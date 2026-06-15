import { useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  SquaresFour, CheckSquare, Target, Trophy, NotePencil,
  SignOut, GearSix, List, X, ArrowsOut,
} from '@phosphor-icons/react'
import { AMBITOS, getSelectedAmbitos } from '../store'
import { getAmbitoIcon } from '../ambitoIcons'
import { useAuth } from '../context/AuthContext'
import { useGymSession, useGymTimer, useGymMinimized, setGymMinimized } from '../context/GymSessionContext'

const mainNav = [
  { to: '/',          icon: SquaresFour, label: 'Inicio'    },
  { to: '/habitos',   icon: CheckSquare, label: 'Hábitos'   },
  { to: '/objetivos', icon: Target,      label: 'Objetivos' },
  { to: '/logros',    icon: Trophy,      label: 'Logros'    },
  { to: '/notas',     icon: NotePencil,  label: 'Notas'     },
]

const fmt = s => {
  const m = Math.floor(s / 60), sec = s % 60
  return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

// Componente aislado — llama useGymTimer() solo aquí, no arrastra re-renders a Layout
function GlobalGymPill() {
  const { session, sessionDone, currentEx } = useGymSession()
  const { elapsed } = useGymTimer()
  const minimized = useGymMinimized()
  const navigate  = useNavigate()
  const { pathname } = useLocation()
  const gymAmbito = AMBITOS.find(a => a.id === 'gym')
  const color     = gymAmbito?.color ?? '#e05c5c'

  // Muestra en otras páginas, O en gym cuando está minimizado
  if (!session || sessionDone) return null
  if (pathname === '/ambito/gym' && !minimized) return null

  return (
    <div className="fixed bottom-[72px] md:bottom-4 left-4 right-4 md:left-[220px] z-[60] rounded-2xl flex items-center gap-3 px-5 py-3"
      style={{
        background: 'linear-gradient(135deg,#111,#0d0d0d)',
        border: `1px solid ${color}40`,
        boxShadow: `0 0 30px ${color}35, 0 8px 32px rgba(0,0,0,.6)`,
      }}>
      <span className="font-mono text-[18px] font-bold shrink-0" style={{ color }}>
        {fmt(elapsed)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-hi truncate">{currentEx?.name}</p>
        <p className="text-[11px]" style={{ color }}>
          {currentEx?.muscle} · Serie {(session.setIdx ?? 0) + 1}/{currentEx?.totalSets}
        </p>
      </div>
      <button
        onClick={() => {
          if (pathname === '/ambito/gym') {
            setGymMinimized(false)
          } else {
            navigate('/ambito/gym')
            setGymMinimized(false)
          }
        }}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold"
        style={{ backgroundColor: `${color}20`, color }}>
        <ArrowsOut size={13}/> Volver
      </button>
    </div>
  )
}

export default function Layout({ children }) {
  const location       = useLocation()
  const { pathname }   = location
  const { user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const activeAmbitos  = AMBITOS.filter(a => getSelectedAmbitos().includes(a.id))

  const avatar = (() => {
    try { return JSON.parse(localStorage.getItem('dt_profile') || '{}').avatar || '🧑' }
    catch { return '🧑' }
  })()

  return (
    <div className="flex min-h-screen bg-bg">

      {/* ══════════════════════════════════════════════
          SIDEBAR — solo desktop (md+)
      ══════════════════════════════════════════════ */}
      <aside className="hidden md:flex w-52 shrink-0 border-r border-border flex-col fixed h-full bg-surface overflow-y-auto z-[65]">

        {/* Brand */}
        <div className="px-4 py-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <SquaresFour size={14} color="#000" weight="fill"/>
            </div>
            <span className="text-[14px] font-bold text-hi">DayTrack</span>
          </Link>
        </div>

        {/* Nav principal */}
        <nav className="flex flex-col gap-0.5 p-2">
          {mainNav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all ${
                  isActive ? 'bg-accent/12 text-accent font-medium' : 'text-mid hover:text-hi hover:bg-white/4'
                }`}>
              {({ isActive }) => <><Icon size={15} weight={isActive?'fill':'regular'}/>{label}</>}
            </NavLink>
          ))}
        </nav>

        {/* Ámbitos */}
        <div className="px-2 mt-2">
          <p className="px-3 pb-1.5 text-[10px] font-semibold text-lo uppercase tracking-widest">Ámbitos</p>
          {activeAmbitos.map((a) => {
            const active = pathname === `/ambito/${a.id}`
            const Icon   = getAmbitoIcon(a.id)
            return (
              <Link key={a.id} to={`/ambito/${a.id}`}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] transition-all"
                style={{ color: active ? a.color : '#555', backgroundColor: active ? a.color+'18' : 'transparent' }}>
                <Icon size={13} weight={active?'fill':'regular'}/>{a.name}
              </Link>
            )
          })}
        </div>

        {/* Footer usuario */}
        <div className="p-3 mt-auto border-t border-border">
          {user && (
            <Link to="/account"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-2 w-full transition-all group"
              style={{ backgroundColor:'#ffffff05', border:'1px solid #1a1a1a' }}>
              <div className="w-8 h-8 rounded-lg text-[18px] flex items-center justify-center shrink-0"
                style={{ backgroundColor:'#a07fcf18' }}>{avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-mid truncate group-hover:text-hi transition-colors">
                  {user.displayName || 'Usuario'}
                </p>
                <p className="text-[9px] text-lo truncate">{user.email}</p>
              </div>
              <GearSix size={13} className="text-lo shrink-0"/>
            </Link>
          )}
          <button onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-lo hover:text-hi hover:bg-white/5 w-full transition-all">
            <SignOut size={13}/> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          TOPBAR — solo móvil
      ══════════════════════════════════════════════ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-[65] flex items-center justify-between px-4 h-14"
        style={{ backgroundColor:'#0e0e0eee', borderBottom:'1px solid #1a1a1a', backdropFilter:'blur(12px)' }}>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <SquaresFour size={14} color="#000" weight="fill"/>
          </div>
          <span className="text-[15px] font-bold text-hi">DayTrack</span>
        </Link>
        <div className="flex items-center gap-2">
          {user && (
            <Link to="/account"
              className="w-8 h-8 rounded-xl text-[18px] flex items-center justify-center"
              style={{ backgroundColor:'#a07fcf18' }}>{avatar}</Link>
          )}
          <button onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all"
            style={{ backgroundColor:'#ffffff08' }}>
            <List size={18} className="text-mid"/>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          DRAWER — menú móvil lateral
      ══════════════════════════════════════════════ */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div className="md:hidden fixed inset-0 z-[70] bg-black/60"
            style={{ backdropFilter:'blur(4px)' }}
            onClick={() => setDrawerOpen(false)}/>
          {/* Panel */}
          <div className="md:hidden fixed top-0 right-0 h-full w-72 z-[70] flex flex-col overflow-y-auto"
            style={{ backgroundColor:'#111', borderLeft:'1px solid #1a1a1a',
                     animation:'slideInRight 0.25s cubic-bezier(0.16,1,0.3,1) both' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-[14px] font-bold text-hi">Menú</span>
              <button onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5">
                <X size={16} className="text-lo"/>
              </button>
            </div>

            {/* Nav principal */}
            <div className="p-3 space-y-1">
              {mainNav.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to==='/'} onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] transition-all ${
                      isActive ? 'bg-accent/12 text-accent font-semibold' : 'text-mid hover:text-hi hover:bg-white/5'
                    }`}>
                  {({ isActive }) => <><Icon size={18} weight={isActive?'fill':'regular'}/>{label}</>}
                </NavLink>
              ))}
            </div>

            {/* Ámbitos */}
            <div className="px-3 pt-2 pb-3">
              <p className="px-4 pb-2 text-[10px] font-semibold text-lo uppercase tracking-widest">Ámbitos</p>
              <div className="grid grid-cols-2 gap-1.5">
                {activeAmbitos.map((a) => {
                  const active = pathname === `/ambito/${a.id}`
                  const Icon   = getAmbitoIcon(a.id)
                  return (
                    <Link key={a.id} to={`/ambito/${a.id}`}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all"
                      style={{ color: active ? a.color : '#888',
                               backgroundColor: active ? a.color+'18' : '#ffffff06',
                               border: `1px solid ${active ? a.color+'30' : '#1a1a1a'}` }}>
                      <Icon size={14} weight={active?'fill':'regular'}/>{a.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto p-4 border-t border-border space-y-2">
              {user && (
                <Link to="/account" onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                  style={{ backgroundColor:'#ffffff05', border:'1px solid #1a1a1a' }}>
                  <div className="w-9 h-9 rounded-xl text-[20px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor:'#a07fcf18' }}>{avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-hi truncate">{user.displayName||'Usuario'}</p>
                    <p className="text-[11px] text-lo truncate">{user.email}</p>
                  </div>
                  <GearSix size={15} className="text-lo shrink-0"/>
                </Link>
              )}
              <button onClick={() => { logout(); setDrawerOpen(false) }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] text-lo hover:text-hi hover:bg-white/5 w-full transition-all">
                <SignOut size={16}/> Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          BOTTOM NAV — móvil (5 tabs principales)
      ══════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[65] flex items-center"
        style={{ backgroundColor:'#0e0e0ef0', borderTop:'1px solid #1a1a1a',
                 backdropFilter:'blur(16px)', height:60 }}>
        {[
          { to:'/',          icon:SquaresFour, label:'Inicio'    },
          { to:'/habitos',   icon:CheckSquare, label:'Hábitos'   },
          { to:'/objetivos', icon:Target,      label:'Metas'     },
          { to:'/logros',    icon:Trophy,      label:'Logros'    },
          { to:'/notas',     icon:NotePencil,  label:'Notas'     },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to==='/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-all ${
                isActive ? 'text-accent' : 'text-lo'
              }`}>
            {({ isActive }) => (
              <>
                <Icon size={20} weight={isActive?'fill':'regular'}/>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ══════════════════════════════════════════════
          CONTENIDO PRINCIPAL
      ══════════════════════════════════════════════ */}
      <main className={`
        flex-1 min-h-screen w-full
        md:ml-52
        pt-14 md:pt-0
        pb-16 md:pb-0
      `}>
        {children}
      </main>

      {/* Pill global de sesión gym — aislado para no re-renderizar Layout */}
      <GlobalGymPill />
    </div>
  )
}
