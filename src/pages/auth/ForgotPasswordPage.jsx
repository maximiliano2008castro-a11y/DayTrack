import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { EnvelopeSimple, ArrowLeft, WarningCircle, CheckCircle } from '@phosphor-icons/react'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)

  const ERRORS = {
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/invalid-email':  'Correo inválido.',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Escribe tu correo.'); return }
    setError(''); setLoading(true)
    try {
      await resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(ERRORS[err.code] || 'Error al enviar el correo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[28px]"
            style={{ background: 'linear-gradient(135deg,#a07fcf22,#2cb99a22)', border: '1px solid #a07fcf30' }}>
            
          </div>
          <h1 className="text-[20px] font-bold text-hi">Recuperar contraseña</h1>
          <p className="text-[12px] text-lo mt-1">Te enviaremos un enlace por correo</p>
        </div>

        <div className="rounded-2xl p-6"
          style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}>

          {sent ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: '#2cb99a18', border: '1px solid #2cb99a30' }}>
                <CheckCircle size={28} color="#2cb99a" weight="fill"/>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-hi">¡Correo enviado!</p>
                <p className="text-[12px] text-lo mt-1 leading-relaxed">
                  Revisa <span className="text-mid font-medium">{email}</span> y sigue el enlace para restablecer tu contraseña.
                </p>
              </div>
              <Link to="/login"
                className="flex items-center justify-center gap-2 text-[12px] font-semibold transition-colors"
                style={{ color: '#a07fcf' }}>
                <ArrowLeft size={13}/> Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <span className="field-label">Correo electrónico</span>
                <div className="relative mt-1">
                  <EnvelopeSimple size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
                  <input type="email" className="field-input pl-9 w-full"
                    placeholder="tu@correo.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    autoComplete="email"/>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px]"
                  style={{ backgroundColor: '#e05c5c12', border: '1px solid #e05c5c30', color: '#e05c5c' }}>
                  <WarningCircle size={14} weight="fill"/>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : 'Enviar enlace de recuperación'
                }
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-4">
          <Link to="/login"
            className="text-[12px] text-lo hover:text-mid transition-colors flex items-center justify-center gap-1">
            <ArrowLeft size={12}/> Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
