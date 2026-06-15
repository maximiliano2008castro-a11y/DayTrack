import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, useSyncExternalStore } from 'react'
import {
  getGymSessions, addGymSession, getLastWeightsForExercise,
  getGymRestSecs, saveGymRestSecs,
  getActiveGymSession, saveActiveGymSession, clearActiveGymSession,
} from '../store'

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
const muscleColor = n => MUSCLE_GROUPS.find(m => m.name === n)?.color || '#888'
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

// ── Timer externo — FUERA de React state para no re-renderizar el árbol ───────
let _timerState = { elapsed: 0, restTimer: null, totalRestTime: 0, alarmActive: false }
let _timerSubs  = new Set()
const getTimerSnapshot = () => _timerState
const subTimer = cb => { _timerSubs.add(cb); return () => _timerSubs.delete(cb) }
const setTimer = patch => { _timerState = { ..._timerState, ...patch }; _timerSubs.forEach(cb => cb()) }

// ── Estado de minimizado — FUERA de React state para no interrumpir transiciones CSS ──
let _minimized = false
let _minSubs   = new Set()
const getMinSnapshot = () => _minimized
const subMin = cb => { _minSubs.add(cb); return () => _minSubs.delete(cb) }
export const setGymMinimized = val => { _minimized = val; _minSubs.forEach(cb => cb()) }

// Hook para componentes que leen el estado minimizado
export function useGymMinimized() {
  return useSyncExternalStore(subMin, getMinSnapshot)
}

// Hook para componentes que muestran el timer — solo ELLOS se re-renderizan cada segundo
export function useGymTimer() {
  return useSyncExternalStore(subTimer, getTimerSnapshot)
}

// ── Contexto de sesión (estable, no cambia cada segundo) ──────────────────────
const GymSessionContext = createContext(null)

