import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Plus, X, MagnifyingGlass, FloppyDisk, PencilSimple, Check,
  UserCircle, UsersThree, CalendarBlank, Bell, Star, ChatCircle,
  Heart, Handshake, Suitcase, ChartLine, Target, Globe,
} from '@phosphor-icons/react'
import AmbitoHeader from '../../components/AmbitoHeader'
import {
  getHabits,
  getContacts, addContact, updateContact, deleteContact,
  getInteractions, addInteraction, deleteInteraction,
  getSocialEvents, addSocialEvent, deleteSocialEvent, updateSocialEvent,
  getSocialLog, saveTodaySocial, getTodaySocial,
  getSocialGoals, addSocialGoal, deleteSocialGoal, updateSocialGoal,
} from '../../store'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// ── Constantes ────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10)

const CATEGORIES = [
  { k: 'familia',  label: 'Familia',    Icon: Heart,      color: '#e05c5c' },
  { k: 'amigo',    label: 'Amigo',      Icon: Star,       color: '#c9a227' },
  { k: 'cercano',  label: 'Cercano',    Icon: UserCircle, color: '#d4608a' },
  { k: 'trabajo',  label: 'Trabajo',    Icon: Suitcase,   color: '#5b84e8' },
  { k: 'conocido', label: 'Conocido',   Icon: Handshake,  color: '#888'    },
]

const EVENT_TYPES = ['Café','Cena','Llamada','Evento','Chat','Actividad','Cumpleaños','Otro']
const INTER_TYPES = ['llamada','mensaje','presencial','videollamada','cumpleaños']
const QUALITY = [1,2,3,4,5]

const EMOJIS_CONTACT = ['🧑','👩','👨','👴','👵','🧒','👧','👦','🧑‍💼','👩‍💼','👨‍💼','🧑‍🎓','👩‍🎓','🧑‍🔬','🧑‍🎨','🤝','🌟','❤️','🐶','🐱']

// días desde última interacción
function daysSince(contactId, interactions) {
  const inters = interactions.filter(i => i.contactId === contactId)
  if (!inters.length) return null
  const last = [...inters].sort((a,b)=>b.date.localeCompare(a.date))[0].date
  return Math.floor((Date.now() - new Date(last+'T12:00').getTime()) / 86400000)
}

function alertColor(days) {
  if (days === null) return '#555'
  if (days > 60) return '#e05c5c'
  if (days > 30) return '#f97316'
  if (days > 14) return '#c9a227'
  return '#4cae8a'
}

