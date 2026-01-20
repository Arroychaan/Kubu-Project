/**
 * Seed Script - Insert dummy battles directly to Supabase
 * 
 * USAGE:
 * 1. Set SUPABASE_SERVICE_ROLE_KEY in .env.local (get from Supabase Dashboard > Settings > API)
 * 2. Run: npx tsx scripts/seed-battles.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required!')
    console.log('👉 Get it from: Supabase Dashboard > Settings > API > service_role key')
    console.log('👉 Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
})

// ============================================
// DUMMY DATA
// ============================================

const dummyUsers = [
    {
        id: '00000000-0000-0000-0000-000000000001',
        tier: 'elite',
        points: 500,
        stats: { wins: 15, losses: 5, votes_cast: 120 },
        title: 'Battle Master',
    },
    {
        id: '00000000-0000-0000-0000-000000000002',
        tier: 'free',
        points: 150,
        stats: { wins: 8, losses: 12, votes_cast: 85 },
        title: 'Voter Pro',
    },
    {
        id: '00000000-0000-0000-0000-000000000003',
        tier: 'elite',
        points: 320,
        stats: { wins: 22, losses: 8, votes_cast: 200 },
        title: 'Champion',
    },
    {
        id: '00000000-0000-0000-0000-000000000004',
        tier: 'free',
        points: 80,
        stats: { wins: 3, losses: 7, votes_cast: 45 },
        title: 'Rookie',
    },
    {
        id: '00000000-0000-0000-0000-000000000005',
        tier: 'free',
        points: 200,
        stats: { wins: 10, losses: 10, votes_cast: 100 },
        title: 'Balanced Warrior',
    },
]

const dummyBattles = [
    // BATTLE 1: Tech Giants Battle (ACTIVE)
    {
        id: 'b0000000-0000-0000-0000-000000000001',
        creator_id: '00000000-0000-0000-0000-000000000001',
        title: 'iPhone vs Android',
        description: 'Mana yang lebih worth it untuk HP flagship di 2026?',
        left_side: 'iPhone 18 Pro',
        right_side: 'Samsung Galaxy S26 Ultra',
        status: 'active',
        pool_left: 156,
        pool_right: 142,
        ends_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
    },
    // BATTLE 2: Indonesian Food Battle (ACTIVE)
    {
        id: 'b0000000-0000-0000-0000-000000000002',
        creator_id: '00000000-0000-0000-0000-000000000002',
        title: 'Indomie vs Mi Sedaap',
        description: 'Perang abadi mie instan Indonesia! Mana juaranya?',
        left_side: 'Indomie Goreng',
        right_side: 'Mi Sedaap Goreng',
        status: 'active',
        pool_left: 284,
        pool_right: 98,
        ends_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    },
    // BATTLE 3: Gaming Console Battle (ACTIVE)
    {
        id: 'b0000000-0000-0000-0000-000000000003',
        creator_id: '00000000-0000-0000-0000-000000000003',
        title: 'PS5 Pro vs Xbox Series X2',
        description: 'Console war 2026! Siapa yang menang?',
        left_side: 'PlayStation 5 Pro',
        right_side: 'Xbox Series X2',
        status: 'active',
        pool_left: 178,
        pool_right: 166,
        ends_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    },
    // BATTLE 4: Coffee Shop Battle (QUEUE)
    {
        id: 'b0000000-0000-0000-0000-000000000004',
        creator_id: '00000000-0000-0000-0000-000000000004',
        title: 'Starbucks vs Kopi Kenangan',
        description: 'Coffee shop mana yang jadi favorit anak muda?',
        left_side: 'Starbucks',
        right_side: 'Kopi Kenangan',
        status: 'queue',
        pool_left: 12,
        pool_right: 8,
        ends_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    },
    // BATTLE 5: Transportation Battle (CLOSED)
    {
        id: 'b0000000-0000-0000-0000-000000000005',
        creator_id: '00000000-0000-0000-0000-000000000005',
        title: 'Gojek vs Grab',
        description: 'Ojol legend! Mana yang lebih reliable?',
        left_side: 'Gojek',
        right_side: 'Grab',
        status: 'closed',
        pool_left: 312,
        pool_right: 288,
        ends_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
]

const dummyComments = [
    {
        user_id: '00000000-0000-0000-0000-000000000002',
        battle_id: 'b0000000-0000-0000-0000-000000000001',
        original_text: 'iPhone for the win! Ecosystem Apple ga ada lawan 🍎',
        displayed_text: 'iPhone for the win! Ecosystem Apple ga ada lawan 🍎',
        is_toxic: false,
        toxicity_score: 0.05,
    },
    {
        user_id: '00000000-0000-0000-0000-000000000003',
        battle_id: 'b0000000-0000-0000-0000-000000000001',
        original_text: 'Android lebih worth it sih, spec lebih tinggi dengan harga sama',
        displayed_text: 'Android lebih worth it sih, spec lebih tinggi dengan harga sama',
        is_toxic: false,
        toxicity_score: 0.02,
    },
    {
        user_id: '00000000-0000-0000-0000-000000000001',
        battle_id: 'b0000000-0000-0000-0000-000000000002',
        original_text: 'INDOMIE SELERAKU! Ga ada yang bisa ngalahin taste legendary ini 🔥',
        displayed_text: 'INDOMIE SELERAKU! Ga ada yang bisa ngalahin taste legendary ini 🔥',
        is_toxic: false,
        toxicity_score: 0.08,
    },
    {
        user_id: '00000000-0000-0000-0000-000000000003',
        battle_id: 'b0000000-0000-0000-0000-000000000002',
        original_text: 'Indomie = agama. Case closed. 🙏',
        displayed_text: 'Indomie = agama. Case closed. 🙏',
        is_toxic: false,
        toxicity_score: 0.15,
    },
    {
        user_id: '00000000-0000-0000-0000-000000000005',
        battle_id: 'b0000000-0000-0000-0000-000000000003',
        original_text: 'Yang pilih Xbox itu tolol semua, ga ngerti gaming!',
        displayed_text: '🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡🤡',
        is_toxic: true,
        toxicity_score: 0.89,
    },
]

// ============================================
// SEED FUNCTION
// ============================================

async function seed() {
    console.log('🌱 Starting seed process...\n')

    // 1. Insert Users (will fail if they reference auth.users, so we skip this for now)
    console.log('👤 Note: Users table references auth.users, skipping user insert.')
    console.log('   You may need to create users via Supabase Auth first.\n')

    // 2. Insert Battles
    console.log('⚔️ Inserting battles...')
    const { data: battlesData, error: battlesError } = await supabase
        .from('battles')
        .upsert(dummyBattles, { onConflict: 'id' })
        .select()

    if (battlesError) {
        console.error('❌ Error inserting battles:', battlesError.message)

        // Check if it's because users don't exist
        if (battlesError.message.includes('foreign key')) {
            console.log('\n💡 TIP: Battles need creator_id from users table.')
            console.log('   You need to first create users via Supabase Auth Dashboard,')
            console.log('   or temporarily disable the foreign key constraint.\n')
        }
        return
    }
    console.log(`✅ Inserted ${battlesData?.length || 0} battles\n`)

    // 3. Insert Comments (skip if battles failed)
    console.log('💬 Inserting comments...')
    const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .upsert(dummyComments)
        .select()

    if (commentsError) {
        console.error('❌ Error inserting comments:', commentsError.message)
    } else {
        console.log(`✅ Inserted ${commentsData?.length || 0} comments\n`)
    }

    // 4. Verify
    console.log('📊 Verification:')
    const { count: battleCount } = await supabase
        .from('battles')
        .select('*', { count: 'exact', head: true })
    console.log(`   Battles in database: ${battleCount}`)

    const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
    console.log(`   Comments in database: ${commentCount}`)

    console.log('\n🎉 Seed complete!')
}

seed().catch(console.error)
