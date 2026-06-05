
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Swords, Send, Loader2, LogOut } from 'lucide-react'
import './App.css'

function App() {
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [question, setQuestion] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [polls, setPolls] = useState([])

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        await loadAdminStatus(session.user.id)
      }

      setAuthLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return

      if (session?.user) {
        setUser(session.user)
        await loadAdminStatus(session.user.id)
      } else {
        setUser(null)
        setIsAdmin(false)
        setAuthError('')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchPolls()
    }
  }, [isAdmin])

  async function loadAdminStatus(userId) {
    setAuthError('')
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Admin check error:', error)
      setIsAdmin(false)
      setAuthError('Tidak bisa verifikasi akses admin.')
      return
    }

    if (!data?.is_admin) {
      setIsAdmin(false)
      setAuthError('Akun ini bukan admin.')
      return
    }

    setIsAdmin(true)
  }

  async function fetchPolls() {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('is_official', true)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) console.error('Error fetching polls:', error)
      else setPolls(data || [])
    } catch (err) {
      console.error('Unexpected error:', err)
    }
  }

  async function handleDeletePoll(pollId) {
    if (!confirm('Hapus poll ini? Tindakan ini tidak bisa dibatalkan.')) return;
    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId);

      if (error) throw error;
      fetchPolls();
      alert('Poll berhasil dihapus.');
    } catch (err) {
      console.error('Failed to delete poll:', err);
      alert('Gagal menghapus poll. Cek konsol untuk detail.');
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setAuthError(error.message)
      setAuthLoading(false)
      return
    }

    if (data?.user) {
      setUser(data.user)
      await loadAdminStatus(data.user.id)
    }

    setAuthLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    setAuthError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!question || !optionA || !optionB) return
    if (!user || !isAdmin) {
      setAuthError('Akses admin diperlukan untuk membuat Official War.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('polls')
        .insert([
          {
            creator_id: user.id,
            question,
            option_a: optionA,
            option_b: optionB,
            is_official: true,
            created_at: new Date().toISOString()
          }
        ])

      if (error) throw error

      alert('Daily War Created Successfully!')
      setQuestion('')
      setOptionA('')
      setOptionB('')
      fetchPolls() // Refresh list
    } catch (error) {
      console.error('Error adding poll:', error)
      if (error.code === '23505' || error.status === 409) {
        alert('Failed to create poll: A poll with this question already exists.')
      } else {
        alert(`Error creating poll: ${error.message}\nDetails: ${error.details || 'No details'}\nHint: ${error.hint || 'No hint'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="app-container">
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" />
          <p className="subtitle" style={{ marginTop: '1rem' }}>Loading admin session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app-container">
        <div className="header-section">
          <h1 className="gradient-text title-large">
            <Swords size={48} className="title-icon" color="#6EE7B7" />
            Kubu War Admin
          </h1>
          <p className="subtitle">Login admin untuk membuat Official War</p>
        </div>

        <div className="glass-panel">
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="admin@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {authError && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#fecaca',
                fontSize: '0.9rem'
              }}>
                {authError}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={authLoading}>
              {authLoading ? <Loader2 className="animate-spin" /> : 'Login Admin'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="app-container">
        <div className="glass-panel" style={{ textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Akses Ditolak</h2>
          <p className="subtitle" style={{ marginBottom: '1.5rem' }}>{authError || 'Akun ini bukan admin.'}</p>
          <button className="btn-primary" onClick={handleSignOut}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="header-section">
        <h1 className="gradient-text title-large">
          <Swords size={48} className="title-icon" color="#6EE7B7" />
          Kubu War Admin
        </h1>
        <p className="subtitle">Create official "Daily Wars" for the mobile app</p>
        <button className="btn-primary" style={{ maxWidth: '240px', margin: '1.5rem auto 0' }} onClick={handleSignOut}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      <div className="glass-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">War Topic (Question)</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Bubur Diaduk vs Gak Diaduk"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="label" style={{ color: '#3B82F6' }}>Team A Option</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Diaduk"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                required
              />
            </div>

            <div className="vs-badge">VS</div>

            <div className="form-group">
              <label className="label" style={{ color: '#ef4444' }}>Team B Option</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Gak Diaduk"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            {loading ? 'Deploying War...' : 'Launch Daily War'}
          </button>
        </form>
      </div>

      {polls.length > 0 && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ marginTop: '4rem', marginBottom: '1rem' }}>Recent Wars</h2>
          <div className="card-grid">
            {polls.map(poll => (
              <div key={poll.id} className="poll-card">
                <h3 style={{ margin: '0 0 1rem 0' }}>{poll.question}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#cbd5e1' }}>
                  <span style={{ color: '#60a5fa' }}>{poll.option_a}</span>
                  <span style={{ fontWeight: 'bold', color: '#64748b' }}>VS</span>
                  <span style={{ color: '#f87171' }}>{poll.option_b}</span>
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#475569' }}>
                  {poll.is_official && <span style={{ background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: '4px', marginRight: '8px' }}>Official</span>}
                  {new Date(poll.created_at).toLocaleDateString()}
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleDeletePoll(poll.id)} className="btn-primary" style={{ background: '#ef4444' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
