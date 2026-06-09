import { createContext, useContext, useState, useEffect, useRef } from 'react'
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

const GymSessionContext = createContext(null)

export function GymSessionProvider({ children }) {
  const saved = getActiveGymSession()

  const [session,       setSession]       = useState(() => getActiveGymSession()?.session       ?? null)
  const [elapsed,       setElapsed]       = useState(() => getActiveGymSession()?.elapsed       ?? 0)
  const [currentWeight, setCurrentWeight] = useState(() => getActiveGymSession()?.currentWeight ?? '')
  const [sessionDone,   setSessionDone]   = useState(false)
  const [showFeeling,   setShowFeeling]   = useState(false)
  const [flash,         setFlash]         = useState(false)
  const [prFlash,       setPrFlash]       = useState(null)
  const [history,       setHistory]       = useState(getGymSessions)
  const [restTimer,     setRestTimer]     = useState(null)
  const [totalRestTime, setTotalRestTime] = useState(0)
  const [restSecs,      setRestSecs]      = useState(getGymRestSecs)
  const [alarmActive,   setAlarmActive]   = useState(false)
  const alarmRef = useRef(null)

  // Persist active session to localStorage
  useEffect(() => {
    if (session && !sessionDone) {
      saveActiveGymSession({ session, elapsed, currentWeight })
    }
  }, [session, elapsed, currentWeight, sessionDone])

  // Elapsed timer
  useEffect(() => {
    if (!session || sessionDone) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [session, sessionDone])

  // Rest timer tick
  useEffect(() => {
    if (!restTimer) return
    const id = setInterval(() => {
      setRestTimer(r => {
        if (!r) return null
        if (r.phase === 'main')  return { ...r, remaining: r.remaining - 1 }
        if (r.phase === 'extra') return { ...r, extraElapsed: r.extraElapsed + 1 }
        return r
      })
    }, 1000)
    return () => clearInterval(id)
  }, [restTimer?.phase, !!restTimer])

  // Countdown hits 0 → alarm + extra phase
  useEffect(() => {
    if (!restTimer || restTimer.phase !== 'main' || restTimer.remaining > 0) return
    setTotalRestTime(t => t + restTimer.initial)
    playAlarm()
    setRestTimer(r => r ? { ...r, phase: 'extra', extraElapsed: 0 } : null)
  }, [restTimer?.remaining])

  const playAlarm = () => {
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
    alarmRef.current = setInterval(beep, 1800)
    setAlarmActive(true)
  }

  const silenceAlarm = () => {
    if (alarmRef.current) { clearInterval(alarmRef.current); alarmRef.current = null }
    setAlarmActive(false)
  }

  const startSession = rutina => {
    const flat = []
    rutina.muscleGroups.forEach(g =>
      g.exercises.forEach(ex =>
        flat.push({ id:ex.id, name:ex.name, muscle:g.name, muscleColor:muscleColor(g.name), totalSets:Number(ex.sets)||3, repsTarget:String(ex.reps||'8') })
      )
    )
    if (!flat.length) return
    clearActiveGymSession()
    setSession({ rutinaId:rutina.id, rutinaName:rutina.name, flat, logs:{}, exIdx:0, setIdx:0 })
    setElapsed(0); setCurrentWeight(''); setSessionDone(false)
    setRestTimer(null); setTotalRestTime(0)
  }

  const advanceToNext = (nextExIdx, nextSetIdx) => {
    setSession(s => {
      if (nextExIdx !== s.exIdx) setCurrentWeight('')
      return { ...s, exIdx: nextExIdx, setIdx: nextSetIdx }
    })
  }

  const completeSet = (unit) => {
    if (!session) return
    const { flat, logs, exIdx, setIdx } = session
    const ex      = flat[exIdx]
    const w       = Number(currentWeight) || 0
    const newLogs = { ...logs }
    if (!newLogs[ex.id]) newLogs[ex.id] = []
    newLogs[ex.id] = [...newLogs[ex.id], { reps:ex.repsTarget, weight:w }]

    const prevMaxW = Math.max(0, ...getLastWeightsForExercise(ex.name))
    if (w > 0 && w > prevMaxW) {
      setPrFlash({ name:ex.name, weight:w })
      setTimeout(() => setPrFlash(null), 2500)
    }

    setFlash(true); setTimeout(() => setFlash(false), 500)

    let nextExIdx = exIdx, nextSetIdx = setIdx + 1
    if (nextSetIdx >= ex.totalSets) { nextExIdx = exIdx + 1; nextSetIdx = 0 }

    setSession(s => ({ ...s, logs: newLogs }))

    if (nextExIdx >= flat.length) {
      setSessionDone(true)
      setShowFeeling(true)
      return
    }

    setRestTimer({
      phase: 'main', remaining: restSecs, initial: restSecs,
      extraElapsed: 0, nextExIdx, nextSetIdx,
    })
  }

  const skipRest = () => {
    if (!restTimer) return
    silenceAlarm()
    if (restTimer.phase === 'main') {
      setTotalRestTime(t => t + (restTimer.initial - restTimer.remaining))
    } else {
      setTotalRestTime(t => t + restTimer.extraElapsed)
    }
    advanceToNext(restTimer.nextExIdx, restTimer.nextSetIdx)
    setRestTimer(null)
  }

  const startExtraRest = () => {
    if (!restTimer || restTimer.phase !== 'main') return
    setTotalRestTime(t => t + (restTimer.initial - restTimer.remaining))
    setRestTimer(r => ({ ...r, phase: 'extra', extraElapsed: 0 }))
  }

  const saveFeelingAndFinish = (feeling) => {
    const savedSession = {
      id:uid(), rutinaId:session.rutinaId, rutinaName:session.rutinaName,
      date: (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(),
      duration: elapsed, restTime: totalRestTime, feeling,
      exercises: session.flat.map(e => ({ id:e.id, name:e.name, muscle:e.muscle, sets:session.logs[e.id]||[] }))
    }
    addGymSession(savedSession)
    setHistory(getGymSessions())
    clearActiveGymSession()
    setShowFeeling(false)
  }

  const abortSession = () => {
    silenceAlarm()
    clearActiveGymSession()
    setSession(null); setElapsed(0); setSessionDone(false)
    setShowFeeling(false); setCurrentWeight('')
    setRestTimer(null); setTotalRestTime(0)
  }

  const updateRestSecs = secs => { setRestSecs(secs); saveGymRestSecs(secs) }

  const currentEx   = session ? session.flat[session.exIdx] : null
  const totalSeries = session ? session.flat.reduce((a,e)=>a+e.totalSets,0) : 0
  const doneSeries  = session ? Object.values(session.logs).reduce((a,arr)=>a+arr.length,0) : 0

  return (
    <GymSessionContext.Provider value={{
      session, elapsed, currentWeight, setCurrentWeight,
      sessionDone, showFeeling, setShowFeeling,
      flash, prFlash, history, setHistory,
      restTimer, totalRestTime, restSecs, updateRestSecs,
      alarmActive, silenceAlarm,
      currentEx, totalSeries, doneSeries,
      startSession, completeSet, advanceToNext,
      skipRest, startExtraRest, saveFeelingAndFinish, abortSession,
    }}>
      {children}
    </GymSessionContext.Provider>
  )
}

export const useGymSession = () => useContext(GymSessionContext)
