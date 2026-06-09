import { useState, useMemo, useEffect } from 'react'
import {
  FloppyDisk, Drop, Moon, PersonSimpleRun, SmileySad, SmileyMeh,
  SmileyBlank, Smiley, SmileyWink, Heart, Thermometer, Plus, X,
  Pill, Target, ChartLine, Fire, Check, Gear,
} from '@phosphor-icons/react'
import AmbitoHeader from '../../components/AmbitoHeader'
import {
  getHabits, getTodayHealth, saveTodayHealth, getHealthLog,
  getHealthGoals, saveHealthGoals, getMeds, addMed, deleteMed,
  getMedLog, toggleMedTaken,
} from '../../store'
import {
  LineChart, Line, XAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'

// ── Constantes ────────────────────────────────────────────────────────────
const MOODS = [SmileySad, SmileyMeh, SmileyBlank, Smiley, SmileyWink]
const MOOD_LABELS = ['Mal','Regular','Normal','Bien','Genial']
const MOOD_COLORS = ['#e05c5c','#c9a227','#888','#4cae8a','#2cb99a']
const today = () => new Date().toISOString().slice(0,10)
const ds = d => d.toISOString().slice(0,10)

// Calcula racha de una métrica que supera una meta
function calcMetricStreak(log, field, goal, compare='gte') {
  const sorted = [...log].sort((a,b)=>b.date.localeCompare(a.date))
  let streak = 0
  for (const e of sorted) {
    const v = Number(e[field])||0
    const ok = compare==='gte' ? v>=goal : v<=goal
    if (ok) streak++; else break
  }
  return streak
}

// Semana actual
function thisWeekDates() {
  const d = new Date(); d.setHours(0,0,0,0)
  const dow = (d.getDay()+6)%7
  d.setDate(d.getDate()-dow)
  return Array.from({length:7},(_,i)=>{ const x=new Date(d); x.setDate(d.getDate()+i); return ds(x) })
}

// ── Tab: Hoy ─────────────────────────────────────────────────────────────
function TodayTab({ entry, setEntry, goals, ambito, onSave }) {
  const upd = (k, v) => setEntry(e => ({ ...e, [k]: v }))

  return (
    <div className="space-y-4">
      {/* Agua */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Drop size={16} color="#5b84e8" weight="fill"/>
          <p className="section-title mb-0">Agua</p>
          <span className="ml-auto text-[11px] font-mono" style={{color:'#5b84e8'}}>
            {entry.water}/{goals.water} vasos
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap mb-3">
          {Array.from({length: Math.min(goals.water,12)}).map((_,i)=>(
            <button key={i} onClick={()=>upd('water', i<entry.water ? i : i+1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={i<entry.water
                ?{backgroundColor:'#5b84e825'}
                :{backgroundColor:'#111',border:'1px solid #242424'}}>
              <Drop size={16} weight={i<entry.water?'fill':'regular'}
                style={{color:i<entry.water?'#5b84e8':'#333'}}/>
            </button>
          ))}
          {entry.water>goals.water && (
            <span className="text-[11px] text-lo self-center">+{entry.water-goals.water} extra</span>
          )}
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{width:`${Math.min(100,(entry.water/goals.water)*100)}%`,backgroundColor:'#5b84e8'}}/>
        </div>
      </div>

      {/* Sueño */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Moon size={16} color="#9575cd" weight="fill"/>
          <p className="section-title mb-0">Sueño</p>
          <span className="ml-auto text-[11px] font-mono" style={{color:'#9575cd'}}>{entry.sleep||0}h</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <span className="field-label">Me dormí</span>
            <input type="time" className="field-input text-center"
              value={entry.sleepStart||''} onChange={e=>upd('sleepStart',e.target.value)}/>
          </div>
          <div>
            <span className="field-label">Me desperté</span>
            <input type="time" className="field-input text-center"
              value={entry.sleepEnd||''} onChange={e=>upd('sleepEnd',e.target.value)}/>
          </div>
          <div>
            <span className="field-label">Horas totales</span>
            <div className="flex items-center gap-1">
              <button onClick={()=>upd('sleep',Math.max(0,(entry.sleep||0)-0.5))}
                className="btn-icon w-8 h-9 text-lg">-</button>
              <span className="flex-1 text-center text-[20px] font-bold font-mono text-hi">
                {entry.sleep||0}
              </span>
              <button onClick={()=>upd('sleep',Math.min(24,(entry.sleep||0)+0.5))}
                className="btn-icon w-8 h-9 text-lg">+</button>
            </div>
          </div>
        </div>
        <div>
          <span className="field-label mb-1.5">Calidad del sueño</span>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(q=>(
              <button key={q} onClick={()=>upd('sleepQuality',q)}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={entry.sleepQuality===q
                  ?{backgroundColor:'#9575cd20',color:'#9575cd',border:'1px solid #9575cd40'}
                  :{backgroundColor:'#111',border:'1px solid #1a1a1a',color:'#555'}}>
                {'★'.repeat(q)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{width:`${Math.min(100,((entry.sleep||0)/goals.sleep)*100)}%`,backgroundColor:'#9575cd'}}/>
        </div>
      </div>

      {/* Pasos + Peso en fila */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <PersonSimpleRun size={14} color={ambito.color} weight="fill"/>
            <p className="section-title mb-0 text-[11px]">Pasos</p>
          </div>
          <input type="number" className="field-input text-center text-[18px] font-mono font-bold h-10 w-full"
            value={entry.steps||''} placeholder="0"
            onChange={e=>upd('steps',Number(e.target.value))}/>
          <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full"
              style={{width:`${Math.min(100,((entry.steps||0)/goals.steps)*100)}%`,backgroundColor:ambito.color}}/>
          </div>
          <p className="text-[9px] text-lo mt-1">Meta: {goals.steps.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="section-title text-[11px]">Peso (kg)</p>
          <input type="number" step="0.1" className="field-input text-center text-[18px] font-mono font-bold h-10 w-full"
            placeholder="—" value={entry.weight||''}
            onChange={e=>upd('weight',e.target.value)}/>
        </div>
      </div>

      {/* Métricas extra */}
      <div className="card">
        <p className="section-title mb-3">Métricas adicionales</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="field-label flex items-center gap-1">
              <Heart size={11} color="#e05c5c"/> FC reposo (bpm)
            </span>
            <input type="number" className="field-input" placeholder="60-100"
              value={entry.heartRate||''} onChange={e=>upd('heartRate',e.target.value)}/>
          </div>
          <div>
            <span className="field-label flex items-center gap-1">
              <Heart size={11} color="#f97316"/> FC máxima (bpm)
            </span>
            <input type="number" className="field-input" placeholder="140-180"
              value={entry.heartRateMax||''} onChange={e=>upd('heartRateMax',e.target.value)}/>
          </div>
          <div>
            <span className="field-label">Presión arterial</span>
            <div className="flex items-center gap-1">
              <input type="number" className="field-input text-center" placeholder="120"
                value={entry.bpSystolic||''} onChange={e=>upd('bpSystolic',e.target.value)}/>
              <span className="text-lo text-[12px]">/</span>
              <input type="number" className="field-input text-center" placeholder="80"
                value={entry.bpDiastolic||''} onChange={e=>upd('bpDiastolic',e.target.value)}/>
            </div>
          </div>
          <div>
            <span className="field-label flex items-center gap-1">
              <Thermometer size={11} color="#38bdf8"/> Temperatura (°C)
            </span>
            <input type="number" step="0.1" className="field-input" placeholder="36.5"
              value={entry.temperature||''} onChange={e=>upd('temperature',e.target.value)}/>
          </div>
        </div>
      </div>

      {/* Estado físico */}
      <div className="card">
        <p className="section-title mb-2">Estado físico</p>
        <div className="flex gap-2">
          {MOODS.map((MoodIcon,i)=>(
            <button key={i} onClick={()=>upd('mood',i+1)}
              className="flex-1 py-2 rounded-xl flex flex-col items-center gap-1 transition-all"
              style={entry.mood===i+1
                ?{backgroundColor:MOOD_COLORS[i]+'20',border:`1px solid ${MOOD_COLORS[i]}44`}
                :{backgroundColor:'#111',border:'1px solid #1a1a1a'}}>
              <MoodIcon size={20} weight={entry.mood===i+1?'fill':'regular'}
                style={{color:entry.mood===i+1?MOOD_COLORS[i]:'#444'}}/>
              <span className="text-[9px]" style={{color:entry.mood===i+1?MOOD_COLORS[i]:'#444'}}>
                {MOOD_LABELS[i]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Síntomas y notas */}
      <div className="card">
        <p className="section-title mb-2">Síntomas y notas del día</p>
        <div className="space-y-2">
          <div>
            <span className="field-label">Síntomas (dolor, energía, etc.)</span>
            <input className="field-input" placeholder="Ej: Dolor de cabeza, cansancio, energía alta..."
              value={entry.symptoms||''} onChange={e=>upd('symptoms',e.target.value)}/>
          </div>
          <div>
            <span className="field-label">Notas adicionales</span>
            <textarea className="field-input resize-none" rows={2}
              placeholder="Cualquier observación del día..."
              value={entry.notes||''} onChange={e=>upd('notes',e.target.value)}/>
          </div>
        </div>
      </div>

      <button onClick={onSave} className="btn-primary w-full flex items-center justify-center gap-2">
        <FloppyDisk size={14}/> Guardar registro del día
      </button>
    </div>
  )
}

// ── Tab: Dashboard semanal ────────────────────────────────────────────────
function WeekTab({ log, goals, ambito }) {
  const weekDates = thisWeekDates()
  const DAY_LABELS = ['L','M','X','J','V','S','D']

  const weekLog = weekDates.map((d,i)=>{
    const e = log.find(x=>x.date===d) || {}
    return {
      day: DAY_LABELS[i],
      date: d,
      agua:  Number(e.water)||0,
      sueño: Number(e.sleep)||0,
      pasos: Number(e.steps)||0,
      humor: Number(e.mood)||0,
    }
  })

  const avgs = {
    agua:  (weekLog.reduce((a,d)=>a+d.agua,0)/7).toFixed(1),
    sueño: (weekLog.reduce((a,d)=>a+d.sueño,0)/7).toFixed(1),
    pasos: Math.round(weekLog.reduce((a,d)=>a+d.pasos,0)/7),
    humor: (weekLog.reduce((a,d)=>a+(d.humor||0),0)/7).toFixed(1),
  }

  // Score de salud: % de metas cumplidas en la semana
  const daysWithData = weekLog.filter(d=>d.agua>0||d.sueño>0)
  const score = daysWithData.length
    ? Math.round(daysWithData.reduce((a,d)=>{
        let pts = 0, total = 3
        if (d.agua>=goals.water)  pts++
        if (d.sueño>=goals.sleep) pts++
        if (d.pasos>=goals.steps) pts++
        return a + (pts/total)*100
      },0) / daysWithData.length)
    : 0

  const scoreColor = score>=80?'#4ade80':score>=60?'#c9a227':'#e05c5c'

  // Racha agua y sueño
  const waterStreak = calcMetricStreak(log, 'water', goals.water)
  const sleepStreak = calcMetricStreak(log, 'sleep', goals.sleep)

  const radarData = [
    { metric:'Agua',  val: Math.min(100,Math.round((avgs.agua/goals.water)*100)) },
    { metric:'Sueño', val: Math.min(100,Math.round((avgs.sueño/goals.sleep)*100)) },
    { metric:'Pasos', val: Math.min(100,Math.round((avgs.pasos/goals.steps)*100)) },
    { metric:'Humor', val: Math.round((avgs.humor/5)*100) },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Score semana */}
      <div className="card col-span-2 flex items-center gap-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg width={80} height={80} className="-rotate-90">
            <circle cx={40} cy={40} r={32} fill="none" stroke="#242424" strokeWidth={6}/>
            <circle cx={40} cy={40} r={32} fill="none" stroke={scoreColor} strokeWidth={6}
              strokeDasharray={2*Math.PI*32}
              strokeDashoffset={2*Math.PI*32*(1-score/100)}
              strokeLinecap="round" style={{transition:'stroke-dashoffset 0.5s'}}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[20px] font-bold font-mono" style={{color:scoreColor}}>{score}</span>
            <span className="text-[9px] text-lo">score</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-hi mb-1">Score de salud semanal</p>
          <p className="text-[12px] text-lo mb-2">Basado en metas cumplidas de agua, sueño y pasos</p>
          <div className="flex gap-3">
            {[[Drop,waterStreak,'Agua','#5b84e8'],[Moon,sleepStreak,'Sueño','#9575cd']].map(([Ico,streak,label,color])=>(
              <div key={label} className="flex items-center gap-1.5">
                <Ico size={14} weight="fill" style={{color}}/>
                <div>
                  <p className="text-[14px] font-bold text-hi leading-none">{streak}</p>
                  <p className="text-[10px] text-lo">días racha {label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score — full width */}
      {/* Promedios */}
      <div className="col-span-2 grid grid-cols-4 gap-2">
        {[
          { label:'Agua/día', val:`${avgs.agua}v`, goal:`/${goals.water}`, color:'#5b84e8' },
          { label:'Sueño/día', val:`${avgs.sueño}h`, goal:`/${goals.sleep}h`, color:'#9575cd' },
          { label:'Pasos/día', val:avgs.pasos.toLocaleString(), goal:`/${(goals.steps/1000).toFixed(0)}k`, color:ambito.color },
          { label:'Humor',     val:`${avgs.humor}/5`, goal:'', color:MOOD_COLORS[Math.round(avgs.humor)-1]||'#888' },
        ].map(m=>(
          <div key={m.label} className="card py-3 text-center">
            <p className="text-[18px] font-bold font-mono" style={{color:m.color}}>{m.val}</p>
            <p className="text-[9px] text-lo">{m.goal}</p>
            <p className="text-[10px] text-lo mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Radar */}
      <div className="card">
        <p className="section-title mb-1">Equilibrio semanal</p>
        <ResponsiveContainer width="100%" height={180}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#242424"/>
            <PolarAngleAxis dataKey="metric" tick={{fill:'#555',fontSize:11}}/>
            <Radar dataKey="val" stroke={ambito.color} fill={ambito.color} fillOpacity={0.2} strokeWidth={2}/>
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Barras diarias */}
      <div className="card">
        <p className="section-title mb-2">Agua esta semana</p>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={weekLog} barSize={16}>
            <XAxis dataKey="day" tick={{fill:'#555',fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:8,fontSize:11}}
              formatter={v=>[`${v} vasos`,'Agua']}/>
            <Bar dataKey="agua" fill="#5b84e8" fillOpacity={0.8} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <p className="section-title mb-2">Sueño esta semana</p>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={weekLog} barSize={16}>
            <XAxis dataKey="day" tick={{fill:'#555',fontSize:10}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:8,fontSize:11}}
              formatter={v=>[`${v}h`,'Sueño']}/>
            <Bar dataKey="sueño" fill="#9575cd" fillOpacity={0.8} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Tab: Historial ────────────────────────────────────────────────────────
function HistorialTab({ log, goals, ambito }) {
  const [metric, setMetric] = useState('weight')

  const METRICS = [
    { k:'weight',      label:'Peso',       color:'#4cae8a', unit:'kg',   field:'weight'     },
    { k:'water',       label:'Agua',       color:'#5b84e8', unit:'v',    field:'water'      },
    { k:'sleep',       label:'Sueño',      color:'#9575cd', unit:'h',    field:'sleep'      },
    { k:'steps',       label:'Pasos',      color:ambito.color, unit:'', field:'steps'      },
    { k:'heartRate',   label:'FC reposo',  color:'#e05c5c', unit:'bpm',  field:'heartRate'  },
    { k:'mood',        label:'Humor',      color:MOOD_COLORS[2], unit:'/5', field:'mood'   },
    { k:'temperature', label:'Temp',       color:'#38bdf8', unit:'°C',   field:'temperature'},
  ]

  const sel = METRICS.find(m=>m.k===metric)
  const data = log.slice(0,30).reverse()
    .filter(e=>e[sel.field]!=null && e[sel.field]!=='')
    .map(e=>({ day:e.date.slice(5), val:Number(e[sel.field]), note:e.symptoms||'' }))

  // Síntomas recientes
  const symptomsLog = log.filter(e=>e.symptoms).slice(0,10)

  return (
    <div className="space-y-4">
      {/* Selector métrica */}
      <div className="flex flex-wrap gap-1.5">
        {METRICS.map(m=>(
          <button key={m.k} onClick={()=>setMetric(m.k)}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={metric===m.k
              ?{backgroundColor:m.color+'20',color:m.color,border:`1px solid ${m.color}40`}
              :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Gráfica */}
      {data.length>1 ? (
        <div className="card">
          <p className="section-title mb-1">{sel.label} — últimos 30 días</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data}>
              <XAxis dataKey="day" tick={{fill:'#555',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:8,fontSize:11}}
                formatter={v=>[`${v}${sel.unit}`,sel.label]}/>
              <Line type="monotone" dataKey="val" stroke={sel.color} strokeWidth={2}
                dot={{r:3,fill:sel.color}} activeDot={{r:5}}/>
            </LineChart>
          </ResponsiveContainer>
          {/* Min/Max/Avg */}
          <div className="flex gap-4 mt-2 pt-2 border-t border-border">
            {[
              ['Mín', Math.min(...data.map(d=>d.val))],
              ['Máx', Math.max(...data.map(d=>d.val))],
              ['Prom',(data.reduce((a,d)=>a+d.val,0)/data.length).toFixed(1)],
            ].map(([l,v])=>(
              <div key={l} className="text-center flex-1">
                <p className="text-[14px] font-bold font-mono" style={{color:sel.color}}>{v}{sel.unit}</p>
                <p className="text-[10px] text-lo">{l}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card py-8 text-center text-lo text-[13px]">
          Sin suficientes datos para {sel.label}. Registra al menos 2 días.
        </div>
      )}

      {/* Síntomas recientes */}
      {symptomsLog.length>0 && (
        <div className="card">
          <p className="section-title mb-2">Síntomas recientes</p>
          <div className="space-y-2">
            {symptomsLog.map(e=>(
              <div key={e.date} className="flex items-start gap-2">
                <span className="text-[10px] font-mono text-lo shrink-0 mt-0.5">{e.date.slice(5)}</span>
                <p className="text-[12px] text-mid">{e.symptoms}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Medicamentos ─────────────────────────────────────────────────────
function MedsTab({ ambito }) {
  const [meds, setMeds]     = useState(getMeds)
  const [medLog, setMedLog] = useState(getMedLog)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]     = useState({ name:'', dose:'', times:1, color:'#2cb99a' })
  const todayStr = today()

  const MED_COLORS = ['#2cb99a','#5b84e8','#9575cd','#e05c5c','#c9a227','#f97316','#38bdf8']

  const handleAdd = () => {
    if (!form.name.trim()) return
    setMeds(addMed(form))
    setForm({ name:'', dose:'', times:1, color:'#2cb99a' })
    setShowAdd(false)
  }

  const toggle = (medId) => {
    setMedLog(toggleMedTaken(medId, todayStr))
  }

  const taken = (medId) => !!medLog[`${todayStr}_${medId}`]
  const allTaken = meds.length>0 && meds.every(m=>taken(m.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-hi">Medicamentos y suplementos</h3>
          {meds.length>0 && (
            <p className="text-[11px] text-lo mt-0.5">
              {meds.filter(m=>taken(m.id)).length}/{meds.length} tomados hoy
              {allTaken && ' ✅'}
            </p>
          )}
        </div>
        <button onClick={()=>setShowAdd(v=>!v)} className="btn-primary flex items-center gap-1.5 py-1.5 text-[12px]">
          <Plus size={12} weight="bold"/> Agregar
        </button>
      </div>

      {showAdd && (
        <div className="card space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="field-label">Nombre</span>
              <input className="field-input" autoFocus placeholder="Vitamina D, Omega 3..."
                value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div>
              <span className="field-label">Dosis</span>
              <input className="field-input" placeholder="500mg, 1 cápsula..."
                value={form.dose} onChange={e=>setForm(f=>({...f,dose:e.target.value}))}/>
            </div>
          </div>
          <div>
            <span className="field-label">Color</span>
            <div className="flex gap-2 mt-1">
              {MED_COLORS.map(c=>(
                <button key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{backgroundColor:c,
                          border: form.color===c?'2px solid white':'2px solid transparent',
                          transform: form.color===c?'scale(1.2)':'scale(1)'}}>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 text-[12px]" onClick={()=>setShowAdd(false)}>Cancelar</button>
            <button className="btn-primary flex-1 text-[12px]" onClick={handleAdd}>Guardar</button>
          </div>
        </div>
      )}

      {meds.length===0 ? (
        <div className="card py-10 text-center">
          <Pill size={28} className="mx-auto mb-2 text-lo"/>
          <p className="text-[13px] text-lo">Sin medicamentos registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {meds.map(m=>{
            const isTaken = taken(m.id)
            return (
              <div key={m.id} className="card flex items-center gap-3 group transition-all"
                style={isTaken?{backgroundColor:m.color+'08',borderColor:m.color+'30'}:{}}>
                <button onClick={()=>toggle(m.id)}
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all"
                  style={{backgroundColor:isTaken?m.color:'transparent',
                          border:`2px solid ${isTaken?m.color:m.color+'50'}`}}>
                  {isTaken && <Check size={13} color="#000" weight="bold"/>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold" style={{color:isTaken?m.color:'#ccc',
                    textDecoration:isTaken?'none':'none'}}>
                    {m.name}
                  </p>
                  {m.dose && <p className="text-[11px] text-lo">{m.dose}</p>}
                </div>
                {isTaken && <span className="text-[10px] font-semibold" style={{color:m.color}}>Tomado ✓</span>}
                <button onClick={()=>setMeds(deleteMed(m.id))}
                  className="btn-icon opacity-0 group-hover:opacity-100">
                  <X size={12}/>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tab: Metas ────────────────────────────────────────────────────────────
function GoalsTab({ goals, setGoals, ambito }) {
  const [form, setForm] = useState(goals)
  const [saved, setSaved] = useState(false)

  const save = () => {
    saveHealthGoals(form)
    setGoals(form)
    setSaved(true)
    setTimeout(()=>setSaved(false),2000)
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-4">
        <p className="text-[14px] font-semibold text-hi">Metas personalizadas</p>

        {[
          { k:'water', label:'Meta de agua', unit:'vasos/día', min:1, max:20, color:'#5b84e8',
            icon: <Drop size={14} color="#5b84e8" weight="fill"/> },
          { k:'sleep', label:'Meta de sueño', unit:'horas/día', min:4, max:12, step:0.5, color:'#9575cd',
            icon: <Moon size={14} color="#9575cd" weight="fill"/> },
          { k:'steps', label:'Meta de pasos', unit:'pasos/día', min:1000, max:30000, step:500, color:ambito.color,
            icon: <PersonSimpleRun size={14} color={ambito.color} weight="fill"/> },
        ].map(m=>(
          <div key={m.k}>
            <div className="flex items-center justify-between mb-2">
              <span className="field-label flex items-center gap-1.5 mb-0">{m.icon}{m.label}</span>
              <span className="text-[13px] font-bold font-mono" style={{color:m.color}}>
                {form[m.k]} <span className="text-[10px] font-normal text-lo">{m.unit}</span>
              </span>
            </div>
            <input type="range" min={m.min} max={m.max} step={m.step||1}
              value={form[m.k]}
              onChange={e=>setForm(f=>({...f,[m.k]:Number(e.target.value)}))}
              className="w-full accent-current"
              style={{accentColor:m.color}}/>
            <div className="flex justify-between text-[10px] text-lo mt-0.5">
              <span>{m.min}</span><span>{m.max}</span>
            </div>
          </div>
        ))}

        <button onClick={save} className="btn-primary w-full flex items-center justify-center gap-2">
          {saved ? <><Check size={14} weight="bold"/> Guardado</> : <><FloppyDisk size={14}/> Guardar metas</>}
        </button>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────
const TABS = ['Hoy','Semana','Historial','Medicamentos','Metas']
const TAB_ICONS = { Hoy:Drop, Semana:ChartLine, Historial:Fire, Medicamentos:Pill, Metas:Target }

export default function SaludView({ ambito }) {
  const habits = getHabits()
  const [tab,     setTab]     = useState('Hoy')
  const [entry,   setEntry]   = useState(getTodayHealth)
  const [goals,   setGoals]   = useState(getHealthGoals)
  const [saved,   setSaved]   = useState(false)
  const log = useMemo(()=>getHealthLog().slice(0,60),[saved])

  // Auto-guarda en localStorage cada vez que entry cambia
  useEffect(() => { saveTodayHealth(entry) }, [entry])

  const handleSave = () => {
    saveTodayHealth(entry)
    setSaved(s=>!s)
  }

  return (
    <div className="min-h-screen">
      <AmbitoHeader ambito={ambito} habits={habits}/>

      <div className="px-6 pt-4 pb-1">
        <div className="flex gap-1 bg-black/30 rounded-xl p-1 overflow-x-auto scrollbar-none">
          {TABS.map(t=>{
            const Icon = TAB_ICONS[t]
            return (
              <button key={t} onClick={()=>setTab(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex-1 justify-center"
                style={tab===t?{backgroundColor:ambito.color+'20',color:ambito.color}:{color:'#555'}}>
                <Icon size={12}/>{t}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-3 md:p-6">
        {tab==='Hoy'          && <TodayTab    entry={entry} setEntry={setEntry} goals={goals} ambito={ambito} onSave={handleSave}/>}
        {tab==='Semana'       && <WeekTab     log={log} goals={goals} ambito={ambito}/>}
        {tab==='Historial'    && <HistorialTab log={log} goals={goals} ambito={ambito}/>}
        {tab==='Medicamentos' && <MedsTab     ambito={ambito}/>}
        {tab==='Metas'        && <GoalsTab    goals={goals} setGoals={setGoals} ambito={ambito}/>}
      </div>
    </div>
  )
}
