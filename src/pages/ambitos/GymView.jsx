import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, X, ArrowLeft, Barbell, Play, Trash, Lightning,
  ArrowsIn, ArrowsOut, CheckFat, Trophy, Moon, PencilSimple,
  ArrowUp, ArrowDown, Check,
} from '@phosphor-icons/react'
import AmbitoHeader from '../../components/AmbitoHeader'
import {
  getHabits, getRutinas, saveRutinas, getWeekPlan, saveWeekPlan,
  getGymUnit, saveGymUnit, getLastWeightsForExercise,
} from '../../store'
import GymCalendario from './GymCalendario'
import { useGymSession, useGymTimer, setGymMinimized } from '../../context/GymSessionContext'

// ── Constantes ────────────────────────────────────────────────────────────────
const MUSCLE_GROUPS = [
  { name: 'Pecho',        color: '#e05c5c' },
  { name: 'Espalda',      color: '#5b84e8' },
  { name: 'Hombros',      color: '#3bafc9' },
  { name: 'Biceps',       color: '#9575cd' },
  { name: 'Triceps',      color: '#c9a227' },
  { name: 'Piernas',      color: '#4cae8a' },
  { name: 'Gluteos',      color: '#d4608a' },
  { name: 'Core',         color: '#e07c4a' },
  { name: 'Pantorrillas', color: '#7ec45a' },
  { name: 'Antebrazos',   color: '#a07fcf' },
  { name: 'Otros',        color: '#888'    },
]
const EXERCISE_PRESETS = {
  Pecho:        ['Press banca', 'Press inclinado', 'Aperturas', 'Fondos', 'Pullover'],
  Espalda:      ['Dominadas', 'Remo barra', 'Jalón polea', 'Peso muerto', 'Remo mancuerna'],
  Hombros:      ['Press militar', 'Elevaciones laterales', 'Pájaros', 'Press Arnold'],
  Biceps:       ['Curl barra', 'Curl mancuernas', 'Curl martillo', 'Curl concentrado'],
  Triceps:      ['Press francés', 'Extensiones polea', 'Fondos banco', 'Patada triceps'],
  Piernas:      ['Sentadillas', 'Prensa', 'Extensiones', 'Curl femoral', 'Zancadas'],
  Gluteos:      ['Hip thrust', 'Patada trasera', 'Abducción', 'Sentadilla sumo'],
  Core:         ['Plancha', 'Crunch', 'Rueda abdominal', 'Elevación piernas'],
  Pantorrillas: ['Elevación talones', 'Prensa pantorrilla'],
  Antebrazos:   ['Curl muñeca', 'Extensión muñeca'],
  Otros:        [],
}
const WEEK_DAYS = [
  { key: 'lunes',     label: 'Lunes',     short: 'LUN' },
  { key: 'martes',    label: 'Martes',    short: 'MAR' },
  { key: 'miercoles', label: 'Miércoles', short: 'MIÉ' },
  { key: 'jueves',    label: 'Jueves',    short: 'JUE' },
  { key: 'viernes',   label: 'Viernes',   short: 'VIE' },
  { key: 'sabado',    label: 'Sábado',    short: 'SÁB' },
  { key: 'domingo',   label: 'Domingo',   short: 'DOM' },
]
const TODAY_KEY = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][new Date().getDay()]

// Reorder helpers
const moveUp   = (arr, i) => { if (i===0) return arr; const r=[...arr]; [r[i-1],r[i]]=[r[i],r[i-1]]; return r }
const moveDown = (arr, i) => { if (i===arr.length-1) return arr; const r=[...arr]; [r[i],r[i+1]]=[r[i+1],r[i]]; return r }

