import { useState } from 'react'
import { api } from '../api.js'

export default function SettingsModal({ user, onClose, onUserUpdate }) {
  const [tab, setTab] = useState('profile')
  const [jiraUrl, setJiraUrl] = useState(user.jiraUrl || '')
  const [jiraEmail, setJiraEmail] = useState(user.jiraEmail || '')
  const [jiraToken, setJiraToken] = useState('')
  const [testStatus, setTestStatus] = useState(null)
  const [testLoading, setTestLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwMsg, setPwMsg] = useState(null)
  const [pwLoading, setPwLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  async function handleTestJira() {
    if (!jiraUrl || !jiraEmail || !jiraToken) {
      setTestStatus({ ok: false, msg: 'Unesite sve podatke' })
      return
    }
    setTestLoading(true)
    setTestStatus(null)
    try {
      const res = await api.testJiraConnection({ jiraUrl, jiraEmail, jiraToken })
      setTestStatus({ ok: true, msg: `✅ Uspešno — ${res.displayName}` })
    } catch (err) {
      setTestStatus({ ok: false, msg: `❌ ${err.message}` })
    } finally {
      setTestLoading(false)
    }
  }

  async function handleSaveJira() {
    setSaving(true)
    setSaveMsg(null)
    try {
      await api.updateJiraConfig({ jiraUrl, jiraEmail, jiraToken: jiraToken || undefined })
      onUserUpdate({ ...user, jiraUrl, jiraEmail })
      setSaveMsg({ ok: true, msg: 'Sačuvano!' })
    } catch (err) {
      setSaveMsg({ ok: false, msg: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (!oldPassword || !newPassword) return
    setPwLoading(true)
    setPwMsg(null)
    try {
      await api.changePassword({ oldPassword, newPassword })
      setPwMsg({ ok: true, msg: 'Lozinka promenjena!' })
      setOldPassword('')
      setNewPassword('')
    } catch (err) {
      setPwMsg({ ok: false, msg: err.message })
    } finally {
      setPwLoading(false)
    }
  }

  async function handleDeleteAccount() {
    try {
      await api.deleteAccount()
      localStorage.removeItem('jt_token')
      window.location.href = '/login'
    } catch (err) {
      alert(err.message)
    }
  }

  const tabs = [
    { key: 'profile', label: '👤 Profil' },
    { key: 'jira', label: '🔗 Jira konekcija' },
    { key: 'danger', label: '⚠️ Opasna zona' },
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: 560,
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>Podešavanja</h2>
          <button onClick={onClose} style={{ fontSize: 18, color: 'var(--textMuted)', padding: 4 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar tabs */}
          <div style={{ width: 180, borderRight: '1px solid var(--border)', padding: '12px 8px', flexShrink: 0 }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 12px',
                  borderRadius: 8,
                  fontFamily: "'DM Sans'",
                  fontSize: 14,
                  color: tab === t.key ? 'var(--accent)' : 'var(--textMuted)',
                  background: tab === t.key ? 'rgba(79,142,247,0.1)' : 'transparent',
                  marginBottom: 2,
                  transition: 'all 0.15s',
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
            {tab === 'profile' && (
              <div>
                <h3 style={sectionTitle}>Profil</h3>
                <div style={fieldGroup}>
                  <label style={fieldLabel}>IME</label>
                  <div style={fieldValue}>{user.name}</div>
                </div>
                <div style={fieldGroup}>
                  <label style={fieldLabel}>EMAIL</label>
                  <div style={fieldValue}>{user.email}</div>
                </div>

                <h3 style={{ ...sectionTitle, marginTop: 24 }}>Promena lozinke</h3>
                <form onSubmit={handleChangePassword}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={fieldLabel}>TRENUTNA LOZINKA</label>
                    <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={fieldLabel}>NOVA LOZINKA</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
                  </div>
                  {pwMsg && <div style={{ ...msgStyle, color: pwMsg.ok ? 'var(--green)' : 'var(--red)', background: pwMsg.ok ? 'var(--greenTint)' : 'var(--redTint)' }}>{pwMsg.msg}</div>}
                  <button type="submit" disabled={pwLoading} style={{ ...btnPrimary, opacity: pwLoading ? 0.7 : 1 }}>
                    {pwLoading ? 'Menjam...' : 'Promeni lozinku'}
                  </button>
                </form>
              </div>
            )}

            {tab === 'jira' && (
              <div>
                <h3 style={sectionTitle}>Jira konekcija</h3>
                <div style={{ marginBottom: 12 }}>
                  <label style={fieldLabel}>JIRA URL</label>
                  <input value={jiraUrl} onChange={e => setJiraUrl(e.target.value)} placeholder="vas-workspace.atlassian.net" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={fieldLabel}>EMAIL</label>
                  <input value={jiraEmail} onChange={e => setJiraEmail(e.target.value)} placeholder="vas@email.com" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={fieldLabel}>API TOKEN</label>
                  <input type="password" value={jiraToken} onChange={e => setJiraToken(e.target.value)} placeholder="••••••••••••" style={inputStyle} />
                  <div style={{ fontSize: 11, color: 'var(--textMuted)', marginTop: 4, fontFamily: "'DM Sans'" }}>
                    Token se čuva enkriptovan. Ostavite prazno da ne menjate.
                  </div>
                </div>
                {testStatus && (
                  <div style={{ ...msgStyle, color: testStatus.ok ? 'var(--green)' : 'var(--red)', background: testStatus.ok ? 'var(--greenTint)' : 'var(--redTint)', marginBottom: 12 }}>
                    {testStatus.msg}
                  </div>
                )}
                {saveMsg && (
                  <div style={{ ...msgStyle, color: saveMsg.ok ? 'var(--green)' : 'var(--red)', background: saveMsg.ok ? 'var(--greenTint)' : 'var(--redTint)', marginBottom: 12 }}>
                    {saveMsg.msg}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleTestJira} disabled={testLoading} style={{ ...btnSecondary, opacity: testLoading ? 0.7 : 1 }}>
                    {testLoading ? 'Testiram...' : '🔌 Test konekcije'}
                  </button>
                  <button onClick={handleSaveJira} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Čuvam...' : 'Sačuvaj'}
                  </button>
                </div>
              </div>
            )}

            {tab === 'danger' && (
              <div>
                <h3 style={{ ...sectionTitle, color: 'var(--red)' }}>Opasna zona</h3>
                <div style={{ background: 'var(--redTint)', border: '1px solid #EF444430', borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Obriši nalog</div>
                  <div style={{ fontSize: 13, color: 'var(--textMuted)', marginBottom: 16, fontFamily: "'DM Sans'" }}>
                    Ova akcija je nepovratna. Svi projekti i podaci će biti trajno obrisani.
                  </div>
                  {!deleteConfirm ? (
                    <button onClick={() => setDeleteConfirm(true)} style={{ ...btnDanger }}>
                      Obriši nalog
                    </button>
                  ) : (
                    <div>
                      <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12, fontFamily: "'DM Sans'" }}>
                        Da li si siguran? Ova akcija se ne može poništiti.
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setDeleteConfirm(false)} style={btnSecondary}>Otkaži</button>
                        <button onClick={handleDeleteAccount} style={btnDanger}>Da, obriši sve</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const sectionTitle = {
  fontFamily: 'Syne',
  fontWeight: 700,
  fontSize: 16,
  color: 'var(--text)',
  marginBottom: 16,
}

const fieldGroup = { marginBottom: 12 }

const fieldLabel = {
  display: 'block',
  fontSize: 11,
  fontFamily: "'DM Mono'",
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--textMuted)',
  marginBottom: 4,
}

const fieldValue = {
  fontFamily: "'DM Sans'",
  fontSize: 14,
  color: 'var(--text)',
  padding: '8px 12px',
  background: 'var(--surfaceAlt)',
  border: '1px solid var(--border)',
  borderRadius: 8,
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '9px 12px',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: "'DM Sans'",
}

const msgStyle = {
  padding: '8px 12px',
  borderRadius: 6,
  fontSize: 13,
  fontFamily: "'DM Sans'",
  border: '1px solid transparent',
  marginBottom: 8,
}

const btnPrimary = {
  background: 'var(--accent)',
  color: '#fff',
  borderRadius: 8,
  padding: '9px 18px',
  fontFamily: "'DM Sans'",
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  border: 'none',
}

const btnSecondary = {
  background: 'transparent',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '9px 18px',
  fontFamily: "'DM Sans'",
  fontSize: 14,
  cursor: 'pointer',
  border: '1px solid var(--border)',
}

const btnDanger = {
  background: 'var(--red)',
  color: '#fff',
  borderRadius: 8,
  padding: '9px 18px',
  fontFamily: "'DM Sans'",
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  border: 'none',
}
