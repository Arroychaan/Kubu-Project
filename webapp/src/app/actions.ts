'use server';

import { createSupabaseServerClient } from '@/lib/supabase-server';

// Raw types for Supabase responses
interface RawProfile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    daily_post_count: number | null;
    last_post_date: string | null;
}

interface RawPoll {
    id: string;
    question: string;
    option_a: string;
    option_b: string;
    is_official: boolean | null;
    created_at: string;
    creator_id?: string | null;
}

interface RawPollStats {
    poll_id: string;
    count_a: number;
    count_b: number;
}

interface RawVote {
    choice: 'a' | 'b' | null;
}

// Response type for consistent API
interface ActionResponse {
    success: boolean;
    message: string;
    data?: unknown;
}

// ============================================
// SERVER ACTION: VOTE
// ============================================
export async function vote(pollId: string, choice: 'a' | 'b'): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        // 1. Check Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                message: 'Kamu harus masuk terlebih dahulu untuk memberikan suara.'
            };
        }

        // 2. Insert Vote
        const { error: voteError } = await supabase
            .from('votes')
            .insert({
                poll_id: pollId,
                user_id: user.id,
                choice: choice
            });

        // 3. Handle Errors
        if (voteError) {
            // Check for unique constraint violation (user already voted)
            if (voteError.code === '23505') {
                return {
                    success: false,
                    message: 'Kamu sudah memberikan suara pada topik ini.'
                };
            }

            console.error('Vote error:', voteError);
            return {
                success: false,
                message: 'Gagal mengirim suara. Silakan coba lagi.'
            };
        }

        // 4. Increment User Points by 5
        await supabase.rpc('increment_user_points', { p_user_id: user.id, p_amount: 5 });

        // 5. Success
        return {
            success: true,
            message: 'Suara berhasil dikirim!'
        };

    } catch (error) {
        console.error('Unexpected vote error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan yang tidak terduga.'
        };
    }
}

// ============================================
// SERVER ACTION: CREATE POLL
// ============================================
const DEFAULT_DAILY_POST_LIMIT = 2;

export async function createPoll(
    question: string,
    optionA: string,
    optionB: string
): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        // 1. Check Authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                message: 'Kamu harus masuk terlebih dahulu untuk membuat topik baru.'
            };
        }

        // 2. Validate Input
        if (!question.trim() || !optionA.trim() || !optionB.trim()) {
            return {
                success: false,
                message: 'Mohon isi semua kolom yang diperlukan.'
            };
        }

        if (question.length > 200) {
            return {
                success: false,
                message: 'Pertanyaan terlalu panjang (maksimal 200 karakter).'
            };
        }

        if (optionA.length > 50 || optionB.length > 50) {
            return {
                success: false,
                message: 'Pilihan terlalu panjang (maksimal 50 karakter masing-masing).'
            };
        }

        // 3. Fetch Daily Limit (DB source of truth)
        const { data: limitData, error: limitError } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'daily_poll_limit')
            .single();

        const dailyLimit = limitError
            ? DEFAULT_DAILY_POST_LIMIT
            : Number.parseInt((limitData as { value?: string } | null)?.value || '', 10) || DEFAULT_DAILY_POST_LIMIT;

        // 4. Fetch User Profile for Rate Limiting
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('daily_post_count, last_post_date')
            .eq('id', user.id)
            .single();

        let profile = profileData as RawProfile | null;

        if (profileError) {
            if (profileError.code !== 'PGRST116') {
                console.error('Profile fetch error:', profileError);
                return {
                    success: false,
                    message: 'Tidak dapat memverifikasi akun kamu. Silakan coba lagi.'
                };
            }

            // Profile not found, create it (safety net if trigger failed)
            const { error: profileInsertError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    username: user.email ? user.email.split('@')[0] : null,
                    daily_post_count: 0,
                    last_post_date: null
                });

            if (profileInsertError) {
                console.error('Profile insert error:', profileInsertError);
                return {
                    success: false,
                    message: 'Tidak dapat membuat profil kamu. Silakan coba lagi.'
                };
            }

            profile = {
                id: user.id,
                username: user.email ? user.email.split('@')[0] : null,
                avatar_url: null,
                daily_post_count: 0,
                last_post_date: null
            };
        }

        // 5. Rate Limit Check
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const lastPostDate = profile?.last_post_date
            ? new Date(profile.last_post_date).toISOString().split('T')[0]
            : '';
        const dailyCount = profile?.daily_post_count || 0;

        // Check if user has reached daily limit
        if (lastPostDate === today && dailyCount >= dailyLimit) {
            return {
                success: false,
                message: `Batas harian tercapai! Kamu hanya dapat membuat ${dailyLimit} topik per hari. Coba lagi besok.`
            };
        }

        // 6. Insert Poll
        const { data: newPollData, error: pollError } = await supabase
            .from('polls')
            .insert({
                creator_id: user.id,
                question: question.trim(),
                option_a: optionA.trim(),
                option_b: optionB.trim(),
                is_official: false // User polls are not official
            })
            .select('id')
            .single();

        if (pollError) {
            console.error('Poll creation error:', pollError);
            const msg = (pollError.message || '').toString();
            if (msg.includes('daily_poll_limit_exceeded')) {
                return {
                    success: false,
                    message: `Daily limit reached! You can only create ${dailyLimit} polls per day. Try again tomorrow.`
                };
            }
            return {
                success: false,
                message: 'Gagal membuat topik. Silakan coba lagi.'
            };
        }

        const newPoll = newPollData as { id: string } | null;

        // 7. Update Profile: Increment Count / Reset if New Day
        const newCount = lastPostDate === today ? dailyCount + 1 : 1;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                daily_post_count: newCount,
                last_post_date: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Profile update error:', updateError);
            // Poll was created successfully, just log the warning
        }

        // Increment User Points by 10
        await supabase.rpc('increment_user_points', { p_user_id: user.id, p_amount: 10 });

        // 8. Success
        return {
            success: true,
            message: 'Topik berhasil dibuat!',
            data: { pollId: newPoll?.id }
        };

    } catch (error) {
        console.error('Unexpected createPoll error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan yang tidak terduga.'
        };
    }
}

