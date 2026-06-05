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
            users: {
                Row: {
                    id: string
                    tier: 'free' | 'elite'
                    points: number
                    stats: Json
                    device_hash: string | null
                    title: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    tier?: 'free' | 'elite'
                    points?: number
                    stats?: Json
                    device_hash?: string | null
                    title?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    tier?: 'free' | 'elite'
                    points?: number
                    stats?: Json
                    device_hash?: string | null
                    title?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            battles: {
                Row: {
                    id: string
                    creator_id: string
                    title: string
                    description: string | null
                    left_side: string
                    right_side: string
                    status: 'queue' | 'active' | 'closed'
                    pool_left: number
                    pool_right: number
                    ends_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    creator_id: string
                    title: string
                    description?: string | null
                    left_side: string
                    right_side: string
                    status?: 'queue' | 'active' | 'closed'
                    pool_left?: number
                    pool_right?: number
                    ends_at: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    creator_id?: string
                    title?: string
                    description?: string | null
                    left_side?: string
                    right_side?: string
                    status?: 'queue' | 'active' | 'closed'
                    pool_left?: number
                    pool_right?: number
                    ends_at?: string
                    created_at?: string
                }
            }
            votes: {
                Row: {
                    user_id: string
                    battle_id: string
                    side: 'left' | 'right'
                    amount: number
                    created_at: string
                }
                Insert: {
                    user_id: string
                    battle_id: string
                    side: 'left' | 'right'
                    amount?: number
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    battle_id?: string
                    side?: 'left' | 'right'
                    amount?: number
                    created_at?: string
                }
            }
            point_transactions: {
                Row: {
                    id: string
                    user_id: string
                    amount: number
                    type: string
                    battle_id: string | null
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    amount: number
                    type: string
                    battle_id?: string | null
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    amount?: number
                    type?: string
                    battle_id?: string | null
                    description?: string | null
                    created_at?: string
                }
            }
            comments: {
                Row: {
                    id: string
                    user_id: string
                    battle_id: string
                    original_text: string
                    displayed_text: string
                    is_toxic: boolean
                    toxicity_score: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    battle_id: string
                    original_text: string
                    displayed_text: string
                    is_toxic?: boolean
                    toxicity_score?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    battle_id?: string
                    original_text?: string
                    displayed_text?: string
                    is_toxic?: boolean
                    toxicity_score?: number | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            vote_transaction: {
                Args: {
                    p_battle_id: string
                    p_side: string
                }
                Returns: Json
            }
            settle_battle: {
                Args: {
                    p_battle_id: string
                }
                Returns: Json
            }
            create_battle: {
                Args: {
                    p_title: string
                    p_description: string
                    p_left_side: string
                    p_right_side: string
                    p_duration_hours?: number
                }
                Returns: Json
            }
            can_create_battle: {
                Args: Record<string, never>
                Returns: boolean
            }
            get_user_stats: {
                Args: {
                    p_user_id?: string
                }
                Returns: Json
            }
            get_battle_details: {
                Args: {
                    p_battle_id: string
                }
                Returns: Json
            }
            auto_settle_expired_battles: {
                Args: Record<string, never>
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
