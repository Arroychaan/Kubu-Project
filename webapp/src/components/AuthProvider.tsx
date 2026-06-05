'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

// Type for profile data from Supabase
interface RawProfile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    daily_post_count: number | null;
    last_post_date: string | null;
    is_admin: boolean | null;
    points: number | null;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkSession, setUser, setProfile } = useAuthStore();

    useEffect(() => {
        // Check session on mount
        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
                setUser(session.user);
                // Fetch profile
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (data) {
                    const profile = data as RawProfile;
                    setProfile({
                        id: profile.id,
                        username: profile.username || 'Anonymous',
                        daily_post_count: profile.daily_post_count || 0,
                        avatar_url: profile.avatar_url || '',
                        is_admin: profile.is_admin || false,
                        points: profile.points ?? 50
                    });
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [checkSession, setUser, setProfile]);

    return <>{children}</>;
}
