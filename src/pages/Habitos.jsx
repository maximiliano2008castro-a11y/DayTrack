import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip as RTooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import {
  Plus, X, Fire, Trophy, ChartBar, Check, PencilSimple,
  Trash, CaretLeft, CaretRight, ArrowCounterClockwise,
} from '@phosphor-icons/react'
import {
  getHabits, addHabit, updateHabit, deleteHabit,
  toggleHabitDay, AMBITOS, getAmbito, habitDueOn,
} from '../store'
import { getAmbitoIcon } from '../ambitoIcons'

// ── Helpers ────────────────────────────────────────────────────────────────────
const pad  = n => String(n).padStart(2,'0')
const ds   = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
const todayStr = () => ds(new Date())
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DOW_LABELS  = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const DOW_JS      = [1,2,3,4,5,6,0]
const EMOJIS = ['✅','💪','📚','💧','🏃','🧘','🥗','😴','🎯','✍️','🎸','🌿','🔥','⭐','🧠','❤️','💊','🚴']
const FREQ_TYPES = [
  { k:'diario',       l:'Todos los días' },
  { k:'diasSemana',   l:'Días específicos' },
  { k:'vecesxsemana', l:'X veces/semana' },
]

function getLast(n) {
  return Array.from({length:n},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(n-1-i)); return d })
}
function getWeekOffset(offset=0) {
  const now=new Date(), dow=(now.getDay()+6)%7
  return Array.from({length:7},(_,i)=>{ const d=new Date(now); d.setDate(d.getDate()-dow+i+offset*7); return d })
}
function getDaysOffset(n, offset=0) {
  return Array.from({length:n},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(n-1-i)+offset*n); return d })
}
function periodLabel(days) {
  if(!days.length) return ''
  const first=days[0], last=days[days.length-1]
  if(first.getFullYear()===last.getFullYear() && first.getMonth()===last.getMonth())
    return `${first.getDate()}–${last.getDate()} ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`
  return `${first.getDate()} ${MONTH_NAMES[first.getMonth()]} – ${last.getDate()} ${MONTH_NAMES[last.getMonth()]} ${last.getFullYear()}`
}
function weekLabel(days) {
  if(!days.length) return ''
  const now=new Date(), dow=(now.getDay()+6)%7
  const thisMonday=new Date(now); thisMonday.setDate(now.getDate()-dow)
  const diff=Math.round((days[0]-thisMonday)/(7*24*3600*1000))
  if(diff===0)  return 'Esta semana'
  if(diff===-1) return 'Semana pasada'
  if(diff===1)  return 'Próxima semana'
  return periodLabel(days)
}

function streakCurrent(habit) {
  let c=0; const d=new Date()
  for(;;){ if(habit.completedDays.includes(ds(d))){c++;d.setDate(d.getDate()-1)}else break; if(c>365)break }
  return c
}
function streakBest(habit) {
  if(!habit.completedDays.length) return 0
  const sorted=[...habit.completedDays].sort(); let best=1,cur=1
  for(let i=1;i<sorted.length;i++){
    const prev=new Date(sorted[i-1]); prev.setDate(prev.getDate()+1)
    if(ds(prev)===sorted[i]){cur++;best=Math.max(best,cur)}else cur=1
  }
  return best
}
function consistency(habit, days) {
  const valid=days.filter(Boolean)
  if(!valid.length) return 0
  const due=valid.filter(d=>habitDueOn(habit,ds(d)))
  if(!due.length) return 0
  return Math.round(due.filter(d=>habit.completedDays.includes(ds(d))).length/due.length*100)
}

/** Genera grid de semanas correctamente alineadas (Lun-Dom) */
function getHeatmapGrid(days) {
  if(!days.length) return []
  const first=days[0], last=days[days.length-1]
  const startDow=(first.getDay()+6)%7
  const gridStart=new Date(first); gridStart.setDate(gridStart.getDate()-startDow)
  const endDow=(last.getDay()+6)%7
  const gridEnd=new Date(last); gridEnd.setDate(gridEnd.getDate()+(6-endDow))
  const cells=[]
  const cur=new Date(gridStart)
  while(cur<=gridEnd){
    const inRange=ds(cur)>=ds(first)&&ds(cur)<=ds(last)
    cells.push(inRange?new Date(cur):null)
    cur.setDate(cur.getDate()+1)
  }
  const weeks=[]
  for(let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7))
  return weeks
}

/** Color del heatmap según nivel de completado (estilo GitHub) */
function heatColor(done, total, baseColor) {
  if(!total || total===0) return '#111'
  const pct=done/total
  if(pct===0)  return '#111'
  if(pct<0.34) return baseColor+'30'
  if(pct<0.67) return baseColor+'55'
  if(pct<1.0)  return baseColor+'88'
  return baseColor+'cc'
}

function defaultForm() {
  return { name:'', emoji:'✅', ambitoId:AMBITOS[0].id, goal:'',
           frequency:{ type:'diario', days:[], count:3 }, color:'' }
}

