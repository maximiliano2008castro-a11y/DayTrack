import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SquaresFour } from '@phosphor-icons/react'
import { useAuth } from './context/AuthContext'
import { getProfile, saveProfile } from './store'
import { setOnRemoteChange } from './sync'
import Layout from './components/Layout'
import { GymSessionProvider } from './context/GymSessionContext'
import { initReminders } from './components/AmbitoHeader'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import AmbitoPage from './pages/AmbitoPage'
import Habitos from './pages/Habitos'
import Objetivos from './pages/Objetivos'
import Logros from './pages/Logros'
import NotasPage from './pages/NotasPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import AccountPage from './pages/auth/AccountPage'

// Rutas que no necesitan auth
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  return user ? <Navigate to="/" replace /> : children
}

// Rutas protegidas — requieren login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  return user ? children : <Navigate to="/login" replace />
}

// Pantalla de carga
function Splash() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
        <SquaresFour size={28} color="#000" weight="fill"/>
      </div>
      <span className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"/>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const [hasProfile,     setHasProfile]     = useState(false)
  const [profileChecked, setProfileChecked] = useState(false)
  const [remoteRev,      setRemoteRev]      = useState(0)  // bump para forzar re-render global

  useEffect(() => { initReminders() }, [])

  // Cuando llegan cambios de otro dispositivo, forzamos re-render de todas las rutas
  useEffect(() => {
    setOnRemoteChange(() => setRemoteRev(r => r + 1))
    return () => setOnRemoteChange(null)
  }, [])

  useEffect(() => {
    if (user) {
      const profile = getProfile()
      if (profile) {
        // Ya tiene perfil guardado localmente
        setHasProfile(true)
      } else {
        // Sin perfil local: determinar si es cuenta nueva o existente
        const created  = new Date(user.metadata.creationTime).getTime()
        const lastSign = new Date(user.metadata.lastSignInTime).getTime()
        const isNew    = (lastSign - created) < 5 * 60 * 1000 // menos de 5 min entre creación y último login
        if (isNew) {
          // Cuenta nueva → mostrar onboarding
          setHasProfile(false)
        } else {
          // Cuenta existente pero sin datos locales → crear perfil mínimo y entrar directo
          saveProfile({ name: user.displayName || user.email?.split('@')[0] || 'Usuario', onboarded: true })
          setHasProfile(true)
        }
      }
    }
    setProfileChecked(true)
  }, [user])

  if (loading || !profileChecked) return <Splash />

  // Si está autenticado pero no tiene perfil → Onboarding (solo cuentas nuevas)
  if (user && !hasProfile) {
    return <Onboarding onComplete={() => setHasProfile(true)} />
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

      {/* Rutas privadas */}
      <Route path="/*" element={
        <PrivateRoute>
          <GymSessionProvider>
            <Layout>
              <AnimatedRoutes remoteRev={remoteRev} />
            </Layout>
          </GymSessionProvider>
        </PrivateRoute>
      }/>
    </Routes>
  )
}

function AnimatedRoutes({ remoteRev = 0 }) {
  const location = useLocation()
  return (
    <Routes location={location} key={`${location.key}-${remoteRev}`}>
      <Route path="/"           element={<div className="ambito-animate"><Dashboard /></div>} />
      <Route path="/ambito/:id" element={<AmbitoPage />} />
      <Route path="/habitos"    element={<div className="ambito-animate"><Habitos /></div>} />
      <Route path="/objetivos"  element={<div className="ambito-animate"><Objetivos /></div>} />
      <Route path="/logros"     element={<div className="ambito-animate"><Logros /></div>} />
      <Route path="/notas"      element={<div className="ambito-animate"><NotasPage /></div>} />
      <Route path="/account"    element={<div className="ambito-animate"><AccountPage /></div>} />
      <Route path="*"           element={<Navigate to="/" replace />} />
    </Routes>
  )
}
