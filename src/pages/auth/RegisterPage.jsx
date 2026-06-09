import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  EnvelopeSimple, LockSimple, Eye, EyeSlash, User, ArrowRight,
  WarningCircle, CheckCircle,
} from '@phosphor-icons/react'

function PasswordStrength({ password }) {
  const checks = [
    { label: 'Al menos 8 caracteres', ok: password.length >= 8 },
    { label: 'Una mayúscula',          ok: /[A-Z]/.test(password) },
    { label: 'Un número',             ok: /\d/.test(password) },
    { label: 'Un símbolo',            ok: /[^A-Za-z0-9]/.test(password) },
  ]
  const score = checks.filter(c => c.ok).length
  const colors = ['#e05c5c', '#f97316', '#c9a227', '#4cae8a']
  const labels = ['Muy débil', 'Débil', 'Regular', 'Fuerte']

  if (!password) return null

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i < score ? colors[score-1] : '#1a1a1a' }}/>
        ))}
      </div>
      {score > 0 && (
        <p className="text-[10px]" style={{ color: colors[score-1] }}>{labels[score-1]}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${c.ok ? 'bg-green-500' : 'bg-[#2a2a2a]'}`}/>
            <span className={`text-[10px] ${c.ok ? 'text-mid' : 'text-lo'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' })
  const [showP,   setShowP]   = useState(false)
  const [showC,   setShowC]   = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const ERRORS = {
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
    'auth/invalid-email':        'Correo inválido.',
    'auth/weak-password':        'Contraseña muy débil (mínimo 6 caracteres).',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim())          { setError('Escribe tu nombre.'); return }
    if (!form.email.trim())         { setError('Escribe tu correo.'); return }
    if (form.password.length < 8)   { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return }

    setError(''); setLoading(true)
    try {
      await register(form.email.trim(), form.password, form.name.trim())
      setDone(true)
    } catch (err) {
      setError(ERRORS[err.code] || 'Error al crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de verificación enviada
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: '#2cb99a18', border: '1px solid #2cb99a30' }}>
            <EnvelopeSimple size={36} color="#2cb99a" weight="fill"/>
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-hi">¡Verifica tu correo!</h2>
            <p className="text-[13px] text-lo mt-2 leading-relaxed">
              Enviamos un enlace de verificación a<br/>
              <span className="text-mid font-medium">{form.email}</span>
            </p>
            <p className="text-[12px] text-lo mt-3">
              Revisa tu bandeja de entrada (y spam).<br/>
              Una vez verificado, puedes iniciar sesión.
            </p>
          </div>
          <Link to="/login"
            className="btn-primary flex items-center justify-center gap-2 py-3 w-full">
            Ir a iniciar sesión <ArrowRight size={14} weight="bold"/>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[28px]"
            style={{ background: 'linear-gradient(135deg,#a07fcf22,#2cb99a22)', border: '1px solid #a07fcf30' }}>
            
          </div>
          <h1 className="text-[22px] font-bold text-hi">Crear cuenta</h1>
          <p className="text-[12px] text-lo mt-1">Empieza a trackear tu vida hoy</p>
        </div>

        <div className="rounded-2xl p-6 space-y-3"
          style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nombre */}
            <div>
              <span className="field-label">Nombre</span>
              <div className="relative mt-1">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
                <input type="text" className="field-input pl-9 w-full"
                  placeholder="Tu nombre"
                  value={form.name} onChange={e => upd('name', e.target.value)}
                  autoComplete="name"/>
              </div>
            </div>

            {/* Email */}
            <div>
              <span className="field-label">Correo electrónico</span>
              <div className="relative mt-1">
                <EnvelopeSimple size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
                <input type="email" className="field-input pl-9 w-full"
                  placeholder="tu@correo.com"
                  value={form.email} onChange={e => upd('email', e.target.value)}
                  autoComplete="email"/>
              </div>
            </div>

            {/* Password */}
            <div>
              <span className="field-label">Contraseña</span>
              <div className="relative mt-1">
                <LockSimple size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
                <input type={showP ? 'text' : 'password'} className="field-input pl-9 pr-9 w-full"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password} onChange={e => upd('password', e.target.value)}
                  autoComplete="new-password"/>
                <button type="button" onClick={() => setShowP(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lo hover:text-mid">
                  {showP ? <EyeSlash size={14}/> : <Eye size={14}/>}
                </button>
              </div>
              <PasswordStrength password={form.password}/>
            </div>

            {/* Confirmar */}
            <div>
              <span className="field-label">Confirmar contraseña</span>
              <div className="relative mt-1">
                <LockSimple size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
                <input type={showC ? 'text' : 'password'} className="field-input pl-9 pr-9 w-full"
                  placeholder="Repite tu contraseña"
                  value={form.confirm} onChange={e => upd('confirm', e.target.value)}
                  autoComplete="new-password"/>
                <button type="button" onClick={() => setShowC(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lo hover:text-mid">
                  {showC ? <EyeSlash size={14}/> : <Eye size={14}/>}
                </button>
              </div>
              {form.confirm && form.password !== form.confirm && (
                <p className="text-[11px] mt-1" style={{ color: '#e05c5c' }}>Las contraseñas no coinciden</p>
              )}
              {form.confirm && form.password === form.confirm && (
                <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: '#4cae8a' }}>
                  <CheckCircle size={12} weight="fill"/> Contraseñas coinciden
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px]"
                style={{ backgroundColor: '#e05c5c12', border: '1px solid #e05c5c30', color: '#e05c5c' }}>
                <WarningCircle size={14} weight="fill"/>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-1 disabled:opacity-50">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <>Crear cuenta <ArrowRight size={15} weight="bold"/></>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-[12px] text-lo mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold hover:text-mid transition-colors"
            style={{ color: '#a07fcf' }}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
