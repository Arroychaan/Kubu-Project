/**
 * Dummy Battle Data for KUBU Platform
 * Use this data for development and testing when Supabase is not connected
 */

import { Database } from './types/supabase'

type Battle = Database['public']['Tables']['battles']['Row']
type User = Database['public']['Tables']['users']['Row']
type Vote = Database['public']['Tables']['votes']['Row']
type Comment = Database['public']['Tables']['comments']['Row']

// ============================================
// DUMMY USERS
// ============================================
export const dummyUsers: User[] = [
    {
        id: '00000000-0000-0000-0000-000000000001',
        tier: 'elite',
        points: 500,
        stats: { wins: 15, losses: 5, votes_cast: 120 },
        device_hash: null,
        title: 'Battle Master',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '00000000-0000-0000-0000-000000000002',
        tier: 'free',
        points: 150,
        stats: { wins: 8, losses: 12, votes_cast: 85 },
        device_hash: null,
        title: 'Voter Pro',
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '00000000-0000-0000-0000-000000000003',
        tier: 'elite',
        points: 320,
        stats: { wins: 22, losses: 8, votes_cast: 200 },
        device_hash: null,
        title: 'Champion',
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '00000000-0000-0000-0000-000000000004',
        tier: 'free',
        points: 80,
        stats: { wins: 3, losses: 7, votes_cast: 45 },
        device_hash: null,
        title: 'Rookie',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: '00000000-0000-0000-0000-000000000005',
        tier: 'free',
        points: 200,
        stats: { wins: 10, losses: 10, votes_cast: 100 },
        device_hash: null,
        title: 'Balanced Warrior',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
    },
]

// ============================================
// 5 DUMMY BATTLES
// ============================================
export const dummyBattles: Battle[] = [
    // BATTLE 1: Tech Giants Battle (ACTIVE - Hot topic!)
    {
        id: 'b0000000-0000-0000-0000-000000000001',
        creator_id: '00000000-0000-0000-0000-000000000001',
        title: 'iPhone vs Android',
        description: 'Mana yang lebih worth it untuk HP flagship di 2026?',
        left_side: 'iPhone 18 Pro',
        right_side: 'Samsung Galaxy S26 Ultra',
        status: 'active',
        pool_left: 156, // 78 votes
        pool_right: 142, // 71 votes
        ends_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },

    // BATTLE 2: Indonesian Food Battle (ACTIVE - Classic debate!)
    {
        id: 'b0000000-0000-0000-0000-000000000002',
        creator_id: '00000000-0000-0000-0000-000000000002',
        title: 'Indomie vs Mi Sedaap',
        description: 'Perang abadi mie instan Indonesia! Mana juaranya?',
        left_side: 'Indomie Goreng',
        right_side: 'Mi Sedaap Goreng',
        status: 'active',
        pool_left: 284, // 142 votes - Indomie cult is strong!
        pool_right: 98, // 49 votes
        ends_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },

    // BATTLE 3: Gaming Console Battle (ACTIVE - Gamers assemble!)
    {
        id: 'b0000000-0000-0000-0000-000000000003',
        creator_id: '00000000-0000-0000-0000-000000000003',
        title: 'PS5 Pro vs Xbox Series X2',
        description: 'Console war 2026! Siapa yang menang?',
        left_side: 'PlayStation 5 Pro',
        right_side: 'Xbox Series X2',
        status: 'active',
        pool_left: 178, // 89 votes
        pool_right: 166, // 83 votes - Neck to neck!
        ends_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },

    // BATTLE 4: Coffee Shop Battle (QUEUE - Waiting for votes!)
    {
        id: 'b0000000-0000-0000-0000-000000000004',
        creator_id: '00000000-0000-0000-0000-000000000004',
        title: 'Starbucks vs Kopi Kenangan',
        description: 'Coffee shop mana yang jadi favorit anak muda?',
        left_side: 'Starbucks',
        right_side: 'Kopi Kenangan',
        status: 'queue',
        pool_left: 12, // 6 votes - Still incubating
        pool_right: 8, // 4 votes
        ends_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },

    // BATTLE 5: Transportation Battle (CLOSED - Finished battle!)
    {
        id: 'b0000000-0000-0000-0000-000000000005',
        creator_id: '00000000-0000-0000-0000-000000000005',
        title: 'Gojek vs Grab',
        description: 'Ojol legend! Mana yang lebih reliable?',
        left_side: 'Gojek',
        right_side: 'Grab',
        status: 'closed',
        pool_left: 312, // 156 votes - Winner!
        pool_right: 288, // 144 votes
        ends_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    },
]