// ── Modal Contacto ────────────────────────────────────────────────────────
function ContactModal({ contact, onSave, onClose, ambito }) {
  const [form, setForm] = useState(contact || { name:'', emoji:'🧑', category:'amigo', birthday:'', notes:'' })
  const [emojiOpen, setEmojiOpen] = useState(false)
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-md border border-border flex flex-col"
        style={{maxHeight:'85vh'}}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <p className="font-semibold text-hi">{contact?'Editar contacto':'Nuevo contacto'}</p>
          <button onClick={onClose} className="btn-icon w-8 h-8"><X size={14}/></button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          {/* Emoji + Nombre */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={()=>setEmojiOpen(v=>!v)}
                className="w-14 h-14 rounded-2xl text-[28px] flex items-center justify-center transition-all"
                style={{backgroundColor:ambito.color+'15',border:`1px solid ${ambito.color}30`}}>
                {form.emoji}
              </button>
              {emojiOpen && (
                <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-xl p-2
                  grid grid-cols-5 gap-1 z-10 shadow-xl">
                  {EMOJIS_CONTACT.map(e=>(
                    <button key={e} onClick={()=>{upd('emoji',e);setEmojiOpen(false)}}
                      className="w-8 h-8 text-[18px] rounded-lg hover:bg-white/5 flex items-center justify-center">
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input className="flex-1 field-input text-[14px] font-semibold"
              placeholder="Nombre completo *"
              value={form.name} onChange={e=>upd('name',e.target.value)}/>
          </div>

          {/* Categoría */}
          <div>
            <span className="field-label">Tipo de relación</span>
            <div className="flex gap-2 flex-wrap mt-1">
              {CATEGORIES.map(c=>(
                <button key={c.k} onClick={()=>upd('category',c.k)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                  style={form.category===c.k
                    ?{backgroundColor:c.color+'22',color:c.color,border:`1px solid ${c.color}44`}
                    :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
                  <c.Icon size={11}/>{c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cumpleaños */}
          <div>
            <span className="field-label">Cumpleaños (opcional)</span>
            <input type="date" className="field-input mt-1"
              value={form.birthday||''} onChange={e=>upd('birthday',e.target.value)}/>
          </div>

          {/* Notas */}
          <div>
            <span className="field-label">Notas privadas</span>
            <textarea className="field-input mt-1 resize-none text-[12px]" rows={4}
              placeholder="Intereses, temas de conversación, detalles importantes..."
              value={form.notes||''} onChange={e=>upd('notes',e.target.value)}/>
          </div>
        </div>
        <div className="p-4 pt-0 shrink-0">
          <button onClick={()=>form.name.trim()&&onSave(form)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3">
            <FloppyDisk size={15}/> Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Directorio ───────────────────────────────────────────────────────
function DirectorioTab({ ambito }) {
  const [contacts,  setContacts]       = useState(getContacts)
  const [interacts, setInteracts]      = useState(getInteractions)
  const [search,    setSearch]         = useState('')
  const [catFilter, setCatFilter]      = useState('all')
  const [modal,     setModal]          = useState(null)
  const [detailId,  setDetailId]       = useState(null)
  const [interForm, setInterForm]      = useState({ type:'llamada', note:'' })
  const [showAddInter, setShowAddInter] = useState(false)

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = catFilter==='all' || c.category===catFilter
    return matchSearch && matchCat
  })

  const handleSave = (form) => {
    if (modal && modal.id) setContacts(updateContact(modal.id, form))
    else setContacts(addContact(form))
    setModal(null)
  }

  const handleDelete = (id) => {
    setContacts(deleteContact(id))
    if (detailId===id) setDetailId(null)
  }

  const handleAddInter = (contactId) => {
    if (!interForm.note.trim()) return
    setInteracts(addInteraction({ contactId, ...interForm, date: todayStr() }))
    setInterForm({ type:'llamada', note:'' })
    setShowAddInter(false)
  }

  const detail       = detailId ? contacts.find(c=>c.id===detailId) : null
  const detailInters = detailId
    ? [...interacts.filter(i=>i.contactId===detailId)].sort((a,b)=>b.date.localeCompare(a.date))
    : []

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-4 md:gap-5">
      {/* Lista */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lo"/>
            <input className="field-input pl-8 text-[12px]" placeholder="Buscar contacto..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <button onClick={()=>setModal('new')}
            className="btn-primary flex items-center gap-2 px-4 text-[12px]">
            <Plus size={13} weight="bold"/> Nuevo
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={()=>setCatFilter('all')}
            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={catFilter==='all'
              ?{backgroundColor:ambito.color+'20',color:ambito.color,border:`1px solid ${ambito.color}40`}
              :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
            Todos ({contacts.length})
          </button>
          {CATEGORIES.map(c=>{
            const count = contacts.filter(x=>x.category===c.k).length
            if (!count) return null
            return (
              <button key={c.k} onClick={()=>setCatFilter(c.k)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1"
                style={catFilter===c.k
                  ?{backgroundColor:c.color+'20',color:c.color,border:`1px solid ${c.color}40`}
                  :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
                <c.Icon size={10}/>{c.label} ({count})
              </button>
            )
          })}
        </div>

        {filtered.length === 0
          ? <div className="card py-10 text-center text-lo text-[13px]">
              {search ? 'Sin resultados.' : 'Sin contactos aún. ¡Añade uno!'}
            </div>
          : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map(c => {
                const cat    = CATEGORIES.find(x=>x.k===c.category)||CATEGORIES[1]
                const days   = daysSince(c.id, interacts)
                const aColor = alertColor(days)
                const isSelected = detailId === c.id
                // cumpleaños próximo
                let bdayAlert = null
                if (c.birthday) {
                  const bday = new Date(c.birthday+'T12:00')
                  const now  = new Date()
                  const next = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
                  if (next < now) next.setFullYear(now.getFullYear()+1)
                  const diff = Math.ceil((next-now)/86400000)
                  if (diff<=7) bdayAlert = diff
                }
                return (
                  <div key={c.id}
                    onClick={()=>setDetailId(isSelected?null:c.id)}
                    className="card cursor-pointer transition-all hover:border-border-2"
                    style={isSelected?{borderColor:ambito.color+'50',backgroundColor:ambito.color+'08'}:{}}>
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl text-[22px] flex items-center justify-center shrink-0"
                        style={{backgroundColor:cat.color+'15'}}>
                        {c.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-hi truncate">{c.name}</p>
                        <span className="text-[10px] flex items-center gap-1 mt-0.5" style={{color:cat.color}}>
                          <cat.Icon size={9}/>{cat.label}
                        </span>
                        <p className="text-[10px] mt-1" style={{color:aColor}}>
                          {days===null?'Sin interacciones':days===0?'Hoy':days===1?'Ayer':`Hace ${days}d`}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={e=>{e.stopPropagation();setModal(c)}}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/5">
                          <PencilSimple size={10} className="text-lo"/>
                        </button>
                        <button onClick={e=>{e.stopPropagation();handleDelete(c.id)}}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-500/10">
                          <X size={10} className="text-lo"/>
                        </button>
                      </div>
                    </div>
                    {bdayAlert !== null && (
                      <div className="mt-2 pt-2 border-t border-border flex items-center gap-1.5">
                        <span className="text-[10px]">🎂</span>
                        <span className="text-[10px] font-medium" style={{color:'#c9a227'}}>
                          {bdayAlert===0?'¡Hoy es su cumpleaños!':bdayAlert===1?'Cumpleaños mañana':`Cumpleaños en ${bdayAlert}d`}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
        }
      </div>

      {/* Panel detalle */}
      <div>
        {detail ? (
          <div className="card space-y-4 sticky top-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl text-[28px] flex items-center justify-center"
                style={{backgroundColor:ambito.color+'15'}}>
                {detail.emoji}
              </div>
              <div>
                <p className="text-[15px] font-bold text-hi">{detail.name}</p>
                {(() => {
                  const cat = CATEGORIES.find(x=>x.k===detail.category)||CATEGORIES[1]
                  return <span className="text-[11px] flex items-center gap-1" style={{color:cat.color}}>
                    <cat.Icon size={10}/>{cat.label}
                  </span>
                })()}
              </div>
            </div>

            {/* Días desde último contacto */}
            {(() => {
              const days = daysSince(detail.id, interacts)
              return (
                <div className="rounded-xl px-4 py-3 text-center"
                  style={{backgroundColor:alertColor(days)+'12'}}>
                  <p className="text-[22px] font-bold font-mono" style={{color:alertColor(days)}}>
                    {days===null?'—':days===0?'Hoy':days===1?'Ayer':`${days}d`}
                  </p>
                  <p className="text-[10px] text-lo">último contacto</p>
                </div>
              )
            })()}

            {detail.notes && (
              <div>
                <p className="text-[10px] text-lo font-semibold uppercase tracking-wider mb-1">Notas privadas</p>
                <p className="text-[12px] text-mid leading-relaxed">{detail.notes}</p>
              </div>
            )}

            {detail.birthday && (
              <p className="text-[12px] text-lo">
                🎂 {new Date(detail.birthday+'T12:00').toLocaleDateString('es',{day:'numeric',month:'long'})}
              </p>
            )}

            {/* Registrar interacción */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-lo font-semibold">Historial</p>
                <button onClick={()=>setShowAddInter(v=>!v)}
                  className="text-[10px] px-2 py-1 rounded-lg transition-all"
                  style={{backgroundColor:ambito.color+'15',color:ambito.color}}>
                  + Registrar
                </button>
              </div>
              {showAddInter && (
                <div className="space-y-2 p-3 rounded-xl mb-2"
                  style={{backgroundColor:ambito.color+'08',border:`1px solid ${ambito.color}20`}}>
                  <select className="field-input text-[11px] py-1.5 w-full"
                    value={interForm.type} onChange={e=>setInterForm(f=>({...f,type:e.target.value}))}>
                    {INTER_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                  <input className="field-input text-[11px] py-1.5 w-full" placeholder="Nota breve..."
                    value={interForm.note} onChange={e=>setInterForm(f=>({...f,note:e.target.value}))}
                    onKeyDown={e=>e.key==='Enter'&&handleAddInter(detail.id)}/>
                  <button onClick={()=>handleAddInter(detail.id)}
                    className="btn-primary w-full py-1.5 text-[11px] flex items-center justify-center gap-1.5">
                    <Check size={11} weight="bold"/> Guardar
                  </button>
                </div>
              )}
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {detailInters.length===0
                  ? <p className="text-[11px] text-lo text-center py-3">Sin interacciones aún</p>
                  : detailInters.slice(0,12).map(i=>(
                    <div key={i.id} className="flex items-start gap-2 group">
                      <div className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                        style={{backgroundColor:ambito.color+'80'}}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-mid leading-snug">{i.note}</p>
                        <p className="text-[9px] text-lo mt-0.5">{i.date} · {i.type}</p>
                      </div>
                      <button onClick={()=>setInteracts(deleteInteraction(i.id))}
                        className="opacity-0 group-hover:opacity-100 text-lo hover:text-red-400 transition-all shrink-0">
                        <X size={9}/>
                      </button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        ) : (
          <div className="card py-14 text-center text-lo text-[13px]">
            <UserCircle size={34} className="mx-auto mb-2 opacity-20"/>
            Selecciona un contacto<br/>para ver su historial
          </div>
        )}
      </div>

      {modal && (
        <ContactModal
          contact={modal==='new'?null:modal}
          onSave={handleSave}
          onClose={()=>setModal(null)}
          ambito={ambito}/>
      )}
    </div>
  )
}

// ── Tab: Eventos ──────────────────────────────────────────────────────────
function EventosTab({ ambito }) {
  const [events,   setEvents]   = useState(getSocialEvents)
  const contacts                = useMemo(()=>getContacts(),[])
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState({ date: todayStr(), type: EVENT_TYPES[0], with: [], note: '', rating:4 })
  const upd = (k,v) => setForm(f=>({...f,[k]:v}))

  const toggleContact = (id) => setForm(f=>({
    ...f, with: f.with.includes(id)?f.with.filter(x=>x!==id):[...f.with,id]
  }))

  const handleAdd = () => {
    if (!form.note.trim()) return
    setEvents(addSocialEvent(form))
    setForm({ date: todayStr(), type: EVENT_TYPES[0], with: [], note: '', rating:4 })
    setShowForm(false)
  }

  const upcoming = events.filter(e=>e.date>=todayStr()).sort((a,b)=>a.date.localeCompare(b.date))
  const past     = events.filter(e=>e.date<todayStr()).sort((a,b)=>b.date.localeCompare(a.date))

  const renderEvent = (e) => {
    const people = contacts.filter(c=>e.with?.includes(c.id))
    return (
      <div key={e.id} className="card flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px] shrink-0"
          style={{backgroundColor:ambito.color+'12'}}>
          {e.type?.split(' ')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-semibold text-hi">{e.type}</span>
            <span className="text-[10px] font-mono text-lo">{e.date}</span>
            {e.date>=todayStr() && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                style={{backgroundColor:ambito.color+'18',color:ambito.color}}>próximo</span>
            )}
          </div>
          {e.note && <p className="text-[12px] text-mid mt-0.5 leading-snug">{e.note}</p>}
          {people.length>0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {people.map(p=>(
                <span key={p.id} className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{backgroundColor:'#ffffff08',color:'#888'}}>
                  {p.emoji} {p.name}
                </span>
              ))}
            </div>
          )}
          {e.rating>0 && (
            <div className="flex gap-0.5 mt-1">
              {[1,2,3,4,5].map(v=>(
                <span key={v} className="text-[10px]">{v<=e.rating?'⭐':'☆'}</span>
              ))}
            </div>
          )}
        </div>
        <button onClick={()=>setEvents(deleteSocialEvent(e.id))}
          className="text-lo hover:text-red-400 transition-colors shrink-0 mt-1">
          <X size={13}/>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-4 md:gap-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="section-title mb-0">Eventos sociales</p>
          <button onClick={()=>setShowForm(v=>!v)}
            className="btn-primary flex items-center gap-1.5 px-4 py-2 text-[12px]">
            <Plus size={12} weight="bold"/> Nuevo evento
          </button>
        </div>

        {showForm && (
          <div className="card space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="field-label">Fecha</span>
                <input type="date" className="field-input mt-1"
                  value={form.date} onChange={e=>upd('date',e.target.value)}/>
              </div>
              <div>
                <span className="field-label">Tipo</span>
                <select className="field-input mt-1" value={form.type} onChange={e=>upd('type',e.target.value)}>
                  {EVENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <span className="field-label">Descripción</span>
              <input className="field-input mt-1 text-[12px]" placeholder="¿Qué van a hacer?"
                value={form.note} onChange={e=>upd('note',e.target.value)}/>
            </div>
            {contacts.length>0 && (
              <div>
                <span className="field-label">¿Con quién?</span>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {contacts.map(c=>(
                    <button key={c.id} onClick={()=>toggleContact(c.id)}
                      className="px-2 py-1 rounded-xl text-[10px] transition-all"
                      style={form.with.includes(c.id)
                        ?{backgroundColor:ambito.color+'22',color:ambito.color,border:`1px solid ${ambito.color}44`}
                        :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
                      {c.emoji} {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {form.date<=todayStr() && (
              <div>
                <span className="field-label">¿Cómo estuvo?</span>
                <div className="flex gap-2 mt-1">
                  {[1,2,3,4,5].map(v=>(
                    <button key={v} onClick={()=>upd('rating',v)}
                      className="text-[20px] transition-transform hover:scale-110">
                      {v<=form.rating?'⭐':'☆'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleAdd}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              <FloppyDisk size={14}/> Guardar evento
            </button>
          </div>
        )}

        {upcoming.length>0 && (
          <div>
            <p className="text-[11px] text-lo font-semibold uppercase tracking-wider mb-2">Próximos</p>
            <div className="space-y-2">{upcoming.map(renderEvent)}</div>
          </div>
        )}
        {past.length>0 && (
          <div>
            <p className="text-[11px] text-lo font-semibold uppercase tracking-wider mb-2">Historial</p>
            <div className="space-y-2">{past.slice(0,15).map(renderEvent)}</div>
          </div>
        )}
        {events.length===0 && !showForm && (
          <div className="card py-10 text-center text-lo text-[13px]">
            <CalendarBlank size={32} className="mx-auto mb-2 opacity-20"/>
            Sin eventos registrados
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <BirthdayWidget contacts={contacts} ambito={ambito}/>
        <AlertasWidget contacts={contacts} interactions={getInteractions()} ambito={ambito}/>
      </div>
    </div>
  )
}

// ── Widgets sidebar ───────────────────────────────────────────────────────
function BirthdayWidget({ contacts, ambito }) {
  const upcoming = contacts
    .filter(c=>c.birthday)
    .map(c=>{
      const bday = new Date(c.birthday+'T12:00')
      const now  = new Date()
      const next = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
      if (next < now) next.setFullYear(now.getFullYear()+1)
      const diff = Math.ceil((next-now)/86400000)
      return { ...c, daysUntil: diff }
    })
    .sort((a,b)=>a.daysUntil-b.daysUntil)
    .slice(0,6)

  if (!upcoming.length) return null

  return (
    <div className="card">
      <p className="section-title mb-3">🎂 Cumpleaños próximos</p>
      <div className="space-y-2">
        {upcoming.map(c=>(
          <div key={c.id} className="flex items-center gap-2">
            <span className="text-[17px]">{c.emoji}</span>
            <p className="text-[12px] font-medium text-hi flex-1 truncate">{c.name}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
              style={c.daysUntil<=3
                ?{backgroundColor:'#e05c5c20',color:'#e05c5c'}
                :{backgroundColor:ambito.color+'15',color:ambito.color}}>
              {c.daysUntil===0?'¡Hoy!':c.daysUntil===1?'Mañana':`${c.daysUntil}d`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AlertasWidget({ contacts, interactions, ambito }) {
  const alerts = contacts
    .map(c=>({ ...c, days: daysSince(c.id, interactions) }))
    .filter(c=>c.days===null || c.days>21)
    .sort((a,b)=>(b.days||999)-(a.days||999))
    .slice(0,6)

  return (
    <div className="card">
      <p className="section-title mb-3">🔔 Sin contacto reciente</p>
      {alerts.length===0
        ? <p className="text-[12px] text-lo text-center py-3">¡Estás al día con todos!</p>
        : <div className="space-y-2">
            {alerts.map(c=>{
              const aColor = alertColor(c.days)
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="text-[16px]">{c.emoji}</span>
                  <p className="text-[12px] font-medium text-hi flex-1 truncate">{c.name}</p>
                  <span className="text-[10px] font-mono shrink-0" style={{color:aColor}}>
                    {c.days===null?'nunca':`${c.days}d`}
                  </span>
                </div>
              )
            })}
          </div>
      }
    </div>
  )
}

// ── Tab: Mapa ─────────────────────────────────────────────────────────────
function MapaTab({ ambito }) {
  const contacts     = useMemo(()=>getContacts(),[])
  const interactions = useMemo(()=>getInteractions(),[])

  const byCategory = CATEGORIES.map(cat=>({
    ...cat, contacts: contacts.filter(c=>c.category===cat.k)
  })).filter(g=>g.contacts.length>0)

  const stats = [
    { label:'Total contactos',       val:contacts.length,                                                       color:ambito.color },
    { label:'Familia',               val:contacts.filter(c=>c.category==='familia').length,                    color:'#e05c5c'    },
    { label:'Amigos',                val:contacts.filter(c=>c.category==='amigo'||c.category==='cercano').length, color:'#c9a227' },
    { label:'Necesitan atención',    val:contacts.filter(c=>{ const d=daysSince(c.id,interactions); return d===null||d>30 }).length, color:'#f97316' },
  ]

  return (
    <div className="space-y-5">
      {contacts.length===0 ? (
        <div className="card py-14 text-center text-lo text-[13px]">
          <UsersThree size={36} className="mx-auto mb-2 opacity-20"/>
          Añade contactos en el Directorio para ver tu red de relaciones.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map(s=>(
              <div key={s.label} className="card text-center py-4">
                <p className="text-[26px] font-bold font-mono" style={{color:s.color}}>{s.val}</p>
                <p className="text-[10px] text-lo mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="card">
            <p className="section-title mb-4">Red de relaciones</p>
            <div className="space-y-5">
              {byCategory.map(g=>(
                <div key={g.k}>
                  <div className="flex items-center gap-2 mb-2">
                    <g.Icon size={13} style={{color:g.color}}/>
                    <span className="text-[11px] font-semibold" style={{color:g.color}}>{g.label}</span>
                    <span className="text-[10px] text-lo">({g.contacts.length})</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {g.contacts.map(c=>{
                      const days   = daysSince(c.id, interactions)
                      const aColor = alertColor(days)
                      return (
                        <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{backgroundColor:g.color+'0f',border:`1px solid ${g.color}20`}}>
                          <span className="text-[16px]">{c.emoji}</span>
                          <div>
                            <p className="text-[11px] font-medium text-hi leading-none">{c.name}</p>
                            <p className="text-[9px] mt-0.5" style={{color:aColor}}>
                              {days===null?'sin contacto':days===0?'hoy':days===1?'ayer':`${days}d`}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Tab: Calidad & Metas ──────────────────────────────────────────────────
function CalidadTab({ ambito }) {
  const [entry,  setEntry]  = useState(getTodaySocial)
  const [goals,  setGoals]  = useState(getSocialGoals)
  const [showGF, setShowGF] = useState(false)
  const [gForm,  setGForm]  = useState({ title:'', period:'semana', target:1, unit:'eventos', contactId:'' })
  const contacts = useMemo(()=>getContacts(),[])
  const log      = useMemo(()=>getSocialLog().slice(0,30).reverse(),[])

  const chartData = log.map(e=>({ day:e.date.slice(5), score:e.score||0 }))
  const avg = log.length ? (log.reduce((a,e)=>a+(e.score||0),0)/log.length).toFixed(1) : '—'
  const upd = (k,v) => setEntry(e=>({...e,[k]:v}))

  const SCORE_LABELS = ['','😔 Muy aislado','😕 Regular','😐 Normal','😊 Conectado','🤗 Muy conectado']

  const calcGoalProgress = (g) => {
    const interactions = getInteractions()
    const events       = getSocialEvents()
    const now = new Date()
    let since
    if (g.period==='semana')    { since=new Date(now); since.setDate(now.getDate()-7) }
    else if (g.period==='mes')  { since=new Date(now.getFullYear(),now.getMonth(),1) }
    else                        { since=new Date(0) }
    const sinceStr = since.toISOString().slice(0,10)

    let count = 0
    if (g.contactId) {
      count = interactions.filter(i=>i.contactId===g.contactId&&i.date>=sinceStr).length
    } else if (g.unit==='eventos') {
      count = events.filter(e=>e.date>=sinceStr&&e.date<=todayStr()).length
    } else {
      count = interactions.filter(i=>i.date>=sinceStr).length
    }
    return { count, pct: Math.min(100, Math.round((count/g.target)*100)) }
  }

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr_280px] gap-4 md:gap-5">
      <div className="space-y-4">
        {/* Registro diario */}
        <div className="card">
          <p className="section-title mb-4">Calidad social de hoy</p>
          <div className="flex gap-2 mb-3">
            {QUALITY.map(v=>(
              <button key={v} onClick={()=>upd('score',v)}
                className="flex-1 py-3 rounded-xl text-[13px] font-semibold transition-all flex flex-col items-center gap-1"
                style={entry.score===v
                  ?{backgroundColor:ambito.color+'22',color:ambito.color,border:`1px solid ${ambito.color}44`}
                  :{backgroundColor:'#0d0d0d',border:'1px solid #1a1a1a',color:'#555'}}>
                <span className="text-[20px]">{['😔','😕','😐','😊','🤗'][v-1]}</span>
                <span>{v}</span>
              </button>
            ))}
          </div>
          {entry.score>0 && (
            <p className="text-center text-[12px] mb-3" style={{color:ambito.color}}>
              {SCORE_LABELS[entry.score]}
            </p>
          )}
          <textarea className="field-input resize-none text-[12px]" rows={2}
            placeholder="¿Con quién interactuaste? ¿Cómo fue?"
            value={entry.notes||''} onChange={e=>upd('notes',e.target.value)}/>
          <button onClick={()=>saveTodaySocial(entry)}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-3">
            <FloppyDisk size={14}/> Guardar
          </button>
        </div>

        {/* Gráfica tendencia */}
        {log.length>2 && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="section-title mb-0">Tendencia social</p>
              <span className="text-[11px] font-mono" style={{color:ambito.color}}>Prom: {avg}/5</span>
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={chartData}>
                <XAxis dataKey="day" tick={{fill:'#555',fontSize:9}} axisLine={false} tickLine={false} interval={4}/>
                <Tooltip contentStyle={{background:'#1a1a1a',border:'1px solid #242424',borderRadius:8,fontSize:11}}
                  formatter={v=>[`${v}/5`,'Calidad social']}/>
                <Line type="monotone" dataKey="score" stroke={ambito.color} strokeWidth={2.5} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Metas sociales */}
      <div className="card h-fit">
        <div className="flex items-center justify-between mb-3">
          <p className="section-title mb-0 flex items-center gap-1"><Target size={13}/>Metas sociales</p>
          <button onClick={()=>setShowGF(v=>!v)}
            className="text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
            style={{backgroundColor:ambito.color+'15',color:ambito.color}}>
            + Nueva
          </button>
        </div>

        {showGF && (
          <div className="space-y-2 p-3 rounded-xl mb-4"
            style={{backgroundColor:ambito.color+'08',border:`1px solid ${ambito.color}20`}}>
            <input className="field-input text-[11px] py-1.5 w-full" placeholder="Ej: Llamar a mamá cada semana"
              value={gForm.title} onChange={e=>setGForm(f=>({...f,title:e.target.value}))}/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select className="field-input text-[11px] py-1.5"
                value={gForm.period} onChange={e=>setGForm(f=>({...f,period:e.target.value}))}>
                <option value="semana">Por semana</option>
                <option value="mes">Por mes</option>
              </select>
              <select className="field-input text-[11px] py-1.5"
                value={gForm.unit} onChange={e=>setGForm(f=>({...f,unit:e.target.value}))}>
                <option value="eventos">eventos</option>
                <option value="interacciones">interacciones</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-lo">Meta:</span>
              <input type="number" min={1} max={30} className="field-input text-[11px] py-1.5 w-16 text-center"
                value={gForm.target} onChange={e=>setGForm(f=>({...f,target:Number(e.target.value)}))}/>
              <span className="text-[10px] text-lo">{gForm.unit}</span>
            </div>
            {contacts.length>0 && (
              <select className="field-input text-[11px] py-1.5 w-full"
                value={gForm.contactId} onChange={e=>setGForm(f=>({...f,contactId:e.target.value}))}>
                <option value="">Cualquier persona</option>
                {contacts.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>
            )}
            <button onClick={()=>{
              if(!gForm.title.trim()) return
              setGoals(addSocialGoal(gForm))
              setGForm({ title:'', period:'semana', target:1, unit:'eventos', contactId:'' })
              setShowGF(false)
            }} className="btn-primary w-full py-1.5 text-[11px] flex items-center justify-center gap-1.5">
              <Check size={11} weight="bold"/> Crear meta
            </button>
          </div>
        )}

        {goals.length===0
          ? <p className="text-[12px] text-lo text-center py-6">Sin metas aún</p>
          : <div className="space-y-4">
              {goals.map(g=>{
                const { count, pct } = calcGoalProgress(g)
                const contact = g.contactId ? contacts.find(c=>c.id===g.contactId) : null
                return (
                  <div key={g.id}>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <p className="text-[12px] font-semibold text-hi">{g.title}</p>
                        <p className="text-[10px] text-lo">
                          {contact?`${contact.emoji} ${contact.name} · `:''}
                          {count}/{g.target} {g.unit}/{g.period}
                        </p>
                      </div>
                      <button onClick={()=>setGoals(deleteSocialGoal(g.id))}
                        className="text-lo hover:text-red-400 transition-colors">
                        <X size={11}/>
                      </button>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{backgroundColor:ambito.color+'15'}}>
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{width:`${pct}%`,backgroundColor:pct>=100?'#4cae8a':ambito.color}}/>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-[9px] text-lo">{pct}%</span>
                      {pct>=100 && <span className="text-[9px]" style={{color:'#4cae8a'}}>✓ Meta cumplida</span>}
                    </div>
                  </div>
                )
              })}
            </div>
        }
      </div>
    </div>
  )
}

// ── Vista principal ────────────────────────────────────────────────────────
const TABS      = ['Directorio','Eventos','Mapa','Calidad & Metas']
const TAB_ICONS = { 'Directorio':UsersThree, 'Eventos':CalendarBlank, 'Mapa':Globe, 'Calidad & Metas':ChartLine }

export default function SocialView({ ambito }) {
  const habits = getHabits()
  const [tab, setTab] = useState('Directorio')

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
        {tab==='Directorio'      && <DirectorioTab ambito={ambito}/>}
        {tab==='Eventos'         && <EventosTab    ambito={ambito}/>}
        {tab==='Mapa'            && <MapaTab       ambito={ambito}/>}
        {tab==='Calidad & Metas' && <CalidadTab    ambito={ambito}/>}
      </div>
    </div>
  )
}