// ── SVG Ring ──────────────────────────────────────────────────────────────────
function MiniRing({pct,size=56,stroke=5,color='#2cb99a'}){
  const r=(size-stroke)/2, circ=2*Math.PI*r, offset=circ*(1-pct/100)
  return(
    <div className="relative flex items-center justify-center" style={{width:size,height:size}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e1e1e" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{transition:'stroke-dashoffset 0.7s ease'}}/>
      </svg>
      <span className="absolute text-[11px] font-black font-mono" style={{color}}>{pct}%</span>
    </div>
  )
}

// ── Tooltip personalizado para gráficas ───────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if(!active||!payload?.length) return null
  const d=payload[0]?.payload
  return(
    <div className="rounded-xl px-3 py-2 text-[11px]" style={{backgroundColor:'#1a1a1a',border:'1px solid #2a2a2a'}}>
      <p className="font-semibold text-hi mb-0.5">{label}</p>
      {d&&<p style={{color:'#2cb99a'}}>{d.done}/{d.total} · <span className="font-black">{d.pct??d.value}%</span></p>}
    </div>
  )
}

// ── Modal crear/editar ────────────────────────────────────────────────────────
function HabitModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || defaultForm())
  const set    = (k,v) => setForm(f=>({...f,[k]:v}))
  const setFreq= (k,v) => setForm(f=>({...f,frequency:{...f.frequency,[k]:v}}))
  const toggleDay = dow => {
    const days=form.frequency.days||[]
    setFreq('days', days.includes(dow)?days.filter(d=>d!==dow):[...days,dow])
  }
  const amb    = AMBITOS.find(a=>a.id===form.ambitoId)
  const isEdit = !!initial

  const freqLabel = () => {
    const {type,days,count}=form.frequency
    if(type==='diario') return 'Todos los días'
    if(type==='diasSemana') return days.length?DOW_LABELS.filter((_,i)=>days.includes(DOW_JS[i])).join(', '):'Sin días'
    return `${count||1}× por semana`
  }

  return(
    <div className="modal-backdrop fixed inset-0 bg-black/60 flex items-end justify-center z-50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="modal-sheet bg-[#0d0d0d] border border-border rounded-t-3xl w-full max-h-[93vh] flex flex-col"
        style={{borderTop:`3px solid ${amb?.color||'#2cb99a'}`}}
        onClick={e=>e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/10"/>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h2 className="text-[15px] font-bold text-hi">{isEdit?'Editar hábito':'Nuevo hábito'}</h2>
          <button className="btn-icon" onClick={onClose}><X size={14}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Emoji + nombre */}
          <div className="grid grid-cols-[56px_1fr] gap-3">
            <div>
              <span className="field-label">Emoji</span>
              <input className="field-input text-center text-[22px] px-1" value={form.emoji}
                onChange={e=>set('emoji',e.target.value)}/>
            </div>
            <div>
              <span className="field-label">Nombre</span>
              <input className="field-input" placeholder="Ej: Leer 20 min..."
                value={form.name} onChange={e=>set('name',e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&form.name.trim()&&onSave(form)} autoFocus/>
            </div>
          </div>

          {/* Emojis rápidos */}
          <div>
            <span className="field-label">Elige emoji</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {EMOJIS.map(e=>(
                <button key={e} onClick={()=>set('emoji',e)}
                  className="w-8 h-8 rounded-lg text-[16px] flex items-center justify-center transition-all"
                  style={form.emoji===e
                    ?{backgroundColor:amb?.color+'22',border:`1px solid ${amb?.color}50`}
                    :{backgroundColor:'#111',border:'1px solid #1a1a1a'}}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div>
            <span className="field-label">Meta (opcional)</span>
            <input className="field-input" placeholder="Ej: 30 min, 2 litros, 10 páginas..."
              value={form.goal} onChange={e=>set('goal',e.target.value)}/>
          </div>

          {/* Ámbito */}
          <div>
            <span className="field-label">Ámbito</span>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              {AMBITOS.map(a=>{
                const Icon=getAmbitoIcon(a.id), active=form.ambitoId===a.id
                return(
                  <button key={a.id} onClick={()=>set('ambitoId',a.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] text-left transition-all"
                    style={active
                      ?{backgroundColor:a.color+'18',color:a.color,border:`1px solid ${a.color}40`}
                      :{backgroundColor:'#111',border:'1px solid #1a1a1a',color:'#555'}}>
                    <Icon size={13} weight={active?'fill':'regular'} style={{color:a.color}}/>
                    {a.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Frecuencia */}
          <div>
            <span className="field-label">Frecuencia</span>
            <div className="flex gap-1.5 mt-1.5">
              {FREQ_TYPES.map(({k,l})=>(
                <button key={k} onClick={()=>setFreq('type',k)}
                  className="flex-1 py-2 rounded-xl text-[10px] font-semibold transition-all"
                  style={form.frequency.type===k
                    ?{backgroundColor:amb?.color+'20',color:amb?.color,border:`1px solid ${amb?.color}40`}
                    :{backgroundColor:'#111',border:'1px solid #1a1a1a',color:'#555'}}>
                  {l}
                </button>
              ))}
            </div>

            {form.frequency.type==='diasSemana'&&(
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {DOW_LABELS.map((label,i)=>{
                  const dow=DOW_JS[i], active=(form.frequency.days||[]).includes(dow)
                  return(
                    <button key={i} onClick={()=>toggleDay(dow)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                      style={active
                        ?{backgroundColor:amb?.color+'20',color:amb?.color,border:`1px solid ${amb?.color}40`}
                        :{backgroundColor:'#111',border:'1px solid #1a1a1a',color:'#555'}}>
                      {label}
                    </button>
                  )
                })}
              </div>
            )}

            {form.frequency.type==='vecesxsemana'&&(
              <div className="mt-3">
                <p className="text-[11px] text-lo mb-2">¿Cuántas veces a la semana?</p>
                <div className="flex gap-2">
                  {[1,2,3,4,5,6,7].map(n=>(
                    <button key={n} onClick={()=>setFreq('count',n)}
                      className="w-9 h-9 rounded-xl text-[13px] font-bold transition-all"
                      style={(form.frequency.count||3)===n
                        ?{backgroundColor:amb?.color+'20',color:amb?.color,border:`1px solid ${amb?.color}40`}
                        :{backgroundColor:'#111',border:'1px solid #1a1a1a',color:'#555'}}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] mt-2 px-1" style={{color:(amb?.color||'#2cb99a')+'88'}}>
              → {freqLabel()}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
          <button className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
          <button className="btn-primary flex-1"
            onClick={()=>form.name.trim()&&onSave(form)}
            style={{opacity:form.name.trim()?1:0.45}}>
            {isEdit?'Guardar cambios':'Crear hábito'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Habit Card (HOY) ──────────────────────────────────────────────────────────
function HabitCard({habit,done,today,onToggle,onEdit,onDelete}){
  const amb   = getAmbito(habit.ambitoId)
  const Icon  = getAmbitoIcon(habit.ambitoId)
  const streak= streakCurrent(habit)
  const color = habit.color||amb.color

  return(
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group"
      style={{
        backgroundColor:done?color+'0e':'#0d0d0d',
        border:`1px solid ${done?color+'35':'#181818'}`,
      }}>
      <div className="w-1 h-10 rounded-full shrink-0" style={{backgroundColor:color+(done?'80':'30')}}/>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold leading-tight"
          style={{color:done?'#555':'#ddd',textDecoration:done?'line-through':'none'}}>
          {habit.emoji} {habit.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <div className="flex items-center gap-1">
            <Icon size={9} weight="fill" style={{color}}/>
            <span className="text-[10px] font-semibold" style={{color:color+'aa'}}>{amb.name}</span>
          </div>
          {habit.goal&&<span className="text-[10px] text-lo">· {habit.goal}</span>}
          {(()=>{const{type,days,count}=habit.frequency||{type:'diario'};
            if(type==='diario') return<span key="f" className="text-[9px] text-lo bg-white/5 px-1.5 py-0.5 rounded">Diario</span>
            if(type==='diasSemana') return<span key="f" className="text-[9px] text-lo bg-white/5 px-1.5 py-0.5 rounded">{(days||[]).length}d/sem</span>
            return<span key="f" className="text-[9px] text-lo bg-white/5 px-1.5 py-0.5 rounded">{count}×/sem</span>
          })()}
          {streak>1&&(
            <div className="flex items-center gap-0.5">
              <Fire size={10} weight="fill" style={{color:'#e07c4a'}}/>
              <span className="text-[10px] font-mono font-bold" style={{color:'#e07c4a'}}>{streak}d</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
        <button onClick={onEdit}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-lo hover:text-mid transition-all"
          style={{backgroundColor:'#1a1a1a'}}>
          <PencilSimple size={11}/>
        </button>
        <button onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-lo hover:text-red-400 transition-all"
          style={{backgroundColor:'#1a1a1a'}}>
          <Trash size={11}/>
        </button>
      </div>

      <button onClick={()=>onToggle(habit.id,today)}
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90"
        style={done
          ?{backgroundColor:color+'20',border:`1px solid ${color}55`}
          :{backgroundColor:'#1a1a1a',border:'1px solid #252525'}}>
        {done
          ?<Check size={16} weight="bold" style={{color}}/>
          :<div className="w-4 h-4 rounded-full border-2" style={{borderColor:'#303030'}}/>
        }
      </button>
    </div>
  )
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function Habitos(){
  const [habits,     setHabits]     = useState(getHabits)
  const [tab,        setTab]        = useState('hoy')
  const [modal,      setModal]      = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [histPeriod, setHistPeriod] = useState('mes')
  const [histOffset, setHistOffset] = useState(0)

  const today = todayStr()
  const HIST_N = { semana:7, mes:30, '3meses':90 }

  const week     = useMemo(()=>getWeekOffset(weekOffset),  [weekOffset])
  const histDays = useMemo(()=>getDaysOffset(HIST_N[histPeriod], histOffset), [histPeriod, histOffset])

  // ── Datos HOY
  const dueToday   = habits.filter(h=>habitDueOn(h,today))
  const todayDone  = dueToday.filter(h=>h.completedDays.includes(today)).length
  const todayTotal = dueToday.length
  const todayPct   = todayTotal>0?Math.round(todayDone/todayTotal*100):0
  const sortedToday= [...dueToday].sort((a,b)=>{
    const da=a.completedDays.includes(today),db=b.completedDays.includes(today)
    return da===db?0:da?1:-1
  })

  // ── Datos SEMANA (gráfica)
  const weekChartData = useMemo(()=>week.map((d,i)=>{
    const dateStr=ds(d)
    const total=habits.filter(h=>habitDueOn(h,dateStr)).length
    const done =habits.filter(h=>habitDueOn(h,dateStr)&&h.completedDays.includes(dateStr)).length
    const pct  =total>0?Math.round(done/total*100):0
    return { label:DOW_LABELS[i], shortDate:`${d.getDate()}`, pct, done, total, isToday:dateStr===today, date:dateStr }
  }),[week,habits,today])

  // ── Datos HISTORIAL (gráfica global de tendencia)
  const histChartData = useMemo(()=>{
    // Para >30 días, agrupar por semana para no saturar
    if(histDays.length>30){
      const weeks=[]
      for(let i=0;i<histDays.length;i+=7){
        const chunk=histDays.slice(i,i+7)
        const total=chunk.reduce((s,d)=>s+habits.filter(h=>habitDueOn(h,ds(d))).length,0)
        const done =chunk.reduce((s,d)=>s+habits.filter(h=>habitDueOn(h,ds(d))&&h.completedDays.includes(ds(d))).length,0)
        const pct  =total>0?Math.round(done/total*100):0
        const label=`${chunk[0].getDate()} ${MONTH_NAMES[chunk[0].getMonth()]}`
        weeks.push({label,pct,done,total})
      }
      return weeks
    }
    return histDays.map(d=>{
      const dateStr=ds(d)
      const total=habits.filter(h=>habitDueOn(h,dateStr)).length
      const done =habits.filter(h=>habitDueOn(h,dateStr)&&h.completedDays.includes(dateStr)).length
      const pct  =total>0?Math.round(done/total*100):null
      const label=`${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
      return {label,pct,done,total,date:dateStr,isToday:dateStr===today}
    })
  },[histDays,habits])

  // ── Stats globales historial
  const globalStats = useMemo(()=>{
    if(!habits.length) return {bestStreak:0,totalComplete:0,avgConsistency:0}
    const bestStreak=Math.max(...habits.map(streakBest))
    const totalComplete=habits.reduce((s,h)=>s+h.completedDays.length,0)
    const avgConsistency=Math.round(habits.reduce((s,h)=>s+consistency(h,histDays),0)/habits.length)
    return {bestStreak,totalComplete,avgConsistency}
  },[habits,histDays])

  const handleSave = form => {
    if(modal?.mode==='edit'){
      setHabits(updateHabit(modal.habit.id,{
        name:form.name,emoji:form.emoji,ambitoId:form.ambitoId,
        goal:form.goal,frequency:form.frequency,color:form.color,
      }))
    } else {
      setHabits(addHabit({
        name:form.name.trim(),emoji:form.emoji,ambitoId:form.ambitoId,
        goal:form.goal,frequency:form.frequency,color:form.color,
      }))
    }
    setModal(null)
  }
  const handleDelete = id => setHabits(deleteHabit(id))
  const handleToggle = (id,date) => setHabits(toggleHabitDay(id,date))

  const TABS = [{k:'hoy',l:'Hoy'},{k:'semana',l:'Semana'},{k:'historial',l:'Historial'}]

  const histPeriodLabel = () => {
    if(histOffset===0)  return 'Período actual'
    if(histOffset===-1) return 'Período anterior'
    return `Hace ${-histOffset} períodos`
  }

  return(
    <div className="min-h-screen p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MiniRing pct={todayPct} color="#2cb99a"/>
          <div>
            <h1 className="text-[20px] font-black text-hi leading-tight">Hábitos</h1>
            <p className="text-[12px] text-lo">
              {todayDone}/{todayTotal} hoy
              {habits.length>0&&<> · {habits.length} hábito{habits.length!==1?'s':''}</>}
            </p>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-1.5 text-[12px]"
          onClick={()=>setModal({mode:'add'})}>
          <Plus size={13} weight="bold"/> Nuevo
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111] rounded-xl p-1">
        {TABS.map(({k,l})=>(
          <button key={k} onClick={()=>setTab(k)}
            className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={tab===k?{backgroundColor:'#1e1e1e',color:'#e2e2e2'}:{color:'#505050'}}>
            {l}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════ HOY ══════════════════════════════════ */}
      {tab==='hoy'&&(
        <div className="space-y-2">
          {habits.length===0?(
            <div className="card py-14 text-center">
              <p className="text-[36px] mb-3">🌱</p>
              <p className="text-[14px] font-semibold text-hi mb-1">Sin hábitos aún</p>
              <p className="text-[12px] text-lo mb-4">Crea tu primer hábito y empieza el tracking.</p>
              <button className="btn-primary" onClick={()=>setModal({mode:'add'})}>
                <Plus size={13} weight="bold" className="inline mr-1"/>Crear hábito
              </button>
            </div>
          ):(
            <>
              {/* Banner todo completo */}
              {todayDone===todayTotal&&todayTotal>0&&(
                <div className="rounded-2xl py-5 text-center"
                  style={{backgroundColor:'#2cb99a09',border:'1px solid #2cb99a22'}}>
                  <p className="text-[26px] mb-1"></p>
                  <p className="text-[14px] font-black" style={{color:'#2cb99a'}}>¡Todo completo!</p>
                  <p className="text-[11px] text-lo mt-0.5">{todayTotal} hábito{todayTotal!==1?'s':''} del día marcado{todayTotal!==1?'s':''}.</p>
                </div>
              )}

              {sortedToday.map(h=>(
                <HabitCard key={h.id} habit={h}
                  done={h.completedDays.includes(today)}
                  today={today} onToggle={handleToggle}
                  onEdit={()=>setModal({mode:'edit',habit:h})}
                  onDelete={()=>handleDelete(h.id)}/>
              ))}

              {/* No programados hoy */}
              {habits.filter(h=>!habitDueOn(h,today)).length>0&&(
                <details className="group">
                  <summary className="text-[11px] text-lo cursor-pointer select-none flex items-center gap-1 px-1 py-2">
                    No programados hoy ({habits.filter(h=>!habitDueOn(h,today)).length})
                  </summary>
                  <div className="space-y-1.5 mt-1">
                    {habits.filter(h=>!habitDueOn(h,today)).map(h=>(
                      <HabitCard key={h.id} habit={h}
                        done={h.completedDays.includes(today)}
                        today={today} onToggle={handleToggle}
                        onEdit={()=>setModal({mode:'edit',habit:h})}
                        onDelete={()=>handleDelete(h.id)}/>
                    ))}
                  </div>
                </details>
              )}

              {/* Chips por ámbito */}
              <div className="flex flex-wrap gap-2 pt-1">
                {AMBITOS.map(a=>{
                  const ah=dueToday.filter(h=>h.ambitoId===a.id)
                  if(!ah.length) return null
                  const done=ah.filter(h=>h.completedDays.includes(today)).length
                  const Icon=getAmbitoIcon(a.id)
                  const allDone=done===ah.length
                  return(
                    <div key={a.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                      style={{backgroundColor:a.color+'10',border:`1px solid ${a.color+'25'}`}}>
                      <Icon size={11} weight="fill" style={{color:a.color}}/>
                      <span className="text-[11px] font-semibold" style={{color:a.color+'cc'}}>{a.name}</span>
                      <span className="text-[10px] font-mono font-bold"
                        style={{color:allDone?a.color:'#555'}}>
                        {done}/{ah.length}
                      </span>
                    </div>
                  )
                }).filter(Boolean)}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════ SEMANA ══════════════════════════════════ */}
      {tab==='semana'&&(
        <div className="space-y-4">

          {/* Navegación semana */}
          <div className="flex items-center justify-between gap-3">
            <button onClick={()=>setWeekOffset(o=>o-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lo hover:text-mid transition-all"
              style={{border:'1px solid #1e1e1e',backgroundColor:'#0d0d0d'}}>
              <CaretLeft size={14}/>
            </button>
            <div className="text-center flex-1">
              <p className="text-[14px] font-bold text-hi">{weekLabel(week)}</p>
              <p className="text-[10px] text-lo">{periodLabel(week)}</p>
            </div>
            <button onClick={()=>setWeekOffset(o=>Math.min(0,o+1))}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{
                border:'1px solid #1e1e1e', backgroundColor:'#0d0d0d',
                color:weekOffset>=0?'#1e1e1e':'#666',
                pointerEvents:weekOffset>=0?'none':'auto',
              }}>
              <CaretRight size={14}/>
            </button>
          </div>

          {/* Gráfica de barras semanal */}
          {habits.length>0&&(
            <div className="rounded-2xl p-4" style={{backgroundColor:'#0a0a0a',border:'1px solid #181818'}}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-lo mb-3">Completado por día (%)</p>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={weekChartData} barSize={28} margin={{top:0,right:0,left:-28,bottom:0}}>
                  <CartesianGrid vertical={false} stroke="#161616"/>
                  <XAxis dataKey="label" tick={{fontSize:10,fill:'#444'}} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,100]} tick={{fontSize:9,fill:'#333'}} axisLine={false} tickLine={false} tickCount={3}/>
                  <RTooltip content={<ChartTooltip/>} cursor={{fill:'#ffffff06'}}/>
                  <Bar dataKey="pct" radius={[5,5,2,2]}>
                    {weekChartData.map((entry,i)=>(
                      <Cell key={i}
                        fill={entry.isToday?'#2cb99a':entry.pct>=80?'#2cb99a55':entry.pct>=50?'#3a3a3a':'#252525'}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Leyenda día actual */}
              <div className="flex justify-between mt-2">
                {weekChartData.map((d,i)=>(
                  <div key={i} className="flex-1 text-center">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mx-auto"
                      style={d.isToday?{backgroundColor:'#2cb99a15',border:'1px solid #2cb99a40'}:{}}>
                      <span className="text-[9px] font-mono" style={{color:d.isToday?'#2cb99a':'#2a2a2a'}}>
                        {d.shortDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid hábitos × días */}
          {habits.length===0?(
            <div className="card py-10 text-center">
              <p className="text-[12px] text-lo">Sin hábitos. Crea uno primero.</p>
            </div>
          ):(
            <>
              {/* Header días */}
              <div className="grid gap-1" style={{gridTemplateColumns:'1fr repeat(7, 36px)'}}>
                <div/>
                {week.map((d,i)=>{
                  const isToday=ds(d)===today
                  return(
                    <div key={i} className="text-center">
                      <p className="text-[9px] font-bold uppercase"
                        style={{color:isToday?'#2cb99a':'#383838'}}>{DOW_LABELS[i]}</p>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-0.5"
                        style={isToday?{backgroundColor:'#2cb99a15',border:'1px solid #2cb99a35'}:{}}>
                        <p className="text-[11px] font-mono font-semibold"
                          style={{color:isToday?'#2cb99a':'#2e2e2e'}}>{d.getDate()}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Fila resumen */}
              <div className="grid gap-1" style={{gridTemplateColumns:'1fr repeat(7, 36px)'}}>
                <span className="text-[9px] text-lo flex items-center">Total</span>
                {weekChartData.map((d,i)=>(
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className="w-7 h-[3px] rounded-full overflow-hidden" style={{backgroundColor:'#1a1a1a'}}>
                      <div className="h-full rounded-full transition-all"
                        style={{width:`${d.pct}%`,backgroundColor:d.isToday?'#2cb99a':'#3a3a3a'}}/>
                    </div>
                    <span className="text-[8px] font-mono" style={{color:d.isToday?'#2cb99a':'#2a2a2a'}}>
                      {d.total>0?`${d.done}/${d.total}`:'·'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="h-px" style={{backgroundColor:'#151515'}}/>

              {/* Filas por ámbito */}
              {AMBITOS.map(a=>{
                const ah=habits.filter(h=>h.ambitoId===a.id)
                if(!ah.length) return null
                const Icon=getAmbitoIcon(a.id)
                return(
                  <div key={a.id}>
                    <div className="flex items-center gap-1.5 px-1 py-1.5 mt-1">
                      <Icon size={10} weight="fill" style={{color:a.color}}/>
                      <span className="text-[9px] font-bold uppercase tracking-wider"
                        style={{color:a.color+'70'}}>{a.name}</span>
                    </div>
                    {ah.map(h=>{
                      const color=h.color||a.color
                      return(
                        <div key={h.id} className="grid gap-1 items-center mb-2"
                          style={{gridTemplateColumns:'1fr repeat(7, 36px)'}}>
                          <div className="flex items-center gap-1.5 pr-1">
                            <div className="w-0.5 h-8 rounded-full shrink-0" style={{backgroundColor:color+'40'}}/>
                            <div className="min-w-0">
                              <span className="text-[11px] font-medium text-hi truncate block">{h.emoji} {h.name}</span>
                              {h.goal&&<span className="text-[9px] text-lo truncate block">{h.goal}</span>}
                            </div>
                          </div>
                          {week.map((d,i)=>{
                            const dateStr=ds(d)
                            const done=h.completedDays.includes(dateStr)
                            const isToday=dateStr===today
                            const isFuture=d>new Date()
                            const due=habitDueOn(h,dateStr)
                            return(
                              <button key={i}
                                onClick={()=>!isFuture&&handleToggle(h.id,dateStr)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                                title={`${dateStr}${done?' ✓':''}`}
                                style={{
                                  backgroundColor:done?color+'20':isToday?'#141414':'#0d0d0d',
                                  border:isToday
                                    ?`1px solid ${done?color+'60':'#2cb99a30'}`
                                    :`1px solid ${done?color+'40':'#161616'}`,
                                  opacity:isFuture?0.15:!due?0.3:1,
                                  cursor:isFuture?'default':'pointer',
                                }}>
                                {done
                                  ?<Check size={13} weight="bold" style={{color}}/>
                                  :!due&&!isFuture
                                    ?<div className="w-1 h-1 rounded-full" style={{backgroundColor:'#252525'}}/>
                                    :null
                                }
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}

          {weekOffset!==0&&(
            <button onClick={()=>setWeekOffset(0)}
              className="w-full py-2.5 text-[11px] text-lo hover:text-accent transition-colors rounded-xl flex items-center justify-center gap-1.5"
              style={{border:'1px dashed #1e1e1e'}}>
              <ArrowCounterClockwise size={12}/> Volver a esta semana
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════ HISTORIAL ══════════════════════════════════ */}
      {tab==='historial'&&(
        <div className="space-y-4">

          {/* Selector período */}
          <div className="flex gap-1 bg-[#111] rounded-xl p-1">
            {[['semana','1 Sem'],['mes','1 Mes'],['3meses','3 Meses']].map(([k,l])=>(
              <button key={k} onClick={()=>{setHistPeriod(k);setHistOffset(0)}}
                className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={histPeriod===k?{backgroundColor:'#1e1e1e',color:'#e2e2e2'}:{color:'#505050'}}>
                {l}
              </button>
            ))}
          </div>

          {/* Navegación período */}
          <div className="flex items-center justify-between gap-3">
            <button onClick={()=>setHistOffset(o=>o-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lo hover:text-mid transition-all"
              style={{border:'1px solid #1e1e1e',backgroundColor:'#0d0d0d'}}>
              <CaretLeft size={14}/>
            </button>
            <div className="text-center flex-1">
              <p className="text-[13px] font-bold text-hi">{histPeriodLabel()}</p>
              <p className="text-[10px] text-lo">{periodLabel(histDays)}</p>
            </div>
            <button onClick={()=>setHistOffset(o=>Math.min(0,o+1))}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{
                border:'1px solid #1e1e1e',backgroundColor:'#0d0d0d',
                color:histOffset>=0?'#1a1a1a':'#666',
                pointerEvents:histOffset>=0?'none':'auto',
              }}>
              <CaretRight size={14}/>
            </button>
          </div>

          {habits.length===0?(
            <div className="card py-12 text-center">
              <p className="text-[12px] text-lo mb-3">Sin datos aún.</p>
              <p className="text-[12px] text-lo">Sin hábitos para mostrar.</p>
            </div>
          ):(
            <>
              {/* Stats globales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  {icon:Fire,   label:'Mejor racha', val:globalStats.bestStreak>0?`${globalStats.bestStreak}d`:'—', color:'#e07c4a'},
                  {icon:Trophy, label:'Completados',  val:globalStats.totalComplete,                                  color:'#c9a227'},
                  {icon:ChartBar,label:histPeriod==='semana'?'7d':histPeriod==='mes'?'30d':'90d',
                    val:`${globalStats.avgConsistency}%`, color:'#2cb99a'},
                ].map(({icon:Ic,label,val,color})=>(
                  <div key={label} className="rounded-2xl px-3 py-3 text-center"
                    style={{backgroundColor:'#0a0a0a',border:'1px solid #181818'}}>
                    <Ic size={13} weight="fill" style={{color,margin:'0 auto 5px'}}/>
                    <p className="text-[17px] font-black font-mono leading-none" style={{color}}>{val}</p>
                    <p className="text-[9px] text-lo uppercase tracking-wider mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Gráfica de tendencia global */}
              <div className="rounded-2xl p-4" style={{backgroundColor:'#0a0a0a',border:'1px solid #181818'}}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-lo mb-3">
                  Tendencia de completado (%)
                </p>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={histChartData} margin={{top:4,right:0,left:-32,bottom:0}}>
                    <defs>
                      <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2cb99a" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#2cb99a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#131313" vertical={false}/>
                    <XAxis dataKey="label" tick={{fontSize:9,fill:'#333'}} axisLine={false} tickLine={false}
                      interval={histPeriod==='semana'?0:histPeriod==='mes'?4:'auto'}/>
                    <YAxis domain={[0,100]} tick={{fontSize:9,fill:'#2a2a2a'}} axisLine={false} tickLine={false} tickCount={3}/>
                    <RTooltip content={<ChartTooltip/>} cursor={{stroke:'#2cb99a20',strokeWidth:1}}/>
                    <Area type="monotone" dataKey="pct" stroke="#2cb99a" strokeWidth={1.5}
                      fill="url(#histGrad)" connectNulls dot={false}
                      activeDot={{r:3,fill:'#2cb99a',strokeWidth:0}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Cards por hábito */}
              {AMBITOS.map(a=>{
                const ah=habits.filter(h=>h.ambitoId===a.id)
                if(!ah.length) return null
                const Icon=getAmbitoIcon(a.id)
                return(
                  <div key={a.id}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{backgroundColor:a.color+'18'}}>
                        <Icon size={12} weight="fill" style={{color:a.color}}/>
                      </div>
                      <span className="text-[13px] font-bold" style={{color:a.color}}>{a.name}</span>
                    </div>

                    <div className="space-y-2 mb-3">
                      {ah.map(h=>{
                        const color=h.color||a.color
                        const cur=streakCurrent(h), best=streakBest(h)
                        const con=consistency(h,histDays)
                        const total=h.completedDays.length
                        const heatWeeks=getHeatmapGrid(histDays)
                        // tamaño celda según período
                        const cs=histPeriod==='semana'?26:histPeriod==='mes'?16:11

                        return(
                          <div key={h.id} className="rounded-2xl p-4 space-y-3"
                            style={{backgroundColor:'#0a0a0a',border:`1px solid #1a1a1a`}}>

                            {/* Header hábito */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-0.5 h-10 rounded-full shrink-0"
                                  style={{backgroundColor:color+'60'}}/>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold text-hi truncate">
                                    {h.emoji} {h.name}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                    {h.goal&&<span className="text-[10px] text-lo">{h.goal}</span>}
                                    <span className="text-[10px] text-lo">{total} días completados</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button onClick={()=>setModal({mode:'edit',habit:h})}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-lo hover:text-mid transition-all"
                                  style={{backgroundColor:'#161616'}}>
                                  <PencilSimple size={11}/>
                                </button>
                                <button onClick={()=>handleDelete(h.id)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-lo hover:text-red-400 transition-all"
                                  style={{backgroundColor:'#161616'}}>
                                  <Trash size={11}/>
                                </button>
                              </div>
                            </div>

                            {/* Stats del hábito */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {[
                                {icon:Fire,    label:'Racha',  val:cur>0?`${cur}d`:'—',  c:'#e07c4a'},
                                {icon:Trophy,  label:'Récord', val:best>0?`${best}d`:'—', c:'#c9a227'},
                                {icon:ChartBar,label:'Consist.',val:`${con}%`,             c:color},
                              ].map(({icon:Ic,label,val,c})=>(
                                <div key={label} className="rounded-xl px-2 py-2.5 text-center"
                                  style={{backgroundColor:'#111',border:'1px solid #1a1a1a'}}>
                                  <Ic size={11} weight="fill" style={{color:c,margin:'0 auto 4px'}}/>
                                  <p className="text-[14px] font-black font-mono leading-none" style={{color:c}}>{val}</p>
                                  <p className="text-[9px] text-lo uppercase tracking-wider mt-1">{label}</p>
                                </div>
                              ))}
                            </div>

                            {/* Heatmap calendario correcto */}
                            <div>
                              {/* Headers día semana */}
                              <div className="flex gap-[2px] mb-1">
                                {['L','M','X','J','V','S','D'].map((d,i)=>(
                                  <div key={i} className="text-center flex-shrink-0" style={{width:cs}}>
                                    <span className="text-[8px] font-bold" style={{color:'#2a2a2a'}}>{d}</span>
                                  </div>
                                ))}
                              </div>
                              {/* Filas semanas */}
                              {heatWeeks.map((wk,wi)=>(
                                <div key={wi} className="flex gap-[2px] mb-[2px]">
                                  {wk.map((d,di)=>{
                                    if(!d) return(
                                      <div key={di} style={{width:cs,height:cs,flexShrink:0}}/>
                                    )
                                    const dateStr=ds(d)
                                    const done=h.completedDays.includes(dateStr)
                                    const isToday=dateStr===today
                                    const isFuture=d>new Date()
                                    const due=habitDueOn(h,dateStr)
                                    // Nivel de intensidad por completado
                                    const bg=done?color+(histPeriod==='semana'?'cc':'99'):due&&!isFuture?'#181818':'#111'
                                    return(
                                      <button key={di}
                                        onClick={()=>!isFuture&&handleToggle(h.id,dateStr)}
                                        className="rounded-sm transition-all hover:scale-110 active:scale-95"
                                        title={`${dateStr}${done?' ✓':!due?' (no aplica)':''}`}
                                        style={{
                                          width:cs, height:cs, flexShrink:0,
                                          backgroundColor:bg,
                                          border:`1px solid ${isToday?'#2cb99a60':done?color+'50':'transparent'}`,
                                          opacity:isFuture?0.12:!due?0.4:1,
                                          cursor:isFuture?'default':'pointer',
                                          outline:isToday&&!done?'1px solid #2cb99a50':'none',
                                          outlineOffset:1,
                                        }}/>
                                    )
                                  })}
                                </div>
                              ))}

                              {/* Leyenda + barra progreso */}
                              <div className="flex items-center justify-between mt-2.5 gap-3">
                                <div className="flex-1 h-1 rounded-full overflow-hidden"
                                  style={{backgroundColor:'#1a1a1a'}}>
                                  <div className="h-full rounded-full transition-all"
                                    style={{width:`${con}%`,backgroundColor:color}}/>
                                </div>
                                <span className="text-[10px] font-mono font-black shrink-0"
                                  style={{color}}>{con}%</span>
                                {/* Leyenda nivel */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[8px] text-lo">Menos</span>
                                  {[color+'22',color+'44',color+'77',color+'bb'].map((c,i)=>(
                                    <div key={i} className="rounded-sm" style={{width:8,height:8,backgroundColor:c}}/>
                                  ))}
                                  <span className="text-[8px] text-lo">Más</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {histOffset!==0&&(
            <button onClick={()=>setHistOffset(0)}
              className="w-full py-2.5 text-[11px] text-lo hover:text-accent transition-colors rounded-xl flex items-center justify-center gap-1.5"
              style={{border:'1px dashed #1e1e1e'}}>
              <ArrowCounterClockwise size={12}/> Volver al período actual
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {modal&&(
        <HabitModal
          initial={modal.mode==='edit'?{
            name:modal.habit.name, emoji:modal.habit.emoji||'✅',
            ambitoId:modal.habit.ambitoId, goal:modal.habit.goal||'',
            frequency:modal.habit.frequency||{type:'diario',days:[],count:3},
            color:modal.habit.color||'',
          }:null}
          onSave={handleSave}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  )
}