// ============================================  
// SERVER ACTION: GET OFFICIAL POLL
// ============================================
export async function getOfficialPoll(): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        // Fetch the latest official poll with stats
        const { data: pollData, error } = await supabase
            .from('polls')
            .select('id, question, option_a, option_b, is_official, created_at')
            .eq('is_official', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Fetch official poll error:', error);
            return {
                success: false,
                message: 'Topik resmi tidak ditemukan.'
            };
        }

        const poll = pollData as RawPoll;

        // Fetch vote stats
        const { data: statsData } = await supabase
            .from('poll_stats')
            .select('count_a, count_b')
            .eq('poll_id', poll.id)
            .single();

        const stats = statsData as RawPollStats | null;

        return {
            success: true,
            message: 'Topik resmi berhasil dimuat.',
            data: {
                ...poll,
                stats: {
                    count_a: stats?.count_a || 0,
                    count_b: stats?.count_b || 0
                }
            }
        };

    } catch (error) {
        console.error('Unexpected getOfficialPoll error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan yang tidak terduga.'
        };
    }
}

// ============================================
// SERVER ACTION: GET COMMUNITY POLLS
// ============================================
export async function getCommunityPolls(limit = 10, offset = 0, searchQuery = ''): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        // Fetch community polls (non-official)
        let query = supabase
            .from('polls')
            .select('id, question, option_a, option_b, is_official, created_at, creator_id')
            .eq('is_official', false);

        if (searchQuery) {
            query = query.ilike('question', `%${searchQuery}%`);
        }

        const { data: pollsData, error } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Fetch community polls error:', error);
            return {
                success: false,
                message: 'Gagal memuat daftar topik.'
            };
        }

        const polls = (pollsData ?? []) as RawPoll[];

        // Fetch stats for all polls
        const pollIds = polls.map(p => p.id);

        let allStats: RawPollStats[] = [];
        if (pollIds.length > 0) {
            const { data: allStatsData } = await supabase
                .from('poll_stats')
                .select('poll_id, count_a, count_b')
                .in('poll_id', pollIds);

            allStats = (allStatsData ?? []) as RawPollStats[];
        }

        // Merge stats with polls
        const pollsWithStats = polls.map(poll => {
            const stat = allStats.find(s => s.poll_id === poll.id);
            return {
                ...poll,
                is_official: poll.is_official ?? false,
                stats: {
                    count_a: stat?.count_a || 0,
                    count_b: stat?.count_b || 0
                }
            };
        });

        return {
            success: true,
            message: 'Topik komunitas berhasil dimuat.',
            data: pollsWithStats
        };

    } catch (error) {
        console.error('Unexpected getCommunityPolls error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan yang tidak terduga.'
        };
    }
}

