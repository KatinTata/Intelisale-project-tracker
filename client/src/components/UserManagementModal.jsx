import { useState, useEffect } from 'react'
import { api } from '../api.js'

export default function UserManagementModal({ projects, onClose }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [newForm, setNewForm] = useState({ name: '', email: '', password: '', role: 'client' })
  const [newError, setNewError] = useState('')
  const [newLoading, setNewLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const data = await api.getUsers()
      setUsers(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    setNewError('')
    setNewLoading(true)
    try {
      const { user } = await api.createUser(newForm)
      setUsers(prev => [...prev, user])
      setNewForm({ name: '', email: '', password: '' })
      setCreating(false)
    } catch (err) {
      setNewError(err.message)
    } finally {
      setNewLoading(false)
    }
  }

  async function handleEditUser(userId, body) {
    const { user } = await api.updateUser(userId, body)
    setUsers(prev => prev.map(u => u.id === userId ? user : u))
  }

  async function handleDeleteUser(userId) {
    if (!confirm('Obrisati ovog korisnika?')) return
    try {
      await api.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleAssignProject(userId, projectId) {
    if (!projectId) return
    try {
      await api.assignProject(userId, parseInt(projectId))
      // Refresh the user's project list
      const assigned = projects.find(p => p.id === parseInt(projectId))
      if (assigned) {
        setUsers(prev => prev.map(u => {
          if (u.id !== userId) return u
          const alreadyAssigned = u.projects.some(p => p.id === assigned.id)
          if (alreadyAssigned) return u
          return { ...u, projects: [...u.projects, { id: assigned.id, epicKey: assigned.epicKey, displayName: assigned.displayName }] }
        }))
      }
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleUnassignProject(userId, projectId) {
    try {
      await api.unassignProject(userId, projectId)
      setUsers(prev => prev.map(u => {
        if (u.id !== userId) return u
        return { ...u, projects: u.projects.filter(p => p.id !== projectId) }
      }))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass-card" style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 700,
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 2 }}>
              Upravljanje korisnicima
            </h2>
            <p style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, color: 'var(--textMuted)' }}>
              Kreiranje i upravljanje client nalozima
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--textMuted)',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surfaceAlt)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--textMuted)' }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px',
              background: 'var(--redTint)', border: '1px solid #EF444430',
              borderRadius: 8, color: 'var(--red)', fontSize: 13,
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
            }}>{error}</div>
          )}

          {/* Add user button */}
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              style={{
                marginBottom: 20,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accentHover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
            >
              + Dodaj korisnika
            </button>
          )}

          {/* Create form */}
          {creating && (
            <form onSubmit={handleCreateUser} style={{
              marginBottom: 20,
              padding: '16px 20px',
              background: 'var(--surfaceAlt)',
              border: '1px solid var(--border)',
              borderRadius: 12,
            }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 14 }}>
                Novi korisnik
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 140px', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>IME</label>
                  <input
                    value={newForm.name}
                    onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ime i prezime"
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>EMAIL</label>
                  <input
                    type="email"
                    value={newForm.email}
                    onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@domen.com"
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>LOZINKA</label>
                  <input
                    type="password"
                    value={newForm.password}
                    onChange={e => setNewForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>ULOGA</label>
                  <select
                    value={newForm.role}
                    onChange={e => setNewForm(f => ({ ...f, role: e.target.value }))}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                  >
                    <option value="client">Klijent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              {newError && (
                <div style={{
                  marginBottom: 12, padding: '8px 12px',
                  background: 'var(--redTint)', border: '1px solid #EF444430',
                  borderRadius: 6, color: 'var(--red)', fontSize: 12,
                  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                }}>{newError}</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="submit"
                  disabled={newLoading}
                  style={{
                    background: 'var(--accent)', color: '#fff', border: 'none',
                    borderRadius: 7, padding: '7px 16px',
                    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 13,
                    cursor: newLoading ? 'not-allowed' : 'pointer',
                    opacity: newLoading ? 0.7 : 1,
                  }}
                >
                  {newLoading ? 'Kreiranje...' : 'Kreiraj'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCreating(false); setNewError('') }}
                  style={{
                    background: 'transparent', color: 'var(--textMuted)',
                    border: '1px solid var(--border)', borderRadius: 7,
                    padding: '7px 16px',
                    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Otkaži
                </button>
              </div>
            </form>
          )}

          {/* Users list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
              Učitavam korisnike...
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--textMuted)', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
              Nema klijent korisnika. Dodajte prvog klikom na dugme iznad.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {users.map(u => (
                <UserRow
                  key={u.id}
                  user={u}
                  adminProjects={projects}
                  onDelete={() => handleDeleteUser(u.id)}
                  onEdit={(body) => handleEditUser(u.id, body)}
                  onAssign={(projectId) => handleAssignProject(u.id, projectId)}
                  onUnassign={(projectId) => handleUnassignProject(u.id, projectId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function UserRow({ user, adminProjects, onDelete, onEdit, onAssign, onUnassign }) {
  const [selectedProject, setSelectedProject] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ name: user.name, email: user.email, role: user.role, password: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const isAdmin = user.role === 'admin'

  const assignedIds = new Set(user.projects.map(p => p.id))
  const availableProjects = adminProjects.filter(p => !assignedIds.has(p.id))

  async function handleSaveEdit(e) {
    e.preventDefault()
    setEditError('')
    setEditLoading(true)
    try {
      await onEdit(editForm)
      setEditMode(false)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div style={{
      padding: '14px 16px',
      background: 'var(--surfaceAlt)',
      border: `1px solid ${isAdmin ? 'rgba(79,142,247,0.3)' : 'var(--border)'}`,
      borderRadius: 10,
    }}>
      {/* User info row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editMode ? 14 : (isAdmin ? 0 : 10) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: isAdmin ? 'var(--accent)' : 'var(--textMuted)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{user.name}</span>
              <span style={{
                fontFamily: "'DM Mono'", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '2px 7px', borderRadius: 20,
                background: isAdmin ? 'rgba(79,142,247,0.12)' : 'rgba(107,122,153,0.12)',
                color: isAdmin ? 'var(--accent)' : 'var(--textMuted)',
                border: `1px solid ${isAdmin ? 'rgba(79,142,247,0.25)' : 'rgba(107,122,153,0.2)'}`,
              }}>{isAdmin ? 'Admin' : 'Klijent'}</span>
            </div>
            <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)' }}>{user.email}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => { setEditMode(m => !m); setEditError(''); setEditForm({ name: user.name, email: user.email, role: user.role, password: '' }) }}
            style={{
              background: editMode ? 'var(--surfaceAlt)' : 'transparent',
              color: 'var(--textMuted)',
              border: '1px solid var(--border)', borderRadius: 6,
              padding: '4px 10px',
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--textMuted)' }}
          >
            {editMode ? 'Otkaži' : 'Izmeni'}
          </button>
          <button
            onClick={onDelete}
            style={{
              background: 'transparent', color: 'var(--red)',
              border: '1px solid #EF444430', borderRadius: 6,
              padding: '4px 10px',
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--redTint)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Obriši
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editMode && (
        <form onSubmit={handleSaveEdit} style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginBottom: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>IME</label>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={labelStyle}>EMAIL</label>
              <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div>
              <label style={labelStyle}>ULOGA</label>
              <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="client">Klijent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>NOVA LOZINKA</label>
              <input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="(ne menjati)" style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--accent)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>
          {editError && (
            <div style={{ marginBottom: 10, padding: '7px 12px', background: 'var(--redTint)', border: '1px solid #EF444430', borderRadius: 6, color: 'var(--red)', fontSize: 12, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>{editError}</div>
          )}
          <button
            type="submit"
            disabled={editLoading}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 18px', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: 13, cursor: editLoading ? 'not-allowed' : 'pointer', opacity: editLoading ? 0.7 : 1 }}
          >
            {editLoading ? 'Čuvam...' : 'Sačuvaj izmene'}
          </button>
        </form>
      )}

      {/* Admin note */}
      {isAdmin && !editMode && (
        <div style={{ marginTop: 10, fontFamily: "'DM Mono'", fontSize: 11, color: 'var(--textMuted)', fontStyle: 'italic' }}>
          Admin korisnik — konfiguriše sopstvene projekte i dodeljuje klijente.
        </div>
      )}

      {/* Assigned projects — clients only */}
      {!isAdmin && <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: "'DM Mono'", fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--textMuted)', marginBottom: 6 }}>
          Projekti
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {user.projects.length === 0 ? (
            <span style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12, color: 'var(--textSubtle)', fontStyle: 'italic' }}>
              Nema dodeljenih projekata
            </span>
          ) : (
            user.projects.map(p => (
              <span key={p.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(79,142,247,0.1)',
                border: '1px solid rgba(79,142,247,0.25)',
                borderRadius: 20,
                padding: '3px 10px',
                fontFamily: "'DM Mono'", fontSize: 11,
                color: 'var(--accent)',
              }}>
                {p.displayName || p.epicKey}
                <button
                  onClick={() => onUnassign(p.id)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: 'var(--textMuted)', cursor: 'pointer',
                    fontSize: 14, lineHeight: 1, padding: 0,
                    display: 'flex', alignItems: 'center',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--textMuted)'}
                >×</button>
              </span>
            ))
          )}
        </div>
      </div>}

      {/* Assign project — clients only */}
      {!isAdmin && availableProjects.length > 0 && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '5px 10px',
              color: 'var(--text)', fontSize: 12,
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
              cursor: 'pointer',
            }}
          >
            <option value="">Dodeli projekat...</option>
            {availableProjects.map(p => (
              <option key={p.id} value={p.id}>
                {p.displayName || p.epicKey}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (selectedProject) {
                onAssign(selectedProject)
                setSelectedProject('')
              }
            }}
            disabled={!selectedProject}
            style={{
              background: selectedProject ? 'var(--accent)' : 'var(--border)',
              color: selectedProject ? '#fff' : 'var(--textMuted)',
              border: 'none', borderRadius: 6,
              padding: '5px 12px',
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: 12,
              cursor: selectedProject ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
          >
            Dodeli
          </button>
        </div>
      )}
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 10,
  fontFamily: "'DM Mono'",
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--textMuted)',
  marginBottom: 5,
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 7,
  padding: '8px 12px',
  color: 'var(--text)',
  fontSize: 13,
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  transition: 'border-color 0.2s',
}
