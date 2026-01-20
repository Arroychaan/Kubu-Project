# KUBU - Competitive Voting Platform

A secure, atomic, and real-time backend for competitive voting battles built with Supabase.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| API | PostgreSQL RPC Functions |
| Realtime | Supabase Realtime |
| AI/NLP | Supabase Edge Functions + HuggingFace |

## 📁 Project Structure

```
Kubu-Project/
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_tables.sql      # Database schema
│   │   ├── 002_rls_policies.sql       # Row Level Security
│   │   ├── 003_rpc_functions.sql      # Core business logic
│   │   └── 004_triggers.sql           # Automation & triggers
│   ├── functions/
│   │   └── clown-filter/              # AI content moderation
│   │       ├── index.ts
│   │       └── deno.json
│   └── config.toml                    # Supabase configuration
├── .env.example                       # Environment template
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Deno](https://deno.land/) (for Edge Functions)
- Supabase account with a project

### 1. Clone & Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd Kubu-Project

# Copy environment template
cp .env.example .env.local

# Fill in your Supabase credentials in .env.local
```

### 2. Link to Supabase Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref
```

### 3. Run Migrations

```bash
# Apply all migrations
supabase db push

# Or reset and apply fresh
supabase db reset
```

### 4. Deploy Edge Functions

```bash
# Set secrets
supabase secrets set HUGGINGFACE_API_KEY=hf_your_key_here

# Deploy clown-filter function
supabase functions deploy clown-filter
```

## 📊 Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | User profiles with tier, points, stats |
| `battles` | Voting battles with pools |
| `votes` | User votes (composite PK prevents double voting) |
| `point_transactions` | Audit log for all point movements |
| `comments` | Battle comments with clown filter |

### Key Constraints

- Users start with **50 points**
- Each vote costs **2 points**
- Users **cannot** directly update their own points (RLS enforced)
- Battle creation requires **10+ votes cast** (incubation)

## ⚡ RPC Functions

### `vote_transaction(battle_id, side)`

Atomic voting function that:
1. ✅ Checks user balance (>= 2 points)
2. ✅ Deducts 2 points from user
3. ✅ Adds to battle pool (left/right)
4. ✅ Records vote in votes table
5. ✅ Logs transaction in audit table

```javascript
const { data, error } = await supabase.rpc('vote_transaction', {
  p_battle_id: 'uuid-here',
  p_side: 'left' // or 'right'
});
```

### `settle_battle(battle_id)`

Battle settlement that:
1. ✅ Determines winning side (higher pool)
2. ✅ Applies 5% platform tax
3. ✅ Applies KUBU Multiplier (50% burn if ratio > 90:10)
4. ✅ Distributes winnings to winners
5. ✅ Updates user stats (wins/losses)

```javascript
const { data, error } = await supabase.rpc('settle_battle', {
  p_battle_id: 'uuid-here'
});
```

### `create_battle(title, description, left_side, right_side, duration_hours)`

Creates a battle with incubation check:

```javascript
const { data, error } = await supabase.rpc('create_battle', {
  p_title: 'Indomie vs Mie Sedaap',
  p_description: 'Which instant noodle is the best?',
  p_left_side: 'Indomie',
  p_right_side: 'Mie Sedaap',
  p_duration_hours: 24
});
```

### `auto_settle_expired_battles()`

Batch settle expired battles (call via cron):

```javascript
const { data, error } = await supabase.rpc('auto_settle_expired_battles');
```

## 🤡 Clown Filter (AI Content Moderation)

Edge Function that filters toxic content using HuggingFace's IndoBERT model.

### Endpoint

```
POST /functions/v1/clown-filter
```

### Request

```json
{
  "text": "Your comment here",
  "battle_id": "optional-uuid",
  "save_to_db": true
}
```

### Response

```json
{
  "success": true,
  "original_text": "Your comment here",
  "displayed_text": "Your comment here", // or "🤡" if toxic
  "is_toxic": false,
  "toxicity_score": 0.123,
  "model_used": "dehatebert-mono-indonesian"
}
```

### Usage Example

```javascript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/clown-filter`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: 'User comment here',
      battle_id: 'battle-uuid',
      save_to_db: true
    })
  }
);

const result = await response.json();
// result.displayed_text will be "🤡" if toxic
```

## 🔒 Security Features

1. **Row Level Security (RLS)**
   - Users cannot update their own points directly
   - Votes can only be created via RPC
   - Transactions are read-only for users

2. **Atomic Transactions**
   - All point operations are atomic (ACID compliant)
   - Race conditions prevented with `FOR UPDATE` locks

3. **Input Validation**
   - All RPC functions validate inputs
   - Triggers prevent negative points

## 🔄 Realtime Subscriptions

```javascript
// Subscribe to battle pool updates
const channel = supabase
  .channel('battle-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'battles',
      filter: `id=eq.${battleId}`
    },
    (payload) => {
      console.log('Pool updated:', payload.new);
    }
  )
  .subscribe();
```

## 📅 Cron Setup (Battle Settlement)

Use Supabase's pg_cron or an external scheduler:

```sql
-- Run every minute to settle expired battles
SELECT cron.schedule(
  'settle-expired-battles',
  '* * * * *',
  $$SELECT auto_settle_expired_battles()$$
);
```

Or use an external service (Vercel Cron, Railway, etc.):

```javascript
// api/cron/settle-battles.ts
export default async function handler() {
  const { data, error } = await supabase.rpc('auto_settle_expired_battles');
  return Response.json(data);
}
```

## 🧪 Testing

### Test Vote Transaction

```sql
-- As authenticated user
SELECT vote_transaction(
  'your-battle-uuid'::uuid,
  'left'
);
```

### Test Settlement

```sql
-- Settle a specific battle
SELECT settle_battle('your-battle-uuid'::uuid);
```

### Test Clown Filter

```bash
curl -X POST https://your-project.supabase.co/functions/v1/clown-filter \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "test message"}'
```

## 📝 License

MIT License - see LICENSE file for details.

---

Built with ❤️ using Supabase
