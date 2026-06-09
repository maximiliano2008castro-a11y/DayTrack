import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  updateProfile, updateEmail, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider,
  sendEmailVerification, deleteUser,
} from 'firebase/auth'
import { auth } from '../../firebase'
import {
  User, EnvelopeSimple, LockSimple, Eye, EyeSlash,
  CheckCircle, WarningCircle, Trash, SignOut, ShieldCheck,
  PencilSimple, ArrowLeft, Camera, Compass, CheckFat, Bell, BellSlash, Clock,
} from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { clearAll, getProfile, saveProfile, AMBITOS, getSelectedAmbitos, setSelectedAmbitos } from '../../store'
import { getAmbitoIcon } from '../../ambitoIcons'

const AVATARS = ['🧑','👩','👨','👴','👵','🧒','🧑‍💼','🧑‍🎓','🧑‍🔬','🧑‍🎨','🧑‍💻','🦸','🧙','🎯','🚀','🌟','🔥','⚡','🎨','🎸']

function Section({ title, icon: Icon, children, color = '#a07fcf' }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1a1a1a' }}>
      <div className="px-5 py-3 flex items-center gap-2.5 border-b border-border"
        style={{ backgroundColor: color + '0a' }}>
        <Icon size={14} style={{ color }} weight="fill" />
        <p className="text-[13px] font-semibold text-hi">{title}</p>
      </div>
      <div className="p-5 space-y-4 bg-surface">{children}</div>
    </div>
  )
}

function Toast({ msg, type }) {
  if (!msg) return null
  const ok = type === 'ok'
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium shadow-xl"
      style={ok
        ? { backgroundColor: '#4cae8a18', border: '1px solid #4cae8a40', color: '#4cae8a' }
        : { backgroundColor: '#e05c5c18', border: '1px solid #e05c5c40', color: '#e05c5c' }}>
      {ok ? <CheckCircle size={15} weight="fill" /> : <WarningCircle size={15} weight="fill" />}
      {msg}
    </div>
  )
}

