import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'
import Topbar from '../components/Topbar.jsx'
import BrainAnimation from '../components/BrainAnimation.jsx'
import { useWindowSize } from '../hooks/useWindowSize.js'
import { useT } from '../lang.jsx'

function fmtTime(dateStr, t) {
  const d = new Date(dateStr)
  const diff = Math.floor((Date.now() - d) / 1000)
  if (diff < 60) return t('time.justNow')
  if (diff < 3600) return t('time.minutesAgo', { n: Math.floor(diff / 60) })
  if (diff < 86400) return t('time.hoursAgo', { n: Math.floor(diff / 3600) })
  return d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const TASK_KEY_RE = /^[A-Z][A-Z0-9]*-\d+$/
function looksLikeTaskKey(val) { return TASK_KEY_RE.test(val.trim().toUpperCase()) }
function threadId(m) { return m.subject || m.task_key || null }

// ── Inner chat panel (same logic as before, now project-aware) ─────────────────

function ChatPanel({ project, currentUser, isClient }) {
  const t = useT()
  const [messages, setMessages] = useState([])
  const [clients, setClients] = useState([])
  const [taskInfoMap, setTaskInfoMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [threadFilter, setThreadFilter] = useState('all')
  const [text, setText] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [topicType, setTopicType] = useState(null)
  const [taskSummary, setTaskSummary] = useState(null)
  const [taskFetchLoading, setTaskFetchLoading] = useState(false)
  const [recipientId, setRecipientId] = useState('all')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const debounceRef = useRef(null)
  const { isMobile } = useWindowSize()

  useEffect(() => {
    setMessages([])
    setThreadFilter('all')
    setTopicInput('')
    setTopicType(null)
    setTaskSummary(null)
    loadMessages()
    if (!isClient) loadClients()
  }, [project.id])

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, threadFilter, loading])

  function handleTopicChange(e) {
    const val = e.target.value
    setTopicInput(val)
    setTaskSummary(null)
    const trimmed = val.trim()
    if (!trimmed) { setTopicType(null); return }
    if (looksLikeTaskKey(trimmed)) {
      setTopicType('task')
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        setTaskFetchLoading(true)
        try {
          const info = await api.getTaskInfo(trimmed.toUpperCase())
          setTaskSummary(info.summary || null)
          setTaskInfoMap(prev => ({ ...prev, [trimmed.toUpperCase()]: info.summary }))
        } catch {}
        setTaskFetchLoading(false)
      }, 500)
    } else {
      setTopicType('subject')
    }
  }

  async function loadMessages() {
    setLoading(true)
    try {
      const msgs = await api.getMessages(project.id)
      setMessages(msgs)
      const fromDb = {}
      msgs.forEach(m => { if (m.task_key && m.task_summary) fromDb[m.task_key] = m.task_summary })
      setTaskInfoMap(fromDb)
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
      const trimmedTopic = topicInput.trim()
      const resolvedKey = topicType === 'task' ? trimmedTopic.toUpperCase() : undefined
      const body = {
        text: text.trim(),
        task_key: resolvedKey,
        task_summary: resolvedKey ? (taskSummary || taskInfoMap[resolvedKey] || undefined) : undefined,
        subject: topicType === 'subject' ? trimmedTopic : undefined,
        recipient_user_id: (!isClient && recipientId !== 'all') ? parseInt(recipientId) : undefined,
      }
      const { message } = await api.sendMessage(project.id, body)
      setMessages(prev => [...prev, message])
      setText('')
      const tid = message.subject || message.task_key
      if (tid) setThreadFilter(tid)
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  function handleExport() {
    const token = localStorage.getItem('jt_token')
    const qs = threadFilter !== 'all' ? `?taskKey=${encodeURIComponent(threadFilter)}` : ''
    fetch(`/api/messages/${project.id}/export${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const suffix = threadFilter !== 'all' ? `-${threadFilter}` : ''
        a.download = `poruke-${project.epicKey}${suffix}-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => alert(t('msg.exportError')))
  }

  const threads = [...new Map(
    messages.filter(m => threadId(m)).map(m => {
      const id = threadId(m)
      return [id, { id, label: m.subject || m.task_key, taskKey: m.task_key, subject: m.subject, count: 0 }]
    })
  ).values()].map(th => ({ ...th, count: messages.filter(m => threadId(m) === th.id).length }))

  const filtered = threadFilter === 'all' ? messages : messages.filter(m => threadId(m) === threadFilter)

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
      {/* Left sidebar — threads */}
      {!isMobile && (
        <div style={{ width: 220, borderRight: '1px solid var(--border)', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '0 16px 10px', fontFamily: "'DM Mono'", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--textSubtle)' }}>
            {t('msg.threads')}
          </div>
          {[{ id: 'all', label: t('msg.all'), taskKey: null, subject: null, count: messages.length }, ...threads].map(th => (
            <button
              key={th.id}
              onClick={() => {
                setThreadFilter(th.id)
                if (th.id !== 'all') {
                  if (th.subject) { setTopicInput(th.subject); setTopicType('subject') }
                  else if (th.taskKey) { setTopicInput(th.taskKey); setTopicType('task') }
                }
              }}
              style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                padding: '8px 16px',
                borderLeft: threadFilter === th.id ? '2px solid var(--accent)' : '2px solid transparent',
                border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                width: '100%',
                background: threadFilter === th.id ? 'rgba(79,142,247,0.08)' : 'transparent',
                gap: 6,
              }}
              onMouseEnter={e => { if (threadFilter !== th.id) e.currentTarget.style.background = 'var(--surfaceAlt)' }}
              onMouseLeave={e => { e.currentTarget.style.background = threadFilter === th.id ? 'rgba(79,142,247,0.08)' : 'transparent' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: th.id === 'all' ? "'DM Sans', sans-serif" : (th.subject ? "'DM Sans', sans-serif" : "'DM Mono'"), fontSize: th.id === 'all' ? 13 : 12, color: threadFilter === th.id ? 'var(--accent)' : 'var(--textMuted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {th.subject && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,opacity:0.6,flexShrink:0}}><path d="M1 2.5A1 1 0 012 1.5h8a1 1 0 011 1v5a1 1 0 01-1 1H7L5.5 10 4 8.5H2a1 1 0 01-1-1z"/></svg>}
                  {th.taskKey && !th.subject && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:4,opacity:0.6,flexShrink:0}}><path d="M5 6.5a2.5 2.5 0 003.5.3l2-2a2.5 2.5 0 00-3.5-3.5l-1 1"/><path d="M7 5.5a2.5 2.5 0 00-3.5-.3l-2 2a2.5 2.5 0 003.5 3.5l1-1"/></svg>}
                  {th.label}
                </div>
                {th.taskKey && !th.subject && taskInfoMap[th.taskKey] && (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--textSubtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {taskInfoMap[th.taskKey]}
                  </div>
                )}
              </div>
              <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)', flexShrink: 0, marginTop: 2 }}>{th.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main area — messages + compose */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Mobile thread pills */}
        {isMobile && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
            {[{ id: 'all', label: `${t('msg.all')} (${messages.length})` }, ...threads.map(th => ({ id: th.id, label: th.subject || th.taskKey }))].map(th => (
              <button
                key={th.id}
                onClick={() => setThreadFilter(th.id)}
                style={{ fontFamily: "'DM Mono'", fontSize: 11, padding: '4px 10px', borderRadius: 12, border: threadFilter === th.id ? '1px solid var(--accent)' : '1px solid var(--border)', background: threadFilter === th.id ? 'rgba(79,142,247,0.1)' : 'transparent', color: threadFilter === th.id ? 'var(--accent)' : 'var(--textMuted)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              >{th.label}</button>
            ))}
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px 32px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--textMuted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: 48 }}>{t('msg.loading')}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--textSubtle)', fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: 64 }}>
              {threadFilter === 'all' ? t('msg.noMessages') : t('msg.noThreadMessages')}
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
                            {isMe ? t('msg.me') : m.sender_name}
                          </span>
                          {!isClient && !isMe && m.recipient_name && (
                            <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textMuted)', background: 'var(--surfaceAlt)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px' }}>→ {m.recipient_name}</span>
                          )}
                          {!isClient && !isMe && !m.recipient_name && (
                            <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)', background: 'var(--surfaceAlt)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px' }}>→ {t('msg.toAllClients')}</span>
                          )}
                        </div>
                        <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)' }}>{fmtTime(m.created_at, t)}</span>
                      </div>
                    </div>
                  )}
                  {(m.subject || m.task_key) && (showHeader || threadId(filtered[i - 1]) !== threadId(m)) && (
                    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, marginBottom: 4 }}>
                      {m.subject && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--surfaceAlt)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px' }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M1 2.5A1 1 0 012 1.5h8a1 1 0 011 1v5a1 1 0 01-1 1H7L5.5 10 4 8.5H2a1 1 0 01-1-1z"/></svg>
                            {m.subject}
                          </span>
                        </div>
                      )}
                      {m.task_key && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 6, padding: '3px 10px' }}>
                          <span style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M5 6.5a2.5 2.5 0 003.5.3l2-2a2.5 2.5 0 00-3.5-3.5l-1 1"/><path d="M7 5.5a2.5 2.5 0 00-3.5-.3l-2 2a2.5 2.5 0 003.5 3.5l1-1"/></svg>
                            {m.task_key}
                          </span>
                          {(m.task_summary || taskInfoMap[m.task_key]) && (
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'var(--textMuted)', borderLeft: '1px solid rgba(79,142,247,0.2)', paddingLeft: 6 }}>
                              {(m.task_summary || taskInfoMap[m.task_key]).slice(0, 50)}{(m.task_summary || taskInfoMap[m.task_key]).length > 50 ? '...' : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{
                    padding: '9px 14px',
                    borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isMe ? 'var(--accent)' : 'var(--surface)',
                    border: isMe ? 'none' : '1px solid var(--border)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    fontFamily: "'DM Sans', sans-serif",
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
        <form onSubmit={handleSend} style={{ borderTop: '2px solid var(--border)', padding: isMobile ? '12px' : '16px 32px', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Topic field */}
            <div>
              <input
                value={topicInput}
                onChange={handleTopicChange}
                placeholder={t('msg.topicPlaceholder')}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, fontFamily: topicType === 'task' ? "'DM Mono'" : "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {topicInput.trim() && topicType && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {topicType === 'task' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--accent)', background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: 6, padding: '3px 10px' }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M5 6.5a2.5 2.5 0 003.5.3l2-2a2.5 2.5 0 00-3.5-3.5l-1 1"/><path d="M7 5.5a2.5 2.5 0 00-3.5-.3l-2 2a2.5 2.5 0 003.5 3.5l1-1"/></svg>
                      {topicInput.trim().toUpperCase()}
                      {taskFetchLoading && <span style={{ opacity: 0.6 }}>…</span>}
                      {!taskFetchLoading && taskSummary && (
                        <span style={{ color: 'var(--textMuted)', fontSize: 10, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>— {taskSummary}</span>
                      )}
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 11, color: 'var(--text)', background: 'var(--surfaceAlt)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px' }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M1 2.5A1 1 0 012 1.5h8a1 1 0 011 1v5a1 1 0 01-1 1H7L5.5 10 4 8.5H2a1 1 0 01-1-1z"/></svg>
                      {topicInput.trim()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Recipient chips (admin only) */}
            {!isClient && clients.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[{ id: 'all', name: t('msg.allClients'), email: t('msg.allClientsOnProject') }, ...clients].map(c => {
                  const sel = recipientId === String(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setRecipientId(String(c.id))}
                      title={c.email}
                      style={{ padding: '5px 14px', borderRadius: 20, border: sel ? '1.5px solid var(--accent)' : '1px solid var(--border)', background: sel ? 'rgba(79,142,247,0.1)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: sel ? 'var(--accent)' : 'var(--text)', fontWeight: sel ? 600 : 400 }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--borderHover)' }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--border)' }}
                    >
                      {c.name}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Textarea */}
            <div style={{ position: 'relative' }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
                placeholder={t('msg.messagePlaceholder')}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', paddingBottom: 28, color: 'var(--text)', fontSize: 14, fontFamily: "'DM Sans', sans-serif", resize: 'none', lineHeight: 1.5, outline: 'none', minHeight: 80, transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              {text.length > 0 && (
                <span style={{ position: 'absolute', bottom: 8, right: 12, fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)', pointerEvents: 'none' }}>{text.length}</span>
              )}
            </div>

            {/* Hint + Send */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'DM Mono'", fontSize: 10, color: 'var(--textSubtle)' }}>
                {t('msg.hint')}
              </span>
              <button
                type="submit"
                disabled={!text.trim() || sending}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: !text.trim() || sending ? 'var(--surfaceAlt)' : 'var(--accent)', color: !text.trim() || sending ? 'var(--textMuted)' : '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, cursor: !text.trim() || sending ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease' }}
              >
                {sending ? t('msg.sending') : t('msg.send')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Full Page ──────────────────────────────────────────────────────────────────

export default function MessagesPage({
  user, theme, onLogout, onOpenSettings,
  onGoToDashboard, onGoToReleaseNotes, onGoToReleaseNotesEditor, onGoToDocuments, onOpenChat,
  initialProjectId,
}) {
  const t = useT()
  const isAdmin = user.role !== 'client'
  const isClient = user.role === 'client'
  const [projects, setProjects] = useState([])
  const [activeId, setActiveId] = useState(initialProjectId || null)
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    api.getProjects()
      .then(list => {
        setProjects(list)
        if (!activeId && list.length > 0) setActiveId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setLoadingProjects(false))
  }, [])

  const activeProject = projects.find(p => p.id === activeId) || null

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <BrainAnimation opacity={0.45} fullscreen />
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Topbar
          user={user}
          theme={theme}
          onLogout={onLogout}
          onOpenSettings={onOpenSettings}
          onGoToDashboard={onGoToDashboard}
          onGoToReleaseNotes={onGoToReleaseNotes}
          onGoToReleaseNotesEditor={isAdmin ? onGoToReleaseNotesEditor : null}
          onGoToDocuments={onGoToDocuments}
          onOpenChat={null}
          onGoToMessages={null}
          currentPage="messages"
        />

        {/* Page header */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', flexShrink: 0 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingBottom: 0 }}>
              <div>
                <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: 'var(--text)', marginBottom: 4 }}>
                  {t('msg.title')}
                </h1>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'var(--textMuted)', paddingBottom: 16 }}>
                  {activeProject ? activeProject.displayName || activeProject.epicKey : t('app.loading')}
                </div>
              </div>
              {activeProject && !isClient && (
                <button
                  onClick={() => {
                    const token = localStorage.getItem('jt_token')
                    fetch(`/api/messages/${activeProject.id}/export`, { headers: { Authorization: `Bearer ${token}` } })
                      .then(res => res.blob())
                      .then(blob => {
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `poruke-${activeProject.epicKey}-${new Date().toISOString().slice(0, 10)}.csv`
                        a.click()
                        URL.revokeObjectURL(url)
                      })
                      .catch(() => {})
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', color: 'var(--textMuted)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
                >
                  ⬇ {t('msg.exportCsv')}
                </button>
              )}
            </div>

            {/* Project tabs */}
            {projects.length > 1 && (
              <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setActiveId(p.id)}
                    style={{
                      padding: '10px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                      background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                      borderBottom: p.id === activeId ? '2px solid var(--accent)' : '2px solid transparent',
                      color: p.id === activeId ? 'var(--accent)' : 'var(--textMuted)',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                    onMouseEnter={e => { if (p.id !== activeId) e.currentTarget.style.color = 'var(--text)' }}
                    onMouseLeave={e => { if (p.id !== activeId) e.currentTarget.style.color = 'var(--textMuted)' }}
                  >
                    {p.displayName || p.epicKey}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', maxWidth: 1400, width: '100%', margin: '0 auto', overflow: 'hidden' }}>
            {loadingProjects ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--textMuted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
                {t('app.loading')}
              </div>
            ) : !activeProject ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--textMuted)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
                {t('msg.noMessages')}
              </div>
            ) : (
              <ChatPanel
                project={activeProject}
                currentUser={user}
                isClient={isClient}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
