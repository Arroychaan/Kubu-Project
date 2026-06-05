import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setProfile: (profile: Profile | null) => void;
    checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    profile: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    setProfile: (profile) => set({ profile }),
    checkSession: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                set({ user: session.user });

                // Fetch profile
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Profile fetch error:', error);
                }

                if (data) {
                    set({
                        profile: {
                            id: data.id,
                            username: data.username || 'Anonymous',
                            daily_post_count: data.daily_post_count || 0,
                            avatar_url: data.avatar_url || '',
                            is_admin: data.is_admin || false,
                            points: data.points ?? 50
                        }
                    });
                }
            } else {
                set({ user: null, profile: null });
            }
        } catch (error) {
            console.error('Session check failed:', error);
            set({ user: null, profile: null });
        } finally {
            set({ isLoading: false });
        }
    },
}));
