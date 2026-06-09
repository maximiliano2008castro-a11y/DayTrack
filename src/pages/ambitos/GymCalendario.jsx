import { useState, useEffect } from 'react'
import { getGymSessions } from '../../store'
import { CaretLeft, CaretRight, Play, Moon, CheckCircle, X, Trophy } from '@phosphor-icons/react'

// ── Helpers ───────────────────────────────────────────────────────────────────
const DOW_TO_KEY = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_LABELS  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

const muscleColor = (name) => {
  const MAP = {
    Pecho:'#e05c5c', Espalda:'#5b84e8', Hombros:'#3bafc9', Biceps:'#9575cd',
    Triceps:'#c9a227', Piernas:'#4cae8a', Gluteos:'#d4608a', Core:'#e07c4a',
    Pantorrillas:'#7ec45a', Antebrazos:'#a07fcf', Otros:'#888',
  }
  return MAP[name] || '#888'
}

const MOODS = [
  { label:'Muy duro',  color:'#e05c5c', level:1 },
  { label:'Difícil',   color:'#e07c4a', level:2 },
  { label:'Normal',    color:'#c9a227', level:3 },
  { label:'Bien',      color:'#4cae8a', level:4 },
  { label:'Excelente', color:'#2cb99a', level:5 },
]

const fmt = s => {
  const m = Math.floor(s/60), sec = s%60
  return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

function pad(n) { return String(n).padStart(2,'0') }

// Genera la cuadrícula del mes: array de 42 celdas (6 semanas × 7 días)
// cada celda: null (fuera del mes) o { day: number, dateStr: 'YYYY-MM-DD' }
function buildGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay() // 0=Sun
  const startOffset = firstDow === 0 ? 6 : firstDow - 1 // offset para Lun=0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = i - startOffset + 1
    if (d < 1 || d > daysInMonth) { cells.push(null); continue }
    cells.push({ day: d, dateStr: `${year}-${pad(month+1)}-${pad(d)}` })
  }
  return cells
}

