import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'

function fmtTime(dateStr) {
  const d = new Date(dateStr)
  const diff = Math.floor((Date.now() - d) / 1000)
  if (diff < 60) return 'upravo'
  if (diff < 3600) return `pre ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `pre ${Math.floor(diff / 3600)}h`
  return d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleString('sr-RS', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function MessagesPanel({ project, currentUser, isClient, initialTaskKey, onClose, onMessagesRead }) {
  const [messages, setMessages] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [taskFilter, setTaskFilter] = useState(initialTaskKey || 'all')
  const [text, setText] = useState('')
  const [taskKey, setTaskKey] = useState(initialTaskKey || '')
  const [recipientId, setRecipientId] = useState('all') // 'all' or client user id
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadMessages()
    if (!isClient) loadClients()
  }, [project.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, taskFilter])

  async function loadMessages() {
    setLoading(true)
    try {
      const msgs = await api.getMessages(project.id)
      setMessages(msgs)
      onMessagesRead?.()
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
      const body = {
        text: text.trim(),
        task_key: taskKey.trim().toUpperCase() || undefined,
        recipient_user_id: (!isClient && recipientId !== 'all') ? parseInt(recipientId) : undefined,
      }
      const { message } = await api.sendMessage(project.id, body)
      setMessages(prev => [...prev, message])
      setText('')
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  function handleExport() {
    const token = localStorage.getItem('jt_token')
    fetch(`/api/messages/${project.id}/export`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `poruke-${project.epicKey}-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => alert('Greška pri eksportu'))
  }

  // Unique task keys from messages (with at least one message)
  const taskKeys = [...new Set(messages.filter(m => m.task_key).map(m => m.task_key))]

  const filtered = taskFilter === 'all' ? messages : messages.filter(m => m.task_key === taskFilter)

  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: 420,
      background: 'var(--surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 300,
      boxShadow: '-8px 0 32px rgba(0,0,0,0.2)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 57 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>💬 Poruke</div>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.displayName || project.epicKey}
          </div>
        </div>
        {!isClient && (
          <button
            onClick={handleExport}
            title="Eksportuj u CSV"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 10px', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 12, color: 'var(--textMuted)', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
          >
            ⬇ Export
          </button>
        )}
        <button
          onClick={onClose}
          style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--textMuted)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >×</button>
      </div>

      {/* Task filter pills */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
        {[{ key: 'all', label: `Sve (${messages.length})` }, ...taskKeys.map(k => ({ key: k, label: `🔗 ${k}` }))].map(p => (
          <button
            key={p.key}
            onClick={() => setTaskFilter(p.key)}
            style={{
              fontFamily: "'DM Mono'",
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 12,
              border: taskFilter === p.key ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: taskFilter === p.key ? 'rgba(79,142,247,0.1)' : 'transparent',
              color: taskFilter === p.key ? 'var(--accent)' : 'var(--textMuted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >{p.label}</button>
        ))}
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 13, padding: 32 }}>Učitavam...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--textSubtle)', fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 13, padding: 40 }}>
            {taskFilter === 'all' ? 'Nema poruka za ovaj projekat.' : `Nema poruka vezanih za ${taskFilter}.`}
          </div>
        )}
        {filtered.map((m, i) => {
          const isMe = m.sender_id === currentUser.id
          const prevMsg = filtered[i - 1]
          const showSender = !prevMsg || prevMsg.sender_id !== m.sender_id
          return (
            <div key={m.id} style={{ marginTop: showSender && i > 0 ? 10 : 2 }}>
              {showSender && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'Syne', fontSize: 12, fontWeight: 700, color: isMe ? 'var(--accent)' : 'var(--text)' }}>
                    {isMe ? 'Vi' : m.sender_name}
                  </span>
                  {!isMe && m.recipient_name && (
                    <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)' }}>→ {m.recipient_name}</span>
                  )}
                  {!isMe && !m.recipient_name && !isClient && (
                    <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)' }}>→ svi klijenti</span>
                  )}
                  <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)', marginLeft: 'auto' }}>{fmtTime(m.created_at)}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
              }}>
                {m.task_key && showSender && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--accent)', background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 4, padding: '1px 6px', marginBottom: 3 }}>
                    🔗 {m.task_key}
                  </span>
                )}
                <div style={{
                  maxWidth: '85%',
                  padding: '7px 11px',
                  borderRadius: isMe ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                  background: isMe ? 'var(--accent)' : 'var(--surfaceAlt)',
                  border: isMe ? 'none' : '1px solid var(--border)',
                  fontFamily: "'TW Cen MT', 'Century Gothic'",
                  fontSize: 13,
                  color: isMe ? '#fff' : 'var(--text)',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}>
                  {m.text}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose area */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Task key input */}
        <input
          value={taskKey}
          onChange={e => setTaskKey(e.target.value)}
          placeholder="Veži za task (npr. ECOM-1774) — opciono"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', color: 'var(--text)', fontSize: 12, fontFamily: "'DM Mono'", outline: 'none', width: '100%', boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; if (taskKey.trim()) setTaskFilter(taskKey.trim().toUpperCase()) }}
        />

        {/* Recipient selector (admin only, only if clients exist) */}
        {!isClient && clients.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 11, color: 'var(--textMuted)', flexShrink: 0 }}>Prima:</span>
            {[{ id: 'all', name: 'Svi klijenti' }, ...clients].map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="recipient"
                  value={c.id}
                  checked={recipientId === String(c.id)}
                  onChange={() => setRecipientId(String(c.id))}
                  style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <span style={{ fontFamily: "'TW Cen MT', 'Century Gothic'", fontSize: 12, color: String(recipientId) === String(c.id) ? 'var(--text)' : 'var(--textMuted)' }}>
                  {c.name}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* Textarea + send */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
            placeholder="Napišite poruku... (Enter za slanje, Shift+Enter novi red)"
            rows={2}
            style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, fontFamily: "'TW Cen MT', 'Century Gothic'", resize: 'none', lineHeight: 1.4, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 14px', cursor: !text.trim() || sending ? 'not-allowed' : 'pointer', opacity: !text.trim() || sending ? 0.6 : 1, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', flexShrink: 0 }}
          >→</button>
        </form>
      </div>
    </div>
  )
}