// ============================================
// SERVER ACTION: CHECK USER VOTE
// ============================================
export async function checkUserVote(pollId: string): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: true,
                message: 'Belum masuk.',
                data: { hasVoted: false, choice: null }
            };
        }

        const { data: voteData, error: voteError } = await supabase
            .from('votes')
            .select('choice')
            .eq('poll_id', pollId)
            .eq('user_id', user.id)
            .single();

        if (voteError && voteError.code !== 'PGRST116') {
            console.error('Vote lookup error:', voteError);
            return {
                success: false,
                message: 'Gagal memeriksa suara kamu.'
            };
        }

        const vote = voteData as RawVote | null;

        return {
            success: true,
            message: vote ? 'Kamu sudah memberikan suara.' : 'Kamu belum memberikan suara.',
            data: {
                hasVoted: !!vote,
                choice: vote?.choice || null
            }
        };

    } catch (error) {
        console.error('Unexpected checkUserVote error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan yang tidak terduga.'
        };
    }
}

// ============================================
// SERVER ACTION: ADMIN TOGGLE OFFICIAL POLL
// ============================================
export async function toggleOfficialPoll(pollId: string, isOfficial: boolean): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, message: 'Silakan masuk terlebih dahulu.' };
        }

        // Verify admin profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            return { success: false, message: 'Akses ditolak. Kamu bukan administrator.' };
        }

        const { error } = await supabase
            .from('polls')
            .update({ is_official: isOfficial })
            .eq('id', pollId);

        if (error) {
            console.error('Error toggling official status:', error);
            return { success: false, message: 'Gagal memperbarui status topik.' };
        }

        return {
            success: true,
            message: isOfficial
                ? 'Topik berhasil diatur menjadi Topik Utama!'
                : 'Topik berhasil diubah menjadi Topik Komunitas.'
        };
    } catch (error) {
        console.error('Unexpected toggleOfficialPoll error:', error);
        return { success: false, message: 'Terjadi kesalahan sistem.' };
    }
}

// ============================================
// SERVER ACTION: ADMIN UPDATE DAILY POLL LIMIT
// ============================================
export async function updateDailyPollLimit(limit: number): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, message: 'Silakan masuk terlebih dahulu.' };
        }

        // Verify admin profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin) {
            return { success: false, message: 'Akses ditolak. Kamu bukan administrator.' };
        }

        const { error } = await supabase
            .from('app_settings')
            .upsert({ key: 'daily_poll_limit', value: limit.toString(), updated_at: new Date().toISOString() });

        if (error) {
            console.error('Error updating daily poll limit:', error);
            return { success: false, message: 'Gagal memperbarui batas harian.' };
        }

        return {
            success: true,
            message: `Batas pembuatan topik harian berhasil diubah menjadi ${limit} kali.`
        };
    } catch (error) {
        console.error('Unexpected updateDailyPollLimit error:', error);
        return { success: false, message: 'Terjadi kesalahan sistem.' };
    }
}

// ============================================
// SERVER ACTION: GET LEADERBOARD
// ============================================
export async function getLeaderboard(limit = 20): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, points, is_admin')
            .order('points', { ascending: false, nullsFirst: false })
            .limit(limit);

        if (error) {
            console.error('Fetch leaderboard error:', error);
            return {
                success: false,
                message: 'Gagal memuat papan peringkat.'
            };
        }

        return {
            success: true,
            message: 'Papan peringkat berhasil dimuat.',
            data: data || []
        };
    } catch (error) {
        console.error('Unexpected getLeaderboard error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan sistem.'
        };
    }
}

