import { useState, useEffect, useRef, useMemo } from 'react'
import {
  FloppyDisk, Timer, SmileySad, SmileyMeh, SmileyBlank, Smiley, SmileyWink,
  Play, Pause, ArrowCounterClockwise, Plus, X, MagnifyingGlass,
  BookOpen, Heart, Lightning, Wind, Sparkle, Fire, Check,
  Sun, Brain, ChartLine, NotePencil, CheckCircle, Barbell, ArrowsClockwise, Books, SunHorizon,
} from '@phosphor-icons/react'
import AmbitoHeader from '../../components/AmbitoHeader'
import {
  getHabits, getTodayMente, saveTodayMente, getMenteLog,
  getAffirmations, addAffirmation, deleteAffirmation,
} from '../../store'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// ── Constantes ─────────────────────────────────────────────────────────────
const MOODS = [
  { v:1, Icon:SmileySad,   label:'Muy mal',   color:'#e05c5c' },
  { v:2, Icon:SmileyMeh,   label:'Mal',        color:'#f97316' },
  { v:3, Icon:SmileyBlank, label:'Regular',    color:'#888'    },
  { v:4, Icon:Smiley,      label:'Bien',       color:'#4cae8a' },
  { v:5, Icon:SmileyWink,  label:'Excelente',  color:'#2cb99a' },
]

const DEFAULT_AFFIRMATIONS = [
  'Soy capaz de lograr todo lo que me propongo.',
  'Cada día soy una mejor versión de mí mismo.',
  'Tengo el poder de crear cambios positivos en mi vida.',
  'Merezco paz, amor y abundancia.',
  'Mi mente es fuerte y mi corazón es valiente.',
  'Confío en el proceso de la vida.',
  'Estoy agradecido por todo lo que tengo.',
  'Hoy elijo ser feliz y productivo.',
  'Soy resiliente y puedo superar cualquier obstáculo.',
  'Mi potencial es ilimitado.',
]

const JOURNAL_PROMPTS = [
  { k:'well',      label:'¿Qué salió bien hoy?',              Icon:CheckCircle },
  { k:'hard',      label:'¿Qué fue difícil?',                 Icon:Barbell },
  { k:'different', label:'¿Qué harías diferente?',            Icon:ArrowsClockwise },
  { k:'learned',   label:'¿Qué aprendiste hoy?',              Icon:Books },
  { k:'tomorrow',  label:'Intención para mañana',             Icon:SunHorizon },
  { k:'gratitude', label:'3 cosas por las que estar agradecido', Icon:Heart },
]

const BREATH_MODES = [
  { k:'478',  label:'4-7-8',      desc:'Relajación profunda', phases:[{l:'Inhala',s:4},{l:'Sostén',s:7},{l:'Exhala',s:8}] },
  { k:'box',  label:'Box',        desc:'Foco y calma',        phases:[{l:'Inhala',s:4},{l:'Sostén',s:4},{l:'Exhala',s:4},{l:'Sostén',s:4}] },
  { k:'calm', label:'Respiración calmante', desc:'Reduce ansiedad', phases:[{l:'Inhala',s:4},{l:'Exhala',s:6}] },
]

const today = () => new Date().toISOString().slice(0,10)

