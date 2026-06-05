export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    avatar_url: string | null
                    daily_post_count: number | null
                    last_post_date: string | null
                    is_admin: boolean | null
                    points: number | null
                }
                Insert: {
                    id: string
                    username?: string | null
                    avatar_url?: string | null
                    daily_post_count?: number | null
                    last_post_date?: string | null
                    is_admin?: boolean | null
                    points?: number | null
                }
                Update: {
                    id?: string
                    username?: string | null
                    avatar_url?: string | null
                    daily_post_count?: number | null
                    last_post_date?: string | null
                    is_admin?: boolean | null
                    points?: number | null
                }
            }
            polls: {
                Row: {
                    id: string
                    creator_id: string | null
                    question: string
                    option_a: string
                    option_b: string
                    is_official: boolean | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    creator_id?: string | null
                    question: string
                    option_a: string
                    option_b: string
                    is_official?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    creator_id?: string | null
                    question?: string
                    option_a?: string
                    option_b?: string
                    is_official?: boolean | null
                    created_at?: string
                }
            }
            votes: {
                Row: {
                    id: string
                    poll_id: string
                    user_id: string
                    choice: 'a' | 'b' | null
                }
                Insert: {
                    id?: string
                    poll_id: string
                    user_id: string
                    choice?: 'a' | 'b' | null
                }
                Update: {
                    id?: string
                    poll_id?: string
                    user_id?: string
                    choice?: 'a' | 'b' | null
                }
            }
            audit_logs: {
                Row: {
                    id: string
                    actor_id: string | null
                    actor_role: string | null
                    action: string
                    target_table: string
                    target_id: string | null
                    details: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    actor_id?: string | null
                    actor_role?: string | null
                    action: string
                    target_table: string
                    target_id?: string | null
                    details?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    actor_id?: string | null
                    actor_role?: string | null
                    action?: string
                    target_table?: string
                    target_id?: string | null
                    details?: Json | null
                    created_at?: string
                }
            }
            app_settings: {
                Row: {
                    key: string
                    value: string
                    updated_at: string
                }
                Insert: {
                    key: string
                    value: string
                    updated_at?: string
                }
                Update: {
                    key?: string
                    value?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            poll_stats: {
                Row: {
                    poll_id: string
                    count_a: number
                    count_b: number
                }
            }
        }
    }
}

export interface Poll {
    id: string;
    question: string;
    option_a: string;
    option_b: string;
    is_official: boolean;
    stats?: {
        count_a: number;
        count_b: number;
    };
}

export interface Profile {
    id: string;
    username: string;
    daily_post_count: number;
    avatar_url?: string;
    is_admin?: boolean;
    points: number;
}