// ============================================
// SERVER ACTION: GET COMMENTS (OPINION SEGMENTS)
// ============================================
export async function getComments(pollId: string): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        const { data, error } = await supabase
            .from('comments')
            .select(`
                id,
                text,
                choice,
                is_toxic,
                created_at,
                user_id,
                parent_id,
                profiles (
                    username,
                    avatar_url,
                    points
                )
            `)
            .eq('poll_id', pollId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch comments error:', error);
            return {
                success: false,
                message: 'Gagal memuat daftar opini.'
            };
        }

        const comments = data || [];
        const commentsA = comments.filter((c: any) => c.choice === 'a');
        const commentsB = comments.filter((c: any) => c.choice === 'b');

        return {
            success: true,
            message: 'Opini berhasil dimuat.',
            data: { commentsA, commentsB }
        };
    } catch (error) {
        console.error('Unexpected getComments error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan sistem.'
        };
    }
}

// ============================================
// SERVER ACTION: ADD COMMENT (OPINION)
// ============================================
export async function addComment(pollId: string, text: string, parentId?: string): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        // 1. Cek Autentikasi
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return {
                success: false,
                message: 'Kamu harus masuk terlebih dahulu untuk mengirim opini.'
            };
        }

        // 2. Validasi input teks
        const trimmedText = text.trim();
        if (!trimmedText) {
            return {
                success: false,
                message: 'Opini tidak boleh kosong.'
            };
        }

        if (trimmedText.length > 500) {
            return {
                success: false,
                message: 'Opini terlalu panjang (maksimal 500 karakter).'
            };
        }

        // 3. Cek apakah pengguna sudah memilih di polling ini
        const { data: voteData, error: voteError } = await supabase
            .from('votes')
            .select('choice')
            .eq('poll_id', pollId)
            .eq('user_id', user.id)
            .single();

        if (voteError || !voteData) {
            return {
                success: false,
                message: 'Kamu harus memberikan pilihan kubu terlebih dahulu sebelum menulis alasan.'
            };
        }

        // 4. Panggil Deno Edge Function clown-filter untuk moderasi dan penyimpanan
        const { data: filterResult, error: invokeError } = await supabase.functions.invoke('clown-filter', {
            body: {
                text: trimmedText,
                poll_id: pollId,
                choice: voteData.choice,
                save_to_db: true,
                parent_id: parentId
            }
        });

        if (invokeError || !filterResult || !filterResult.success) {
            console.error('Clown filter invocation failed:', invokeError, filterResult);
            return {
                success: false,
                message: 'Gagal mempublikasikan opini. Sistem moderasi sedang sibuk, silakan coba beberapa saat lagi.'
            };
        }

        // 5. Berikan bonus koin untuk penulisan alasan (+15 poin reputasi opini)
        await supabase.rpc('increment_user_points', { p_user_id: user.id, p_amount: 15 });

        return {
            success: true,
            message: filterResult.is_toxic
                ? 'Opini diterbitkan, namun dibersihkan (mengandung konten tidak pantas).'
                : 'Opini kamu berhasil diterbitkan!',
            data: filterResult
        };

    } catch (error: any) {
        console.error('Unexpected addComment error:', error);
        // Cek constraint unik di database
        if (error?.message?.includes('comments_poll_user_unique') || (error?.code === '23505')) {
            return {
                success: false,
                message: 'Kamu hanya dapat mengirim satu alasan utama per topik ini.'
            };
        }
        return {
            success: false,
            message: 'Terjadi kesalahan sistem.'
        };
    }
}