const uid         = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
const muscleColor = n  => MUSCLE_GROUPS.find(m => m.name === n)?.color || '#888'
const fmt = s => {
  const m = Math.floor(s / 60), sec = s % 60
  return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

// ── DayColumn ─────────────────────────────────────────────────────────────────
function DayColumn({ day, rutina, isRest, isToday, ambito, onAssign, onStart }) {
  const totalEx = rutina ? rutina.muscleGroups.reduce((a,g) => a + g.exercises.length, 0) : 0
  const accentColor = isToday ? ambito.color : '#2a2a2a'

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden shrink-0 transition-all"
      style={{
        width: 148,
        minHeight: 320,
        border: `1px solid ${isToday ? ambito.color + '50' : '#1e1e1e'}`,
        backgroundColor: isToday ? ambito.color + '06' : '#0d0d0d',
        boxShadow: isToday ? `0 0 20px ${ambito.color}18` : 'none',
      }}
    >
      {/* Day header */}
      <div className="px-3 pt-3 pb-2 border-b"
        style={{ borderColor: isToday ? ambito.color + '30' : '#1a1a1a' }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-0.5"
          style={{ color: isToday ? ambito.color : '#444' }}>
          {day.short}
        </p>
        <p className="text-[13px] font-semibold"
          style={{ color: isToday ? '#fff' : '#555' }}>
          {day.label}
        </p>
        {isToday && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-1 inline-block"
            style={{ backgroundColor: ambito.color + '25', color: ambito.color }}>
            Hoy
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-2.5">
        {isRest ? (
          // Rest day
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
            <Moon size={24} style={{ color: '#3a3a3a' }} weight="fill" />
            <p className="text-[11px] font-medium" style={{ color: '#3a3a3a' }}>Descanso</p>
            <button onClick={onAssign}
              className="text-[9px] text-lo hover:text-mid transition-colors mt-1 underline underline-offset-2">
              Cambiar
            </button>
          </div>
        ) : rutina ? (
          // Has routine
          <div className="flex flex-col flex-1 gap-2">
            <div className="flex items-start justify-between">
              <p className="text-[12px] font-bold text-hi leading-tight flex-1">{rutina.name}</p>
              <button onClick={onAssign}
                className="text-lo hover:text-mid transition-colors ml-1 shrink-0 mt-0.5">
                <PencilSimple size={11} />
              </button>
            </div>

            {/* Muscle groups + exercises */}
            <div className="space-y-2 flex-1">
              {rutina.muscleGroups.map(g => {
                const color = muscleColor(g.name)
                return (
                  <div key={g.id}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
                        {g.name}
                      </span>
                    </div>
                    {g.exercises.map(ex => (
                      <div key={ex.id} className="pl-2.5 flex items-baseline justify-between gap-1 py-0.5">
                        <span className="text-[10px] text-lo leading-tight truncate flex-1">{ex.name}</span>
                        <span className="text-[9px] font-mono shrink-0" style={{ color: color + 'bb' }}>
                          {ex.sets}×{ex.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Start button */}
            {totalEx > 0 && (
              <button onClick={onStart}
                className="w-full py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 mt-1 transition-all active:scale-95"
                style={{ backgroundColor: ambito.color, color: '#000', boxShadow: `0 2px 12px ${ambito.color}40` }}>
                <Play size={11} weight="fill" /> Iniciar
              </button>
            )}
          </div>
        ) : (
          // Empty day
          <button onClick={onAssign}
            className="flex-1 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-all group"
            style={{ borderColor: '#242424' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = ambito.color + '40'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#242424'}>
            <Plus size={20} style={{ color: '#333' }} className="group-hover:text-mid transition-colors" />
            <span className="text-[10px]" style={{ color: '#333' }}>Asignar</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ── RutinaDetail (editor) ─────────────────────────────────────────────────────
function RutinaDetail({ rutina, onChange, onBack, onDelete }) {
  const [showAddMuscle, setShowAddMuscle] = useState(false)
  const [customMuscle,  setCustomMuscle]  = useState('')
  const [showCustom,    setShowCustom]    = useState(false)
  const [addingExFor,   setAddingExFor]   = useState(null)
  const [newExName,     setNewExName]     = useState('')
  const [newExSets,     setNewExSets]     = useState('4')
  const [newExReps,     setNewExReps]     = useState('8')
  const [editingName,   setEditingName]   = useState(false)
  const [draftName,     setDraftName]     = useState(rutina.name)
  const [editingEx,     setEditingEx]     = useState(null) // { gid, eid }
  const [exDraft,       setExDraft]       = useState({})

  const used      = rutina.muscleGroups.map(g => g.name)
  const available = MUSCLE_GROUPS.filter(m => !used.includes(m.name))

  // ── helpers ──
  const updateGroups = groups => onChange({ ...rutina, muscleGroups: groups })

  const addMuscle   = name => { updateGroups([...rutina.muscleGroups, { id:uid(), name, exercises:[] }]); setShowAddMuscle(false) }
  const deleteGroup = id   => updateGroups(rutina.muscleGroups.filter(g => g.id !== id))
  const moveGroup   = (i, dir) => updateGroups(dir==='up' ? moveUp(rutina.muscleGroups,i) : moveDown(rutina.muscleGroups,i))

  const updateGroupExercises = (gid, exercises) =>
    updateGroups(rutina.muscleGroups.map(g => g.id===gid ? { ...g, exercises } : g))

  const addExercise = gid => {
    if (!newExName.trim()) return
    const g = rutina.muscleGroups.find(g => g.id===gid)
    updateGroupExercises(gid, [...g.exercises, { id:uid(), name:newExName.trim(), sets:newExSets||'3', reps:newExReps||'8' }])
    setNewExName(''); setNewExSets('4'); setNewExReps('8'); setAddingExFor(null)
  }
  const deleteEx = (gid, eid) => {
    const g = rutina.muscleGroups.find(g => g.id===gid)
    updateGroupExercises(gid, g.exercises.filter(e => e.id!==eid))
  }
  const moveEx = (gid, i, dir) => {
    const g = rutina.muscleGroups.find(g => g.id===gid)
    updateGroupExercises(gid, dir==='up' ? moveUp(g.exercises,i) : moveDown(g.exercises,i))
  }
  const saveExEdit = (gid, eid) => {
    const g = rutina.muscleGroups.find(g => g.id===gid)
    updateGroupExercises(gid, g.exercises.map(e => e.id===eid ? { ...e, ...exDraft } : e))
    setEditingEx(null)
  }

  return (
    <div>
      {/* Header con nombre editable */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-2 rounded-xl text-lo hover:text-mid hover:bg-white/5 transition-all">
          <ArrowLeft size={16}/>
        </button>
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input className="field-input text-[15px] font-bold flex-1" value={draftName}
                onChange={e => setDraftName(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'){ onChange({...rutina,name:draftName.trim()||rutina.name}); setEditingName(false) }}}
                autoFocus/>
              <button onClick={() => { onChange({...rutina,name:draftName.trim()||rutina.name}); setEditingName(false) }}
                className="p-1.5 rounded-lg text-lo hover:text-mid bg-white/5"><Check size={14}/></button>
              <button onClick={() => { setDraftName(rutina.name); setEditingName(false) }}
                className="p-1.5 rounded-lg text-lo hover:text-mid bg-white/5"><X size={14}/></button>
            </div>
          ) : (
            <button onClick={() => { setDraftName(rutina.name); setEditingName(true) }}
              className="flex items-center gap-2 group w-full text-left">
              <h2 className="text-[16px] font-bold text-hi">{rutina.name}</h2>
              <PencilSimple size={13} className="text-lo opacity-0 group-hover:opacity-100 transition-all"/>
            </button>
          )}
          <p className="text-[11px] text-lo mt-0.5">{rutina.muscleGroups.length} grupos · {rutina.muscleGroups.reduce((a,g)=>a+g.exercises.length,0)} ejercicios</p>
        </div>
        <button onClick={onDelete} className="text-[12px] text-red-400/50 hover:text-red-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors">
          <Trash size={13}/> Eliminar
        </button>
      </div>

      <div className="space-y-3">
        {rutina.muscleGroups.map((g, gi) => {
          const color = muscleColor(g.name)
          return (
            <div key={g.id} className="card p-0 overflow-hidden">
              {/* Muscle header */}
              <div className="flex items-center gap-2 px-3 py-3 border-b border-border" style={{ borderLeft:`3px solid ${color}` }}>
                {/* Reorder group */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => moveGroup(gi,'up')} disabled={gi===0}
                    className="text-lo hover:text-mid disabled:opacity-20 transition-colors"><ArrowUp size={10}/></button>
                  <button onClick={() => moveGroup(gi,'down')} disabled={gi===rutina.muscleGroups.length-1}
                    className="text-lo hover:text-mid disabled:opacity-20 transition-colors"><ArrowDown size={10}/></button>
                </div>
                <span className="text-[14px] font-semibold flex-1" style={{ color }}>{g.name}</span>
                <span className="text-[11px] text-lo">{g.exercises.length} ejerc.</span>
                <button onClick={() => deleteGroup(g.id)} className="btn-icon text-lo hover:text-red-400 opacity-60 hover:opacity-100"><Trash size={13}/></button>
              </div>

              <div className="p-3 space-y-1.5">
                {g.exercises.map((ex, ei) => {
                  const isEditing = editingEx?.gid===g.id && editingEx?.eid===ex.id
                  return isEditing ? (
                    // Inline edit mode
                    <div key={ex.id} className="rounded-xl border p-3 space-y-2" style={{ borderColor: color+'40', backgroundColor: color+'08' }}>
                      <input className="field-input text-[13px]" placeholder="Nombre"
                        value={exDraft.name??ex.name} onChange={e => setExDraft(d=>({...d,name:e.target.value}))} autoFocus/>
                      <div className="flex gap-2">
                        <div className="flex-1"><span className="field-label">Series</span>
                          <input type="number" min={1} max={10} className="field-input text-center text-[13px]"
                            value={exDraft.sets??ex.sets} onChange={e => setExDraft(d=>({...d,sets:e.target.value}))}/>
                        </div>
                        <div className="flex-1"><span className="field-label">Reps</span>
                          <input className="field-input text-center text-[13px]" placeholder="8 ó 8-12"
                            value={exDraft.reps??ex.reps} onChange={e => setExDraft(d=>({...d,reps:e.target.value}))}/>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn-ghost flex-1 text-[12px]" onClick={() => setEditingEx(null)}>Cancelar</button>
                        <button className="btn-primary flex-1 text-[12px]" onClick={() => saveExEdit(g.id,ex.id)}>Guardar</button>
                      </div>
                    </div>
                  ) : (
                    // Normal row
                    <div key={ex.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg group hover:bg-white/3">
                      {/* Reorder exercise */}
                      <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => moveEx(g.id,ei,'up')} disabled={ei===0}
                          className="text-lo hover:text-mid disabled:opacity-20"><ArrowUp size={10}/></button>
                        <button onClick={() => moveEx(g.id,ei,'down')} disabled={ei===g.exercises.length-1}
                          className="text-lo hover:text-mid disabled:opacity-20"><ArrowDown size={10}/></button>
                      </div>
                      <span className="flex-1 text-[13px] text-mid">{ex.name}</span>
                      <span className="text-[12px] font-mono font-semibold shrink-0" style={{ color }}>{ex.sets}×{ex.reps}</span>
                      {/* Edit + delete */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingEx({gid:g.id,eid:ex.id}); setExDraft({}) }}
                          className="btn-icon text-lo hover:text-mid"><PencilSimple size={11}/></button>
                        <button onClick={() => deleteEx(g.id,ex.id)}
                          className="btn-icon text-lo hover:text-red-400"><X size={11}/></button>
                      </div>
                    </div>
                  )
                })}

                {/* Add exercise */}
                {addingExFor === g.id ? (
                  <div className="rounded-xl border border-border p-3 space-y-2 mt-1">
                    <input className="field-input text-[13px]" placeholder="Nombre del ejercicio"
                      value={newExName} onChange={e => setNewExName(e.target.value)} autoFocus
                      onKeyDown={e => e.key==='Enter' && addExercise(g.id)}/>
                    <div className="flex flex-wrap gap-1.5">
                      {(EXERCISE_PRESETS[g.name]||[]).map(p => (
                        <button key={p} onClick={() => setNewExName(p)}
                          className="text-[10px] px-2 py-1 rounded-lg transition-colors"
                          style={{ border:`1px solid ${color}30`, color:color+'bb', backgroundColor:color+'12' }}>
                          {p}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1"><span className="field-label">Series</span>
                        <input type="number" min={1} max={10} className="field-input text-center text-[13px]" value={newExSets} onChange={e => setNewExSets(e.target.value)}/>
                      </div>
                      <div className="flex-1"><span className="field-label">Reps</span>
                        <input className="field-input text-center text-[13px]" placeholder="8 ó 8-12" value={newExReps} onChange={e => setNewExReps(e.target.value)}/>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-ghost flex-1 text-[12px]" onClick={() => setAddingExFor(null)}>Cancelar</button>
                      <button className="btn-primary flex-1 text-[12px]" onClick={() => addExercise(g.id)}>Agregar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setAddingExFor(g.id); setNewExName('') }}
                    className="w-full text-[12px] py-1.5 rounded-lg border border-dashed flex items-center justify-center gap-1.5 transition-colors"
                    style={{ borderColor:color+'30', color:color+'70' }}
                    onMouseEnter={e => { e.currentTarget.style.color=color; e.currentTarget.style.borderColor=color+'60' }}
                    onMouseLeave={e => { e.currentTarget.style.color=color+'70'; e.currentTarget.style.borderColor=color+'30' }}>
                    <Plus size={11}/> Ejercicio
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {showAddMuscle ? (
          <div className="card p-4">
            <p className="text-[13px] font-medium text-hi mb-3">¿Qué músculo trabajas?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {available.filter(m=>m.name!=='Otros').map(m => (
                <button key={m.name} onClick={() => addMuscle(m.name)}
                  className="py-2 px-3 rounded-xl text-[12px] font-medium text-center transition-all"
                  style={{ backgroundColor:m.color+'15', color:m.color, border:`1px solid ${m.color}30` }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor=m.color+'28'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor=m.color+'15'}>
                  {m.name}
                </button>
              ))}
              {/* Otros — siempre disponible */}
              {!showCustom && (
                <button onClick={() => setShowCustom(true)}
                  className="py-2 px-3 rounded-xl text-[12px] font-medium text-center transition-all"
                  style={{ backgroundColor:'#88888815', color:'#888', border:'1px solid #88888830' }}>
                  Otros…
                </button>
              )}
              {available.filter(m=>m.name!=='Otros').length===0 && !showCustom && (
                <p className="text-[12px] text-lo col-span-3 text-center py-2">Todos los grupos ya están.</p>
              )}
            </div>
            {showCustom && (
              <div className="mt-3 flex gap-2">
                <input autoFocus className="field-input flex-1 text-[13px]"
                  placeholder="Ej: Trapecio, Aductores…"
                  value={customMuscle} onChange={e => setCustomMuscle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key==='Enter' && customMuscle.trim()) {
                      addMuscle(customMuscle.trim())
                      setCustomMuscle(''); setShowCustom(false)
                    }
                    if (e.key==='Escape') { setShowCustom(false); setCustomMuscle('') }
                  }}/>
                <button
                  onClick={() => {
                    if (customMuscle.trim()) {
                      addMuscle(customMuscle.trim())
                      setCustomMuscle(''); setShowCustom(false)
                    }
                  }}
                  disabled={!customMuscle.trim()}
                  className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
                  style={customMuscle.trim()
                    ? { backgroundColor:'#2cb99a22', color:'#2cb99a', border:'1px solid #2cb99a40' }
                    : { backgroundColor:'#111', color:'#444', border:'1px solid #1a1a1a' }}>
                  Agregar
                </button>
              </div>
            )}
            <button className="btn-ghost w-full mt-3 text-[12px]" onClick={() => { setShowAddMuscle(false); setShowCustom(false); setCustomMuscle('') }}>Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setShowAddMuscle(true)}
            className="w-full py-3 rounded-xl border border-dashed border-border text-[12px] text-lo hover:text-mid hover:border-border-2 transition-all flex items-center justify-center gap-2">
            <Plus size={13}/> Agregar grupo muscular
          </button>
        )}
      </div>
    </div>
  )
}

// ── Pill minimizada ───────────────────────────────────────────────────────────
function SessionPill({ currentEx, setIdx, elapsed, color, onExpand }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-56 z-[60] rounded-2xl flex items-center gap-3 px-5 py-3"
      style={{ background:'linear-gradient(135deg,#111,#0d0d0d)', border:`1px solid ${color}40`, boxShadow:`0 0 30px ${color}35, 0 8px 32px rgba(0,0,0,.6)` }}>
      <span className="font-mono text-[18px] font-bold shrink-0" style={{ color }}>{fmt(elapsed)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-hi truncate">{currentEx?.name}</p>
        <p className="text-[11px]" style={{ color: muscleColor(currentEx?.muscle) }}>
          {currentEx?.muscle} · Serie {setIdx+1}/{currentEx?.totalSets}
        </p>
      </div>
      <button onClick={onExpand}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold"
        style={{ backgroundColor: color+'20', color }}>
        <ArrowsOut size={13}/> Volver
      </button>
    </div>
  )
}

// ── Rest timer ───────────────────────────────────────────────────────────────
// Countdown circle (shrinks toward 0)
function CircleCountdown({ remaining, initial, color }) {
  const r    = 72
  const circ = 2 * Math.PI * r
  const pct  = Math.max(0, remaining / initial)
  return (
    <svg width={180} height={180} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={90} cy={90} r={r} fill="none" stroke="#1a1a1a" strokeWidth={8}/>
      <circle cx={90} cy={90} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)}
        style={{ transition:'stroke-dashoffset 1s linear', filter:`drop-shadow(0 0 8px ${color}80)` }}/>
      <text x={90} y={90} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize={38} fontWeight={900} fontFamily="monospace"
        style={{ transform:'rotate(90deg)', transformOrigin:'90px 90px' }}>
        {remaining}
      </text>
    </svg>
  )
}

// Extra rest stopwatch (counts up)
function ExtraStopwatch({ elapsed, color }) {
  const m   = Math.floor(elapsed / 60)
  const s   = elapsed % 60
  const str = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return (
    <div className="flex items-center justify-center rounded-full"
      style={{ width:180, height:180, border:`4px solid ${color}40`,
        boxShadow:`0 0 40px ${color}30, inset 0 0 40px ${color}08` }}>
      <div className="text-center">
        <p className="font-mono text-[42px] font-black leading-none" style={{ color }}>{str}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color:color+'80' }}>extra</p>
      </div>
    </div>
  )
}

function RestOverlay({ timer, nextEx, unit, lastWeights, color, alarmActive, onSkip, onStartExtra, onSilence }) {
  const isExtra   = timer.phase === 'extra'
  const nextColor = nextEx ? muscleColor(nextEx.muscle) : color
  const lastW     = lastWeights?.[0] || null

  return (
    <div className="fixed inset-0 z-[65] flex flex-col items-center justify-center px-6"
      style={{
        backgroundColor: alarmActive ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(6px)',
        // Pulsing border when alarm active
        boxShadow: alarmActive ? `inset 0 0 60px #ffd70020` : 'none',
        transition: 'box-shadow 0.5s',
      }}>

      {/* Phase label */}
      <p className="text-[11px] font-bold uppercase tracking-widest mb-2"
        style={{ color: isExtra ? '#ffd700' : '#555' }}>
        {alarmActive ? '¡Tiempo!' : isExtra ? 'Descanso extra' : 'Descanso'}
      </p>

      {/* Timer */}
      {isExtra
        ? <ExtraStopwatch elapsed={timer.extraElapsed} color={alarmActive ? '#ffd700' : '#ffd700'}/>
        : <CircleCountdown remaining={timer.remaining} initial={timer.initial} color={color}/>
      }

      {/* Silence button — solo cuando suena la alarma */}
      {alarmActive && (
        <button onClick={onSilence}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95"
          style={{ backgroundColor:'#1a1a1a', border:'1px solid #ffd70030', color:'#ffd70099' }}>
          🔕 Silenciar alarma
        </button>
      )}

      {/* Context when not alarm */}
      {isExtra && !alarmActive && (
        <p className="mt-3 text-[12px] text-center" style={{ color:'#ffd70060' }}>
          Tómate el tiempo que necesites
        </p>
      )}

      {/* Next exercise card */}
      {nextEx && (
        <div className="mt-5 w-full max-w-xs rounded-2xl p-4 text-center"
          style={{ backgroundColor:nextColor+'10', border:`1px solid ${nextColor}25` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color:nextColor }}>Siguiente</p>
          <p className="text-[16px] font-black text-hi">{nextEx.name}</p>
          <p className="text-[12px] mt-0.5" style={{ color:nextColor+'aa' }}>
            {nextEx.muscle} · {nextEx.totalSets}×{nextEx.repsTarget}
          </p>
          {lastW > 0 && (
            <p className="text-[11px] mt-1.5" style={{ color:'#ffd70099' }}>⚡ Última vez: {lastW} {unit}</p>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 mt-5 w-full max-w-xs">
        {!isExtra && (
          <button onClick={onStartExtra}
            className="flex-1 py-4 rounded-2xl text-[13px] font-semibold transition-all active:scale-95 text-center"
            style={{ backgroundColor:'#141414', border:'1px solid #242424', color:'#777' }}>
            Aún no
            <span className="block text-[10px] mt-0.5" style={{ color:'#444' }}>Iniciar extra</span>
          </button>
        )}
        <button onClick={onSkip}
          className="flex-1 py-4 rounded-2xl text-[13px] font-bold transition-all active:scale-95 text-center"
          style={{
            backgroundColor: '#ffd700',
            color: '#000',
            boxShadow: `0 4px 20px #ffd70050`,
          }}>
          Listo
          <span className="block text-[10px] mt-0.5 opacity-60">
            {isExtra ? `+${timer.extraElapsed}s guardados` : 'Ya estoy listo'}
          </span>
        </button>
      </div>
    </div>
  )
}

// ── Feeling screen ────────────────────────────────────────────────────────────
const MOODS = [
  { label:'Muy duro',   color:'#e05c5c', level:1 },
  { label:'Difícil',    color:'#e07c4a', level:2 },
  { label:'Normal',     color:'#c9a227', level:3 },
  { label:'Bien',       color:'#4cae8a', level:4 },
  { label:'Excelente',  color:'#2cb99a', level:5 },
]

function FeelingScreen({ session, elapsed, unit, onSubmit }) {
  const [mood,   setMood]   = useState(2)
  const [energy, setEnergy] = useState(3)
  const [notes,  setNotes]  = useState('')
  const vol = Object.values(session.logs).flat().reduce((a,s)=>a+(Number(s.weight)*Number(s.reps)||0),0)

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 overflow-y-auto"
      style={{ background:'radial-gradient(ellipse 80% 60% at 50% 30%,#111820,#0a0a0a)' }}>
      <div className="w-full max-w-sm">
        {/* Stats rápidos */}
        <div className="flex gap-2 justify-center mb-8">
          {[{ label:'Tiempo', val:fmt(elapsed) },{ label:'Series', val:session.flat.reduce((a,e)=>a+e.totalSets,0) },{ label:'Volumen', val:vol>0?`${vol}${unit}`:'—' }].map(s=>(
            <div key={s.label} className="text-center px-4 py-2 rounded-xl" style={{ backgroundColor:'#ffffff08', border:'1px solid #ffffff10' }}>
              <p className="text-[9px] text-lo uppercase tracking-wider">{s.label}</p>
              <p className="text-[15px] font-bold font-mono text-hi">{s.val}</p>
            </div>
          ))}
        </div>

        <h2 className="text-[24px] font-black text-hi text-center mb-1">¿Cómo te sentiste?</h2>
        <p className="text-[13px] text-lo text-center mb-7">{session.rutinaName}</p>

        {/* Mood */}
        <div className="flex justify-between gap-2 mb-6">
          {MOODS.map((m,i) => (
            <button key={i} onClick={() => setMood(i)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all"
              style={mood===i
                ? { backgroundColor:m.color+'22', border:`2px solid ${m.color}60`, transform:'scale(1.05)' }
                : { backgroundColor:'#0d0d0d', border:'2px solid #1a1a1a' }}>
              <div className="flex gap-0.5 mb-0.5">
                {Array.from({length:m.level}).map((_,li)=>(
                  <div key={li} className="w-2 h-4 rounded-sm" style={{backgroundColor:mood===i?m.color:m.color+'44'}}/>
                ))}
              </div>
              <span className="text-[9px] font-semibold" style={{ color:mood===i?m.color:'#444' }}>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Energy */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-lo uppercase tracking-wider mb-2">Nivel de energía</p>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setEnergy(n)}
                className="flex-1 h-10 rounded-xl text-[18px] transition-all"
                style={n<=energy
                  ? { backgroundColor:MOODS[mood].color+'30', border:`1px solid ${MOODS[mood].color}60` }
                  : { backgroundColor:'#0d0d0d', border:'1px solid #1a1a1a' }}>
                ⚡
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <p className="text-[11px] font-semibold text-lo uppercase tracking-wider mb-2">Notas (opcional)</p>
          <textarea
            className="field-input resize-none w-full h-20 text-[13px]"
            placeholder="¿Qué funcionó? ¿Qué mejorar? ¿Lesión? ..."
            value={notes} onChange={e => setNotes(e.target.value)}/>
        </div>

        <button
          onClick={() => onSubmit({ mood, energy, notes })}
          className="w-full py-4 rounded-xl text-[14px] font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ backgroundColor:MOODS[mood].color, color:'#000', boxShadow:`0 4px 24px ${MOODS[mood].color}50` }}>
          <Trophy size={16} weight="bold"/> Guardar y terminar
        </button>
      </div>
    </div>
  )
}

// ── Sesión completa ───────────────────────────────────────────────────────────
function SessionComplete({ session, elapsed, unit, onClose }) {
  const vol     = Object.values(session.logs).flat().reduce((a,s)=>a+(Number(s.weight)*Number(s.reps)||0),0)
  const feeling = session.feeling
  const mood    = feeling ? MOODS[feeling.mood] : null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background:'radial-gradient(ellipse 80% 60% at 50% 40%,#0f1f18,#0a0a0a)' }}>
      <div className="text-center px-8 max-w-sm w-full">
        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background:'radial-gradient(circle,#2cb99a30,#2cb99a10)', border:'2px solid #2cb99a40' }}>
          <Trophy size={36} color="#2cb99a" weight="fill"/>
        </div>
        <h2 className="text-[26px] font-black text-hi mb-1">¡Rutina completada!</h2>
        <p className="text-[13px] text-lo mb-5">{session.rutinaName}</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[{ label:'Tiempo', value:fmt(elapsed) },{ label:'Series', value:session.flat.reduce((a,e)=>a+e.totalSets,0) },{ label:'Volumen', value:vol>0?`${vol}${unit}`:'—' }].map(s=>(
            <div key={s.label} className="rounded-xl p-3" style={{ backgroundColor:'#2cb99a12', border:'1px solid #2cb99a20' }}>
              <p className="text-[10px] text-lo mb-1">{s.label}</p>
              <p className="text-[17px] font-bold font-mono" style={{ color:'#2cb99a' }}>{s.value}</p>
            </div>
          ))}
        </div>
        {/* Feeling summary */}
        {mood && (
          <div className="rounded-2xl p-4 mb-5 text-left" style={{ backgroundColor:mood.color+'12', border:`1px solid ${mood.color}25` }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[28px]">{mood.emoji}</span>
              <div>
                <p className="text-[13px] font-semibold" style={{ color:mood.color }}>{mood.label}</p>
                <div className="flex gap-1 mt-0.5">
                  {[1,2,3,4,5].map(n=>(
                    <span key={n} className="text-[11px]" style={{ opacity:n<=feeling.energy?1:0.2 }}>⚡</span>
                  ))}
                </div>
              </div>
            </div>
            {feeling.notes && <p className="text-[12px] text-lo italic">"{feeling.notes}"</p>}
          </div>
        )}
        <button onClick={onClose} className="btn-primary w-full text-[14px] py-3">Cerrar</button>
      </div>
    </div>
  )
}

// ── Componentes aislados que leen el timer (se re-renderizan cada segundo pero no arrastran a GymView)
function SessionTimerDisplay({ color, doneSeries, totalSeries }) {
  const { elapsed } = useGymTimer()
  return (
    <div className="px-5 py-4 shrink-0">
      <div className="text-center mb-4">
        <span className="font-mono text-[44px] font-black leading-none"
          style={{ color, textShadow:`0 0 30px ${color}60` }}>
          {fmt(elapsed)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width:`${(doneSeries/totalSeries)*100}%`, backgroundColor:color, boxShadow:`0 0 10px ${color}` }}/>
        </div>
        <span className="text-[11px] font-mono text-lo shrink-0">{doneSeries}/{totalSeries}</span>
      </div>
    </div>
  )
}

function RestOverlayFromContext({ session, unit, color, alarmActive, silenceAlarm, skipRest, startExtraRest }) {
  const { restTimer } = useGymTimer()
  if (!restTimer || !session) return null
  const nextEx = session.flat[restTimer.nextExIdx]
  const lastWs = nextEx ? getLastWeightsForExercise(nextEx.name) : []
  return (
    <RestOverlay
      timer={restTimer} nextEx={nextEx} unit={unit}
      lastWeights={lastWs} color={color}
      alarmActive={alarmActive}
      onSkip={skipRest} onStartExtra={startExtraRest} onSilence={silenceAlarm}
    />
  )
}

function SessionPillFromContext({ currentEx, setIdx, color, onExpand }) {
  const { elapsed } = useGymTimer()
  return <SessionPill currentEx={currentEx} setIdx={setIdx} elapsed={elapsed} color={color} onExpand={onExpand}/>
}


function FeelingScreenFromContext({ session, unit, onSubmit }) {
  const { elapsed } = useGymTimer()
  return <FeelingScreen session={session} elapsed={elapsed} unit={unit} onSubmit={onSubmit}/>
}

function SessionCompleteFromContext({ session, unit, onClose }) {
  const { elapsed } = useGymTimer()
  return <SessionComplete session={session} elapsed={elapsed} unit={unit} onClose={onClose}/>
}

// ── GymView ───────────────────────────────────────────────────────────────────
const TABS = ['Semana', 'Rutinas', 'Calendario', 'Historial']

export default function GymView({ ambito }) {
  const habits = getHabits()

  const [tab,           setTab]           = useState('Semana')
  const [rutinas,       setRutinas]       = useState(getRutinas)
  const [weekPlan,      setWeekPlan]      = useState(getWeekPlan)
  const [editingRutina, setEditingRutina] = useState(null)
  const [showNewRutina, setShowNewRutina] = useState(false)
  const [newForm,       setNewForm]       = useState({ name: '' })
  const [assignDay,     setAssignDay]     = useState(null)
  const [unit,          setUnit]          = useState(getGymUnit)

  const toggleUnit = () => {
    const next = unit === 'kg' ? 'lbs' : 'kg'
    setUnit(next); saveGymUnit(next)
  }

  const {
    session, currentWeight, setCurrentWeight,
    sessionDone, showFeeling, setShowFeeling,
    flash, prFlash, history, setHistory,
    restSecs, updateRestSecs,
    alarmActive, silenceAlarm,
    currentEx, totalSeries, doneSeries,
    startSession, completeSet, skipRest, startExtraRest,
    saveFeelingAndFinish, abortSession,
  } = useGymSession()
  const [selectedSession,  setSelectedSession]  = useState(null)
  const [showRestConfig,   setShowRestConfig]   = useState(false)
  const [showAbortConfirm, setShowAbortConfirm] = useState(false)

  // Refs para manipular el DOM directamente — sin re-renders de React al minimizar
  const overlayRef = useRef(null)
  const pillRef    = useRef(null)

  const handleMinimize = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.style.opacity = '0'
      overlayRef.current.style.pointerEvents = 'none'
      overlayRef.current.style.transform = 'scale(0.96) translateY(20px)'
    }
    if (pillRef.current) {
      pillRef.current.style.opacity = '1'
      pillRef.current.style.pointerEvents = 'all'
      pillRef.current.style.transform = 'translateY(0)'
    }
    setGymMinimized(true)
  }, [])

  const handleExpand = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.style.opacity = '1'
      overlayRef.current.style.pointerEvents = 'all'
      overlayRef.current.style.transform = 'scale(1) translateY(0)'
    }
    if (pillRef.current) {
      pillRef.current.style.opacity = '0'
      pillRef.current.style.pointerEvents = 'none'
      pillRef.current.style.transform = 'translateY(80px)'
    }
    setGymMinimized(false)
  }, [])

  // ── Week plan helpers ───────────────────────────────────────────────────────
  const persistPlan = p => { setWeekPlan(p); saveWeekPlan(p) }
  const assignToDay = (dayKey, value) => persistPlan({ ...weekPlan, [dayKey]: value })
  const clearDay    = dayKey => { const p = { ...weekPlan }; delete p[dayKey]; persistPlan(p) }

  // ── Rutinas helpers ─────────────────────────────────────────────────────────
  const persistRutinas = r => { setRutinas(r); saveRutinas(r) }
  const addRutina = () => {
    if (!newForm.name.trim()) return
    persistRutinas([...rutinas, { id: uid(), name: newForm.name.trim(), muscleGroups: [] }])
    setShowNewRutina(false); setNewForm({ name: '' })
  }
  const updateRutina = updated => { persistRutinas(rutinas.map(r => r.id===updated.id?updated:r)); setEditingRutina(updated) }
  const deleteRutina = id => {
    persistRutinas(rutinas.filter(r => r.id!==id))
    // Remove from week plan too
    const p = { ...weekPlan }
    Object.keys(p).forEach(k => { if (p[k]===id) delete p[k] })
    persistPlan(p)
    setEditingRutina(null)
  }

  const lastWs     = currentEx ? getLastWeightsForExercise(currentEx.name) : []
  const lastWeight = lastWs[session?.setIdx] || lastWs[0] || null

  return (
    <div>
      <AmbitoHeader ambito={ambito} habits={habits} extra={
        <div className="flex items-center gap-2 ml-auto">
          {/* Rest config */}
          <button onClick={() => setShowRestConfig(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-[11px] text-lo hover:text-mid transition-colors shrink-0">
            {restSecs}s
          </button>
          {/* kg / lbs toggle */}
          <button onClick={toggleUnit}
            className="flex items-center rounded-lg overflow-hidden border border-border text-[11px] font-bold shrink-0">
            <span className="px-2.5 py-1.5 transition-all" style={unit==='kg' ? { backgroundColor:ambito.color, color:'#000' } : { color:'#555' }}>kg</span>
            <span className="px-2.5 py-1.5 transition-all" style={unit==='lbs' ? { backgroundColor:ambito.color, color:'#000' } : { color:'#555' }}>lbs</span>
          </button>
          <div className="flex gap-1 bg-[#111] rounded-lg p-0.5 whitespace-nowrap">
            {TABS.map(t => (
              <button key={t} onClick={() => { setTab(t); setEditingRutina(null) }}
                className="text-[12px] px-3 py-1 rounded-md transition-all"
                style={tab===t ? { backgroundColor:ambito.color+'22', color:ambito.color, fontWeight:600 } : { color:'#555' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      }/>

      <div className="p-3 md:p-5">

        {/* ── SEMANA ─────────────────────────────────────────────────────────── */}
        {tab === 'Semana' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-semibold text-hi">Mi semana</h2>
                <p className="text-[11px] text-lo">
                  {WEEK_DAYS.filter(d => weekPlan[d.key] && weekPlan[d.key] !== 'rest').length} días de entreno ·{' '}
                  {WEEK_DAYS.filter(d => weekPlan[d.key] === 'rest').length} de descanso
                </p>
              </div>
            </div>

            {/* 7-day calendar strip */}
            <div className="overflow-x-auto -mx-5 px-5 pb-2">
              <div className="flex gap-2.5" style={{ minWidth: 1060 }}>
                {WEEK_DAYS.map(d => {
                  const val     = weekPlan[d.key]
                  const rutina  = val && val !== 'rest' ? rutinas.find(r => r.id === val) : null
                  const isRest  = val === 'rest'
                  return (
                    <DayColumn
                      key={d.key}
                      day={d}
                      rutina={rutina}
                      isRest={isRest}
                      isToday={d.key === TODAY_KEY}
                      ambito={ambito}
                      onAssign={() => setAssignDay(d.key)}
                      onStart={rutina ? () => startSession(rutina) : null}
                    />
                  )
                })}
              </div>
            </div>

            {rutinas.length === 0 && (
              <div className="mt-4 card py-8 text-center">
                <p className="text-[13px] text-lo mb-2">Primero crea tus rutinas en la pestaña <strong className="text-hi">Rutinas</strong>.</p>
                <button onClick={() => setTab('Rutinas')} className="btn-primary text-[12px]">Ir a Rutinas</button>
              </div>
            )}
          </div>
        )}

        {/* ── RUTINAS ────────────────────────────────────────────────────────── */}
        {tab === 'Rutinas' && (
          editingRutina ? (
            <RutinaDetail
              rutina={editingRutina}
              onChange={updateRutina}
              onBack={() => setEditingRutina(null)}
              onDelete={() => deleteRutina(editingRutina.id)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-hi">Plantillas de rutina</h2>
                  <p className="text-[11px] text-lo">Configura y asígnalas a días de la semana</p>
                </div>
                <button onClick={() => setShowNewRutina(true)}
                  className="btn-primary flex items-center gap-1.5 text-[12px]">
                  <Plus size={13} weight="bold"/> Nueva rutina
                </button>
              </div>

              {rutinas.length === 0 && (
                <div className="card py-14 text-center">
                  <Barbell size={40} className="mx-auto mb-3 opacity-20" style={{ color:ambito.color }}/>
                  <p className="text-[13px] text-lo">Sin rutinas aún.</p>
                  <p className="text-[12px] text-lo mt-1">Crea una y asígnala a los días que quieras.</p>
                </div>
              )}

              <div className="space-y-2">
                {rutinas.map(r => {
                  const totalEx = r.muscleGroups.reduce((a,g)=>a+g.exercises.length, 0)
                  const assignedDays = WEEK_DAYS.filter(d => weekPlan[d.key] === r.id).map(d => d.short)
                  return (
                    <div key={r.id} className="card flex items-center gap-3 hover:border-border-2 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-hi">{r.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-lo">{totalEx} ejercicios</span>
                          {assignedDays.length > 0 && (
                            <div className="flex gap-1">
                              {assignedDays.map(d => (
                                <span key={d} className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor:ambito.color+'20', color:ambito.color }}>
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setEditingRutina(r)}
                          className="text-[11px] px-3 py-1.5 rounded-lg text-lo hover:text-mid border border-border hover:border-border-2 transition-colors">
                          Editar
                        </button>
                        <button onClick={() => startSession(r)} disabled={totalEx===0}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                          style={totalEx>0 ? { backgroundColor:ambito.color, color:'#000' } : { backgroundColor:'#1a1a1a', color:'#333', cursor:'not-allowed' }}>
                          <Play size={11} weight="fill"/> Iniciar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )
        )}

        {/* ── CALENDARIO ─────────────────────────────────────────────────────── */}
        {tab === 'Calendario' && (
          <GymCalendario
            rutinas={rutinas}
            weekPlan={weekPlan}
            sessions={history}
            unit={unit}
            ambito={ambito}
            onStart={startSession}
          />
        )}

        {/* ── HISTORIAL ──────────────────────────────────────────────────────── */}
        {tab === 'Historial' && (
          <div>
            <h2 className="text-[15px] font-semibold text-hi mb-4">Historial</h2>
            {history.length === 0 && <div className="card py-10 text-center text-lo text-[13px]">Aún no hay sesiones.</div>}
            <div className="space-y-2">
              {history.map(s => {
                const vol   = s.exercises?.reduce((a,e)=>a+(e.sets||[]).reduce((b,st)=>b+(Number(st.weight)*Number(st.reps)||0),0),0)||0
                const mood  = s.feeling ? MOODS[s.feeling.mood] : null
                const muscles = [...new Set(s.exercises?.map(e=>e.muscle)||[])]
                return (
                  <button key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className="card w-full text-left hover:border-border-2 transition-all group active:scale-[0.99]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold text-hi">{s.rutinaName}</p>
                        <p className="text-[11px] text-lo mt-0.5">{s.date} · {fmt(s.duration||0)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {mood && <span className="text-[18px]">{mood.emoji}</span>}
                        {vol > 0 && <span className="text-[12px] font-mono font-bold" style={{ color:ambito.color }}>{vol}{unit}</span>}
                        <span className="text-lo opacity-0 group-hover:opacity-100 transition-all text-[11px]">→</span>
                      </div>
                    </div>
                    {/* Muscle chips */}
                    <div className="flex gap-1 flex-wrap mt-2">
                      {muscles.map(m => (
                        <span key={m} className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                          style={{ backgroundColor:muscleColor(m)+'20', color:muscleColor(m) }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Asignar día ────────────────────────────────────────────────── */}
      {assignDay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setAssignDay(null)}>
          <div className="bg-card border border-border-2 rounded-2xl p-5 w-[360px] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-hi mb-1 text-[15px]">
              {WEEK_DAYS.find(d=>d.key===assignDay)?.label}
            </h3>
            <p className="text-[12px] text-lo mb-4">¿Qué va este día?</p>
            <div className="space-y-2">
              {/* Descanso */}
              <button
                onClick={() => { assignToDay(assignDay,'rest'); setAssignDay(null) }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
                style={{ borderColor: weekPlan[assignDay]==='rest' ? '#5b84e880' : '#1e1e1e',
                  backgroundColor: weekPlan[assignDay]==='rest' ? '#5b84e810' : 'transparent' }}>
                <Moon size={18} style={{ color:'#3a3a3a' }} weight="fill"/>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-hi">Día de descanso</p>
                  <p className="text-[11px] text-lo">Recuperación activa</p>
                </div>
              </button>
              {/* Rutinas */}
              {rutinas.map(r => {
                const sel = weekPlan[assignDay] === r.id
                return (
                  <button key={r.id}
                    onClick={() => { assignToDay(assignDay, r.id); setAssignDay(null) }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left"
                    style={{ borderColor: sel ? ambito.color+'60' : '#1e1e1e',
                      backgroundColor: sel ? ambito.color+'10' : 'transparent' }}>
                    <Barbell size={18} style={{ color: sel ? ambito.color : '#444' }}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-hi">{r.name}</p>
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        {r.muscleGroups.map(g => (
                          <span key={g.id} className="text-[9px] px-1 py-0.5 rounded"
                            style={{ backgroundColor:muscleColor(g.name)+'20', color:muscleColor(g.name) }}>
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                )
              })}
              {weekPlan[assignDay] && (
                <button onClick={() => { clearDay(assignDay); setAssignDay(null) }}
                  className="w-full text-[12px] text-red-400/60 hover:text-red-400 py-2 transition-colors">
                  Quitar asignación
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Nueva rutina ───────────────────────────────────────────────── */}
      {showNewRutina && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowNewRutina(false)}>
          <div className="bg-card border border-border-2 rounded-2xl p-6 w-[360px] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-hi mb-4 text-[15px]">Nueva rutina</h3>
            <span className="field-label">Nombre</span>
            <input className="field-input mt-1" placeholder="Push Day, Piernas, Full Body..."
              value={newForm.name} onChange={e => setNewForm({ name:e.target.value })}
              onKeyDown={e => e.key==='Enter' && addRutina()} autoFocus/>
            <div className="flex gap-2 mt-4">
              <button className="btn-ghost flex-1" onClick={() => setShowNewRutina(false)}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={addRutina}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sesión activa: portal fuera de ambito-animate para evitar CSS conflicts ── */}
      {session && !sessionDone && createPortal(
        <>
          <div ref={overlayRef} className="fixed inset-x-0 bottom-0 top-14 md:top-0 md:left-52 z-[60] flex flex-col bg-bg gym-overlay-panel">

            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
              <div>
                <p className="text-[13px] font-bold text-hi">{session.rutinaName}</p>
                <p className="text-[11px] text-lo">{[...new Set(session.flat.map(e=>e.muscle))].join(' · ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleMinimize}
                  className="p-2 rounded-xl text-lo hover:text-mid hover:bg-white/5 transition-all">
                  <ArrowsIn size={15}/>
                </button>
                <button onClick={() => setShowAbortConfirm(true)}
                  className="p-2 rounded-xl text-lo hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <X size={15}/>
                </button>
              </div>
            </div>

            {/* Timer + progress */}
            <SessionTimerDisplay color={ambito.color} doneSeries={doneSeries} totalSeries={totalSeries}/>

            {/* Exercise card */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {currentEx && (
                <div className="rounded-2xl overflow-hidden transition-all duration-400"
                  style={{ border:`1px solid ${currentEx.muscleColor}40`,
                    backgroundColor: flash ? currentEx.muscleColor+'18' : currentEx.muscleColor+'08',
                    boxShadow: flash ? `0 0 40px ${currentEx.muscleColor}30` : 'none' }}>
                  <div className="px-5 py-3 border-b" style={{ borderColor:currentEx.muscleColor+'30', backgroundColor:currentEx.muscleColor+'12' }}>
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color:currentEx.muscleColor }}>{currentEx.muscle}</span>
                  </div>
                  <div className="px-5 py-5">
                    <h2 className="text-[24px] font-black text-hi mb-1">{currentEx.name}</h2>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[13px] font-semibold" style={{ color:currentEx.muscleColor }}>Serie {session.setIdx+1} de {currentEx.totalSets}</span>
                      <span className="text-[13px] text-lo">·</span>
                      <span className="text-[13px] text-lo">{currentEx.repsTarget} reps</span>
                    </div>
                    <div className="flex gap-2 mb-5">
                      {Array.from({ length:currentEx.totalSets }).map((_,i) => (
                        <div key={i} className="h-2 flex-1 rounded-full transition-all duration-300"
                          style={{ backgroundColor: i<session.setIdx ? currentEx.muscleColor : i===session.setIdx ? currentEx.muscleColor+'60' : '#2a2a2a' }}/>
                      ))}
                    </div>
                    {lastWeight > 0 && (
                      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
                        style={{ backgroundColor:'#ffd70012', border:'1px solid #ffd70025' }}>
                        <Lightning size={14} color="#ffd700" weight="fill"/>
                        <span className="text-[12px]" style={{ color:'#ffd700cc' }}>
                          Última vez: <strong>{lastWeight} {unit}</strong> en esta serie
                        </span>
                      </div>
                    )}
                    <div className="mb-5">
                      <span className="field-label">Peso ({unit})</span>
                      <div className="flex items-center gap-3 mt-1">
                        <button onClick={() => setCurrentWeight(w => String(Math.max(0,(Number(w)||0)-2.5)))}
                          className="w-10 h-10 rounded-xl text-[18px] font-bold flex items-center justify-center"
                          style={{ backgroundColor:'#1e1e1e', color:'#666', border:'1px solid #2a2a2a' }}>−</button>
                        <input type="number" min={0} step={2.5} className="field-input flex-1 text-center text-[22px] font-bold font-mono h-12"
                          placeholder="0" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)}
                          onKeyDown={e => e.key==='Enter' && completeSet()}
                          style={{ color:currentEx.muscleColor }}/>
                        <button onClick={() => setCurrentWeight(w => String((Number(w)||0)+2.5))}
                          className="w-10 h-10 rounded-xl text-[18px] font-bold flex items-center justify-center"
                          style={{ backgroundColor:'#1e1e1e', color:'#666', border:'1px solid #2a2a2a' }}>+</button>
                      </div>
                    </div>
                    <button onClick={completeSet}
                      className="w-full py-4 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={{ backgroundColor:currentEx.muscleColor, color:'#000', boxShadow:`0 4px 20px ${currentEx.muscleColor}50` }}>
                      <CheckFat size={16} weight="bold"/>
                      {session.setIdx+1 < currentEx.totalSets ? `Completar serie ${session.setIdx+1}` : session.exIdx+1 < session.flat.length ? 'Completar · Siguiente →' : '¡Terminar rutina!'}
                    </button>
                  </div>
                </div>
              )}
              {/* Siguiente */}
              {(() => {
                const next = []
                if (session.setIdx+1 < currentEx?.totalSets)
                  next.push({ label:`Serie ${session.setIdx+2}/${currentEx.totalSets}`, name:currentEx.name, color:currentEx.muscleColor })
                for (let i=session.exIdx+1; i<Math.min(session.exIdx+4,session.flat.length); i++) {
                  const e=session.flat[i]
                  next.push({ label:`${e.totalSets}×${e.repsTarget}`, name:e.name, color:e.muscleColor })
                }
                if (!next.length) return null
                return (
                  <div className="mt-4">
                    <p className="text-[11px] text-lo uppercase tracking-wider mb-2">A continuación</p>
                    <div className="space-y-1">
                      {next.map((n,i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0d0d0d]" style={{ opacity:1-i*0.2 }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor:n.color }}/>
                          <span className="text-[12px] text-mid flex-1">{n.name}</span>
                          <span className="text-[11px] font-mono" style={{ color:n.color+'99' }}>{n.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* PR flash banner */}
          {prFlash && (
            <div className="fixed top-4 left-4 right-4 z-[70] flex items-center gap-3 px-5 py-3 rounded-2xl transition-all"
              style={{ background:'linear-gradient(135deg,#ffd70020,#ffa50015)', border:'1px solid #ffd70060', boxShadow:'0 0 30px #ffd70030' }}>
              <Trophy size={22} color="#ffd700" weight="fill"/>
              <div>
                <p className="text-[13px] font-black" style={{ color:'#ffd700' }}>¡Nuevo récord personal!</p>
                <p className="text-[11px]" style={{ color:'#ffd70099' }}>{prFlash.name} · {prFlash.weight} {unit}</p>
              </div>
            </div>
          )}

          {/* Pill minimizada */}
          <div ref={pillRef} className="gym-pill-panel">
            <SessionPillFromContext currentEx={currentEx} setIdx={session.setIdx} color={ambito.color} onExpand={handleExpand}/>
          </div>
        </>,
        document.body
      )}

      {/* ── Modal: Detalle de sesión ─────────────────────────────────────────── */}
      {selectedSession && (() => {
        const s     = selectedSession
        const vol   = s.exercises?.reduce((a,e)=>a+(e.sets||[]).reduce((b,st)=>b+(Number(st.weight)*Number(st.reps)||0),0),0)||0
        const mood  = s.feeling ? MOODS[s.feeling.mood] : null
        const byMuscle = {}
        s.exercises?.forEach(ex => {
          const v = (ex.sets||[]).reduce((a,st)=>a+(Number(st.weight)*Number(st.reps)||0),0)
          if (v > 0) byMuscle[ex.muscle] = (byMuscle[ex.muscle]||0) + v
        })
        const muscleEntries = Object.entries(byMuscle).sort((a,b)=>b[1]-a[1])
        const maxVol = muscleEntries[0]?.[1] || 1

        return (
          <div className="fixed inset-0 bg-black/75 z-50 flex items-end justify-center backdrop-blur-sm"
            onClick={() => setSelectedSession(null)}>
            <div className="bg-card border border-border-2 rounded-t-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
              style={{ borderTop:`3px solid ${ambito.color}` }}
              onClick={e => e.stopPropagation()}>

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/10"/>
              </div>

              {/* Header */}
              <div className="px-5 pt-2 pb-4 border-b border-border shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-[17px] font-black text-hi">{s.rutinaName}</h2>
                    <p className="text-[12px] text-lo mt-0.5">{s.date}</p>
                  </div>
                  <button onClick={() => setSelectedSession(null)}
                    className="p-1.5 rounded-xl text-lo hover:text-mid hover:bg-white/5 transition-all">
                    <X size={16}/>
                  </button>
                </div>

                {/* Stats row */}
                <div className="flex gap-2 mt-3">
                  {[
                    { label:'Duración',  val: fmt(s.duration||0) },
                    { label:'Volumen',   val: vol>0 ? `${vol}${unit}` : '—' },
                    { label:'Descanso',  val: s.restTime>0 ? fmt(s.restTime) : '—' },
                  ].map(st => (
                    <div key={st.label} className="flex-1 rounded-xl p-2.5 text-center"
                      style={{ backgroundColor:ambito.color+'10', border:`1px solid ${ambito.color}20` }}>
                      <p className="text-[9px] text-lo uppercase tracking-wider">{st.label}</p>
                      <p className="text-[14px] font-bold font-mono mt-0.5" style={{ color:ambito.color }}>{st.val}</p>
                    </div>
                  ))}
                  {mood && (
                    <div className="flex-1 rounded-xl p-2.5 text-center"
                      style={{ backgroundColor:mood.color+'10', border:`1px solid ${mood.color}20` }}>
                      <p className="text-[9px] text-lo uppercase tracking-wider">Feeling</p>
                      <p className="text-[20px] leading-none mt-0.5">{mood.emoji}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

                {/* Feeling note */}
                {s.feeling?.notes && (
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor:mood?.color+'10', border:`1px solid ${mood?.color}20` }}>
                    <p className="text-[11px] font-semibold mb-1" style={{ color:mood?.color }}>
                      {mood?.emoji} {mood?.label}
                    </p>
                    <div className="flex gap-0.5 mb-1.5">
                      {[1,2,3,4,5].map(n=>(
                        <span key={n} className="text-[12px]" style={{ opacity:n<=s.feeling.energy?1:0.2 }}>⚡</span>
                      ))}
                    </div>
                    <p className="text-[12px] text-lo italic">"{s.feeling.notes}"</p>
                  </div>
                )}
                {s.feeling && !s.feeling.notes && mood && (
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ backgroundColor:mood.color+'10', border:`1px solid ${mood.color}20` }}>
                    <span className="text-[24px]">{mood.emoji}</span>
                    <div>
                      <p className="text-[12px] font-semibold" style={{ color:mood.color }}>{mood.label}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(n=>(
                          <span key={n} className="text-[11px]" style={{ opacity:n<=s.feeling.energy?1:0.2 }}>⚡</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Volume by muscle */}
                {muscleEntries.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-lo uppercase tracking-wider mb-2">Volumen por músculo</p>
                    <div className="space-y-2">
                      {muscleEntries.map(([muscle, v]) => {
                        const color = muscleColor(muscle)
                        return (
                          <div key={muscle} className="flex items-center gap-2">
                            <span className="text-[11px] w-24 shrink-0 font-medium" style={{ color }}>{muscle}</span>
                            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                              <div className="h-full rounded-full"
                                style={{ width:`${(v/maxVol)*100}%`, backgroundColor:color, boxShadow:`0 0 6px ${color}60`, transition:'width 0.5s' }}/>
                            </div>
                            <span className="text-[11px] font-mono text-lo shrink-0 w-16 text-right">{v}{unit}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Exercises detail */}
                <div>
                  <p className="text-[11px] font-semibold text-lo uppercase tracking-wider mb-2">Ejercicios</p>
                  <div className="space-y-2">
                    {s.exercises?.map(ex => {
                      const color   = muscleColor(ex.muscle)
                      const exVol   = (ex.sets||[]).reduce((a,st)=>a+(Number(st.weight)*Number(st.reps)||0),0)
                      const maxW    = Math.max(0, ...(ex.sets||[]).map(st=>Number(st.weight)||0))
                      return (
                        <div key={ex.id} className="rounded-xl overflow-hidden"
                          style={{ border:`1px solid ${color}25` }}>
                          {/* Exercise header */}
                          <div className="flex items-center justify-between px-3 py-2"
                            style={{ backgroundColor:color+'12', borderBottom:`1px solid ${color}20` }}>
                            <div>
                              <span className="text-[13px] font-bold" style={{ color }}>{ex.name}</span>
                              <span className="text-[10px] text-lo ml-2">{ex.muscle}</span>
                            </div>
                            <div className="flex items-center gap-2 text-right">
                              {maxW > 0 && <span className="text-[11px] font-mono font-bold" style={{ color }}>{maxW}{unit} max</span>}
                              {exVol > 0 && <span className="text-[10px] text-lo">{exVol}{unit} vol</span>}
                            </div>
                          </div>
                          {/* Sets */}
                          <div className="px-3 py-2 flex gap-2 flex-wrap">
                            {(ex.sets||[]).map((st,i) => (
                              <div key={i} className="flex flex-col items-center px-2.5 py-1.5 rounded-lg"
                                style={{ backgroundColor:color+'12', border:`1px solid ${color}25` }}>
                                <span className="text-[9px] text-lo">S{i+1}</span>
                                <span className="text-[13px] font-bold font-mono" style={{ color }}>
                                  {st.weight > 0 ? `${st.weight}${unit}` : '—'}
                                </span>
                                <span className="text-[10px] text-lo">×{st.reps}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Overlays de sesión — portal fuera de ambito-animate */}
      {createPortal(
        <>
          <RestOverlayFromContext
            session={session} unit={unit} color={ambito.color}
            alarmActive={alarmActive} silenceAlarm={silenceAlarm}
            skipRest={skipRest} startExtraRest={startExtraRest}
          />
          {session && sessionDone && showFeeling && (
            <FeelingScreenFromContext session={session} unit={unit} onSubmit={saveFeelingAndFinish}/>
          )}
          {session && sessionDone && !showFeeling && (
            <SessionCompleteFromContext session={session} unit={unit} onClose={abortSession}/>
          )}
          {showRestConfig && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
              onClick={() => setShowRestConfig(false)}>
              <div className="bg-card border border-border-2 rounded-2xl p-6 w-[320px] shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <h3 className="font-semibold text-hi mb-1 text-[15px]">Tiempo de descanso</h3>
                <p className="text-[12px] text-lo mb-4">Entre series</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[30,60,90,120,150,180,240,300].map(s => (
                    <button key={s} onClick={() => updateRestSecs(s)}
                      className="py-2.5 rounded-xl text-[12px] font-bold transition-all"
                      style={restSecs===s
                        ? { backgroundColor:ambito.color, color:'#000' }
                        : { backgroundColor:'#111', border:'1px solid #242424', color:'#666' }}>
                      {s < 60 ? `${s}s` : s%60===0 ? `${s/60}min` : `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}
                    </button>
                  ))}
                </div>
                <div className="mb-4">
                  <p className="field-label mb-1">Tiempo personalizado</p>
                  <div className="flex gap-2">
                    <input type="number" min={5} max={600} placeholder="ej: 75"
                      className="field-input flex-1 text-center"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const v = Math.max(5, Math.min(600, Number(e.target.value)))
                          if (v) { updateRestSecs(v); e.target.value = '' }
                        }
                      }}/>
                    <span className="flex items-center text-[12px] text-lo">seg</span>
                  </div>
                  <p className="text-[11px] text-lo mt-1">Escribe los segundos y presiona Enter</p>
                </div>
                <button className="btn-primary w-full" onClick={() => setShowRestConfig(false)}>Listo</button>
              </div>
            </div>
          )}
          {showAbortConfirm && (
            <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center backdrop-blur-sm px-6"
              onClick={() => setShowAbortConfirm(false)}>
              <div className="bg-card border border-border-2 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                onClick={e => e.stopPropagation()}>
                <h3 className="text-[17px] font-black text-hi mb-1">¿Abandonar sesión?</h3>
                <p className="text-[13px] text-lo mb-6">Se perderá el progreso del entreno actual.</p>
                <div className="flex gap-3">
                  <button className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-mid"
                    style={{ backgroundColor:'#1a1a1a', border:'1px solid #2a2a2a' }}
                    onClick={() => setShowAbortConfirm(false)}>
                    Cancelar
                  </button>
                  <button className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white"
                    style={{ backgroundColor:'#e05c5c' }}
                    onClick={() => { setShowAbortConfirm(false); abortSession() }}>
                    Abandonar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  )
}