// ── Tab: Hoy ──────────────────────────────────────────────────────────────
function HoyTab({ entry, upd, ambito, onSave }) {
  // Afirmación del día
  const allAff    = useMemo(()=>[...DEFAULT_AFFIRMATIONS,...getAffirmations().map(a=>a.text)],[])
  const todayAff  = useMemo(()=>{
    const seed = new Date().toISOString().slice(0,10).replace(/-/g,'')
    return allAff[Number(seed) % allAff.length]
  },[allAff])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* Afirmación del día */}
      <div className="col-span-2 rounded-2xl px-5 py-4 flex items-center gap-4"
        style={{background:`linear-gradient(135deg, ${ambito.color}18, ${ambito.color}08)`,
                border:`1px solid ${ambito.color}30`}}>
        <Sparkle size={22} weight="fill" style={{color:ambito.color,flexShrink:0}}/>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-lo mb-1">Afirmación del día</p>
          <p className="text-[14px] font-medium text-hi leading-snug italic">"{todayAff}"</p>
        </div>
        {!entry.affirmationRead ? (
          <button onClick={()=>upd('affirmationRead',true)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 transition-all"
            style={{backgroundColor:ambito.color+'20',color:ambito.color,border:`1px solid ${ambito.color}40`}}>
            ✓ Leída
          </button>
        ) : (
          <span className="text-[11px] text-lo shrink-0">✅ Leída</span>
        )}
      </div>

      {/* Mood */}
      <div className="card">
        <p className="section-title mb-2">Estado de ánimo</p>
        <div className="flex gap-2">
          {MOODS.map(m=>(
            <button key={m.v} onClick={()=>upd('mood',m.v)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
              style={entry.mood===m.v
                ?{backgroundColor:m.color+'22',border:`1px solid ${m.color}44`}
                :{backgroundColor:'#111',border:'1px solid #1a1a1a'}}>
              <m.Icon size={22} weight={entry.mood===m.v?'fill':'regular'}
                style={{color:entry.mood===m.v?m.color:'#444'}}/>
              <span className="text-[9px]" style={{color:entry.mood===m.v?m.color:'#444'}}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energía y Ansiedad */}
      <div className="card space-y-3">
        {[
          { k:'energy',  label:'Energía',  icon:<Lightning size={13} color="#c9a227" weight="fill"/>, color:'#c9a227' },
          { k:'anxiety', label:'Estrés',   icon:<Wind size={13} color="#5b84e8" weight="fill"/>,      color:'#5b84e8' },
        ].map(m=>(
          <div key={m.k}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-lo flex items-center gap-1">{m.icon}{m.label}</span>
              <span className="text-[11px] font-mono font-bold" style={{color:m.color}}>{entry[m.k]||3}/5</span>
            </div>
            <div className="flex gap-1.5">
              {[1,2,3,4,5].map(v=>(
                <button key={v} onClick={()=>upd(m.k,v)}
                  className="flex-1 h-6 rounded-lg transition-all"
                  style={{backgroundColor:(entry[m.k]||3)>=v?m.color+'cc':m.color+'15',
                          border:`1px solid ${m.color}30`}}/>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Diario estructurado */}
      <div className="card col-span-2">
        <p className="section-title mb-3">Diario del día</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {JOURNAL_PROMPTS.map(p=>(
            <div key={p.k}>
              <span className="field-label flex items-center gap-1 mb-1"><p.Icon size={11}/> {p.label}</span>
              <textarea
                className="field-input resize-none text-[12px]" rows={2}
                placeholder="Escribe aquí..."
                value={entry.prompts?.[p.k]||''}
                onChange={e=>upd('prompts',{...(entry.prompts||{}),[p.k]:e.target.value})}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Botón guardar */}
      <button onClick={onSave}
        className="col-span-2 btn-primary flex items-center justify-center gap-2 py-3">
        <FloppyDisk size={15}/> Guardar día
      </button>
    </div>
  )
}

// ── Tab: Meditación ────────────────────────────────────────────────────────
function MeditacionTab({ entry, upd, ambito }) {
  const [secs,     setSecs]     = useState(10*60)
  const [running,  setRunning]  = useState(false)
  const [selMins,  setSelMins]  = useState(10)
  const [sound,    setSound]    = useState('none')
  const intervalRef = useRef(null)
  const audioCtxRef = useRef(null)
  const sourceRef   = useRef(null)

  const log = useMemo(()=>getMenteLog().slice(0,30),[])

  // Estadísticas
  const totalMins    = log.reduce((a,e)=>a+(e.meditation||0),0)
  const thisMonthMins = log.filter(e=>e.date?.slice(0,7)===new Date().toISOString().slice(0,7))
                            .reduce((a,e)=>a+(e.meditation||0),0)
  // Racha
  let streak = 0
  const sorted = [...log].sort((a,b)=>b.date.localeCompare(a.date))
  for (const e of sorted) { if ((e.meditation||0)>0) streak++; else break }

  const weekData = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-6+i)
    const ds = d.toISOString().slice(0,10)
    const e  = log.find(x=>x.date===ds)
    return { day:['L','M','X','J','V','S','D'][(d.getDay()+6)%7], mins:e?.meditation||0 }
  })

  // Audio simple con Web Audio API
  const startSound = (type) => {
    if (!window.AudioContext && !window.webkitAudioContext) return
    const ctx = new (window.AudioContext||window.webkitAudioContext)()
    audioCtxRef.current = ctx
    if (type==='bowl') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.setValueAtTime(432, ctx.currentTime)
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      osc.start(); sourceRef.current = osc
    } else if (type==='rain') {
      const buf = ctx.createBuffer(1, ctx.sampleRate*2, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*0.05
      const src = ctx.createBufferSource()
      src.buffer = buf; src.loop = true; src.connect(ctx.destination)
      src.start(); sourceRef.current = src
    }
  }

  const stopSound = () => {
    try { sourceRef.current?.stop() } catch(e) {}
    try { audioCtxRef.current?.close() } catch(e) {}
  }

  useEffect(()=>{
    if (running) {
      if (sound!=='none') startSound(sound)
      intervalRef.current = setInterval(()=>{
        setSecs(s=>{
          if (s<=1) {
            clearInterval(intervalRef.current)
            stopSound()
            setRunning(false)
            upd('meditation',(entry.meditation||0)+selMins)
            setSecs(selMins*60)
            return 0
          }
          return s-1
        })
      },1000)
    } else {
      clearInterval(intervalRef.current)
      if (!running) stopSound()
    }
    return ()=>{ clearInterval(intervalRef.current); stopSound() }
  },[running])

  const reset = () => { setRunning(false); setSecs(selMins*60) }
  const mins  = Math.floor(secs/60)
  const sec2  = secs%60
  const pct   = ((selMins*60-secs)/(selMins*60))*100
  const circ  = 2*Math.PI*54

  const SOUNDS = [
    { k:'none',  label:'Sin sonido', emoji:'🔇' },
    { k:'bowl',  label:'Cuenco',     emoji:'🎵' },
    { k:'rain',  label:'Lluvia',     emoji:'🌧️' },
  ]

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-4 md:gap-5">
      {/* Timer */}
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title mb-0">Temporizador</p>
            <span className="text-[11px] font-mono text-lo">Hoy: {entry.meditation||0} min</span>
          </div>

          {/* Selector duración */}
          {!running && (
            <div className="flex gap-2 mb-4">
              {[5,10,15,20,30].map(m=>(
                <button key={m} onClick={()=>{setSelMins(m);setSecs(m*60)}}
                  className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all"
                  style={selMins===m
                    ?{backgroundColor:ambito.color+'22',color:ambito.color,border:`1px solid ${ambito.color}44`}
                    :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
                  {m}m
                </button>
              ))}
            </div>
          )}

          {/* Anillo timer */}
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36 mb-4">
              <svg width={144} height={144} className="-rotate-90">
                <circle cx={72} cy={72} r={54} fill="none" stroke="#1a1a1a" strokeWidth={8}/>
                <circle cx={72} cy={72} r={54} fill="none" stroke={ambito.color} strokeWidth={8}
                  strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
                  strokeLinecap="round" style={{transition:'stroke-dashoffset 1s linear'}}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[30px] font-bold font-mono text-hi leading-none">
                  {String(mins).padStart(2,'0')}:{String(sec2).padStart(2,'0')}
                </span>
                <span className="text-[11px] text-lo mt-1">
                  {running ? <span className="flex items-center gap-1"><Brain size={12}/>Meditando...</span> : ''}
                </span>
              </div>
            </div>

            {/* Controles */}
            <div className="flex gap-3">
              <button onClick={()=>setRunning(r=>!r)}
                className="btn-primary flex items-center gap-2 px-6 py-2.5">
                {running?<Pause size={16} weight="bold"/>:<Play size={16} weight="bold"/>}
                {running?'Pausar':'Iniciar'}
              </button>
              <button onClick={reset} className="btn-icon w-11 h-11">
                <ArrowCounterClockwise size={16}/>
              </button>
            </div>
          </div>

          {/* Selector sonido */}
          <div className="mt-4">
            <p className="text-[11px] text-lo mb-2">Ambiente sonoro</p>
            <div className="flex gap-2">
              {SOUNDS.map(s=>(
                <button key={s.k} onClick={()=>setSound(s.k)}
                  className="flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all"
                  style={sound===s.k
                    ?{backgroundColor:ambito.color+'18',color:ambito.color,border:`1px solid ${ambito.color}35`}
                    :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar estadísticas */}
      <div className="space-y-4">
        {/* Stats */}
        <div className="card">
          <p className="section-title mb-3">Estadísticas</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label:'Racha', val:`${streak}d`,      color:ambito.color },
              { label:'Este mes', val:`${thisMonthMins}m`, color:'#c9a227' },
              { label:'Total', val:`${totalMins}m`,   color:'#5b84e8' },
            ].map(s=>(
              <div key={s.label} className="text-center py-2 rounded-xl"
                style={{backgroundColor:s.color+'10'}}>
                <p className="text-[16px] font-bold font-mono" style={{color:s.color}}>{s.val}</p>
                <p className="text-[9px] text-lo">{s.label}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={70}>
            <BarChart data={weekData} barSize={12}>
              <XAxis dataKey="day" tick={{fill:'#555',fontSize:9}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:8,fontSize:11}}
                formatter={v=>[`${v} min`,'Meditación']}/>
              <Bar dataKey="mins" fill={ambito.color} fillOpacity={0.8} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Historial */}
        <div className="card">
          <p className="section-title mb-2">Historial reciente</p>
          <div className="space-y-1.5">
            {log.slice(0,8).map(e=>{
              const m = MOODS.find(x=>x.v===e.mood)||MOODS[2]
              return (
                <div key={e.date} className="flex items-center gap-2">
                  <m.Icon size={13} weight="regular" style={{color:m.color,flexShrink:0}}/>
                  <span className="text-[11px] font-mono text-lo flex-1">{e.date.slice(5)}</span>
                  {(e.meditation||0)>0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{backgroundColor:ambito.color+'15',color:ambito.color}}>
                      {e.meditation}m
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Respiración ───────────────────────────────────────────────────────
function RespiracionTab({ entry, upd, ambito }) {
  const [mode,    setMode]    = useState('box')
  const [running, setRunning] = useState(false)
  const [phase,   setPhase]   = useState(0)
  const [secs,    setSecs]    = useState(0)
  const [cycles,  setCycles]  = useState(0)
  const intervalRef = useRef(null)

  const bm = BREATH_MODES.find(b=>b.k===mode)

  useEffect(()=>{
    if (!running) { clearInterval(intervalRef.current); return }
    setSecs(bm.phases[0].s); setPhase(0)
    let p = 0, s = bm.phases[0].s
    intervalRef.current = setInterval(()=>{
      s--
      if (s<=0) {
        p = (p+1) % bm.phases.length
        if (p===0) setCycles(c=>{ const nc=c+1; upd('breathingCycles',(entry.breathingCycles||0)+1); return nc })
        s = bm.phases[p].s
        setPhase(p)
      }
      setSecs(s)
    },1000)
    return ()=>clearInterval(intervalRef.current)
  },[running, mode])

  const stop = () => { setRunning(false); setPhase(0); setSecs(0) }

  const currentPhase = bm.phases[phase]
  const phasePct     = running && currentPhase ? ((currentPhase.s - secs) / currentPhase.s) * 100 : 0

  // Tamaño del círculo de respiración
  const isInhale  = currentPhase?.l === 'Inhala'
  const isExhale  = currentPhase?.l === 'Exhala'
  const circleSize = running
    ? isInhale ? 140 + phasePct * 0.6
    : isExhale ? 200 - phasePct * 0.6
    : 140
    : 140

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-4 md:gap-5">
      <div className="card flex flex-col items-center py-8 space-y-6">
        {/* Selector modo */}
        <div className="flex gap-2 w-full max-w-sm">
          {BREATH_MODES.map(b=>(
            <button key={b.k} onClick={()=>{stop();setMode(b.k)}}
              className="flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all text-center"
              style={mode===b.k
                ?{backgroundColor:ambito.color+'22',color:ambito.color,border:`1px solid ${ambito.color}44`}
                :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
              {b.label}
            </button>
          ))}
        </div>

        <p className="text-[12px] text-lo text-center">{bm.desc}</p>

        {/* Círculo de respiración */}
        <div className="relative flex items-center justify-center" style={{width:220,height:220}}>
          {/* Anillos externos */}
          {[1,2,3].map(i=>(
            <div key={i} className="absolute rounded-full transition-all duration-1000"
              style={{
                width: running ? circleSize + i*18 : 140 + i*18,
                height: running ? circleSize + i*18 : 140 + i*18,
                backgroundColor: ambito.color,
                opacity: running ? 0.04 : 0.02,
              }}/>
          ))}
          {/* Círculo principal */}
          <div className="rounded-full flex flex-col items-center justify-center transition-all duration-1000 z-10"
            style={{
              width: running ? circleSize : 140,
              height: running ? circleSize : 140,
              backgroundColor: ambito.color + (running ? '28' : '15'),
              border: `2px solid ${ambito.color}${running ? '60' : '30'}`,
            }}>
            {running ? (
              <>
                <p className="text-[20px] font-bold text-hi">{secs}</p>
                <p className="text-[13px] font-semibold" style={{color:ambito.color}}>
                  {currentPhase?.l}
                </p>
              </>
            ) : (
              <>
                <Wind size={28} style={{color:ambito.color+'80'}}/>
                <p className="text-[11px] text-lo mt-1">Listo</p>
              </>
            )}
          </div>
        </div>

        {/* Fases */}
        {running && (
          <div className="flex gap-2">
            {bm.phases.map((p,i)=>(
              <div key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px]"
                style={{backgroundColor:phase===i?ambito.color+'22':'#111',
                        color:phase===i?ambito.color:'#444',
                        border:`1px solid ${phase===i?ambito.color+'40':'#1a1a1a'}`}}>
                {p.l} {p.s}s
              </div>
            ))}
          </div>
        )}

        {/* Controles */}
        <div className="flex gap-3">
          <button
            onClick={()=>running?stop():setRunning(true)}
            className="btn-primary flex items-center gap-2 px-8 py-2.5">
            {running?<Pause size={16} weight="bold"/>:<Play size={16} weight="bold"/>}
            {running?'Detener':'Comenzar'}
          </button>
        </div>

        {cycles>0 && (
          <p className="text-[12px] text-lo">
            {cycles} ciclo{cycles!==1?'s':''} completado{cycles!==1?'s':''} 🌿
          </p>
        )}
      </div>

      {/* Info */}
      <div className="space-y-4">
        <div className="card">
          <p className="section-title mb-3">Técnicas</p>
          {BREATH_MODES.map(b=>(
            <div key={b.k} className="mb-3 last:mb-0">
              <p className="text-[12px] font-semibold text-hi mb-0.5">{b.label}</p>
              <p className="text-[11px] text-lo mb-1">{b.desc}</p>
              <div className="flex gap-1">
                {b.phases.map((p,i)=>(
                  <div key={i} className="flex-1 text-center py-1.5 rounded-lg"
                    style={{backgroundColor:ambito.color+'10'}}>
                    <p className="text-[9px] text-lo">{p.l}</p>
                    <p className="text-[13px] font-bold font-mono" style={{color:ambito.color}}>{p.s}s</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <p className="section-title mb-2">Hoy</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{backgroundColor:ambito.color+'18'}}>
              <Wind size={20} style={{color:ambito.color}}/>
            </div>
            <div>
              <p className="text-[22px] font-bold font-mono text-hi">{entry.breathingCycles||0}</p>
              <p className="text-[11px] text-lo">ciclos completados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Gráficas ──────────────────────────────────────────────────────────
function GraficasTab({ ambito }) {
  const log = useMemo(()=>getMenteLog().slice(0,30).reverse(),[])

  const chartData = log.map(e=>({
    day:  e.date.slice(5),
    mood: e.mood||0,
    energia: e.energy||0,
    estres:  e.anxiety||0,
  }))

  const avg = field => log.length
    ? (log.reduce((a,e)=>a+(e[field]||0),0)/log.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label:'Humor prom.',   val:avg('mood'),    color:MOODS[Math.round(avg('mood'))-1]?.color||ambito.color },
          { label:'Energía prom.', val:avg('energy'),  color:'#c9a227' },
          { label:'Estrés prom.',  val:avg('anxiety'), color:'#5b84e8' },
        ].map(s=>(
          <div key={s.label} className="card text-center py-4">
            <p className="text-[26px] font-bold font-mono" style={{color:s.color}}>{s.val}</p>
            <p className="text-[10px] text-lo mt-1">{s.label} (30d)</p>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="section-title mb-2">Estado de ánimo — 30 días</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" tick={{fill:'#555',fontSize:9}} axisLine={false} tickLine={false}
              interval={4}/>
            <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:8,fontSize:11}}/>
            <Line type="monotone" dataKey="mood"    stroke={ambito.color} strokeWidth={2} dot={false} name="Humor"/>
            <Line type="monotone" dataKey="energia" stroke="#c9a227"      strokeWidth={2} dot={false} name="Energía"/>
            <Line type="monotone" dataKey="estres"  stroke="#5b84e8"      strokeWidth={2} dot={false} name="Estrés"/>
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 pt-2 border-t border-border">
          {[['Humor',ambito.color],['Energía','#c9a227'],['Estrés','#5b84e8']].map(([l,c])=>(
            <span key={l} className="flex items-center gap-1.5 text-[11px] text-lo">
              <span className="w-3 h-0.5 rounded-full inline-block" style={{backgroundColor:c}}/>
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Patron por día de la semana */}
      <div className="card">
        <p className="section-title mb-2">Humor promedio por día de la semana</p>
        {(() => {
          const DAY_LABELS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
          const byDow = Array(7).fill(null).map(()=>[])
          getMenteLog().forEach(e=>{
            if (!e.date||!e.mood) return
            const dow = new Date(e.date+'T12:00').getDay()
            byDow[dow].push(e.mood)
          })
          const data = DAY_LABELS.map((day,i)=>({
            day,
            humor: byDow[i].length ? Number((byDow[i].reduce((a,v)=>a+v,0)/byDow[i].length).toFixed(1)) : 0
          }))
          return (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={data} barSize={22}>
                <XAxis dataKey="day" tick={{fill:'#555',fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:8,fontSize:11}}
                  formatter={v=>[`${v}/5`,'Humor']}/>
                <Bar dataKey="humor" fill={ambito.color} fillOpacity={0.75} radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )
        })()}
      </div>
    </div>
  )
}

// ── Tab: Diario / Biblioteca ───────────────────────────────────────────────
function DiarioTab({ ambito }) {
  const log    = useMemo(()=>getMenteLog().filter(e=>e.journal||(e.prompts&&Object.values(e.prompts).some(Boolean))),[])
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [open,   setOpen]     = useState(null)

  const filtered = log.filter(e=>{
    const text = e.journal + JSON.stringify(e.prompts||{})
    const matchSearch = !search || text.toLowerCase().includes(search.toLowerCase())
    const matchMood   = filter==='all' || e.mood===Number(filter)
    return matchSearch && matchMood
  })

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-4 md:gap-5">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
            <input className="field-input pl-8 text-[12px]" placeholder="Buscar en el diario..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="field-input w-36 text-[12px]" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="all">Todos los ánimos</option>
            {MOODS.map(m=><option key={m.v} value={m.v}>{m.label}</option>)}
          </select>
        </div>

        {filtered.length===0
          ? <div className="card py-10 text-center text-lo text-[13px]">
              {search ? 'Sin resultados.' : 'Sin entradas de diario aún. Escribe algo en la pestaña Hoy.'}
            </div>
          : filtered.map(e=>{
            const m   = MOODS.find(x=>x.v===e.mood)||MOODS[2]
            const isOpen = open===e.date
            const hasPrompts = e.prompts && Object.values(e.prompts).some(Boolean)
            return (
              <div key={e.date} className="card cursor-pointer hover:border-border-2 transition-all"
                onClick={()=>setOpen(isOpen?null:e.date)}>
                <div className="flex items-center gap-2 mb-1">
                  <m.Icon size={14} weight="fill" style={{color:m.color}}/>
                  <span className="text-[11px] font-mono text-lo">{e.date}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{backgroundColor:m.color+'18',color:m.color}}>{m.label}</span>
                  {(e.meditation||0)>0 && (
                    <span className="text-[10px] text-lo ml-auto flex items-center gap-0.5"><Brain size={10}/>{e.meditation}m</span>
                  )}
                </div>
                {e.journal && (
                  <p className={`text-[12px] text-mid leading-relaxed ${isOpen?'':'line-clamp-2'}`}>
                    {e.journal}
                  </p>
                )}
                {isOpen && hasPrompts && (
                  <div className="mt-3 pt-3 border-t border-border space-y-2">
                    {JOURNAL_PROMPTS.map(p=>{
                      const val = e.prompts?.[p.k]
                      if (!val) return null
                      return (
                        <div key={p.k}>
                          <p className="text-[10px] text-lo font-semibold mb-0.5 flex items-center gap-1"><p.Icon size={10}/> {p.label}</p>
                          <p className="text-[12px] text-mid leading-relaxed">{val}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        }
      </div>

      {/* Sidebar: afirmaciones */}
      <div className="space-y-4">
        <AffirmationsWidget ambito={ambito}/>
      </div>
    </div>
  )
}

// ── Afirmaciones widget ────────────────────────────────────────────────────
function AffirmationsWidget({ ambito }) {
  const [custom,   setCustom]   = useState(getAffirmations)
  const [newText,  setNewText]  = useState('')
  const [showAll,  setShowAll]  = useState(false)

  const all = [...DEFAULT_AFFIRMATIONS, ...custom.map(a=>a.text)]

  return (
    <div className="card">
      <p className="section-title mb-3">Afirmaciones</p>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {(showAll ? all : all.slice(0,5)).map((text,i)=>(
          <div key={i} className="flex items-start gap-2 group">
            <Sparkle size={10} weight="fill" className="shrink-0 mt-1" style={{color:ambito.color+'80'}}/>
            <p className="text-[11px] text-mid leading-relaxed flex-1">{text}</p>
            {i>=DEFAULT_AFFIRMATIONS.length && (
              <button onClick={()=>{ const a=custom[i-DEFAULT_AFFIRMATIONS.length]; if(a){deleteAffirmation(a.id);setCustom(getAffirmations())} }}
                className="opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all shrink-0">
                <X size={9}/>
              </button>
            )}
          </div>
        ))}
      </div>
      {all.length>5 && (
        <button onClick={()=>setShowAll(v=>!v)} className="text-[11px] text-lo hover:text-mid mt-2 transition-colors">
          {showAll?'Mostrar menos':'Ver todas →'}
        </button>
      )}
      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
        <input className="flex-1 field-input text-[11px] py-1.5" placeholder="Nueva afirmación..."
          value={newText} onChange={e=>setNewText(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&newText.trim()&&(setCustom(addAffirmation(newText.trim())),setNewText(''))}/>
        <button onClick={()=>newText.trim()&&(setCustom(addAffirmation(newText.trim())),setNewText(''))}
          className="btn-primary px-3 py-1.5 text-[11px]"><Plus size={11} weight="bold"/></button>
      </div>
    </div>
  )
}

// ── Vista principal ──────────────────────────────────────────────────────────
const TABS = ['Hoy','Meditación','Respiración','Gráficas','Diario']
const TAB_ICONS = { Hoy:Sun, Meditación:Brain, Respiración:Wind, Gráficas:ChartLine, Diario:NotePencil }

export default function MenteView({ ambito }) {
  const habits = getHabits()
  const [tab,   setTab]   = useState('Hoy')
  const [entry, setEntry] = useState(getTodayMente)
  const [saved, setSaved] = useState(false)

  const upd = (k, v) => setEntry(e => ({ ...e, [k]: v }))

  // Auto-guarda en localStorage cada vez que entry cambia
  useEffect(() => { saveTodayMente(entry) }, [entry])

  const handleSave = () => { saveTodayMente(entry); setSaved(true); setTimeout(()=>setSaved(false),2000) }

  return (
    <div className="min-h-screen">
      <AmbitoHeader ambito={ambito} habits={habits}/>

      <div className="px-6 pt-4 pb-1">
        <div className="flex gap-1 bg-black/30 rounded-xl p-1 overflow-x-auto scrollbar-none">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex-1 justify-center"
              style={tab===t?{backgroundColor:ambito.color+'20',color:ambito.color}:{color:'#555'}}>
              {(() => { const I = TAB_ICONS[t]; return I ? <I size={13}/> : null })()} {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 md:p-6">
        {tab==='Hoy'         && <HoyTab         entry={entry} upd={upd} ambito={ambito} onSave={handleSave}/>}
        {tab==='Meditación'  && <MeditacionTab  entry={entry} upd={upd} ambito={ambito}/>}
        {tab==='Respiración' && <RespiracionTab entry={entry} upd={upd} ambito={ambito}/>}
        {tab==='Gráficas'    && <GraficasTab    ambito={ambito}/>}
        {tab==='Diario'      && <DiarioTab      ambito={ambito}/>}
      </div>
    </div>
  )
}
