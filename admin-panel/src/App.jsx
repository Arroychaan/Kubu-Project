
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { Swords, Send, Trophy, Loader2 } from 'lucide-react'
import './App.css'

function App() {
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [polls, setPolls] = useState([])

  useEffect(() => {
    fetchPolls()
  }, [])

  async function fetchPolls() {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) console.error('Error fetching polls:', error)
      else setPolls(data || [])
    } catch (err) {
      console.error('Unexpected error:', err)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!question || !optionA || !optionB) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('polls')
        .insert([
          {
            question,
            option_a: optionA,
            option_b: optionB,
            is_official: true, // This makes it a "Daily War" from admin
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
      alert('Error creating poll: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="gradient-text" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontSize: '2.5rem'
        }}>
          <Swords size={48} color="#6EE7B7" />
          Kubu War Admin
        </h1>
        <p style={{ color: '#94a3b8' }}>Create official "Daily Wars" for the mobile app</p>
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
