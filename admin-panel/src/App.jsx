import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BarChart3, Send, Loader2, LogOut, ShieldAlert, Check, EyeOff, Trash, User, Calendar, RefreshCw } from 'lucide-react'
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

  // Reports & Moderation States
  const [activeTab, setActiveTab] = useState('polls') // 'polls' or 'moderation'
  const [reports, setReports] = useState([])
  const [targetData, setTargetData] = useState({ polls: {}, comments: {} })
  const [moderatingReportId, setModeratingReportId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('pending') // 'all', 'pending', 'ignored', 'hidden', 'deleted'

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
      fetchReports()
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

  async function fetchReports() {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reporter_id(username),
          reviewer:profiles!reviewed_by(username)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reports:', error)
        return
      }

      setReports(data || [])

      // Fetch targets in bulk
      const pollIds = data.filter(r => r.target_type === 'poll').map(r => r.target_id)
      const commentIds = data.filter(r => r.target_type === 'comment').map(r => r.target_id)

      const newTargetData = { polls: {}, comments: {} }

      if (pollIds.length > 0) {
        const { data: polls } = await supabase
          .from('polls')
          .select('id, question, option_a, option_b')
          .in('id', pollIds)

        if (polls) {
          polls.forEach(p => {
            newTargetData.polls[p.id] = p
          })
        }
      }

      if (commentIds.length > 0) {
        const { data: comments } = await supabase
          .from('comments')
          .select('id, text, choice')
          .in('id', commentIds)

        if (comments) {
          comments.forEach(c => {
            newTargetData.comments[c.id] = c
          })
        }
      }

      setTargetData(newTargetData)
    } catch (err) {
      console.error('Unexpected error fetching reports:', err)
    }
  }

  async function handleModerationAction(reportId, targetType, targetId, action) {
    try {
      setModeratingReportId(reportId)
      const now = new Date().toISOString()
      const reviewerId = user.id

      if (action === 'ignore') {
        const { error } = await supabase
          .from('reports')
          .update({
            status: 'ignored',
            reviewed_by: reviewerId,
            reviewed_at: now
          })
          .eq('id', reportId)

        if (error) throw error
        alert('Laporan berhasil diabaikan.')
      } else if (action === 'hide') {
        const table = targetType === 'poll' ? 'polls' : 'comments'
        const { error: targetError } = await supabase
          .from(table)
          .update({ is_hidden: true })
          .eq('id', targetId)

        if (targetError) throw targetError

        const { error: reportError } = await supabase
          .from('reports')
          .update({
            status: 'hidden',
            reviewed_by: reviewerId,
            reviewed_at: now
          })
          .eq('id', reportId)

        if (reportError) throw reportError
        alert('Konten berhasil disembunyikan.')
      } else if (action === 'delete') {
        if (!confirm(`Hapus ${targetType === 'poll' ? 'polling' : 'komentar'} ini secara permanen? Tindakan ini tidak bisa dibatalkan.`)) {
          setModeratingReportId(null)
          return
        }

        const table = targetType === 'poll' ? 'polls' : 'comments'
        const { error: targetError } = await supabase
          .from(table)
          .delete()
          .eq('id', targetId)

        if (targetError) throw targetError

        const { error: reportError } = await supabase
          .from('reports')
          .update({
            status: 'deleted',
            reviewed_by: reviewerId,
            reviewed_at: now
          })
          .eq('id', reportId)

        if (reportError) throw reportError
        alert('Konten berhasil dihapus secara permanen.')
      }

      await fetchReports()
      if (targetType === 'poll') {
        await fetchPolls()
      }
    } catch (err) {
      console.error('Failed to moderate report:', err)
      alert(`Gagal memproses moderasi: ${err.message || err}`)
    } finally {
      setModeratingReportId(null)
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
      setAuthError('Akses admin diperlukan untuk membuat Polling Pilihan.')
      return;
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

      alert('Polling Pilihan Berhasil Dibuat!')
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
            <BarChart3 size={48} className="title-icon" color="#6EE7B7" />
            KUBU Admin Opini
          </h1>
          <p className="subtitle">Login admin untuk membuat Polling Pilihan</p>
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
          <BarChart3 size={48} className="title-icon" color="#6EE7B7" />
          KUBU Admin Opini
        </h1>
        <p className="subtitle">Moderasi Konten & Buat Polling Pilihan Resmi</p>
        <button className="btn-primary" style={{ maxWidth: '240px', margin: '1.5rem auto 0' }} onClick={handleSignOut}>
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '2.5rem',
        width: '100%',
        maxWidth: '500px'
      }}>
        <button 
          onClick={() => setActiveTab('polls')}
          className="btn-primary"
          style={{
            margin: 0,
            background: activeTab === 'polls' ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : 'rgba(30, 41, 59, 0.5)',
            border: activeTab === 'polls' ? 'none' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: activeTab === 'polls' ? '0 4px 15px rgba(37, 99, 235, 0.3)' : 'none',
            color: activeTab === 'polls' ? '#fff' : '#94a3b8'
          }}
        >
          Buat Polling
        </button>
        <button 
          onClick={() => {
            setActiveTab('moderation')
            fetchReports()
          }}
          className="btn-primary"
          style={{
            margin: 0,
            background: activeTab === 'moderation' ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : 'rgba(30, 41, 59, 0.5)',
            border: activeTab === 'moderation' ? 'none' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: activeTab === 'moderation' ? '0 4px 15px rgba(37, 99, 235, 0.3)' : 'none',
            color: activeTab === 'moderation' ? '#fff' : '#94a3b8'
          }}
        >
          Moderasi Konten ({reports.filter(r => r.status === 'pending').length})
        </button>
      </div>

      {activeTab === 'polls' ? (
        <>
          <div className="glass-panel">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Topik Polling (Pertanyaan)</label>
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
                {loading ? 'Menerbitkan Polling...' : 'Terbitkan Polling'}
              </button>
            </form>
          </div>

          {polls.length > 0 && (
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <h2 style={{ marginTop: '4rem', marginBottom: '1rem' }}>Polling Terbaru</h2>
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
        </>
      ) : (
        <div style={{ width: '100%' }}>
          {/* Moderation Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto 1.5rem',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['pending', 'ignored', 'hidden', 'deleted', 'all'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: statusFilter === filter ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    background: statusFilter === filter ? '#3B82F6' : 'rgba(30, 41, 59, 0.5)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {filter === 'pending' ? 'Menunggu' : filter === 'ignored' ? 'Diabaikan' : filter === 'hidden' ? 'Disembunyikan' : filter === 'deleted' ? 'Dihapus' : 'Semua'}
                </button>
              ))}
            </div>
            <button
              onClick={fetchReports}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(30, 41, 59, 0.3)',
                color: '#94a3b8',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* Reports Content */}
          {reports.filter(r => statusFilter === 'all' || r.status === statusFilter).length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem', width: '100%', maxWidth: '480px' }}>
              <ShieldAlert size={48} style={{ color: '#4b5563', marginBottom: '1rem' }} />
              <p className="subtitle">Tidak ada laporan dengan status ini.</p>
            </div>
          ) : (
            <div className="card-grid" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              {reports
                .filter(r => statusFilter === 'all' || r.status === statusFilter)
                .map((report) => {
                  const reporterName = report.reporter?.username || 'Anonymous'
                  const reviewerName = report.reviewer?.username || ''
                  const target = report.target_type === 'poll' 
                    ? targetData.polls[report.target_id] 
                    : targetData.comments[report.target_id]

                  return (
                    <div 
                      key={report.id} 
                      className="poll-card" 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1rem', 
                        borderLeft: report.status === 'pending' ? '4px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.05)',
                        textAlign: 'left'
                      }}
                    >
                      {/* Report Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ 
                          background: report.target_type === 'poll' ? '#2563EB' : '#7C3AED', 
                          color: '#fff', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {report.target_type === 'poll' ? 'Polling' : 'Opini'}
                        </span>
                        <span style={{ 
                          background: 'rgba(239, 68, 68, 0.15)', 
                          color: '#FCA5A5', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          {report.reason === 'ujaran_kebencian' ? 'Ujaran Kebencian / SARA' : report.reason === 'informasi_menyesatkan' ? 'Hoaks / Informasi Menyesatkan' : report.reason === 'konten_tidak_pantas' ? 'Konten Tidak Pantas' : report.reason === 'spam' ? 'Spam' : report.reason === 'pelecehan' ? 'Pelecehan' : 'Lainnya'}
                        </span>
                      </div>

                      {/* Target Content Display */}
                      <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.9rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          Konten yang dilaporkan:
                        </div>
                        {target ? (
                          report.target_type === 'poll' ? (
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#fff' }}>{target.question}</div>
                              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                                Pilihan: <span style={{ color: '#60a5fa' }}>{target.option_a}</span> vs <span style={{ color: '#f87171' }}>{target.option_b}</span>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ color: '#e2e8f0', fontStyle: 'italic' }}>"{target.text}"</div>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                Kubu pilihan komentator: <span style={{ textTransform: 'uppercase', color: target.choice === 'a' ? '#60a5fa' : '#f87171', fontWeight: 'bold' }}>Kubu {target.choice}</span>
                              </div>
                            </div>
                          )
                        ) : (
                          <div style={{ color: '#ef4444', fontStyle: 'italic', fontSize: '0.85rem' }}>
                            Konten tidak ditemukan atau telah dihapus.
                          </div>
                        )}
                      </div>

                      {/* Reporter details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <User size={12} />
                          <span>Pelapor: <strong>@{reporterName}</strong></span>
                        </div>
                        {report.details && (
                          <div style={{ marginTop: '0.25rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: '2px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}>
                            <strong>Keterangan:</strong> {report.details}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', fontSize: '0.75rem', color: '#475569' }}>
                          <Calendar size={12} />
                          <span>Waktu Lapor: {new Date(report.created_at).toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      {/* Reviewer actions/info */}
                      {report.status !== 'pending' ? (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          padding: '0.5rem 0.75rem', 
                          background: report.status === 'ignored' ? 'rgba(255,255,255,0.05)' : report.status === 'hidden' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', 
                          borderRadius: '8px', 
                          fontSize: '0.8rem',
                          color: report.status === 'ignored' ? '#cbd5e1' : report.status === 'hidden' ? '#FBBF24' : '#FCA5A5'
                        }}>
                          <strong>Tindakan diambil:</strong> {report.status === 'ignored' ? 'Laporan Diabaikan' : report.status === 'hidden' ? 'Konten Disembunyikan' : 'Konten Dihapus'}
                          {reviewerName && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Oleh @{reviewerName} pada {new Date(report.reviewed_at).toLocaleString('id-ID')}</div>}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            disabled={moderatingReportId === report.id}
                            onClick={() => handleModerationAction(report.id, report.target_type, report.target_id, 'ignore')}
                            className="btn-primary"
                            style={{
                              margin: 0,
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                              padding: '0.5rem 0.75rem',
                              background: 'rgba(34, 197, 94, 0.15)',
                              color: '#4ade80',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              boxShadow: 'none'
                            }}
                          >
                            {moderatingReportId === report.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            Abaikan
                          </button>

                          <button
                            disabled={moderatingReportId === report.id || !target}
                            onClick={() => handleModerationAction(report.id, report.target_type, report.target_id, 'hide')}
                            className="btn-primary"
                            style={{
                              margin: 0,
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                              padding: '0.5rem 0.75rem',
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              opacity: !target ? 0.5 : 1,
                              boxShadow: 'none'
                            }}
                          >
                            <EyeOff size={12} />
                            Sembunyikan
                          </button>

                          <button
                            disabled={moderatingReportId === report.id || !target}
                            onClick={() => handleModerationAction(report.id, report.target_type, report.target_id, 'delete')}
                            className="btn-primary"
                            style={{
                              margin: 0,
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                              padding: '0.5rem 0.75rem',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#fca5a5',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              opacity: !target ? 0.5 : 1,
                              boxShadow: 'none'
                            }}
                          >
                            <Trash size={12} />
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
