import { useState, useMemo } from 'react'
import {
  Plus, X, ArrowUp, ArrowDown, Target, CreditCard, ArrowSquareOut,
  Repeat, Warning, PiggyBank, ChartPie, Wallet, Check, PencilSimple, Trash,
  ChartBar, ArrowsLeftRight, Scales, ArrowsClockwise,
} from '@phosphor-icons/react'
import AmbitoHeader from '../../components/AmbitoHeader'
import {
  getHabits, getFinanceEntries, addFinanceEntry, deleteFinanceEntry,
  getBudgets, saveBudgets,
  getSavingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
  getRecurring, addRecurring, deleteRecurring,
  getDebts, addDebt, updateDebt, deleteDebt,
  getAccounts, addAccount, deleteAccount,
} from '../../store'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

// ── Constantes ─────────────────────────────────────────────────────────────
const GASTO_CATS   = ['Comida','Transporte','Entretenimiento','Ropa','Salud','Educación','Tecnología','Hogar','Otro']
const INGRESO_CATS = ['Sueldo','Freelance','Regalo','Venta','Inversión','Otro']
const CAT_COLORS   = ['#e05c5c','#c9a227','#2cb99a','#5b84e8','#9575cd','#f97316','#38bdf8','#4ade80','#888']
const ACC_COLORS   = ['#2cb99a','#5b84e8','#c9a227','#e05c5c','#a78bfa','#f97316']

const currMonth = () => new Date().toISOString().slice(0,7)
const today     = () => new Date().toISOString().slice(0,10)
const fmt       = n => Number(n).toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:0})

