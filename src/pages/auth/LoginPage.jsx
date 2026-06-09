import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  EnvelopeSimple, LockSimple, Eye, EyeSlash, ArrowRight, WarningCircle,
} from '@phosphor-icons/react'
import { SquaresFour as _SF } from '@phosphor-icons/react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form,    setForm]    = useState({ email: '', password: '' })
  const [show,    setShow]    = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const ERRORS = {
    'auth/user-not-found':   'No existe una cuenta con ese correo.',
    'auth/wrong-password':   'Contraseña incorrecta.',
    'auth/invalid-email':    'Correo inválido.',
    'auth/too-many-requests':'Demasiados intentos. Intenta más tarde.',
    'auth/invalid-credential':'Correo o contraseña incorrectos.',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Completa todos los campos.'); return }
    setError(''); setLoading(true)
    try {
      await login(form.email.trim(), form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(ERRORS[err.code] || 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[32px]"
            style={{ background: 'linear-gradient(135deg, #a07fcf22, #2cb99a22)', border: '1px solid #a07fcf30' }}>
            
          </div>
          <h1 className="text-[26px] font-bold text-hi">DayTrack</h1>
          <p className="text-[13px] text-lo mt-1">Tu vida, organizada.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 space-y-4"
          style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}>
          <h2 className="text-[16px] font-semibold text-hi">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div>
              <span className="field-label">Correo electrónico</span>
              <div className="relative mt-1">
                <EnvelopeSimple size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
                <input
                  type="email"
                  className="field-input pl-9 w-full"
                  placeholder="tu@correo.com"
                  value={form.email}
                  onChange={e => upd('email', e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between">
                <span className="field-label">Contraseña</span>
                <Link to="/forgot-password"
                  className="text-[11px] text-lo hover:text-mid transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative mt-1">
                <LockSimple size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
                <input
                  type={show ? 'text' : 'password'}
                  className="field-input pl-9 pr-9 w-full"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => upd('password', e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lo hover:text-mid transition-colors">
                  {show ? <EyeSlash size={14}/> : <Eye size={14}/>}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px]"
                style={{ backgroundColor: '#e05c5c12', border: '1px solid #e05c5c30', color: '#e05c5c' }}>
                <WarningCircle size={14} weight="fill"/>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-1 disabled:opacity-50">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              ) : (
                <>Entrar <ArrowRight size={15} weight="bold"/></>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] text-lo mt-5">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold hover:text-mid transition-colors"
            style={{ color: '#a07fcf' }}>
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  )
}