// ── DayDetail (panel inferior al picar un día) ─────────────────────────────────
function DayDetail({ cell, rutina, session, isRest, ambito, unit, onClose, onStart }) {
  const mood = session?.feeling ? MOODS[session.feeling.mood] : null
  const vol  = session?.exercises?.reduce((a,e)=>a+(e.sets||[]).reduce((b,s)=>b+(Number(s.weight)*Number(s.reps)||0),0),0)||0

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-card border border-border-2 rounded-t-3xl w-full max-h-[80vh] flex flex-col"
        style={{ borderTop:`3px solid ${session ? '#2cb99a' : rutina ? ambito.color : '#2a2a2a'}` }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/10"/>
        </div>

        {/* Header */}
        <div className="px-5 pt-1 pb-4 border-b border-border flex items-start justify-between shrink-0">
          <div>
            <p className="text-[16px] font-black text-hi">{cell.dateStr}</p>
            <p className="text-[12px] text-lo mt-0.5">
              {session ? 'Sesión completada' : isRest ? 'Día de descanso' : rutina ? `Planificado: ${rutina.name}` : 'Sin actividad'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-lo hover:text-mid transition-colors">
            <X size={16}/>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* ── Sesión completada ── */}
          {session && (
            <>
              {/* Stats */}
              <div className="flex gap-2">
                {[
                  { label:'Duración', val: fmt(session.duration||0) },
                  { label:'Volumen',  val: vol>0?`${vol}${unit}`:'—' },
                  { label:'Descanso', val: session.restTime>0?fmt(session.restTime):'—' },
                ].map(s => (
                  <div key={s.label} className="flex-1 rounded-xl p-2.5 text-center"
                    style={{ backgroundColor:'#2cb99a12', border:'1px solid #2cb99a20' }}>
                    <p className="text-[9px] text-lo uppercase tracking-wider">{s.label}</p>
                    <p className="text-[14px] font-bold font-mono mt-0.5" style={{ color:'#2cb99a' }}>{s.val}</p>
                  </div>
                ))}
                {mood && (
                  <div className="flex-1 rounded-xl p-2.5 text-center"
                    style={{ backgroundColor:mood.color+'12', border:`1px solid ${mood.color}20` }}>
                    <p className="text-[9px] text-lo uppercase tracking-wider">Feeling</p>
                    <div className="flex gap-0.5 justify-center mt-1">
                      {Array.from({length:mood.level}).map((_,li)=>(
                        <div key={li} className="w-1.5 h-3 rounded-sm" style={{backgroundColor:mood.color}}/>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Feeling note */}
              {session.feeling?.notes && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor:mood?.color+'10', border:`1px solid ${mood?.color}20` }}>
                  <p className="text-[11px] italic text-lo">"{session.feeling.notes}"</p>
                </div>
              )}

              {/* Exercises */}
              <div className="space-y-2">
                {session.exercises?.map(ex => {
                  const color  = muscleColor(ex.muscle)
                  const maxW   = Math.max(0, ...(ex.sets||[]).map(s=>Number(s.weight)||0))
                  return (
                    <div key={ex.id} className="rounded-xl overflow-hidden"
                      style={{ border:`1px solid ${color}25` }}>
                      <div className="flex items-center justify-between px-3 py-2"
                        style={{ backgroundColor:color+'12', borderBottom:`1px solid ${color}20` }}>
                        <div>
                          <span className="text-[13px] font-bold" style={{ color }}>{ex.name}</span>
                          <span className="text-[10px] text-lo ml-2">{ex.muscle}</span>
                        </div>
                        {maxW > 0 && <span className="text-[11px] font-mono font-bold" style={{ color }}>{maxW}{unit}</span>}
                      </div>
                      <div className="px-3 py-2 flex gap-1.5 flex-wrap">
                        {(ex.sets||[]).map((s,i) => (
                          <div key={i} className="flex flex-col items-center px-2 py-1.5 rounded-lg"
                            style={{ backgroundColor:color+'12', border:`1px solid ${color}25` }}>
                            <span className="text-[9px] text-lo">S{i+1}</span>
                            <span className="text-[12px] font-bold font-mono" style={{ color }}>
                              {s.weight>0?`${s.weight}${unit}`:'—'}
                            </span>
                            <span className="text-[9px] text-lo">×{s.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Rutina planificada (sin sesión aún) ── */}
          {!session && rutina && !isRest && (
            <>
              <div className="space-y-2">
                {rutina.muscleGroups.map(g => {
                  const color = muscleColor(g.name)
                  return (
                    <div key={g.id} className="card p-0 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border"
                        style={{ borderLeft:`3px solid ${color}` }}>
                        <span className="text-[13px] font-semibold flex-1" style={{ color }}>{g.name}</span>
                        <span className="text-[11px] text-lo">{g.exercises.length} ejerc.</span>
                      </div>
                      <div className="px-3 py-2 space-y-0.5">
                        {g.exercises.map(ex => (
                          <div key={ex.id} className="flex items-center justify-between py-0.5">
                            <span className="text-[12px] text-mid">{ex.name}</span>
                            <span className="text-[11px] font-mono" style={{ color: color+'bb' }}>
                              {ex.sets}×{ex.reps}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
              <button onClick={() => { onStart(rutina); onClose() }}
                className="w-full py-3.5 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ backgroundColor:ambito.color, color:'#000', boxShadow:`0 4px 20px ${ambito.color}50` }}>
                <Play size={14} weight="fill"/> Iniciar ahora
              </button>
            </>
          )}

          {/* ── Descanso ── */}
          {isRest && !session && (
            <div className="text-center py-8">
              <Moon size={36} className="mx-auto mb-2" style={{color:'#9575cd'}} weight="fill"/>
              <p className="text-[14px] font-semibold text-hi">Día de descanso</p>
              <p className="text-[12px] text-lo mt-1">Recuperación y crecimiento muscular</p>
            </div>
          )}

          {/* ── Sin actividad ── */}
          {!session && !rutina && !isRest && (
            <div className="text-center py-8">
              <p className="text-[13px] text-lo">Sin actividad planificada para este día.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── GymCalendario ─────────────────────────────────────────────────────────────
export default function GymCalendario({ rutinas, weekPlan, sessions: sessionsProp, unit, ambito, onStart }) {
  const today     = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selected, setSelected] = useState(null)
  // Siempre lee las sesiones frescas del localStorage al montar o cuando sessiónsProp cambia
  const [sessions, setSessions] = useState(() => getGymSessions())
  useEffect(() => { setSessions(getGymSessions()) }, [sessionsProp])

  const prevMonth = () => { if (month === 0) { setYear(y=>y-1); setMonth(11) } else setMonth(m=>m-1) }
  const nextMonth = () => { if (month === 11) { setYear(y=>y+1); setMonth(0) } else setMonth(m=>m+1) }

  // Local date (not UTC) to avoid off-by-one at night
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`
  const cells    = buildGrid(year, month)

  // Sessions indexed by date
  const sessionByDate = {}
  sessions.forEach(s => { sessionByDate[s.date] = s })

  // Stats for this month (using local date comparison)
  const monthStr      = `${year}-${pad(month+1)}`
  const monthSessions = sessions.filter(s => s?.date?.startsWith(monthStr))
  const trainDays     = monthSessions.length
  const totalVol      = monthSessions.reduce((a,s)=>a+(s.exercises||[]).reduce((b,e)=>b+(e.sets||[]).reduce((c,st)=>c+(Number(st.weight)*Number(st.reps)||0),0),0),0)

  const openDay = (cell) => {
    if (!cell) return
    const dow      = new Date(cell.dateStr).getDay()
    const key      = DOW_TO_KEY[dow]
    const planVal  = weekPlan[key]
    const rutina   = planVal && planVal !== 'rest' ? rutinas.find(r => r.id === planVal) : null
    const isRest   = planVal === 'rest'
    const session  = sessionByDate[cell.dateStr]
    setSelected({ cell, rutina, session, isRest })
  }

  return (
    <div>
      {/* Month header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth}
          className="p-2 rounded-xl text-lo hover:text-mid hover:bg-white/5 transition-all">
          <CaretLeft size={16}/>
        </button>
        <div className="text-center">
          <p className="text-[16px] font-black text-hi">{MONTH_NAMES[month]} {year}</p>
          {(trainDays > 0 || totalVol > 0) && (
            <p className="text-[11px] text-lo mt-0.5">
              {trainDays} sesion{trainDays!==1?'es':''} · {totalVol>0?`${totalVol}${unit} vol`:''}
            </p>
          )}
        </div>
        <button onClick={nextMonth}
          className="p-2 rounded-xl text-lo hover:text-mid hover:bg-white/5 transition-all">
          <CaretRight size={16}/>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center py-1.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ color:'#444' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i}/>

          const dow      = new Date(cell.dateStr).getDay()
          const key      = DOW_TO_KEY[dow]
          const planVal  = weekPlan[key]
          const rutina   = planVal && planVal !== 'rest' ? rutinas.find(r => r.id === planVal) : null
          const isRest   = planVal === 'rest'
          const session  = sessionByDate[cell.dateStr]
          const isToday  = cell.dateStr === todayStr
          const isPast   = cell.dateStr < todayStr

          // Determine cell accent color
          const accentColor = session
            ? '#2cb99a'
            : rutina ? ambito.color
            : isRest ? '#3a3a3a'
            : null

          // Muscle dots for planned or completed
          const muscles = session
            ? [...new Set(session.exercises?.map(e=>e.muscle)||[])]
            : rutina
              ? rutina.muscleGroups.map(g=>g.name)
              : []

          return (
            <button
              key={i}
              onClick={() => openDay(cell)}
              className="relative flex flex-col rounded-xl transition-all active:scale-95 overflow-hidden"
              style={{
                minHeight: 64,
                border: isToday
                  ? `2px solid ${ambito.color}80`
                  : `1px solid ${accentColor ? accentColor+'25' : '#1a1a1a'}`,
                backgroundColor: session
                  ? '#2cb99a08'
                  : rutina ? ambito.color+'06'
                  : isRest ? '#0d0d0d'
                  : 'transparent',
                boxShadow: isToday ? `0 0 12px ${ambito.color}20` : 'none',
              }}>

              {/* Colored top bar */}
              {accentColor && (
                <div className="h-0.5 w-full" style={{ backgroundColor: accentColor }}/>
              )}

              <div className="flex flex-col flex-1 p-1.5">
                {/* Day number */}
                <div className="flex items-start justify-between mb-1">
                  <span className="text-[12px] font-bold leading-none"
                    style={{
                      color: isToday ? ambito.color : isPast && !session && rutina ? '#3a3a3a' : '#777',
                    }}>
                    {cell.day}
                  </span>
                  {/* Status icon */}
                  {session && <span className="text-[13px] leading-none">
                    {session.feeling
                      ? <div className="w-2 h-2 rounded-full" style={{backgroundColor:MOODS[session.feeling.mood]?.color||'#555'}}/>
                      : <CheckCircle size={10} style={{color:'#4cae8a'}}/>
                    }
                  </span>}
                  {isRest && !session && <Moon size={10} style={{ color:'#3a3a3a' }} weight="fill"/>}
                </div>

                {/* Muscle dots */}
                {muscles.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {muscles.slice(0,4).map(m => (
                      <div key={m} className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: muscleColor(m), opacity: session ? 1 : 0.5 }}/>
                    ))}
                    {muscles.length > 4 && (
                      <span className="text-[8px] text-lo">+{muscles.length-4}</span>
                    )}
                  </div>
                )}

                {/* Routine name (small) */}
                {(rutina || session) && (
                  <p className="text-[9px] mt-auto leading-tight truncate"
                    style={{ color: session ? '#2cb99a99' : ambito.color+'80' }}>
                    {session ? session.rutinaName : rutina?.name}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 flex-wrap">
        {[
          { color: '#2cb99a', label: 'Completado' },
          { color: ambito.color, label: 'Planificado' },
          { color: '#3a3a3a', label: 'Descanso' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }}/>
            <span className="text-[11px] text-lo">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Day detail panel */}
      {selected && (
        <DayDetail
          cell={selected.cell}
          rutina={selected.rutina}
          session={selected.session}
          isRest={selected.isRest}
          ambito={ambito}
          unit={unit}
          onClose={() => setSelected(null)}
          onStart={onStart}
        />
      )}
    </div>
  )
}
