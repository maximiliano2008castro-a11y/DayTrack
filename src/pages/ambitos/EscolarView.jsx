import { useState } from 'react'
import { Plus, X, Check, CalendarBlank, BookOpen, Trash, NotePencil } from '@phosphor-icons/react'
import AmbitoHeader from '../../components/AmbitoHeader'
import {
  getHabits,
  getMaterias, addMateria, deleteMateria,
  getTasks, addTask, toggleTask, updateTask, deleteTask,
  getNotes, addNote, deleteNote,
  getSchedule, addScheduleEntry, deleteScheduleEntry,
} from '../../store'

// ── Constants ────────────────────────────────────────────────────────────────
const PRIORITIES = {
  alta:  { label: 'Alta',  color: '#e05c5c' },
  media: { label: 'Media', color: '#c9a227' },
  baja:  { label: 'Baja',  color: '#4cae8a' },
}
const DAYS_FULL  = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
const DAYS_SHORT = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const START_HOUR = 7
const END_HOUR   = 22
const HOUR_H     = 56

const PALETTE = [
  '#5b84e8', '#9575cd', '#e05c5c', '#e07c4a',
  '#4cae8a', '#c9a227', '#d4608a', '#3bafc9',
  '#a07fcf', '#7ec45a',
]

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return (h - START_HOUR) * 60 + (m || 0)
}