export default function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const profile  = getProfile() || {}

  // Estados
  const [name,       setName]       = useState(user?.displayName || '')
  const [avatar,     setAvatar]     = useState(profile.avatar || '🧑')
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [newEmail,   setNewEmail]   = useState(user?.email || '')
  const [curPass,    setCurPass]    = useState('')
  const [newPass,    setNewPass]    = useState('')
  const [confPass,   setConfPass]   = useState('')
  const [showCur,    setShowCur]    = useState(false)
  const [showNew,    setShowNew]    = useState(false)
  const [showConf,   setShowConf]   = useState(false)
  const [reautPass,  setReautPass]  = useState('')
  const [showReaut,  setShowReaut]  = useState(false)
  const [loading,    setLoading]    = useState({})
  const [toast,      setToast]      = useState({ msg: '', type: '' })
  const [deleteConf, setDeleteConf] = useState(false)
  const [selAmbitos, setSelAmbitos] = useState(() => getSelectedAmbitos())
  const [reminders,  setReminders]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('dt_reminders') || '{}') } catch { return {} }
  })

  const setLoad = (k, v) => setLoading(l => ({ ...l, [k]: v }))

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  const reauth = async (password) => {
    const cred = EmailAuthProvider.credential(user.email, password)
    await reauthenticateWithCredential(user, cred)
  }

  // ── Guardar nombre ────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!name.trim()) return
    setLoad('name', true)
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() })
      saveProfile({ ...profile, name: name.trim(), avatar })
      showToast('Nombre actualizado correctamente')
    } catch {
      showToast('Error al actualizar el nombre', 'err')
    } finally { setLoad('name', false) }
  }

  // ── Guardar avatar ────────────────────────────────────────────────────────
  const handleSaveAvatar = () => {
    saveProfile({ ...profile, avatar })
    setAvatarOpen(false)
    showToast('Avatar actualizado')
  }

  // ── Cambiar email ─────────────────────────────────────────────────────────
  const handleChangeEmail = async () => {
    if (!newEmail.trim() || newEmail === user.email) return
    if (!curPass) { showToast('Ingresa tu contraseña actual para cambiar el email', 'err'); return }
    setLoad('email', true)
    try {
      await reauth(curPass)
      await updateEmail(auth.currentUser, newEmail.trim())
      await sendEmailVerification(auth.currentUser)
      showToast('Email actualizado. Revisa tu nuevo correo para verificarlo.')
      setCurPass('')
    } catch (err) {
      const msgs = {
        'auth/wrong-password':      'Contraseña incorrecta.',
        'auth/email-already-in-use':'Ese email ya está en uso.',
        'auth/invalid-email':       'Email inválido.',
        'auth/requires-recent-login':'Por seguridad, cierra sesión y vuelve a entrar.',
      }
      showToast(msgs[err.code] || 'Error al cambiar el email', 'err')
    } finally { setLoad('email', false) }
  }

  // ── Cambiar contraseña ────────────────────────────────────────────────────
  const handleChangePass = async () => {
    if (newPass.length < 8) { showToast('La contraseña debe tener al menos 8 caracteres', 'err'); return }
    if (newPass !== confPass) { showToast('Las contraseñas no coinciden', 'err'); return }
    if (!curPass) { showToast('Ingresa tu contraseña actual', 'err'); return }
    setLoad('pass', true)
    try {
      await reauth(curPass)
      await updatePassword(auth.currentUser, newPass)
      showToast('Contraseña actualizada correctamente')
      setCurPass(''); setNewPass(''); setConfPass('')
    } catch (err) {
      const msgs = {
        'auth/wrong-password': 'Contraseña actual incorrecta.',
        'auth/requires-recent-login': 'Por seguridad, cierra sesión y vuelve a entrar.',
      }
      showToast(msgs[err.code] || 'Error al cambiar la contraseña', 'err')
    } finally { setLoad('pass', false) }
  }

  // ── Eliminar cuenta ───────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!reautPass) { showToast('Ingresa tu contraseña para confirmar', 'err'); return }
    setLoad('delete', true)
    try {
      await reauth(reautPass)
      clearAll()
      await deleteUser(auth.currentUser)
      navigate('/login', { replace: true })
    } catch (err) {
      const msgs = {
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/requires-recent-login': 'Por seguridad, cierra sesión y vuelve a entrar.',
      }
      showToast(msgs[err.code] || 'Error al eliminar la cuenta', 'err')
    } finally { setLoad('delete', false) }
  }

  const passStrength = (p) => {
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/\d/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  }
  const strengthColors = ['#e05c5c', '#f97316', '#c9a227', '#4cae8a']

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="btn-icon w-9 h-9">
          <ArrowLeft size={15}/>
        </Link>
        <div>
          <h1 className="text-[20px] font-bold text-hi">Configuración de cuenta</h1>
          <p className="text-[12px] text-lo">Gestiona tu perfil y seguridad</p>
        </div>
      </div>

      <div className="space-y-5">

        {/* ── Perfil ── */}
        <Section title="Perfil" icon={User} color="#a07fcf">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl text-[32px] flex items-center justify-center"
                style={{ backgroundColor: '#a07fcf18', border: '1px solid #a07fcf30' }}>
                {avatar}
              </div>
              <button onClick={() => setAvatarOpen(v => !v)}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#a07fcf', border: '2px solid #000' }}>
                <PencilSimple size={10} color="white" weight="bold"/>
              </button>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-hi">{user?.displayName || 'Sin nombre'}</p>
              <p className="text-[12px] text-lo">{user?.email}</p>
              {user?.emailVerified
                ? <span className="text-[10px] flex items-center gap-1 mt-1" style={{ color: '#4cae8a' }}>
                    <CheckCircle size={10} weight="fill"/> Email verificado
                  </span>
                : <span className="text-[10px] flex items-center gap-1 mt-1" style={{ color: '#f97316' }}>
                    <WarningCircle size={10} weight="fill"/> Email sin verificar
                  </span>
              }
            </div>
          </div>

          {/* Selector avatar */}
          {avatarOpen && (
            <div className="p-3 rounded-xl space-y-2" style={{ backgroundColor: '#a07fcf08', border: '1px solid #a07fcf20' }}>
              <p className="text-[11px] text-lo">Elige tu avatar</p>
              <div className="flex gap-1.5 flex-wrap">
                {AVATARS.map(a => (
                  <button key={a} onClick={() => setAvatar(a)}
                    className="w-9 h-9 rounded-xl text-[20px] flex items-center justify-center transition-all"
                    style={avatar === a
                      ? { backgroundColor: '#a07fcf22', border: '1.5px solid #a07fcf66' }
                      : { backgroundColor: '#111', border: '1px solid #1a1a1a' }}>
                    {a}
                  </button>
                ))}
              </div>
              <button onClick={handleSaveAvatar}
                className="btn-primary px-4 py-1.5 text-[11px] flex items-center gap-1.5">
                <Check size={11} weight="bold"/> Guardar avatar
              </button>
            </div>
          )}

          {/* Nombre */}
          <div>
            <span className="field-label">Nombre visible</span>
            <div className="flex gap-2 mt-1">
              <input className="flex-1 field-input" placeholder="Tu nombre"
                value={name} onChange={e => setName(e.target.value)}/>
              <button onClick={handleSaveName} disabled={loading.name || name.trim() === user?.displayName}
                className="btn-primary px-4 disabled:opacity-40 flex items-center gap-1.5 text-[12px]">
                {loading.name
                  ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : <><CheckCircle size={13}/> Guardar</>
                }
              </button>
            </div>
          </div>
        </Section>

        {/* ── Email ── */}
        <Section title="Cambiar email" icon={EnvelopeSimple} color="#2cb99a">
          <div>
            <span className="field-label">Nuevo email</span>
            <input type="email" className="field-input mt-1 w-full"
              placeholder="nuevo@correo.com"
              value={newEmail} onChange={e => setNewEmail(e.target.value)}/>
          </div>
          <div>
            <span className="field-label">Contraseña actual (para confirmar)</span>
            <div className="relative mt-1">
              <LockSimple size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
              <input type={showCur ? 'text' : 'password'} className="field-input pl-9 pr-9 w-full"
                placeholder="Tu contraseña actual"
                value={curPass} onChange={e => setCurPass(e.target.value)}/>
              <button type="button" onClick={() => setShowCur(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lo hover:text-mid">
                {showCur ? <EyeSlash size={13}/> : <Eye size={13}/>}
              </button>
            </div>
          </div>
          <button onClick={handleChangeEmail} disabled={loading.email || newEmail === user?.email}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-[12px] disabled:opacity-40">
            {loading.email
              ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              : <><EnvelopeSimple size={13}/> Actualizar email</>
            }
          </button>
          <p className="text-[11px] text-lo">Se enviará un email de verificación al nuevo correo.</p>
        </Section>

        {/* ── Contraseña ── */}
        <Section title="Cambiar contraseña" icon={LockSimple} color="#5b84e8">
          <div>
            <span className="field-label">Contraseña actual</span>
            <div className="relative mt-1">
              <LockSimple size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
              <input type={showCur ? 'text' : 'password'} className="field-input pl-9 pr-9 w-full"
                placeholder="Tu contraseña actual"
                value={curPass} onChange={e => setCurPass(e.target.value)}/>
              <button type="button" onClick={() => setShowCur(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lo hover:text-mid">
                {showCur ? <EyeSlash size={13}/> : <Eye size={13}/>}
              </button>
            </div>
          </div>
          <div>
            <span className="field-label">Nueva contraseña</span>
            <div className="relative mt-1">
              <LockSimple size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
              <input type={showNew ? 'text' : 'password'} className="field-input pl-9 pr-9 w-full"
                placeholder="Mínimo 8 caracteres"
                value={newPass} onChange={e => setNewPass(e.target.value)}/>
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lo hover:text-mid">
                {showNew ? <EyeSlash size={13}/> : <Eye size={13}/>}
              </button>
            </div>
            {newPass && (
              <div className="flex gap-1 mt-2">
                {[0,1,2,3].map(i => (
                  <div key={i} className="flex-1 h-1 rounded-full transition-all"
                    style={{ backgroundColor: i < passStrength(newPass) ? strengthColors[passStrength(newPass)-1] : '#1a1a1a' }}/>
                ))}
              </div>
            )}
          </div>
          <div>
            <span className="field-label">Confirmar nueva contraseña</span>
            <div className="relative mt-1">
              <LockSimple size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
              <input type={showConf ? 'text' : 'password'} className="field-input pl-9 pr-9 w-full"
                placeholder="Repite la nueva contraseña"
                value={confPass} onChange={e => setConfPass(e.target.value)}/>
              <button type="button" onClick={() => setShowConf(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lo hover:text-mid">
                {showConf ? <EyeSlash size={13}/> : <Eye size={13}/>}
              </button>
            </div>
            {confPass && newPass !== confPass && (
              <p className="text-[11px] mt-1" style={{ color: '#e05c5c' }}>Las contraseñas no coinciden</p>
            )}
          </div>
          <button onClick={handleChangePass} disabled={loading.pass}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-[12px] disabled:opacity-40">
            {loading.pass
              ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              : <><ShieldCheck size={13}/> Actualizar contraseña</>
            }
          </button>
        </Section>

        {/* ── Sesión ── */}
        <Section title="Sesión" icon={SignOut} color="#888">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-hi">Cerrar sesión</p>
              <p className="text-[11px] text-lo">Salir de tu cuenta en este dispositivo</p>
            </div>
            <button onClick={() => logout()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
              style={{ backgroundColor: '#ffffff08', border: '1px solid #2a2a2a', color: '#888' }}>
              <SignOut size={13}/> Cerrar sesión
            </button>
          </div>
        </Section>

        {/* ── Ámbitos activos ── */}
        <Section title="Mis ámbitos" icon={Compass} color="#2cb99a">
          <p className="text-[12px] text-lo -mt-1 mb-1">Selecciona las áreas que quieres ver en la app.</p>
          <div className="grid grid-cols-2 gap-2">
            {AMBITOS.map(a => {
              const Icon   = getAmbitoIcon(a.id)
              const active = selAmbitos.includes(a.id)
              return (
                <button key={a.id} onClick={() => {
                  const next = active
                    ? selAmbitos.filter(x => x !== a.id)
                    : [...selAmbitos, a.id]
                  if (next.length === 0) return // al menos uno
                  setSelAmbitos(next)
                  setSelectedAmbitos(next)
                }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all relative"
                  style={active
                    ? { backgroundColor: a.color+'18', border: `1px solid ${a.color}44`, color: a.color }
                    : { backgroundColor: '#111', border: '1px solid #242424', color: '#444' }
                  }>
                  <Icon size={13} weight={active ? 'fill' : 'regular'}/>
                  <span className="flex-1 text-left">{a.name}</span>
                  {active && <CheckFat size={10} weight="fill" style={{ color: a.color }}/>}
                </button>
              )
            })}
          </div>
          <p className="text-[10px] text-lo">{selAmbitos.length} de {AMBITOS.length} activos · Los cambios aplican al recargar.</p>
        </Section>

        {/* ── Recordatorios ── */}
        <Section title="Recordatorios" icon={Bell} color="#5b84e8">
          {Object.keys(reminders).length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <BellSlash size={28} className="text-lo opacity-40"/>
              <p className="text-[12px] text-lo">No tienes recordatorios activos.</p>
              <p className="text-[11px] text-lo opacity-60">Entra a cualquier ámbito y toca la campana <Bell size={10} className="inline"/> para crear uno.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(reminders).map(([ambitoId, r]) => {
                const ambito = AMBITOS.find(a => a.id === ambitoId)
                const Icon   = ambito ? getAmbitoIcon(ambitoId) : Bell
                const color  = r.color || ambito?.color || '#888'
                const DAY_LABELS = ['D','L','M','X','J','V','S']
                const deleteReminder = () => {
                  const updated = { ...reminders }
                  delete updated[ambitoId]
                  localStorage.setItem('dt_reminders', JSON.stringify(updated))
                  setReminders(updated)
                }
                return (
                  <div key={ambitoId} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ backgroundColor: color+'0d', border: `1px solid ${color}25` }}>
                    {/* Ícono ámbito */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color+'22' }}>
                      <Icon size={14} weight="fill" style={{ color }}/>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-hi truncate">
                        {r.ambitoName || ambito?.name || ambitoId}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px]" style={{ color }}>
                          <Clock size={10}/>{r.time}
                        </span>
                        <span className="text-[10px] text-lo">
                          {r.days.length === 7
                            ? 'Todos los días'
                            : r.days.map(d => DAY_LABELS[d]).join(' · ')}
                        </span>
                      </div>
                    </div>
                    {/* Eliminar */}
                    <button onClick={deleteReminder}
                      className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-red-500/10"
                      style={{ color: '#555' }}
                      title="Eliminar recordatorio">
                      <BellSlash size={14}/>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* ── Zona peligrosa ── */}
        <Section title="Zona peligrosa" icon={Trash} color="#e05c5c">
          <div>
            <p className="text-[13px] font-medium text-hi mb-1">Eliminar cuenta</p>
            <p className="text-[12px] text-lo mb-3">
              Esta acción es <span className="font-semibold text-red-400">irreversible</span>. Se eliminarán todos tus datos y tu cuenta permanentemente.
            </p>
            {!deleteConf ? (
              <button onClick={() => setDeleteConf(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{ backgroundColor: '#e05c5c12', border: '1px solid #e05c5c30', color: '#e05c5c' }}>
                <Trash size={13}/> Eliminar mi cuenta
              </button>
            ) : (
              <div className="space-y-3 p-4 rounded-xl"
                style={{ backgroundColor: '#e05c5c08', border: '1px solid #e05c5c25' }}>
                <p className="text-[12px] font-semibold" style={{ color: '#e05c5c' }}>
                  ⚠️ Confirma con tu contraseña para eliminar la cuenta
                </p>
                <div className="relative">
                  <LockSimple size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
                  <input type={showReaut ? 'text' : 'password'}
                    className="field-input pl-9 pr-9 w-full text-[12px]"
                    placeholder="Tu contraseña actual"
                    value={reautPass} onChange={e => setReautPass(e.target.value)}/>
                  <button type="button" onClick={() => setShowReaut(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lo hover:text-mid">
                    {showReaut ? <EyeSlash size={13}/> : <Eye size={13}/>}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDeleteAccount} disabled={loading.delete}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#e05c5c', color: 'white' }}>
                    {loading.delete
                      ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      : <><Trash size={12}/> Sí, eliminar</>
                    }
                  </button>
                  <button onClick={() => { setDeleteConf(false); setReautPass('') }}
                    className="px-4 py-2 rounded-xl text-[12px] font-semibold text-lo hover:text-mid transition-all"
                    style={{ border: '1px solid #2a2a2a' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </Section>

      </div>

      <Toast msg={toast.msg} type={toast.type}/>
    </div>
  )
}

// mini helper para el botón de guardar avatar
function Check({ size, weight }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor">
      <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z"/>
    </svg>
  )
}