// ============================================
// SERVER ACTION: GET NOTIFICATIONS
// ============================================
export async function getNotifications(): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, message: 'Silakan masuk terlebih dahulu.' };
        }

        const { data, error } = await supabase
            .from('notifications')
            .select(`
                id,
                type,
                poll_id,
                actor_id,
                message,
                is_read,
                read_at,
                created_at,
                actor:profiles!actor_id(username, avatar_url),
                poll:polls(question)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Fetch notifications error:', error);
            return { success: false, message: 'Gagal memuat notifikasi.' };
        }

        return {
            success: true,
            message: 'Notifikasi berhasil dimuat.',
            data: data || []
        };
    } catch (error) {
        console.error('Unexpected getNotifications error:', error);
        return { success: false, message: 'Terjadi kesalahan sistem.' };
    }
}

// ============================================
// SERVER ACTION: MARK NOTIFICATION AS READ
// ============================================
export async function markNotificationAsRead(id: string): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, message: 'Silakan masuk terlebih dahulu.' };
        }

        const { error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Mark notification read error:', error);
            return { success: false, message: 'Gagal menandai notifikasi.' };
        }

        return { success: true, message: 'Notifikasi ditandai telah dibaca.' };
    } catch (error) {
        console.error('Unexpected markNotificationAsRead error:', error);
        return { success: false, message: 'Terjadi kesalahan sistem.' };
    }
}

// ============================================
// SERVER ACTION: MARK ALL NOTIFICATIONS AS READ
// ============================================
export async function markAllNotificationsAsRead(): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, message: 'Silakan masuk terlebih dahulu.' };
        }

        const { error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) {
            console.error('Mark all notifications read error:', error);
            return { success: false, message: 'Gagal menandai semua notifikasi.' };
        }

        return { success: true, message: 'Semua notifikasi ditandai telah dibaca.' };
    } catch (error) {
        console.error('Unexpected markAllNotificationsAsRead error:', error);
        return { success: false, message: 'Terjadi kesalahan sistem.' };
    }
}

// ============================================
// SERVER ACTION: REPORT CONTENT
// ============================================
export async function reportContent(
    targetType: 'poll' | 'comment',
    targetId: string,
    reason: 'spam' | 'ujaran_kebencian' | 'pelecehan' | 'informasi_menyesatkan' | 'konten_tidak_pantas' | 'lainnya',
    details: string
): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: false, message: 'Silakan masuk terlebih dahulu untuk membuat laporan.' };
        }

        if (!targetId || !targetType || !reason) {
            return { success: false, message: 'Data laporan tidak lengkap.' };
        }

        const validReasons = ['spam', 'ujaran_kebencian', 'pelecehan', 'informasi_menyesatkan', 'konten_tidak_pantas', 'lainnya'];
        if (!validReasons.includes(reason)) {
            return { success: false, message: 'Kategori laporan tidak valid.' };
        }

        const { error } = await supabase
            .from('reports')
            .insert({
                reporter_id: user.id,
                target_type: targetType,
                target_id: targetId,
                reason: reason,
                details: details.trim() || null
            });

        if (error) {
            console.error('Error inserting report:', error);
            return { success: false, message: 'Gagal mengirim laporan. Silakan coba lagi.' };
        }

        return { success: true, message: 'Laporan berhasil dikirim!' };
    } catch (error) {
        console.error('Unexpected reportContent error:', error);
        return { success: false, message: 'Terjadi kesalahan sistem.' };
    }
}

// ============================================
// SERVER ACTION: SEED INITIAL TOPICS
// ============================================
export async function seedInitialTopics(): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        // 1. Check if polls table already has seeded topics
        const { count, error: countError } = await supabase
            .from('polls')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Check polls count error:', countError);
            return { success: false, message: 'Gagal memverifikasi jumlah topik.' };
        }

        // If there are already polls in the database, don't seed again
        if (count && count > 0) {
            return { success: true, message: 'Database sudah terisi.' };
        }

        const SEED_TOPICS = [
            {
                id: 't0000000-0000-0000-0000-000000000001',
                question: 'Tim bubur diaduk masih punya alasan paling kuat, kamu di kubu mana?',
                option_a: 'Bubur Diaduk',
                option_b: 'Bubur Tidak Diaduk',
                creator_id: 'a0000000-0000-0000-0000-000000000001',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000002', choice: 'a', text: 'Kalau diaduk, rasa kuah dan topping lebih rata.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000003', choice: 'b', text: 'Kalau tidak diaduk, tekstur buburnya lebih jelas.' }
                ]
            },
            {
                id: 't0000000-0000-0000-0000-000000000002',
                question: 'Apakah Android lebih bebas dan worth it daripada iPhone?',
                option_a: 'Android',
                option_b: 'iPhone',
                creator_id: 'a0000000-0000-0000-0000-000000000002',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000001', choice: 'a', text: 'Android lebih bebas pasang aplikasi dan modifikasi tampilan.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000003', choice: 'b', text: 'iPhone lebih aman, stabil, dan pembaruan OS terjamin.' }
                ]
            },
            {
                id: 't0000000-0000-0000-0000-000000000003',
                question: 'Kuliah IT masih penting buat programmer pemula?',
                option_a: 'Sangat Penting',
                option_b: 'Tidak Terlalu',
                creator_id: 'a0000000-0000-0000-0000-000000000003',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000001', choice: 'a', text: 'Kuliah penting untuk melatih logika dasar dan membangun jaringan relasi.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000002', choice: 'b', text: 'Portofolio dan skill praktek jauh lebih dihargai dibanding ijazah formal.' }
                ]
            },
            {
                id: 't0000000-0000-0000-0000-000000000004',
                question: 'Kerja remote penuh bikin hidup lebih sehat atau malah stres?',
                option_a: 'Lebih Sehat',
                option_b: 'Malah Stres',
                creator_id: 'a0000000-0000-0000-0000-000000000001',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000002', choice: 'a', text: 'Hemat waktu commute di jalan, bisa lebih dekat dengan keluarga.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000003', choice: 'b', text: 'Batas kerja jadi kabur dan kurang sosialisasi tatap muka.' }
                ]
            },
            {
                id: 't0000000-0000-0000-0000-000000000005',
                question: 'AI bikin programmer makin kuat?',
                option_a: 'Makin Kuat',
                option_b: 'Makin Tergantikan',
                creator_id: 'a0000000-0000-0000-0000-000000000002',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000001', choice: 'a', text: 'Programmer yang bisa memakai AI akan punya output jauh lebih cepat.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000003', choice: 'b', text: 'Pemula yang cuma copy-paste AI akan makin sulit membangun fondasi.' }
                ]
            },
            {
                id: 't0000000-0000-0000-0000-000000000006',
                question: 'Nasi Padang lebih enak dibungkus daripada makan di tempat?',
                option_a: 'Enak Dibungkus',
                option_b: 'Makan di Tempat',
                creator_id: 'a0000000-0000-0000-0000-000000000003',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000001', choice: 'a', text: 'Porsi nasi Padang yang dibungkus biasanya jauh lebih banyak.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000002', choice: 'b', text: 'Bisa makan hangat dengan kuah melimpah dan nambah sambal langsung.' }
                ]
            },
            {
                id: 't0000000-0000-0000-0000-000000000007',
                question: 'Cowok harus selalu mulai chat duluan di chat app?',
                option_a: 'Harus Mulai',
                option_b: 'Siapa Saja Bebas',
                creator_id: 'a0000000-0000-0000-0000-000000000001',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000002', choice: 'a', text: 'Memulai duluan menunjukkan inisiatif dan keseriusan.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000003', choice: 'b', text: 'Komunikasi dua arah, siapa saja yang tertarik boleh menyapa.' }
                ]
            },
            {
                id: 't0000000-0000-0000-0000-000000000008',
                question: 'Gen Z lebih susah sukses daripada generasi sebelumnya?',
                option_a: 'Lebih Susah',
                option_b: 'Sama Saja/Gampang',
                creator_id: 'a0000000-0000-0000-0000-000000000002',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000001', choice: 'a', text: 'Harga properti meroket tajam sedangkan kenaikan gaji stagnan.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000003', choice: 'b', text: 'Banyak karir baru di era digital seperti konten kreator dan e-commerce.' }
                ]
            },
            {
                id: 't0000000-0000-0000-0000-000000000009',
                question: 'Es teh manis adalah minuman nasional tidak resmi Indonesia?',
                option_a: 'Setuju Banget',
                option_b: 'Biasa Saja',
                creator_id: 'a0000000-0000-0000-0000-000000000003',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000001', choice: 'a', text: 'Selalu jadi pilihan pertama di warung makan mana pun.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000002', choice: 'b', text: 'Minuman biasa, masih banyak teh lokal tradisional yang lebih berkarakter.' }
                ]
            },
            {
                id: 't0000000-0000-0000-0000-000000000010',
                question: 'Main game bisa jadi produktif kalau diarahkan?',
                option_a: 'Produktif',
                option_b: 'Hanya Buang Waktu',
                creator_id: 'a0000000-0000-0000-0000-000000000001',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000002', choice: 'a', text: 'Mengasah refleks strategis dan bisa menghasilkan uang dari e-sports.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000003', choice: 'b', text: 'Lebih banyak bikin kecanduan dan mengabaikan kewajiban dunia nyata.' }
                ]
            },
            {
                id: 't0000000-0000-0000-0000-000000000011',
                question: 'Orang pendiam lebih sering punya opini tajam?',
                option_a: 'Sering Tajam',
                option_b: 'Belum Tentu',
                creator_id: 'a0000000-0000-0000-0000-000000000002',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000001', choice: 'a', text: 'Mereka meluangkan lebih banyak waktu untuk mengamati dan menganalisis.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000003', choice: 'b', text: 'Sikap pendiam tidak berkorelasi langsung dengan kedalaman berpikir.' }
                ]
            },
            {
                id: 't0000000-0000-0000-0000-000000000012',
                question: 'Skripsi lebih berat karena tekanan mental daripada teknis?',
                option_a: 'Karena Mental',
                option_b: 'Karena Teknis',
                creator_id: 'a0000000-0000-0000-0000-000000000003',
                comments: [
                    { user_id: 'a0000000-0000-0000-0000-000000000001', choice: 'a', text: 'Menghadapi dosen pembimbing dan godaan overthinking jauh lebih berat.' },
                    { user_id: 'a0000000-0000-0000-0000-000000000002', choice: 'b', text: 'Mengolah data penelitian lapangan dan menyusun metode kuantitatif sangat rumit.' }
                ]
            }
        ];

        // Insert polls, votes, and comments sequentially
        for (const topic of SEED_TOPICS) {
            const { error: pollError } = await supabase.from('polls').insert({
                id: topic.id,
                question: topic.question,
                option_a: topic.option_a,
                option_b: topic.option_b,
                creator_id: topic.creator_id,
                is_official: false,
                is_featured: true
            });

            if (pollError && pollError.code !== '23505') {
                console.error(`Error inserting poll ${topic.id}:`, pollError);
            }

            for (const comment of topic.comments) {
                // Insert vote first due to foreign key constraints
                await supabase.from('votes').insert({
                    poll_id: topic.id,
                    user_id: comment.user_id,
                    choice: comment.choice
                });

                // Insert comment
                await supabase.from('comments').insert({
                    poll_id: topic.id,
                    user_id: comment.user_id,
                    choice: comment.choice,
                    text: comment.text
                });
            }
        }

        return { success: true, message: 'Database successfully seeded with 12 topics!' };

    } catch (error) {
        console.error('Unexpected seed error:', error);
        return { success: false, message: 'Terjadi kesalahan saat seeding.' };
    }
}

// ============================================
// SERVER ACTION: SUPPORT COMMENT (ARGUMENT)
// ============================================
export async function supportComment(authorId: string): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, message: 'Kamu harus masuk terlebih dahulu.' };
        }

        // Increment points for argument creator
        await supabase.rpc('increment_user_points', { p_user_id: authorId, p_amount: 10 });

        return { success: true, message: 'Dukungan berhasil dikirim!' };
    } catch (error) {
        console.error('Support comment error:', error);
        return { success: false, message: 'Gagal mengirim dukungan.' };
    }
}

// ============================================
// SERVER ACTION: SEARCH PROFILES
// ============================================
export async function searchProfiles(searchQuery: string, limit = 20): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();

        if (!searchQuery.trim()) {
            return {
                success: true,
                message: 'Pencarian kosong.',
                data: []
            };
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, points, is_admin')
            .ilike('username', `%${searchQuery}%`)
            .order('points', { ascending: false, nullsFirst: false })
            .limit(limit);

        if (error) {
            console.error('Search profiles error:', error);
            return {
                success: false,
                message: 'Gagal mencari pengguna.'
            };
        }

        return {
            success: true,
            message: 'Pencarian pengguna berhasil.',
            data: data || []
        };
    } catch (error) {
        console.error('Unexpected searchProfiles error:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan sistem.'
        };
    }
}

// ============================================
// SERVER ACTION: GET UNREAD NOTIFICATION COUNT
// ============================================
export async function getUnreadNotificationCount(): Promise<ActionResponse> {
    try {
        const supabase = await createSupabaseServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return { success: true, message: 'Not authenticated', data: 0 };
        }

        const { count, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) {
            console.error('Fetch unread notifications count error:', error);
            return { success: false, message: 'Gagal memuat jumlah notifikasi.' };
        }

        return {
            success: true,
            message: 'Jumlah notifikasi berhasil dimuat.',
            data: count || 0
        };
    } catch (error) {
        console.error('Unexpected getUnreadNotificationCount error:', error);
        return { success: false, message: 'Terjadi kesalahan sistem.' };
    }
}