// ── Weekly Calendar ───────────────────────────────────────────────────────────
function WeeklyCalendar({ schedule, materias, ambito, onDelete, onAddClass }) {
  const hours    = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const totalH   = (END_HOUR - START_HOUR) * HOUR_H
  const todayDow = new Date().getDay()
  const todayIdx = todayDow === 0 ? -1 : todayDow - 1

  const colorOf = (subject) => materias.find(m => m.name === subject)?.color || '#5b84e8'

  return (
    <div className="card p-0 overflow-hidden">
      {/* Botón agregar arriba en móvil */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border md:hidden">
        <span className="text-[12px] text-lo">Horario semanal</span>
        <button onClick={onAddClass}
          className="text-[11px] flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{ backgroundColor: ambito.color + '22', color: ambito.color }}>
          <Plus size={11} /> Agregar clase
        </button>
      </div>

      {/* Scroll horizontal en móvil */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 560 }}>

      <div className="flex border-b border-border" style={{ paddingLeft: 56 }}>
        {DAYS_FULL.map((d, i) => (
          <div key={d} className="flex-1 text-center py-2.5 text-[11px] font-medium border-l border-border first:border-l-0"
            style={{ color: i === todayIdx ? ambito.color : '#666' }}>
            {d}
            {i === todayIdx && (
              <div className="w-5 h-5 rounded-full mx-auto mt-0.5 flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: ambito.color, color: '#000' }}>
                {new Date().getDate()}
              </div>
            )}
          </div>
        ))}
        <button onClick={onAddClass}
          className="hidden md:flex px-3 py-2 text-lo hover:text-mid transition-colors shrink-0 text-[11px] items-center gap-1">
          <Plus size={12} /> Clase
        </button>
      </div>

      <div className="flex overflow-y-auto" style={{ maxHeight: 460 }}>
        <div className="shrink-0" style={{ width: 56 }}>
          {hours.map(h => (
            <div key={h} style={{ height: HOUR_H, position: 'relative' }}>
              <span className="absolute -top-2 right-2 text-[10px] font-mono select-none" style={{ color: '#3a3a3a' }}>
                {String(h).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {DAYS_SHORT.map((_, dayIdx) => {
          const dayClasses = schedule.filter(c => Number(c.day) === dayIdx)
          const isToday    = dayIdx === todayIdx
          return (
            <div key={dayIdx} className="flex-1 relative border-l border-border" style={{ height: totalH }}>
              {isToday && <div className="absolute inset-0" style={{ backgroundColor: ambito.color + '06' }} />}
              {hours.map((h, i) => (
                <div key={h} className="absolute w-full border-t"
                  style={{ top: i * HOUR_H, borderColor: h % 2 === 0 ? '#222' : '#1a1a1a' }} />
              ))}
              {hours.slice(0, -1).map((h, i) => (
                <div key={h + 0.5} className="absolute w-full border-t"
                  style={{ top: i * HOUR_H + HOUR_H / 2, borderColor: '#191919', borderStyle: 'dashed' }} />
              ))}
              {dayClasses.map(c => {
                const startMins = timeToMinutes(c.startTime)
                const endMins   = timeToMinutes(c.endTime)
                const top    = (startMins / 60) * HOUR_H
                const height = Math.max(24, ((endMins - startMins) / 60) * HOUR_H)
                const color  = colorOf(c.subject)
                return (
                  <div key={c.id} className="absolute left-0.5 right-0.5 rounded-md overflow-hidden cursor-default group/ev"
                    style={{ top, height, backgroundColor: color + '25', borderLeft: `3px solid ${color}`, zIndex: 1 }}>
                    <div className="px-1.5 pt-1">
                      <p className="text-[11px] font-semibold leading-tight truncate" style={{ color }}>{c.subject}</p>
                      {height > 38 && <p className="text-[9px] leading-tight" style={{ color: color + '99' }}>{c.startTime} – {c.endTime}</p>}
                      {height > 52 && c.room && <p className="text-[9px]" style={{ color: color + '80' }}>{c.room}</p>}
                    </div>
                    <button onClick={() => onDelete(c.id)}
                      className="absolute top-0.5 right-0.5 opacity-0 group-hover/ev:opacity-100 text-white/40 hover:text-red-400 transition-all">
                      <X size={10} />
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

        </div>{/* minWidth wrapper */}
      </div>{/* overflow-x-auto */}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
const TABS = ['Materias', 'Tareas', 'Horario', 'Notas']

export default function EscolarView({ ambito }) {
  const habits = getHabits()
  const [tab,      setTab]      = useState('Materias')
  const [materias, setMaterias] = useState(getMaterias)
  const [tasks,    setTasks]    = useState(getTasks)
  const [notes,    setNotes]    = useState(getNotes)
  const [schedule, setSchedule] = useState(getSchedule)

  const [showMateria, setShowMateria] = useState(false)
  const [showTask,    setShowTask]    = useState(false)
  const [showNote,    setShowNote]    = useState(false)
  const [showClass,   setShowClass]   = useState(false)
  const [detailTask,  setDetailTask]  = useState(null)
  const [editing,     setEditing]     = useState(false)
  const [draft,       setDraft]       = useState({})

  // selected materia filter for tareas/notas
  const [filterMateria, setFilterMateria] = useState(null)

  const [materiaForm, setMateriaForm] = useState({ name: '', teacher: '', color: PALETTE[0] })
  const [taskForm,    setTaskForm]    = useState({ materiaId: '', title: '', dueDate: '', priority: 'media', notes: '' })
  const [noteForm,    setNoteForm]    = useState({ materiaId: '', title: '', content: '' })
  const [classForm,   setClassForm]   = useState({ day: 0, startTime: '08:00', endTime: '09:30', materiaId: '', room: '' })

  // Next auto color
  const nextColor = PALETTE[materias.length % PALETTE.length]

  const materiaName = (id) => materias.find(m => m.id === id)?.name || ''
  const materiaColor = (id) => materias.find(m => m.id === id)?.color || '#5b84e8'

  const filteredTasks = filterMateria
    ? tasks.filter(t => t.materiaId === filterMateria)
    : tasks
  const pending = filteredTasks.filter(t => !t.done)
  const done    = filteredTasks.filter(t => t.done)

  function openAddTask(materiaId = '') {
    setTaskForm({ materiaId, title: '', dueDate: '', priority: 'media', notes: '' })
    setShowTask(true)
  }

  return (
    <div className="min-h-screen">
      <AmbitoHeader ambito={ambito} habits={habits} extra={
        <div className="flex gap-1 bg-[#111] rounded-lg p-0.5 ml-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="text-[12px] px-3 py-1 rounded-md transition-all"
              style={tab === t
                ? { backgroundColor: ambito.color + '22', color: ambito.color, fontWeight: 600 }
                : { color: '#555' }}>
              {t}
            </button>
          ))}
        </div>
      } />

      <div className="p-3 md:p-5">

        {/* ── MATERIAS ─────────────────────────────────────────────────────── */}
        {tab === 'Materias' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[15px] font-semibold text-hi">Mis materias</h2>
                <p className="text-[11px] text-lo">{materias.length} registradas</p>
              </div>
              <button onClick={() => { setMateriaForm({ name: '', teacher: '', color: nextColor }); setShowMateria(true) }}
                className="btn-primary flex items-center gap-1.5 text-[12px]">
                <Plus size={13} weight="bold" /> Materia
              </button>
            </div>

            {materias.length === 0 && (
              <div className="card py-12 text-center">
                <BookOpen size={32} className="mx-auto mb-3 text-lo opacity-40" />
                <p className="text-[13px] text-lo">Aun no tienes materias registradas.</p>
                <p className="text-[12px] text-lo mt-1">Agrega tus clases del semestre para empezar.</p>
              </div>
            )}

            <div className="space-y-2">
              {materias.map(m => {
                const matTasks   = tasks.filter(t => t.materiaId === m.id)
                const matPending = matTasks.filter(t => !t.done).length
                return (
                  <div key={m.id} className="card flex items-center gap-3 group hover:border-border-2 transition-colors">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-hi">{m.name}</p>
                      {m.teacher && <p className="text-[11px] text-lo">{m.teacher}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {matPending > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: m.color + '20', color: m.color }}>
                          {matPending} tarea{matPending > 1 ? 's' : ''}
                        </span>
                      )}
                      <button
                        onClick={() => { setFilterMateria(m.id); setTab('Tareas') }}
                        className="text-[11px] text-lo hover:text-mid px-2 py-1 rounded transition-colors">
                        Ver tareas
                      </button>
                      <button
                        onClick={() => openAddTask(m.id)}
                        className="text-[11px] flex items-center gap-1 px-2 py-1 rounded transition-colors"
                        style={{ color: m.color }}>
                        <Plus size={11} /> Tarea
                      </button>
                      <button onClick={() => setMaterias(deleteMateria(m.id))}
                        className="btn-icon opacity-0 group-hover:opacity-100 text-red-400">
                        <Trash size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── TAREAS ───────────────────────────────────────────────────────── */}
        {tab === 'Tareas' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-4 text-[12px]">
                <span className="text-lo"><span className="text-hi font-semibold">{pending.length}</span> pendientes</span>
                <span className="text-lo"><span className="text-hi font-semibold">{done.length}</span> entregadas</span>
              </div>
              <button onClick={() => openAddTask(filterMateria || '')}
                className="btn-primary flex items-center gap-1.5 text-[12px]">
                <Plus size={13} weight="bold" /> Tarea
              </button>
            </div>

            {/* Filtro por materia */}
            {materias.length > 0 && (
              <div className="flex gap-1.5 mb-4 flex-wrap">
                <button
                  onClick={() => setFilterMateria(null)}
                  className="text-[11px] px-3 py-1 rounded-full transition-all"
                  style={!filterMateria
                    ? { backgroundColor: ambito.color + '22', color: ambito.color, border: `1px solid ${ambito.color}44` }
                    : { backgroundColor: '#111', border: '1px solid #242424', color: '#555' }}>
                  Todas
                </button>
                {materias.map(m => (
                  <button key={m.id}
                    onClick={() => setFilterMateria(m.id)}
                    className="text-[11px] px-3 py-1 rounded-full transition-all"
                    style={filterMateria === m.id
                      ? { backgroundColor: m.color + '22', color: m.color, border: `1px solid ${m.color}44` }
                      : { backgroundColor: '#111', border: '1px solid #242424', color: '#555' }}>
                    {m.name}
                  </button>
                ))}
              </div>
            )}

            {filteredTasks.length === 0 && (
              <div className="card py-10 text-center text-lo text-[13px]">Sin tareas registradas.</div>
            )}

            <div className="space-y-2">
              {[...pending, ...done].map(t => {
                const p       = PRIORITIES[t.priority]
                const overdue = t.dueDate && new Date(t.dueDate) < new Date() && !t.done
                const color   = materiaColor(t.materiaId)
                return (
                  <div key={t.id}
                    className="card flex items-start gap-3 group hover:border-border-2 transition-colors cursor-pointer"
                    style={{ opacity: t.done ? 0.5 : 1 }}
                    onClick={() => { setDetailTask(t); setEditing(false) }}>
                    {/* Checkbox — stopPropagation para no abrir el modal */}
                    <button
                      onClick={e => { e.stopPropagation(); setTasks(toggleTask(t.id)); setDetailTask(null) }}
                      className="w-5 h-5 rounded-md shrink-0 mt-0.5 flex items-center justify-center transition-all"
                      style={t.done
                        ? { backgroundColor: ambito.color + '33', border: `1px solid ${ambito.color}66` }
                        : { border: '1.5px solid #3a3a3a' }}>
                      {t.done && <Check size={11} color={ambito.color} weight="bold" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        {t.materiaId && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: color + '20', color }}>
                            {materiaName(t.materiaId)}
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: p.color + '20', color: p.color }}>
                          {p.label}
                        </span>
                        {t.dueDate && (
                          <span className={`text-[10px] flex items-center gap-0.5 ${overdue && !t.done ? 'text-red-500/70' : 'text-lo'}`}>
                            <CalendarBlank size={9} /> {t.dueDate}
                            {overdue && !t.done && ' ⚠'}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-hi leading-snug"
                        style={{ textDecoration: t.done ? 'line-through' : 'none' }}>
                        {t.title}
                      </p>
                      {t.notes && (
                        <p className="text-[11px] text-lo mt-0.5 line-clamp-2">{t.notes}</p>
                      )}
                    </div>
                    <NotePencil size={13} className="shrink-0 mt-1 opacity-0 group-hover:opacity-40 text-lo transition-all" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── HORARIO ──────────────────────────────────────────────────────── */}
        {tab === 'Horario' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[15px] font-semibold text-hi">Horario del semestre</h2>
                <p className="text-[11px] text-lo">{schedule.length} clases registradas</p>
              </div>
              <button onClick={() => setShowClass(true)}
                className="btn-primary flex items-center gap-1.5 text-[12px]">
                <Plus size={13} weight="bold" /> Agregar clase
              </button>
            </div>
            <WeeklyCalendar
              schedule={schedule.map(c => ({
                ...c,
                subject: c.materiaId ? materiaName(c.materiaId) : (c.subject || ''),
              }))}
              materias={materias}
              ambito={ambito}
              onDelete={id => setSchedule(deleteScheduleEntry(id))}
              onAddClass={() => setShowClass(true)}
            />
          </>
        )}

        {/* ── NOTAS ────────────────────────────────────────────────────────── */}
        {tab === 'Notas' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold text-hi">Notas rapidas</h2>
              <button onClick={() => { setNoteForm({ materiaId: '', title: '', content: '' }); setShowNote(true) }}
                className="btn-primary flex items-center gap-1.5 text-[12px]">
                <Plus size={13} weight="bold" /> Nota
              </button>
            </div>
            {notes.length === 0 && <div className="card py-10 text-center text-lo text-[13px]">Sin notas aun.</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {notes.map(n => {
                const color = materiaColor(n.materiaId)
                return (
                  <div key={n.id} className="card group relative hover:border-border-2 transition-colors">
                    <button onClick={() => setNotes(deleteNote(n.id))}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all">
                      <X size={12} />
                    </button>
                    {n.materiaId && (
                      <span className="text-[10px] font-semibold mb-1.5 block px-1.5 py-0.5 rounded w-fit"
                        style={{ backgroundColor: color + '20', color }}>
                        {materiaName(n.materiaId)}
                      </span>
                    )}
                    <h3 className="text-[13px] font-medium text-hi mb-1">{n.title}</h3>
                    <p className="text-[12px] text-lo leading-relaxed whitespace-pre-wrap">{n.content}</p>
                    <p className="text-[10px] text-lo mt-2">{n.createdAt}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Nueva materia ─────────────────────────────────────────────── */}
      {showMateria && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowMateria(false)}>
          <div className="bg-card border border-border-2 rounded-2xl p-6 w-[400px] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-hi mb-4 text-[15px]">Nueva materia</h3>
            <div className="space-y-3">
              <div>
                <span className="field-label">Nombre de la materia</span>
                <input className="field-input" placeholder="Ej: Matematicas, Programacion..."
                  value={materiaForm.name} onChange={e => setMateriaForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus />
              </div>
              <div>
                <span className="field-label">Profesor (opcional)</span>
                <input className="field-input" placeholder="Nombre del profesor"
                  value={materiaForm.teacher} onChange={e => setMateriaForm(f => ({ ...f, teacher: e.target.value }))} />
              </div>
              <div>
                <span className="field-label">Color</span>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {PALETTE.map(c => (
                    <button key={c} onClick={() => setMateriaForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{
                        backgroundColor: c,
                        outline: materiaForm.color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: 2,
                        opacity: materiaForm.color === c ? 1 : 0.5,
                      }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-ghost flex-1" onClick={() => setShowMateria(false)}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={() => {
                if (materiaForm.name.trim()) {
                  setMaterias(addMateria(materiaForm))
                  setShowMateria(false)
                }
              }}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Agregar clase al horario ─────────────────────────────────── */}
      {showClass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowClass(false)}>
          <div className="bg-card border border-border-2 rounded-2xl p-6 w-[420px] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-hi mb-4 text-[15px]">Agregar clase al horario</h3>
            {materias.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[13px] text-lo mb-3">Primero registra tus materias.</p>
                <button className="btn-primary text-[12px]" onClick={() => { setShowClass(false); setTab('Materias') }}>
                  Ir a Materias
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <span className="field-label">Materia</span>
                    <select className="field-input" value={classForm.materiaId}
                      onChange={e => setClassForm(f => ({ ...f, materiaId: e.target.value }))}>
                      <option value="">Selecciona una materia...</option>
                      {materias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="field-label">Dia</span>
                    <div className="flex gap-1.5 mt-1">
                      {DAYS_SHORT.map((d, i) => (
                        <button key={d} onClick={() => setClassForm(f => ({ ...f, day: i }))}
                          className="flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                          style={classForm.day === i
                            ? { backgroundColor: ambito.color + '22', color: ambito.color, border: `1px solid ${ambito.color}44` }
                            : { backgroundColor: '#111', border: '1px solid #242424', color: '#666' }}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="field-label">Hora inicio</span>
                      <input type="time" className="field-input" value={classForm.startTime}
                        onChange={e => setClassForm(f => ({ ...f, startTime: e.target.value }))} />
                    </div>
                    <div>
                      <span className="field-label">Hora fin</span>
                      <input type="time" className="field-input" value={classForm.endTime}
                        onChange={e => setClassForm(f => ({ ...f, endTime: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <span className="field-label">Salon / Aula (opcional)</span>
                    <input className="field-input" placeholder="Ej: A-301" value={classForm.room}
                      onChange={e => setClassForm(f => ({ ...f, room: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button className="btn-ghost flex-1" onClick={() => setShowClass(false)}>Cancelar</button>
                  <button className="btn-primary flex-1" onClick={() => {
                    if (classForm.materiaId) {
                      setSchedule(addScheduleEntry(classForm))
                      setClassForm({ day: 0, startTime: '08:00', endTime: '09:30', materiaId: '', room: '' })
                      setShowClass(false)
                    }
                  }}>Agregar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Nueva tarea ───────────────────────────────────────────────── */}
      {showTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowTask(false)}>
          <div className="bg-card border border-border-2 rounded-2xl p-6 w-[400px] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-hi mb-4 text-[15px]">Nueva tarea</h3>
            <div className="space-y-3">
              <div>
                <span className="field-label">Materia</span>
                <select className="field-input" value={taskForm.materiaId}
                  onChange={e => setTaskForm(f => ({ ...f, materiaId: e.target.value }))}>
                  <option value="">Sin materia</option>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <span className="field-label">Descripcion</span>
                <input className="field-input" placeholder="Que hay que entregar" autoFocus
                  value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && taskForm.title.trim()) {
                      setTasks(addTask(taskForm))
                      setTaskForm({ materiaId: '', title: '', dueDate: '', priority: 'media', notes: '' })
                      setShowTask(false)
                    }
                  }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="field-label">Fecha limite</span>
                  <input type="date" className="field-input" value={taskForm.dueDate}
                    onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div>
                  <span className="field-label">Prioridad</span>
                  <select className="field-input" value={taskForm.priority}
                    onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                    {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <span className="field-label">Notas</span>
                <textarea className="field-input h-28 resize-none" placeholder="Instrucciones, detalles, referencias..."
                  value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-ghost flex-1" onClick={() => setShowTask(false)}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={() => {
                if (taskForm.title.trim()) {
                  setTasks(addTask(taskForm))
                  setTaskForm({ materiaId: '', title: '', dueDate: '', priority: 'media', notes: '' })
                  setShowTask(false)
                }
              }}>Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Detalle / Edición de tarea ──────────────────────────────── */}
      {detailTask && (() => {
        const t      = tasks.find(x => x.id === detailTask.id) || detailTask
        const p      = PRIORITIES[t.priority]
        const color  = materiaColor(t.materiaId)
        const overdue = t.dueDate && new Date(t.dueDate) < new Date() && !t.done

        const closeModal = () => { setDetailTask(null); setEditing(false) }
        const startEdit  = () => setDraft({ title: t.title, materiaId: t.materiaId, dueDate: t.dueDate, priority: t.priority, notes: t.notes || '' })
        const saveEdit   = () => {
          if (!draft.title?.trim()) return
          const updated = updateTask(t.id, draft)
          setTasks(updated)
          setDetailTask(updated.find(x => x.id === t.id))
          setEditing(false)
        }

        const accentColor = t.materiaId ? color : ambito.color

        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={closeModal}>
            <div className="bg-card border border-border-2 rounded-2xl w-[500px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>

              {/* Barra de color superior */}
              <div style={{ height: 3, backgroundColor: accentColor, flexShrink: 0 }} />

              {/* Header */}
              <div className="px-6 pt-5 pb-4 border-b border-border flex items-start gap-3 shrink-0">
                <button
                  onClick={() => { const u = updateTask(t.id, { done: !t.done }); setTasks(u); setDetailTask(u.find(x => x.id === t.id)) }}
                  className="w-6 h-6 rounded-md shrink-0 mt-0.5 flex items-center justify-center transition-all"
                  style={t.done
                    ? { backgroundColor: ambito.color + '33', border: `1px solid ${ambito.color}66` }
                    : { border: '1.5px solid #3a3a3a' }}>
                  {t.done && <Check size={13} color={ambito.color} weight="bold" />}
                </button>

                {editing ? (
                  <input
                    className="field-input flex-1 text-[15px] font-semibold"
                    value={draft.title}
                    onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                    autoFocus
                  />
                ) : (
                  <p className="flex-1 text-[16px] font-semibold text-hi leading-snug pt-0.5"
                    style={{ textDecoration: t.done ? 'line-through' : 'none', opacity: t.done ? 0.6 : 1 }}>
                    {t.title}
                  </p>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  {!editing && (
                    <button onClick={() => { setEditing(true); startEdit() }}
                      className="p-1.5 rounded-lg text-lo hover:text-mid hover:bg-white/5 transition-all">
                      <NotePencil size={15} />
                    </button>
                  )}
                  <button onClick={closeModal}
                    className="p-1.5 rounded-lg text-lo hover:text-mid hover:bg-white/5 transition-all">
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Cuerpo scrollable */}
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

                {/* Materia + prioridad + fecha */}
                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <span className="field-label">Materia</span>
                      <select className="field-input" value={draft.materiaId}
                        onChange={e => setDraft(d => ({ ...d, materiaId: e.target.value }))}>
                        <option value="">Sin materia</option>
                        {materias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="field-label">Fecha límite</span>
                        <input type="date" className="field-input" value={draft.dueDate}
                          onChange={e => setDraft(d => ({ ...d, dueDate: e.target.value }))} />
                      </div>
                      <div>
                        <span className="field-label">Prioridad</span>
                        <select className="field-input" value={draft.priority}
                          onChange={e => setDraft(d => ({ ...d, priority: e.target.value }))}>
                          {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {t.materiaId && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: color + '20', color }}>
                        {materiaName(t.materiaId)}
                      </span>
                    )}
                    <span className="text-[11px] px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: p.color + '20', color: p.color }}>
                      {p.label} prioridad
                    </span>
                    {t.dueDate && (
                      <span className={`text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 ${overdue && !t.done ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-lo'}`}>
                        <CalendarBlank size={11} />
                        {overdue && !t.done ? 'Vencida: ' : 'Entrega: '}{t.dueDate}
                      </span>
                    )}
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-lo">
                      Creada: {t.createdAt}
                    </span>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <span className="text-[11px] font-semibold text-lo uppercase tracking-wider block mb-2">Notas</span>
                  {editing ? (
                    <textarea
                      className="field-input resize-none w-full"
                      style={{ minHeight: 140 }}
                      placeholder="Instrucciones, referencias, links..."
                      value={draft.notes}
                      onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                    />
                  ) : (
                    <div className="min-h-[60px]">
                      {t.notes
                        ? <p className="text-[13px] text-mid leading-relaxed whitespace-pre-wrap">{t.notes}</p>
                        : <p className="text-[12px] text-lo italic">Sin notas.</p>
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
                <button onClick={() => { setTasks(deleteTask(t.id)); closeModal() }}
                  className="flex items-center gap-1.5 text-[12px] text-red-400/60 hover:text-red-400 transition-colors">
                  <Trash size={13} /> Eliminar
                </button>
                {editing ? (
                  <div className="flex gap-2">
                    <button className="btn-ghost text-[12px]" onClick={() => setEditing(false)}>Cancelar</button>
                    <button className="btn-primary text-[12px]" onClick={saveEdit}>Guardar cambios</button>
                  </div>
                ) : (
                  <button className="btn-primary text-[12px] flex items-center gap-1.5"
                    onClick={() => { setEditing(true); startEdit() }}>
                    <NotePencil size={13} /> Editar tarea
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Modal: Nueva nota ────────────────────────────────────────────────── */}
      {showNote && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowNote(false)}>
          <div className="bg-card border border-border-2 rounded-2xl p-6 w-[400px] shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-hi mb-4 text-[15px]">Nueva nota</h3>
            <div className="space-y-3">
              <div>
                <span className="field-label">Materia</span>
                <select className="field-input" value={noteForm.materiaId}
                  onChange={e => setNoteForm(f => ({ ...f, materiaId: e.target.value }))}>
                  <option value="">Sin materia</option>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <span className="field-label">Titulo</span>
                <input className="field-input" value={noteForm.title} autoFocus
                  onChange={e => setNoteForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <span className="field-label">Contenido</span>
                <textarea className="field-input h-28 resize-none" value={noteForm.content}
                  onChange={e => setNoteForm(f => ({ ...f, content: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-ghost flex-1" onClick={() => setShowNote(false)}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={() => {
                if (noteForm.title.trim()) {
                  setNotes(addNote(noteForm))
                  setNoteForm({ materiaId: '', title: '', content: '' })
                  setShowNote(false)
                }
              }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
