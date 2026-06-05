'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

// Create Supabase client for Server Actions (without generic to avoid 'never' issues)
async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing sessions.
                    }
                },
            },
        }
    );
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
                message: 'You must be logged in to vote.'
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
                    message: 'You have already voted on this poll.'
                };
            }

            console.error('Vote error:', voteError);
            return {
                success: false,
                message: 'Failed to submit vote. Please try again.'
            };
        }

        // 4. Success
        return {
            success: true,
            message: 'Vote submitted successfully!'
        };

    } catch (error) {
        console.error('Unexpected vote error:', error);
        return {
            success: false,
            message: 'An unexpected error occurred.'
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
                message: 'You must be logged in to create a poll.'
            };
        }

        // 2. Validate Input
        if (!question.trim() || !optionA.trim() || !optionB.trim()) {
            return {
                success: false,
                message: 'Please fill in all fields.'
            };
        }

        if (question.length > 200) {
            return {
                success: false,
                message: 'Question is too long (max 200 characters).'
            };
        }

        if (optionA.length > 50 || optionB.length > 50) {
            return {
                success: false,
                message: 'Options are too long (max 50 characters each).'
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
                    message: 'Could not verify your account. Please try again.'
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
                    message: 'Could not create your profile. Please try again.'
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
                message: `Daily limit reached! You can only create ${dailyLimit} polls per day. Try again tomorrow.`
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
                message: 'Failed to create poll. Please try again.'
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

        // 8. Success
        return {
            success: true,
            message: 'Poll created successfully!',
            data: { pollId: newPoll?.id }
        };

    } catch (error) {
        console.error('Unexpected createPoll error:', error);
        return {
            success: false,
            message: 'An unexpected error occurred.'
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
                message: 'No official poll found.'
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
            message: 'Official poll fetched.',
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
            message: 'An unexpected error occurred.'
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
                message: 'Failed to fetch polls.'
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
            message: 'Community polls fetched.',
            data: pollsWithStats
        };

    } catch (error) {
        console.error('Unexpected getCommunityPolls error:', error);
        return {
            success: false,
            message: 'An unexpected error occurred.'
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
                message: 'Not logged in.',
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
                message: 'Failed to check your vote.'
            };
        }

        const vote = voteData as RawVote | null;

        return {
            success: true,
            message: vote ? 'User has voted.' : 'User has not voted.',
            data: {
                hasVoted: !!vote,
                choice: vote?.choice || null
            }
        };

    } catch (error) {
        console.error('Unexpected checkUserVote error:', error);
        return {
            success: false,
            message: 'An unexpected error occurred.'
        };
    }
}
