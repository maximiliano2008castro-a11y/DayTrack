import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, BellSlash, X, Check } from '@phosphor-icons/react'
import { getAmbitoIcon } from '../ambitoIcons'

const today = () => new Date().toISOString().slice(0, 10)
const STORAGE_KEY = 'dt_reminders'

function loadReminders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}
function saveReminders(r) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(r))
}

function ReminderModal({ ambito, onClose }) {
  const reminders = loadReminders()
  const existing  = reminders[ambito.id]

  const [time,    setTime]    = useState(existing?.time || '08:00')
  const [days,    setDays]    = useState(existing?.days || [1,2,3,4,5])
  const [perm,    setPerm]    = useState(Notification.permission)
  const [saved,   setSaved]   = useState(false)

  const DAY_LABELS = ['D','L','M','X','J','V','S']

  const toggleDay = d => setDays(ds => ds.includes(d) ? ds.filter(x=>x!==d) : [...ds,d])

  const requestPerm = async () => {
    const r = await Notification.requestPermission()
    setPerm(r)
  }

  const handleSave = () => {
    const all = loadReminders()
    all[ambito.id] = { time, days, ambitoName: ambito.name, color: ambito.color }
    saveReminders(all)
    scheduleNext(ambito.id, time, days, ambito.name)
    setSaved(true)
    setTimeout(onClose, 900)
  }

  const handleDelete = () => {
    const all = loadReminders()
    delete all[ambito.id]
    saveReminders(all)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#111', border: '1px solid #242424' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell size={15} style={{ color: ambito.color }}/>
            <p className="text-[14px] font-semibold text-hi">Recordatorio · {ambito.name}</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={14}/></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Permiso notificaciones */}
          {perm !== 'granted' && (
            <div className="rounded-xl p-3 flex items-center gap-3"
              style={{ backgroundColor: '#c9a22712', border: '1px solid #c9a22730' }}>
              <Bell size={14} color="#c9a227"/>
              <p className="text-[11px] text-lo flex-1 leading-snug">
                Necesitas permitir notificaciones para recibir recordatorios.
              </p>
              <button onClick={requestPerm}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0"
                style={{ backgroundColor: '#c9a22722', color: '#c9a227', border: '1px solid #c9a22740' }}>
                Permitir
              </button>
            </div>
          )}

          {/* Hora */}
          <div>
            <span className="field-label">Hora del recordatorio</span>
            <input type="time" className="field-input text-center text-[18px] font-mono font-bold h-12"
              value={time} onChange={e => setTime(e.target.value)}/>
          </div>

          {/* Días */}
          <div>
            <span className="field-label">Días</span>
            <div className="flex gap-1.5 mt-1">
              {DAY_LABELS.map((l, i) => (
                <button key={i} onClick={() => toggleDay(i)}
                  className="flex-1 h-9 rounded-xl text-[11px] font-bold transition-all"
                  style={days.includes(i)
                    ? { backgroundColor: ambito.color+'22', color: ambito.color, border: `1px solid ${ambito.color}44` }
                    : { backgroundColor: '#0d0d0d', color: '#444', border: '1px solid #1a1a1a' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Info días seleccionados */}
          <p className="text-[10px] text-lo text-center">
            {days.length === 0 ? 'Selecciona al menos un día'
              : days.length === 7 ? 'Todos los días'
              : `${days.length} día${days.length > 1 ? 's' : ''} por semana`}
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          {existing && (
            <button onClick={handleDelete}
              className="btn-icon w-10 h-10 shrink-0"
              style={{ color: '#e05c5c' }}>
              <BellSlash size={15}/>
            </button>
          )}
          <button onClick={handleSave} disabled={days.length === 0}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all"
            style={days.length === 0
              ? { backgroundColor: '#1a1a1a', color: '#444' }
              : saved
                ? { backgroundColor: '#4cae8a22', color: '#4cae8a', border: '1px solid #4cae8a40' }
                : { backgroundColor: ambito.color, color: '#000' }}>
            {saved ? <><Check size={14} weight="bold"/> Guardado</> : <><Bell size={13}/> Activar recordatorio</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// Programa la siguiente notificación del día correcto
function scheduleNext(ambitoId, time, days, name) {
  if (Notification.permission !== 'granted' || !days.length) return
  const [h, m] = time.split(':').map(Number)
  const now = new Date()
  // busca el próximo día (hoy o futuro) que esté en `days`
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(now)
    candidate.setDate(now.getDate() + offset)
    candidate.setHours(h, m, 0, 0)
    if (!days.includes(candidate.getDay())) continue
    if (candidate <= now) continue
    const ms = candidate.getTime() - now.getTime()
    setTimeout(() => {
      new Notification(`DayTrack · ${name}`, {
        body: '¡Es hora de registrar tu progreso!',
        icon: '/favicon.ico',
      })
      // reprogramar para el siguiente ciclo
      scheduleNext(ambitoId, time, days, name)
    }, ms)
    break
  }
}

// Al cargar la app, reprograma los recordatorios guardados
export function initReminders() {
  if (Notification.permission !== 'granted') return
  const all = loadReminders()
  Object.entries(all).forEach(([id, r]) => {
    scheduleNext(id, r.time, r.days, r.ambitoName)
  })
}

export default function AmbitoHeader({ ambito, habits = [], extra }) {
  const todayStr = today()
  const ambitoHabits = habits.filter(h => h.ambitoId === ambito.id)
  const done = ambitoHabits.filter(h => h.completedDays.includes(todayStr)).length
  const Icon = getAmbitoIcon(ambito.id)
  const [showReminder, setShowReminder] = useState(false)

  const hasReminder = !!loadReminders()[ambito.id]

  return (
    <>
      <div className="border-b border-border px-4 py-3 flex flex-col gap-2">
        {/* Fila superior: back + ícono + título + bell */}
        <div className="flex items-center gap-3">
          <Link to="/" className="btn-icon shrink-0"><ArrowLeft size={15} /></Link>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: ambito.color + '1a' }}>
            <Icon size={16} weight="regular" style={{ color: ambito.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[16px] font-semibold text-hi leading-tight">{ambito.name}</h1>
            {ambitoHabits.length > 0 && (
              <p className="text-[10px] text-lo">Hoy: {done}/{ambitoHabits.length} hábitos</p>
            )}
          </div>
          {/* Bell button */}
          <button onClick={() => setShowReminder(true)}
            className="btn-icon shrink-0 relative"
            title="Recordatorio">
            <Bell size={15} weight={hasReminder ? 'fill' : 'regular'}
              style={{ color: hasReminder ? ambito.color : undefined }}/>
            {hasReminder && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: ambito.color }}/>
            )}
          </button>
        </div>
        {/* Fila de tabs */}
        {extra && (
          <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
            {extra}
          </div>
        )}
      </div>

      {showReminder && (
        <ReminderModal ambito={ambito} onClose={() => setShowReminder(false)}/>
      )}
    </>
  )
}