// ── Tab: Dashboard ─────────────────────────────────────────────────────────
function DashboardTab({ entries, ambito, budgets, recurring, accounts }) {
  const month = currMonth()
  const monthEntries = entries.filter(e => e.date?.startsWith(month))
  const ingresos = monthEntries.filter(e=>e.type==='ingreso').reduce((a,e)=>a+e.amount,0)
  const gastos   = monthEntries.filter(e=>e.type==='gasto').reduce((a,e)=>a+e.amount,0)
  const balance  = ingresos - gastos

  // Gastos fijos comprometidos este mes
  const fixedTotal = recurring.reduce((a,r)=>a+Number(r.amount),0)
  const disponible = ingresos - fixedTotal

  // Últimos 6 meses
  const last6 = Array.from({length:6},(_,i)=>{
    const d = new Date(); d.setMonth(d.getMonth()-5+i)
    const m = d.toISOString().slice(0,7)
    const label = d.toLocaleString('es-MX',{month:'short'})
    const ing = entries.filter(e=>e.date?.startsWith(m)&&e.type==='ingreso').reduce((a,e)=>a+e.amount,0)
    const gas = entries.filter(e=>e.date?.startsWith(m)&&e.type==='gasto').reduce((a,e)=>a+e.amount,0)
    return { label, ingresos:ing, gastos:gas }
  })

  // Por categoría este mes (pie)
  const byCat = {}
  monthEntries.filter(e=>e.type==='gasto').forEach(e=>{
    byCat[e.category]=(byCat[e.category]||0)+e.amount
  })
  const pieData = Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([name,value],i)=>({name,value,color:CAT_COLORS[i%CAT_COLORS.length]}))

  // Alertas presupuesto
  const alerts = Object.entries(budgets).filter(([cat,limit])=>{
    const spent = (byCat[cat]||0)
    return spent >= limit*0.8
  })

  return (
    <div className="space-y-5">
      {/* Alertas */}
      {alerts.length>0 && (
        <div className="space-y-2">
          {alerts.map(([cat,limit])=>{
            const spent = byCat[cat]||0
            const over  = spent>limit
            return (
              <div key={cat} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                style={{backgroundColor:over?'#e05c5c12':'#c9a22712',border:`1px solid ${over?'#e05c5c':'#c9a227'}30`}}>
                <Warning size={14} weight="fill" color={over?'#e05c5c':'#c9a227'}/>
                <p className="text-[12px]" style={{color:over?'#e05c5c':'#c9a227'}}>
                  {over?'Superaste':'Cerca del límite en'} <strong>{cat}</strong>: ${fmt(spent)} / ${fmt(limit)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Balance mes',  val: balance,    color: balance>=0?'#4cae8a':'#e05c5c', prefix: balance>=0?'+':'' },
          { label:'Ingresos',     val: ingresos,   color:'#4cae8a', prefix:'+' },
          { label:'Gastos',       val: gastos,     color:'#e05c5c', prefix:'-' },
          { label:'Disponible',   val: disponible, color:'#c9a227', prefix:'' },
        ].map(c=>(
          <div key={c.label} className="card text-center py-4">
            <p className="text-[10px] text-lo mb-1">{c.label}</p>
            <p className="text-[22px] font-bold font-mono" style={{color:c.color}}>
              {c.prefix}${fmt(Math.abs(c.val))}
            </p>
          </div>
        ))}
      </div>

      {/* Cuentas */}
      {accounts.length>0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {accounts.map((acc,i)=>(
            <div key={acc.id} className="card flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{backgroundColor:ACC_COLORS[i%ACC_COLORS.length]+'20'}}>
                <Wallet size={16} style={{color:ACC_COLORS[i%ACC_COLORS.length]}}/>
              </div>
              <div>
                <p className="text-[11px] text-lo">{acc.name}</p>
                <p className="text-[16px] font-bold font-mono" style={{color:ACC_COLORS[i%ACC_COLORS.length]}}>
                  ${fmt(acc.balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-4 md:gap-5">
        {/* Gráfica 6 meses */}
        <div className="card">
          <p className="section-title mb-2">Ingresos vs Gastos — 6 meses</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={last6} barSize={14} barGap={3}>
              <XAxis dataKey="label" tick={{fill:'#555',fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:8,fontSize:11}}
                formatter={(v,n)=>[`$${fmt(v)}`,n==='ingresos'?'Ingresos':'Gastos']}/>
              <Bar dataKey="ingresos" fill="#4cae8a" fillOpacity={0.8} radius={[3,3,0,0]}/>
              <Bar dataKey="gastos"   fill="#e05c5c" fillOpacity={0.8} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie por categoría */}
        <div className="card">
          <p className="section-title mb-2">Gastos por categoría</p>
          {pieData.length>0 ? (
            <>
              <ResponsiveContainer width="100%" height={100}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={45}
                    dataKey="value" strokeWidth={0}>
                    {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:8,fontSize:11}}
                    formatter={v=>[`$${fmt(v)}`]}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-1">
                {pieData.slice(0,4).map(d=>(
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:d.color}}/>
                    <span className="text-[11px] text-mid flex-1">{d.name}</span>
                    <span className="text-[11px] font-mono text-lo">${fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-[12px] text-lo text-center py-6">Sin gastos este mes</p>}
        </div>
      </div>

      {/* Gastos fijos comprometidos */}
      {recurring.length>0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="section-title mb-0">Gastos fijos este mes</p>
            <span className="text-[12px] font-mono text-lo">${fmt(fixedTotal)} comprometidos</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {recurring.map(r=>(
              <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a'}}>
                <Repeat size={11} color="#555"/>
                <span className="flex-1 text-[11px] text-mid truncate">{r.name}</span>
                <span className="text-[11px] font-mono text-lo">${fmt(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link app externa */}
      <a href="https://fintrack-frontend-wev7.onrender.com" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-3 px-5 py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{background:'linear-gradient(135deg,#2cb99a15,#5b84e815)',border:'1px solid #2cb99a30'}}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{backgroundColor:'#2cb99a20',border:'1px solid #2cb99a40'}}>
          <ArrowSquareOut size={18} color="#2cb99a" weight="fill"/>
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-hi">Abrir FinTrack</p>
          <p className="text-[11px] text-lo">Tu app financiera completa → fintrack-frontend-wev7.onrender.com</p>
        </div>
        <ArrowSquareOut size={14} color="#2cb99a"/>
      </a>
    </div>
  )
}

// ── Tab: Movimientos ────────────────────────────────────────────────────────
function MovimientosTab({ entries, setEntries, ambito, accounts }) {
  const [showAdd, setShowAdd] = useState(false)
  const [type,    setType]    = useState('gasto')
  const [filter,  setFilter]  = useState('all')
  const [form, setForm] = useState({ amount:'', category:'Comida', description:'', accountId:'' })

  const handleAdd = () => {
    if (!form.amount) return
    setEntries(addFinanceEntry({ type, ...form, amount:Number(form.amount) }))
    setForm({ amount:'', category: type==='gasto'?'Comida':'Sueldo', description:'', accountId:'' })
    setShowAdd(false)
  }

  const filtered = filter==='all' ? entries
    : filter==='ingreso'||filter==='gasto' ? entries.filter(e=>e.type===filter)
    : entries.filter(e=>e.category===filter)

  const allCats = [...new Set(entries.map(e=>e.category))]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[['all','Todos'],['ingreso','Ingresos'],['gasto','Gastos'],...allCats.slice(0,4).map(c=>[c,c])].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)}
              className="text-[12px] px-3 py-1.5 rounded-lg transition-all"
              style={filter===k?{backgroundColor:ambito.color+'20',color:ambito.color}:{color:'#555'}}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={()=>setShowAdd(true)} className="btn-primary flex items-center gap-1.5 py-1.5 text-[12px]">
          <Plus size={13} weight="bold"/> Registrar
        </button>
      </div>

      {filtered.length===0
        ? <div className="card py-10 text-center text-lo text-[13px]">Sin movimientos.</div>
        : (
          <div className="space-y-1.5">
            {filtered.slice(0,50).map(e=>{
              const acc = accounts.find(a=>a.id===e.accountId)
              return (
                <div key={e.id} className="card flex items-center gap-3 py-2.5 group hover:border-border-2 transition-colors">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{backgroundColor:e.type==='ingreso'?'#4cae8a18':'#e05c5c18'}}>
                    {e.type==='ingreso'
                      ?<ArrowUp size={14} color="#4cae8a" weight="bold"/>
                      :<ArrowDown size={14} color="#e05c5c" weight="bold"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-hi truncate">{e.description||e.category}</p>
                    <p className="text-[10px] text-lo">
                      {e.category} · {e.date}
                      {acc && <span className="ml-1 px-1.5 rounded-full" style={{backgroundColor:ambito.color+'15',color:ambito.color+'aa'}}>{acc.name}</span>}
                    </p>
                  </div>
                  <p className="text-[15px] font-mono font-bold shrink-0"
                    style={{color:e.type==='ingreso'?'#4cae8a':'#e05c5c'}}>
                    {e.type==='ingreso'?'+':'-'}${fmt(e.amount)}
                  </p>
                  <button onClick={()=>setEntries(deleteFinanceEntry(e.id))}
                    className="btn-icon opacity-0 group-hover:opacity-100"><X size={12}/></button>
                </div>
              )
            })}
          </div>
        )
      }

      {/* Modal agregar */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={()=>setShowAdd(false)}>
          <div className="bg-card border border-border-2 rounded-2xl w-[400px] shadow-2xl"
            onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-hi text-[15px]">Registrar movimiento</h3>
              <button className="btn-icon" onClick={()=>setShowAdd(false)}><X size={15}/></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex gap-2">
                {['gasto','ingreso'].map(t=>(
                  <button key={t} onClick={()=>{setType(t);setForm(f=>({...f,category:t==='gasto'?'Comida':'Sueldo'}))}}
                    className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-all capitalize"
                    style={type===t
                      ?{backgroundColor:t==='gasto'?'#e05c5c22':'#4cae8a22',color:t==='gasto'?'#e05c5c':'#4cae8a',border:`1px solid ${t==='gasto'?'#e05c5c':'#4cae8a'}44`}
                      :{backgroundColor:'#111',border:'1px solid #1a1a1a',color:'#555'}}>
                    {t==='gasto'?'Gasto':'Ingreso'}
                  </button>
                ))}
              </div>
              <div>
                <span className="field-label">Monto ($)</span>
                <input type="number" className="field-input text-center text-[20px] font-mono font-bold h-12"
                  placeholder="0.00" autoFocus value={form.amount}
                  onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="field-label">Categoría</span>
                  <select className="field-input" value={form.category}
                    onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {(type==='gasto'?GASTO_CATS:INGRESO_CATS).map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                {accounts.length>0 && (
                  <div>
                    <span className="field-label">Cuenta</span>
                    <select className="field-input" value={form.accountId}
                      onChange={e=>setForm(f=>({...f,accountId:e.target.value}))}>
                      <option value="">Sin cuenta</option>
                      {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <span className="field-label">Descripción (opcional)</span>
                <input className="field-input" value={form.description}
                  onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                  onKeyDown={e=>e.key==='Enter'&&handleAdd()}/>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-border">
              <button className="btn-ghost flex-1" onClick={()=>setShowAdd(false)}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={handleAdd}>Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Presupuesto ────────────────────────────────────────────────────────
function PresupuestoTab({ entries, budgets, setBudgets, ambito }) {
  const [editing, setEditing] = useState({})
  const month = currMonth()
  const monthGastos = entries.filter(e=>e.date?.startsWith(month)&&e.type==='gasto')

  const spent = {}
  monthGastos.forEach(e=>{ spent[e.category]=(spent[e.category]||0)+e.amount })

  const save = () => {
    const b = {...budgets}
    Object.entries(editing).forEach(([k,v])=>{ if(v) b[k]=Number(v); else delete b[k] })
    saveBudgets(b); setBudgets(b); setEditing({})
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-hi">Presupuesto mensual</h3>
          <p className="text-[12px] text-lo mt-0.5">Define límites por categoría para {month}</p>
        </div>
        {Object.keys(editing).length>0 && (
          <button onClick={save} className="btn-primary text-[12px] py-1.5 flex items-center gap-1">
            <Check size={12} weight="bold"/> Guardar
          </button>
        )}
      </div>

      <div className="space-y-3">
        {GASTO_CATS.map((cat,i)=>{
          const limit   = budgets[cat]||0
          const spentAmt = spent[cat]||0
          const pct     = limit>0 ? Math.min(100,(spentAmt/limit)*100) : 0
          const over    = spentAmt>limit&&limit>0
          const near    = pct>=80&&!over
          const barColor = over?'#e05c5c':near?'#c9a227':CAT_COLORS[i%CAT_COLORS.length]

          return (
            <div key={cat} className="card">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[13px] text-hi flex-1 font-medium">{cat}</span>
                <span className="text-[12px] font-mono" style={{color:over?'#e05c5c':near?'#c9a227':'#aaa'}}>
                  ${fmt(spentAmt)}
                </span>
                <span className="text-[11px] text-lo">/ </span>
                <input
                  type="number"
                  className="w-24 rounded-lg px-2 py-1 text-[12px] font-mono text-center outline-none"
                  style={{backgroundColor:'#111',border:`1px solid ${limit>0?barColor+'40':'#1a1a1a'}`,color:'#ccc'}}
                  placeholder="Sin límite"
                  value={editing[cat]!==undefined ? editing[cat] : (limit||'')}
                  onChange={e=>setEditing(ed=>({...ed,[cat]:e.target.value}))}
                />
              </div>
              {limit>0 && (
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{width:`${pct}%`,backgroundColor:barColor}}/>
                </div>
              )}
              {over && <p className="text-[10px] text-red-400 mt-1">⚠ Superaste el límite por ${fmt(spentAmt-limit)}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab: Ahorro ─────────────────────────────────────────────────────────────
function AhorroTab({ ambito }) {
  const [goals,   setGoals]   = useState(getSavingsGoals)
  const [showAdd, setShowAdd] = useState(false)
  const [adding,  setAdding]  = useState(null) // id de meta a la que se agrega monto
  const [addAmt,  setAddAmt]  = useState('')
  const [form, setForm] = useState({ name:'', target:'', deadline:'', color:'#2cb99a', description:'' })
  const GOAL_COLORS = ['#2cb99a','#5b84e8','#c9a227','#9575cd','#f97316','#e05c5c']

  const handleSave = () => {
    if (!form.name||!form.target) return
    setGoals(addSavingsGoal({ name:form.name, target:Number(form.target), deadline:form.deadline, color:form.color, description:form.description }))
    setForm({ name:'', target:'', deadline:'', color:'#2cb99a', description:'' })
    setShowAdd(false)
  }

  const handleAdd = (id) => {
    if (!addAmt) return
    const g = goals.find(x=>x.id===id)
    setGoals(updateSavingsGoal(id,{ current: Math.min(g.target,(g.current||0)+Number(addAmt)) }))
    setAdding(null); setAddAmt('')
  }

  const totalAhorrado = goals.reduce((a,g)=>a+(g.current||0),0)
  const totalMeta     = goals.reduce((a,g)=>a+g.target,0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-hi">Metas de ahorro</h3>
          {goals.length>0 && <p className="text-[11px] text-lo mt-0.5">Total ahorrado: ${fmt(totalAhorrado)} / ${fmt(totalMeta)}</p>}
        </div>
        <button onClick={()=>setShowAdd(v=>!v)} className="btn-primary flex items-center gap-1.5 py-1.5 text-[12px]">
          <Plus size={12} weight="bold"/> Nueva meta
        </button>
      </div>

      {showAdd && (
        <div className="card space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="field-label">Nombre</span>
              <input className="field-input" autoFocus placeholder="Ej: Viaje a Europa"
                value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div>
              <span className="field-label">Meta ($)</span>
              <input type="number" className="field-input" placeholder="10000"
                value={form.target} onChange={e=>setForm(f=>({...f,target:e.target.value}))}/>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="field-label">Fecha límite</span>
              <input type="date" className="field-input"
                value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))}/>
            </div>
            <div>
              <span className="field-label">Color</span>
              <div className="flex gap-2 mt-1">
                {GOAL_COLORS.map(c=>(
                  <button key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                    className="w-6 h-6 rounded-full transition-all"
                    style={{backgroundColor:c,border:form.color===c?'2px solid white':'2px solid transparent',
                            transform:form.color===c?'scale(1.2)':'scale(1)'}}/>
                ))}
              </div>
            </div>
          </div>
          <div>
            <span className="field-label">Descripción (opcional)</span>
            <input className="field-input" placeholder="¿Para qué es este ahorro?"
              value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 text-[12px]" onClick={()=>setShowAdd(false)}>Cancelar</button>
            <button className="btn-primary flex-1 text-[12px]" onClick={handleSave}>Crear meta</button>
          </div>
        </div>
      )}

      {goals.length===0
        ? <div className="card py-10 text-center"><PiggyBank size={32} className="mx-auto mb-2 text-lo"/><p className="text-[13px] text-lo">Sin metas de ahorro aún</p></div>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.map(g=>{
              const pct = Math.min(100,Math.round(((g.current||0)/g.target)*100))
              const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline)-new Date())/86400000) : null
              // Cuánto ahorrar por mes para llegar a tiempo
              const monthsLeft = daysLeft ? Math.max(1,Math.ceil(daysLeft/30)) : null
              const needed     = monthsLeft ? Math.ceil((g.target-(g.current||0))/monthsLeft) : null
              const done       = pct>=100

              return (
                <div key={g.id} className="card group"
                  style={done?{backgroundColor:g.color+'08',borderColor:g.color+'30'}:{}}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[14px] font-semibold text-hi leading-snug">{g.name}</p>
                      {g.description && <p className="text-[11px] text-lo">{g.description}</p>}
                    </div>
                    <button onClick={()=>setGoals(deleteSavingsGoal(g.id))}
                      className="opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all">
                      <X size={12}/>
                    </button>
                  </div>

                  {/* Anillo */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-16 h-16 shrink-0">
                      <svg width={64} height={64} className="-rotate-90">
                        <circle cx={32} cy={32} r={26} fill="none" stroke="#1a1a1a" strokeWidth={5}/>
                        <circle cx={32} cy={32} r={26} fill="none" stroke={done?'#4ade80':g.color} strokeWidth={5}
                          strokeDasharray={2*Math.PI*26}
                          strokeDashoffset={2*Math.PI*26*(1-pct/100)}
                          strokeLinecap="round" style={{transition:'stroke-dashoffset 0.5s'}}/>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold font-mono"
                        style={{color:done?'#4ade80':g.color}}>{pct}%</span>
                    </div>
                    <div>
                      <p className="text-[18px] font-bold font-mono" style={{color:g.color}}>${fmt(g.current||0)}</p>
                      <p className="text-[11px] text-lo">de ${fmt(g.target)}</p>
                      {daysLeft!==null && <p className="text-[10px] text-lo mt-0.5">{daysLeft>0?`${daysLeft} días restantes`:'⚠ Vencido'}</p>}
                    </div>
                  </div>

                  {needed && !done && (
                    <p className="text-[11px] mb-2 px-2 py-1 rounded-lg"
                      style={{backgroundColor:g.color+'12',color:g.color+'cc'}}>
                      Ahorra ~${fmt(needed)}/mes para llegar a tiempo
                    </p>
                  )}

                  {/* Agregar monto */}
                  {adding===g.id ? (
                    <div className="flex gap-2">
                      <input type="number" autoFocus className="flex-1 field-input py-1.5 text-[12px]"
                        placeholder="Cuánto ahorré..."
                        value={addAmt} onChange={e=>setAddAmt(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&handleAdd(g.id)}/>
                      <button onClick={()=>handleAdd(g.id)} className="btn-primary px-3 py-1.5 text-[11px]">+</button>
                      <button onClick={()=>{setAdding(null);setAddAmt('')}} className="btn-ghost px-2 py-1.5 text-[11px]">×</button>
                    </div>
                  ) : (
                    <button onClick={()=>setAdding(g.id)}
                      className="w-full py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                      style={{backgroundColor:g.color+'15',color:g.color,border:`1px solid ${g.color}30`}}>
                      {done?'✅ ¡Meta alcanzada!':'+ Agregar ahorro'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

// ── Tab: Deudas ─────────────────────────────────────────────────────────────
function DeudasTab({ ambito }) {
  const [debts,   setDebts]   = useState(getDebts)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', amount:'', toWhom:'', dueDate:'', notes:'' })

  const handleAdd = () => {
    if (!form.name||!form.amount) return
    setDebts(addDebt({ name:form.name, amount:Number(form.amount), toWhom:form.toWhom, dueDate:form.dueDate, notes:form.notes }))
    setForm({ name:'', amount:'', toWhom:'', dueDate:'', notes:'' })
    setShowAdd(false)
  }

  const pending = debts.filter(d=>!d.paid)
  const paid    = debts.filter(d=>d.paid)
  const totalPending = pending.reduce((a,d)=>a+d.amount,0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-hi">Deudas y pagos pendientes</h3>
          {pending.length>0 && (
            <p className="text-[11px] text-lo mt-0.5">
              {pending.length} pendiente{pending.length!==1?'s':''} · Total: <span className="text-red-400 font-semibold">${fmt(totalPending)}</span>
            </p>
          )}
        </div>
        <button onClick={()=>setShowAdd(v=>!v)} className="btn-primary flex items-center gap-1.5 py-1.5 text-[12px]">
          <Plus size={12} weight="bold"/> Agregar deuda
        </button>
      </div>

      {showAdd && (
        <div className="card space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="field-label">Descripción</span>
              <input className="field-input" autoFocus placeholder="Ej: Préstamo de laptop"
                value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div>
              <span className="field-label">Monto ($)</span>
              <input type="number" className="field-input" placeholder="500"
                value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
            </div>
            <div>
              <span className="field-label">A quién se le debe</span>
              <input className="field-input" placeholder="Nombre / banco"
                value={form.toWhom} onChange={e=>setForm(f=>({...f,toWhom:e.target.value}))}/>
            </div>
            <div>
              <span className="field-label">Fecha de vencimiento</span>
              <input type="date" className="field-input"
                value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1 text-[12px]" onClick={()=>setShowAdd(false)}>Cancelar</button>
            <button className="btn-primary flex-1 text-[12px]" onClick={handleAdd}>Registrar</button>
          </div>
        </div>
      )}

      {debts.length===0
        ? <div className="card py-10 text-center"><Warning size={28} className="mx-auto mb-2 text-lo"/><p className="text-[13px] text-lo">Sin deudas registradas</p></div>
        : (
          <div className="space-y-2">
            {/* Pendientes */}
            {pending.map(d=>{
              const daysLeft = d.dueDate ? Math.ceil((new Date(d.dueDate)-new Date())/86400000) : null
              const overdue  = daysLeft!==null && daysLeft<0
              return (
                <div key={d.id} className="card flex items-start gap-3 group"
                  style={overdue?{backgroundColor:'#e05c5c08',borderColor:'#e05c5c30'}:{}}>
                  <button onClick={()=>setDebts(updateDebt(d.id,{paid:true}))}
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all"
                    style={{border:'1.5px solid #e05c5c66'}}>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-hi">{d.name}</p>
                    <p className="text-[11px] text-lo">
                      {d.toWhom && `A: ${d.toWhom}`}
                      {daysLeft!==null && (
                        <span className={`ml-2 ${overdue?'text-red-400':daysLeft<7?'text-amber-400':'text-lo'}`}>
                          {overdue?'Vencida':daysLeft===0?'Vence hoy':`Vence en ${daysLeft}d`}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-[16px] font-bold font-mono text-red-400 shrink-0">${fmt(d.amount)}</p>
                  <button onClick={()=>setDebts(deleteDebt(d.id))}
                    className="opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all mt-0.5">
                    <X size={12}/>
                  </button>
                </div>
              )
            })}

            {/* Pagadas */}
            {paid.length>0 && (
              <div>
                <p className="text-[11px] text-lo mb-2 mt-3">Pagadas ({paid.length})</p>
                <div className="space-y-1 opacity-50">
                  {paid.map(d=>(
                    <div key={d.id} className="flex items-center gap-3 px-3 py-2 group">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{backgroundColor:'#4cae8a22'}}>
                        <Check size={11} color="#4cae8a" weight="bold"/>
                      </div>
                      <p className="text-[12px] text-lo line-through flex-1">{d.name}</p>
                      <p className="text-[12px] font-mono text-lo">${fmt(d.amount)}</p>
                      <button onClick={()=>setDebts(deleteDebt(d.id))}
                        className="opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all">
                        <X size={11}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      }
    </div>
  )
}

// ── Tab: Recurrentes + Cuentas ──────────────────────────────────────────────
function RecurrentesTab({ ambito }) {
  const [recurring, setRecurring] = useState(getRecurring)
  const [accounts,  setAccounts]  = useState(getAccounts)
  const [formR, setFormR] = useState({ name:'', amount:'', category:'Hogar', dayOfMonth:1 })
  const [formA, setFormA] = useState({ name:'', balance:'', type:'efectivo' })
  const [showR, setShowR] = useState(false)
  const [showA, setShowA] = useState(false)

  const totalFixed = recurring.reduce((a,r)=>a+Number(r.amount),0)
  const totalBalance = accounts.reduce((a,acc)=>a+Number(acc.balance||0),0)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {/* Gastos recurrentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-hi flex items-center gap-2">
              <Repeat size={14} color={ambito.color}/> Gastos fijos
            </h3>
            <p className="text-[11px] text-lo mt-0.5">${fmt(totalFixed)}/mes comprometidos</p>
          </div>
          <button onClick={()=>setShowR(v=>!v)} className="btn-primary text-[11px] py-1.5 flex items-center gap-1">
            <Plus size={11} weight="bold"/> Agregar
          </button>
        </div>

        {showR && (
          <div className="card space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="field-label">Nombre</span>
                <input className="field-input" autoFocus placeholder="Netflix, Renta..."
                  value={formR.name} onChange={e=>setFormR(f=>({...f,name:e.target.value}))}/>
              </div>
              <div>
                <span className="field-label">Monto ($)</span>
                <input type="number" className="field-input"
                  value={formR.amount} onChange={e=>setFormR(f=>({...f,amount:e.target.value}))}/>
              </div>
              <div>
                <span className="field-label">Categoría</span>
                <select className="field-input" value={formR.category}
                  onChange={e=>setFormR(f=>({...f,category:e.target.value}))}>
                  {GASTO_CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <span className="field-label">Día del mes</span>
                <input type="number" className="field-input" min={1} max={31}
                  value={formR.dayOfMonth} onChange={e=>setFormR(f=>({...f,dayOfMonth:e.target.value}))}/>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1 text-[11px]" onClick={()=>setShowR(false)}>Cancelar</button>
              <button className="btn-primary flex-1 text-[11px]"
                onClick={()=>{
                  if(!formR.name||!formR.amount) return
                  setRecurring(addRecurring({...formR,amount:Number(formR.amount)}))
                  setFormR({name:'',amount:'',category:'Hogar',dayOfMonth:1}); setShowR(false)
                }}>Guardar</button>
            </div>
          </div>
        )}

        {recurring.length===0
          ? <div className="card py-8 text-center text-lo text-[12px]">Sin gastos recurrentes</div>
          : (
            <div className="space-y-2">
              {recurring.map((r,i)=>(
                <div key={r.id} className="card flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{backgroundColor:CAT_COLORS[GASTO_CATS.indexOf(r.category)%CAT_COLORS.length]+'18'}}>
                    <Repeat size={13} style={{color:CAT_COLORS[GASTO_CATS.indexOf(r.category)%CAT_COLORS.length]}}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-hi">{r.name}</p>
                    <p className="text-[10px] text-lo">{r.category} · día {r.dayOfMonth}</p>
                  </div>
                  <p className="text-[14px] font-bold font-mono text-lo">${fmt(r.amount)}</p>
                  <button onClick={()=>setRecurring(deleteRecurring(r.id))}
                    className="opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all">
                    <X size={12}/>
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Cuentas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-hi flex items-center gap-2">
              <Wallet size={14} color={ambito.color}/> Cuentas
            </h3>
            <p className="text-[11px] text-lo mt-0.5">Total: ${fmt(totalBalance)}</p>
          </div>
          <button onClick={()=>setShowA(v=>!v)} className="btn-primary text-[11px] py-1.5 flex items-center gap-1">
            <Plus size={11} weight="bold"/> Agregar
          </button>
        </div>

        {showA && (
          <div className="card space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="field-label">Nombre</span>
                <input className="field-input" autoFocus placeholder="BBVA, Efectivo..."
                  value={formA.name} onChange={e=>setFormA(f=>({...f,name:e.target.value}))}/>
              </div>
              <div>
                <span className="field-label">Saldo ($)</span>
                <input type="number" className="field-input"
                  value={formA.balance} onChange={e=>setFormA(f=>({...f,balance:e.target.value}))}/>
              </div>
              <div>
                <span className="field-label">Tipo</span>
                <select className="field-input" value={formA.type}
                  onChange={e=>setFormA(f=>({...f,type:e.target.value}))}>
                  {['efectivo','débito','crédito','ahorro','inversión'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1 text-[11px]" onClick={()=>setShowA(false)}>Cancelar</button>
              <button className="btn-primary flex-1 text-[11px]"
                onClick={()=>{
                  if(!formA.name) return
                  setAccounts(addAccount({...formA,balance:Number(formA.balance||0)}))
                  setFormA({name:'',balance:'',type:'efectivo'}); setShowA(false)
                }}>Guardar</button>
            </div>
          </div>
        )}

        {accounts.length===0
          ? <div className="card py-8 text-center text-lo text-[12px]">Sin cuentas registradas</div>
          : (
            <div className="space-y-2">
              {accounts.map((acc,i)=>(
                <div key={acc.id} className="card flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{backgroundColor:ACC_COLORS[i%ACC_COLORS.length]+'20'}}>
                    <Wallet size={14} style={{color:ACC_COLORS[i%ACC_COLORS.length]}}/>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] text-hi">{acc.name}</p>
                    <p className="text-[10px] text-lo capitalize">{acc.type}</p>
                  </div>
                  <p className="text-[16px] font-bold font-mono" style={{color:ACC_COLORS[i%ACC_COLORS.length]}}>
                    ${fmt(acc.balance||0)}
                  </p>
                  <button onClick={()=>setAccounts(deleteAccount(acc.id))}
                    className="opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all">
                    <X size={12}/>
                  </button>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}

// ── Vista principal ──────────────────────────────────────────────────────────
const TABS = ['Dashboard','Movimientos','Presupuesto','Ahorro','Deudas','Fijos & Cuentas']
const TAB_ICONS = {
  Dashboard:ChartBar, Movimientos:ArrowsLeftRight, Presupuesto:Scales,
  Ahorro:PiggyBank, Deudas:Warning, 'Fijos & Cuentas':ArrowsClockwise,
}

export default function FinanzasView({ ambito }) {
  const habits = getHabits()
  const [tab,      setTab]      = useState('Dashboard')
  const [entries,  setEntries]  = useState(getFinanceEntries)
  const [budgets,  setBudgets]  = useState(getBudgets)
  const [recurring]             = useState(getRecurring)
  const [accounts]              = useState(getAccounts)

  return (
    <div className="min-h-screen">
      <AmbitoHeader ambito={ambito} habits={habits}/>

      {/* Tabs */}
      <div className="px-6 pt-4 pb-1">
        <div className="flex gap-1 bg-black/30 rounded-xl p-1 overflow-x-auto">
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap"
              style={tab===t?{backgroundColor:ambito.color+'20',color:ambito.color}:{color:'#555'}}>
              {(() => { const I = TAB_ICONS[t]; return I ? <I size={13}/> : null })()} {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 md:p-6">
        {tab==='Dashboard'      && <DashboardTab   entries={entries} ambito={ambito} budgets={budgets} recurring={recurring} accounts={accounts}/>}
        {tab==='Movimientos'    && <MovimientosTab entries={entries} setEntries={setEntries} ambito={ambito} accounts={accounts}/>}
        {tab==='Presupuesto'    && <PresupuestoTab entries={entries} budgets={budgets} setBudgets={setBudgets} ambito={ambito}/>}
        {tab==='Ahorro'         && <AhorroTab      ambito={ambito}/>}
        {tab==='Deudas'         && <DeudasTab      ambito={ambito}/>}
        {tab==='Fijos & Cuentas'&& <RecurrentesTab ambito={ambito}/>}
      </div>
    </div>
  )
}