// ============================================
// DUMMY VOTES
// ============================================
export const dummyVotes: Vote[] = [
    // Votes for Battle 1 (iPhone vs Android)
    {
        user_id: '00000000-0000-0000-0000-000000000002',
        battle_id: 'b0000000-0000-0000-0000-000000000001',
        side: 'left',
        amount: 2,
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
        user_id: '00000000-0000-0000-0000-000000000003',
        battle_id: 'b0000000-0000-0000-0000-000000000001',
        side: 'right',
        amount: 2,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
        user_id: '00000000-0000-0000-0000-000000000004',
        battle_id: 'b0000000-0000-0000-0000-000000000001',
        side: 'left',
        amount: 2,
        created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    },
    // Votes for Battle 2 (Indomie vs Mi Sedaap)
    {
        user_id: '00000000-0000-0000-0000-000000000001',
        battle_id: 'b0000000-0000-0000-0000-000000000002',
        side: 'left',
        amount: 2,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
        user_id: '00000000-0000-0000-0000-000000000003',
        battle_id: 'b0000000-0000-0000-0000-000000000002',
        side: 'left',
        amount: 2,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
]

// ============================================
// DUMMY COMMENTS (with Clown Filter examples!)
// ============================================
export const dummyComments: Comment[] = [
    // Comments for Battle 1 (iPhone vs Android)
    {
        id: 'c0000000-0000-0000-0000-000000000001',
        user_id: '00000000-0000-0000-0000-000000000002',
        battle_id: 'b0000000-0000-0000-0000-000000000001',
        original_text: 'iPhone for the win! Ecosystem Apple ga ada lawan 🍎',
        displayed_text: 'iPhone for the win! Ecosystem Apple ga ada lawan 🍎',
        is_toxic: false,
        toxicity_score: 0.05,
        created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
    {
        id: 'c0000000-0000-0000-0000-000000000002',
        user_id: '00000000-0000-0000-0000-000000000003',
        battle_id: 'b0000000-0000-0000-0000-000000000001',
        original_text: 'Android lebih worth it sih, spec lebih tinggi dengan harga sama',
        displayed_text: 'Android lebih worth it sih, spec lebih tinggi dengan harga sama',
        is_toxic: false,
        toxicity_score: 0.02,
        created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    // Comments for Battle 2 (Indomie vs Mi Sedaap)
    {
        id: 'c0000000-0000-0000-0000-000000000003',
        user_id: '00000000-0000-0000-0000-000000000001',
        battle_id: 'b0000000-0000-0000-0000-000000000002',
        original_text: 'INDOMIE SELERAKU! Ga ada yang bisa ngalahin taste legendary ini 🔥',
        displayed_text: 'INDOMIE SELERAKU! Ga ada yang bisa ngalahin taste legendary ini 🔥',
        is_toxic: false,
        toxicity_score: 0.08,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'c0000000-0000-0000-0000-000000000004',
        user_id: '00000000-0000-0000-0000-000000000003',
        battle_id: 'b0000000-0000-0000-0000-000000000002',
        original_text: 'Indomie = agama. Case closed. 🙏',
        displayed_text: 'Indomie = agama. Case closed. 🙏',
        is_toxic: false,
        toxicity_score: 0.15,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    // Comments for Battle 3 (PS5 vs Xbox) - With one TOXIC comment filtered!
    {
        id: 'c0000000-0000-0000-0000-000000000005',
        user_id: '00000000-0000-0000-0000-000000000001',
        battle_id: 'b0000000-0000-0000-0000-000000000003',
        original_text: 'PS5 exclusive games nya ga ada lawan! God of War, Spider-Man 🎮',
        displayed_text: 'PS5 exclusive games nya ga ada lawan! God of War, Spider-Man 🎮',
        is_toxic: false,
        toxicity_score: 0.04,
        created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'c0000000-0000-0000-0000-000000000006',
        user_id: '00000000-0000-0000-0000-000000000002',
        battle_id: 'b0000000-0000-0000-0000-000000000003',
        original_text: 'Xbox Game Pass >>> Everything. Value for money banget!',
        displayed_text: 'Xbox Game Pass >>> Everything. Value for money banget!',
        is_toxic: false,
        toxicity_score: 0.02,
        created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'c0000000-0000-0000-0000-000000000007',
        user_id: '00000000-0000-0000-0000-000000000005',
        battle_id: 'b0000000-0000-0000-0000-000000000003',
        original_text: 'Yang pilih Xbox itu tolol semua, ga ngerti gaming!',
        displayed_text: '🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡', // CLOWN FILTERED!
        is_toxic: true,
        toxicity_score: 0.89,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get active battles only
 */
export function getActiveBattles(): Battle[] {
    return dummyBattles.filter((battle) => battle.status === 'active')
}

/**
 * Get battles in queue (incubating)
 */
export function getQueueBattles(): Battle[] {
    return dummyBattles.filter((battle) => battle.status === 'queue')
}

/**
 * Get closed battles
 */
export function getClosedBattles(): Battle[] {
    return dummyBattles.filter((battle) => battle.status === 'closed')
}

/**
 * Get trending battles (sorted by total pool size)
 */
export function getTrendingBattles(): Battle[] {
    return [...dummyBattles]
        .filter((battle) => battle.status !== 'closed')
        .sort((a, b) => (b.pool_left + b.pool_right) - (a.pool_left + a.pool_right))
}

/**
 * Get a battle by ID
 */
export function getBattleById(id: string): Battle | undefined {
    return dummyBattles.find((battle) => battle.id === id)
}

/**
 * Get comments for a battle
 */
export function getCommentsByBattleId(battleId: string): Comment[] {
    return dummyComments.filter((comment) => comment.battle_id === battleId)
}

/**
 * Get votes for a battle
 */
export function getVotesByBattleId(battleId: string): Vote[] {
    return dummyVotes.filter((vote) => vote.battle_id === battleId)
}

/**
 * Get user by ID
 */
export function getUserById(id: string): User | undefined {
    return dummyUsers.find((user) => user.id === id)
}

/**
 * Calculate remaining time for a battle
 */
export function getBattleTimeRemaining(battle: Battle): string {
    const endTime = new Date(battle.ends_at).getTime()
    const now = Date.now()
    const diff = endTime - now

    if (diff <= 0) return 'Ended'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`
    }
    return `${minutes}m remaining`
}

/**
 * Calculate vote percentage for a side
 */
export function getVotePercentage(battle: Battle, side: 'left' | 'right'): number {
    const total = battle.pool_left + battle.pool_right
    if (total === 0) return 50

    if (side === 'left') {
        return Math.round((battle.pool_left / total) * 100)
    }
    return Math.round((battle.pool_right / total) * 100)
}
