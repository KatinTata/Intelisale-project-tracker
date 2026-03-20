import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'
import { useWindowSize } from '../hooks/useWindowSize.js'

function fmtTime(dateStr) {
  const d = new Date(dateStr)
  const diff = Math.floor((Date.now() - d) / 1000)
  if (diff < 60) return 'upravo'
  if (diff < 3600) return `pre ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `pre ${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function MessagesPage({ project, currentUser, isClient, initialTaskKey, onClose, onMessagesRead }) {
  const [messages, setMessages] = useState([])
  const [clients, setClients] = useState([])
  const [taskInfoMap, setTaskInfoMap] = useState({}) // key -> { key, summary }
  const [loading, setLoading] = useState(true)
  const [taskFilter, setTaskFilter] = useState(initialTaskKey || 'all')
  const [text, setText] = useState('')
  const [taskKey, setTaskKey] = useState(initialTaskKey || '')
  const [taskKeyInfo, setTaskKeyInfo] = useState(null) // info for compose input
  const [taskKeyLoading, setTaskKeyLoading] = useState(false)
  const [recipientId, setRecipientId] = useState('all')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const debounceRef = useRef(null)
  const { isMobile } = useWindowSize()

  useEffect(() => {
    loadMessages()
    if (!isClient) loadClients()
  }, [project.id])

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, taskFilter, loading])

  // Debounced task key lookup for compose input
  useEffect(() => {
    setTaskKeyInfo(null)
    const key = taskKey.trim().toUpperCase()
    if (!key || !/^[A-Z]+-\d+$/.test(key)) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setTaskKeyLoading(true)
      try {
        const info = await api.getTaskInfo(key)
        setTaskKeyInfo(info)
        setTaskInfoMap(prev => ({ ...prev, [key]: info.summary }))
      } catch {}
      setTaskKeyLoading(false)
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [taskKey])

  async function loadMessages() {
    setLoading(true)
    try {
      const msgs = await api.getMessages(project.id)
      setMessages(msgs)
      onMessagesRead?.()
      // Build taskInfoMap from stored task_summary in messages
      const fromDb = {}
      msgs.forEach(m => { if (m.task_key && m.task_summary) fromDb[m.task_key] = m.task_summary })
      setTaskInfoMap(fromDb)
      // Fetch summaries for keys that are missing (best-effort, don't block)
      const missing = [...new Set(msgs.filter(m => m.task_key && !m.task_summary).map(m => m.task_key))]
      if (missing.length) {
        Promise.all(missing.map(k => api.getTaskInfo(k).catch(() => null))).then(results => {
          const extra = {}
          results.forEach(r => { if (r) extra[r.key] = r.summary })
          setTaskInfoMap(prev => ({ ...prev, ...extra }))
        })
      }
    } catch {}
    setLoading(false)
  }

  async function loadClients() {
    try {
      const list = await api.getProjectClients(project.id)
      setClients(list)
    } catch {}
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const resolvedKey = taskKey.trim().toUpperCase() || undefined
      const body = {
        text: text.trim(),
        task_key: resolvedKey,
        task_summary: resolvedKey ? (taskKeyInfo?.summary || taskInfoMap[resolvedKey] || undefined) : undefined,
        recipient_user_id: (!isClient && recipientId !== 'all') ? parseInt(recipientId) : undefined,
      }
      const { message } = await api.sendMessage(project.id, body)
      setMessages(prev => [...prev, message])
      setText('')
      if (resolvedKey) setTaskFilter(resolvedKey)
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  function handleExport() {
    const token = localStorage.getItem('jt_token')
    const qs = taskFilter !== 'all' ? `?taskKey=${encodeURIComponent(taskFilter)}` : ''
    fetch(`/api/messages/${project.id}/export${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const suffix = taskFilter !== 'all' ? `-${taskFilter}` : ''
        a.download = `poruke-${project.epicKey}${suffix}-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => alert('Greška pri eksportu'))
  }

  const taskKeys = [...new Set(messages.filter(m => m.task_key).map(m => m.task_key))]
  const filtered = taskFilter === 'all' ? messages : messages.filter(m => m.task_key === taskFilter)
  const unreadCount = messages.filter(m => !m.is_read && m.sender_id !== currentUser.id).length

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 400, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
        <button
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--borderHover)'; e.currentTarget.style.color = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
        >← Nazad</button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
              💬 Poruke
            </span>
            <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: 'var(--textMuted)' }}>
              {project.displayName || project.epicKey}
            </span>
            {unreadCount > 0 && (
              <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--red)', background: 'var(--redTint)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '1px 8px' }}>
                {unreadCount} nepročitano
              </span>
            )}
          </div>
        </div>

        {!isClient && (
          <button
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 14px', color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
          >
            ⬇ {taskFilter !== 'all' ? `Export: ${taskFilter}` : 'Eksportuj CSV'}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', maxWidth: 1200, width: '100%', margin: '0 auto', padding: isMobile ? '0' : '0', alignSelf: 'stretch' }}>

        {/* Left sidebar — task filters */}
        {!isMobile && (
          <div style={{ width: 220, borderRight: '1px solid var(--border)', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '0 16px 10px', fontFamily: "'DM Mono'", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--textSubtle)' }}>
              Filteri po tasku
            </div>
            {[{ key: 'all', label: 'Sve poruke', summary: null, count: messages.length }, ...taskKeys.map(k => ({ key: k, label: k, summary: taskInfoMap[k] || null, count: messages.filter(m => m.task_key === k).length }))].map(p => (
              <button
                key={p.key}
                onClick={() => setTaskFilter(p.key)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  borderLeft: taskFilter === p.key ? '2px solid var(--accent)' : '2px solid transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  width: '100%',
                  background: taskFilter === p.key ? 'rgba(79,142,247,0.08)' : 'transparent',
                  gap: 6,
                }}
                onMouseEnter={e => { if (taskFilter !== p.key) e.currentTarget.style.background = 'var(--surfaceAlt)' }}
                onMouseLeave={e => { if (taskFilter !== p.key) e.currentTarget.style.background = taskFilter === p.key ? 'rgba(79,142,247,0.08)' : 'transparent' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: p.key === 'all' ? "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" : "'DM Mono'", fontSize: p.key === 'all' ? 13 : 12, color: taskFilter === p.key ? 'var(--accent)' : 'var(--textMuted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.key !== 'all' && <span style={{ marginRight: 4, opacity: 0.6 }}>🔗</span>}
                    {p.label}
                  </div>
                  {p.summary && (
                    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, color: 'var(--textSubtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {p.summary}
                    </div>
                  )}
                </div>
                <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)', flexShrink: 0, marginTop: 2 }}>{p.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main area — messages + compose */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Mobile task filter pills */}
          {isMobile && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
              {[{ key: 'all', label: `Sve (${messages.length})` }, ...taskKeys.map(k => ({ key: k, label: `🔗 ${k}` }))].map(p => (
                <button
                  key={p.key}
                  onClick={() => setTaskFilter(p.key)}
                  style={{ fontFamily: "'DM Mono'", fontSize: 11, padding: '4px 10px', borderRadius: 12, border: taskFilter === p.key ? '1px solid var(--accent)' : '1px solid var(--border)', background: taskFilter === p.key ? 'rgba(79,142,247,0.1)' : 'transparent', color: taskFilter === p.key ? 'var(--accent)' : 'var(--textMuted)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
                >{p.label}</button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px 32px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, padding: 48 }}>Učitavam poruke...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--textSubtle)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 14, padding: 64 }}>
                {taskFilter === 'all' ? 'Nema poruka za ovaj projekat.' : `Nema poruka vezanih za ${taskFilter}.`}
              </div>
            ) : (
              filtered.map((m, i) => {
                const isMe = m.sender_id === currentUser.id
                const prevMsg = filtered[i - 1]
                const showHeader = !prevMsg || prevMsg.sender_id !== m.sender_id ||
                  (new Date(m.created_at) - new Date(prevMsg.created_at)) > 5 * 60 * 1000

                return (
                  <div key={m.id} style={{ marginTop: showHeader && i > 0 ? 20 : 3, display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '72%', alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
                    {showHeader && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isMe ? 'var(--accent)' : 'var(--surfaceAlt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: isMe ? '#fff' : 'var(--text)', flexShrink: 0 }}>
                          {(isMe ? currentUser.name : m.sender_name)?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                            <span style={{ fontFamily: 'Syne', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                              {isMe ? 'Vi' : m.sender_name}
                            </span>
                            {!isClient && !isMe && m.recipient_name && (
                              <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textMuted)', background: 'var(--surfaceAlt)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px' }}>→ {m.recipient_name}</span>
                            )}
                            {!isClient && !isMe && !m.recipient_name && (
                              <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)', background: 'var(--surfaceAlt)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px' }}>→ svi klijenti</span>
                            )}
                          </div>
                          <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)' }}>{fmtTime(m.created_at)}</span>
                        </div>
                      </div>
                    )}
                    {m.task_key && (showHeader || filtered[i - 1]?.task_key !== m.task_key) && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 6, padding: '3px 10px', marginBottom: 4 }}>
                        <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>🔗 {m.task_key}</span>
                        {(m.task_summary || taskInfoMap[m.task_key]) && (
                          <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, color: 'var(--textMuted)', borderLeft: '1px solid rgba(79,142,247,0.2)', paddingLeft: 6 }}>
                            {(m.task_summary || taskInfoMap[m.task_key]).length > 50
                              ? (m.task_summary || taskInfoMap[m.task_key]).slice(0, 50) + '...'
                              : (m.task_summary || taskInfoMap[m.task_key])}
                          </span>
                        )}
                      </div>
                    )}
                    <div style={{
                      padding: '9px 14px',
                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      background: isMe ? 'var(--accent)' : 'var(--surface)',
                      border: isMe ? 'none' : '1px solid var(--border)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                      fontSize: 14,
                      color: isMe ? '#fff' : 'var(--text)',
                      lineHeight: 1.55,
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {m.text}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Compose area */}
          <div style={{ borderTop: '1px solid var(--border)', padding: isMobile ? '12px' : '16px 32px', background: 'var(--surface)', flexShrink: 0 }}>
            <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Task key + recipient row */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '0 0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)', flexShrink: 0 }}>Task:</span>
                    <input
                      value={taskKey}
                      onChange={e => setTaskKey(e.target.value.toUpperCase())}
                      placeholder="ECOM-1774"
                      style={{ width: 120, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', color: 'var(--text)', fontSize: 12, fontFamily: "'DM Mono'", outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                  </div>
                  {taskKeyLoading && (
                    <div style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)', paddingLeft: 44 }}>tražim...</div>
                  )}
                  {!taskKeyLoading && taskKeyInfo && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 6, padding: '2px 8px', marginLeft: 44 }}>
                      <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>🔗 {taskKeyInfo.key}</span>
                      {taskKeyInfo.summary && (
                        <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 11, color: 'var(--textMuted)', borderLeft: '1px solid rgba(79,142,247,0.2)', paddingLeft: 6 }}>
                          {taskKeyInfo.summary.length > 60 ? taskKeyInfo.summary.slice(0, 60) + '...' : taskKeyInfo.summary}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {!isClient && clients.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)', flexShrink: 0 }}>Prima:</span>
                    {[{ id: 'all', name: 'Svi klijenti' }, ...clients].map(c => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="recipient"
                          value={c.id}
                          checked={String(recipientId) === String(c.id)}
                          onChange={() => setRecipientId(String(c.id))}
                          style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                        />
                        <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, color: String(recipientId) === String(c.id) ? 'var(--text)' : 'var(--textMuted)' }}>
                          {c.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Textarea + send */}
              <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
                  placeholder="Napišite poruku... (Enter za slanje, Shift+Enter novi red)"
                  rows={3}
                  style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", resize: 'none', lineHeight: 1.5, outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  style={{ background: sending || !text.trim() ? 'var(--surfaceAlt)' : 'var(--accent)', color: sending || !text.trim() ? 'var(--textMuted)' : '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: '0 20px', cursor: !text.trim() || sending ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, transition: 'all 0.2s ease', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {sending ? '...' : '→ Pošalji'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