export function GymSessionProvider({ children }) {
  const saved = getActiveGymSession()

  const [session,       setSession]       = useState(() => saved?.session       ?? null)
  const [currentWeight, setCurrentWeight] = useState(() => saved?.currentWeight ?? '')
  const [sessionDone,   setSessionDone]   = useState(false)
  const [showFeeling,   setShowFeeling]   = useState(false)
  const [flash,         setFlash]         = useState(false)
  const [prFlash,          setPrFlash]          = useState(null)
  const [history,          setHistory]          = useState(getGymSessions)
  const [restSecs,         setRestSecs]         = useState(getGymRestSecs)

  // Refs para leer valores actuales del timer sin crear dependencias en useCallback
  const sessionRef      = useRef(session)
  const currentWeightRef = useRef(currentWeight)
  const alarmIntervalRef = useRef(null)

  useEffect(() => { sessionRef.current = session }, [session])
  useEffect(() => { currentWeightRef.current = currentWeight }, [currentWeight])

  // Inicializa el estado externo del timer con el valor guardado
  useEffect(() => {
    if (saved?.elapsed) setTimer({ elapsed: saved.elapsed })
  }, [])

  const playAlarm = useCallback(() => {
    const beep = () => {
      try {
        const ctx  = new AudioContext()
        const play = (freq, t, dur) => {
          const osc = ctx.createOscillator(), gain = ctx.createGain()
          osc.connect(gain); gain.connect(ctx.destination)
          osc.type = 'sine'; osc.frequency.value = freq
          gain.gain.setValueAtTime(0.35, ctx.currentTime + t)
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur)
          osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + dur + 0.05)
        }
        play(880, 0, 0.12); play(880, 0.16, 0.12); play(1100, 0.36, 0.28)
      } catch(e) {}
    }
    beep()
    alarmIntervalRef.current = setInterval(beep, 1800)
    setTimer({ alarmActive: true })
  }, [])

  const silenceAlarm = useCallback(() => {
    if (alarmIntervalRef.current) { clearInterval(alarmIntervalRef.current); alarmIntervalRef.current = null }
    setTimer({ alarmActive: false })
  }, [])

  // ── Elapsed + restTimer tick — todo en un solo interval, fuera de React state ──
  useEffect(() => {
    if (!session || sessionDone) return
    const id = setInterval(() => {
      const cur = getTimerSnapshot()
      const newElapsed = cur.elapsed + 1

      let newRestTimer = cur.restTimer
      let newTotalRest = cur.totalRestTime

      if (newRestTimer) {
        if (newRestTimer.phase === 'main') {
          const newRemaining = newRestTimer.remaining - 1
          if (newRemaining <= 0) {
            newTotalRest += newRestTimer.initial
            playAlarm()
            newRestTimer = { ...newRestTimer, remaining: 0, phase: 'extra', extraElapsed: 0 }
          } else {
            newRestTimer = { ...newRestTimer, remaining: newRemaining }
          }
        } else if (newRestTimer.phase === 'extra') {
          newRestTimer = { ...newRestTimer, extraElapsed: newRestTimer.extraElapsed + 1 }
        }
      }

      setTimer({ elapsed: newElapsed, restTimer: newRestTimer, totalRestTime: newTotalRest })

      // Persist to localStorage sin tocar React state
      saveActiveGymSession({
        session: sessionRef.current,
        elapsed: newElapsed,
        currentWeight: currentWeightRef.current,
      })
    }, 1000)
    return () => clearInterval(id)
  }, [session?.rutinaId, sessionDone, playAlarm])

  // ── Acciones ──────────────────────────────────────────────────────────────────
  const startSession = useCallback(rutina => {
    const flat = []
    rutina.muscleGroups.forEach(g =>
      g.exercises.forEach(ex =>
        flat.push({ id:ex.id, name:ex.name, muscle:g.name, muscleColor:muscleColor(g.name), totalSets:Number(ex.sets)||3, repsTarget:String(ex.reps||'8') })
      )
    )
    if (!flat.length) return
    silenceAlarm()
    clearActiveGymSession()
    setTimer({ elapsed: 0, restTimer: null, totalRestTime: 0, alarmActive: false })
    setSession({ rutinaId:rutina.id, rutinaName:rutina.name, flat, logs:{}, exIdx:0, setIdx:0 })
    setCurrentWeight(''); setSessionDone(false); setGymMinimized(false)
  }, [silenceAlarm])

  const advanceToNext = useCallback((nextExIdx, nextSetIdx) => {
    setSession(s => {
      if (nextExIdx !== s.exIdx) setCurrentWeight('')
      return { ...s, exIdx: nextExIdx, setIdx: nextSetIdx }
    })
  }, [])

  const completeSet = useCallback(() => {
    const s = sessionRef.current
    if (!s) return
    const { flat, logs, exIdx, setIdx } = s
    const ex = flat[exIdx]
    const w  = Number(currentWeightRef.current) || 0
    const newLogs = { ...logs, [ex.id]: [...(logs[ex.id] || []), { reps:ex.repsTarget, weight:w }] }

    const prevMaxW = Math.max(0, ...getLastWeightsForExercise(ex.name))
    if (w > 0 && w > prevMaxW) {
      setPrFlash({ name:ex.name, weight:w })
      setTimeout(() => setPrFlash(null), 2500)
    }

    setFlash(true); setTimeout(() => setFlash(false), 500)

    let nextExIdx = exIdx, nextSetIdx = setIdx + 1
    if (nextSetIdx >= ex.totalSets) { nextExIdx = exIdx + 1; nextSetIdx = 0 }

    setSession(s2 => ({ ...s2, logs: newLogs }))

    if (nextExIdx >= flat.length) {
      setSessionDone(true); setShowFeeling(true)
      return
    }

    // Leer restSecs del store directamente para no crear dependencia
    const secs = getGymRestSecs()
    setTimer({ restTimer: { phase:'main', remaining:secs, initial:secs, extraElapsed:0, nextExIdx, nextSetIdx } })
  }, [])

  const skipRest = useCallback(() => {
    const { restTimer, totalRestTime } = getTimerSnapshot()
    if (!restTimer) return
    silenceAlarm()
    const added = restTimer.phase === 'main'
      ? restTimer.initial - restTimer.remaining
      : restTimer.extraElapsed
    setTimer({ restTimer: null, totalRestTime: totalRestTime + added })
    advanceToNext(restTimer.nextExIdx, restTimer.nextSetIdx)
  }, [silenceAlarm, advanceToNext])

  const startExtraRest = useCallback(() => {
    const { restTimer, totalRestTime } = getTimerSnapshot()
    if (!restTimer || restTimer.phase !== 'main') return
    const added = restTimer.initial - restTimer.remaining
    setTimer({ restTimer: { ...restTimer, phase:'extra', extraElapsed:0 }, totalRestTime: totalRestTime + added })
  }, [])

  const saveFeelingAndFinish = useCallback((feeling) => {
    const s = sessionRef.current
    const { elapsed, totalRestTime } = getTimerSnapshot()
    const savedSession = {
      id:uid(), rutinaId:s.rutinaId, rutinaName:s.rutinaName,
      date: (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(),
      duration: elapsed, restTime: totalRestTime, feeling,
      exercises: s.flat.map(e => ({ id:e.id, name:e.name, muscle:e.muscle, sets:s.logs[e.id]||[] }))
    }
    addGymSession(savedSession)
    setHistory(getGymSessions())
    clearActiveGymSession()
    setShowFeeling(false)
  }, [])

  const abortSession = useCallback(() => {
    silenceAlarm()
    clearActiveGymSession()
    setTimer({ elapsed:0, restTimer:null, totalRestTime:0, alarmActive:false })
    setSession(null); setSessionDone(false)
    setShowFeeling(false); setCurrentWeight(''); setGymMinimized(false)
  }, [silenceAlarm])

  const updateRestSecs = useCallback(secs => { setRestSecs(secs); saveGymRestSecs(secs) }, [])

  const currentEx   = session ? session.flat[session.exIdx] : null
  const totalSeries = session ? session.flat.reduce((a,e)=>a+e.totalSets,0) : 0
  const doneSeries  = session ? Object.values(session.logs).reduce((a,arr)=>a+arr.length,0) : 0

  // useMemo: referencia estable — no cambia cuando tick-ea el timer
  const value = useMemo(() => ({
    session, currentWeight, setCurrentWeight,
    sessionDone, showFeeling, setShowFeeling,
    flash, prFlash, history, setHistory,
    restSecs, updateRestSecs,
    silenceAlarm,
    currentEx, totalSeries, doneSeries,
    startSession, completeSet, advanceToNext,
    skipRest, startExtraRest, saveFeelingAndFinish, abortSession,
  }), [
    session, currentWeight, sessionDone, showFeeling,
    flash, prFlash, history, restSecs,
    currentEx, totalSeries, doneSeries,
    updateRestSecs, silenceAlarm,
    startSession, completeSet, advanceToNext,
    skipRest, startExtraRest, saveFeelingAndFinish, abortSession,
  ])

  return (
    <GymSessionContext.Provider value={value}>
      {children}
    </GymSessionContext.Provider>
  )
}

export const useGymSession = () => useContext(GymSessionContext)
