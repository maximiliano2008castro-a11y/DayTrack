import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getQuickNotes, addQuickNote, updateQuickNote, deleteQuickNote, AMBITOS, getAmbito,
} from '../store'
import { getAmbitoIcon } from '../ambitoIcons'
import { Plus, X, NotePencil, PushPin, Trash, PencilSimple, MagnifyingGlass, ArrowRight } from '@phosphor-icons/react'

// ── Helpers ───────────────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2,'0')
const todayDs = () => { const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }

function NoteCard({ n, onPin, onEdit, onDelete }) {
  const amb = n.ambitoId ? AMBITOS.find(a=>a.id===n.ambitoId) : null
  const AmbIcon = amb ? getAmbitoIcon(amb.id) : null
  const today = todayDs()
  const dateLabel = n.createdAt===today ? 'Hoy' : n.updatedAt!==n.createdAt ? `Editado ${n.updatedAt}` : n.createdAt

  return (
    <div className="group rounded-2xl px-4 py-3.5 transition-all card-hover"
      style={{
        backgroundColor: n.color+'0a',
        border:`1px solid ${n.pinned ? n.color+'45' : n.color+'22'}`,
      }}>
      <div className="flex items-start gap-2">
        {n.pinned && <PushPin size={10} weight="fill" className="shrink-0 mt-1" style={{color:n.color}}/>}
        <p className="flex-1 text-[13px] leading-relaxed" style={{color:'#d8d8d8', whiteSpace:'pre-wrap'}}>{n.text}</p>
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {amb && AmbIcon && (
            <Link to={`/ambito/${amb.id}`}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all hover:opacity-80"
              style={{backgroundColor:amb.color+'18'}}>
              <AmbIcon size={9} weight="fill" style={{color:amb.color}}/>
              <span className="text-[9px] font-semibold" style={{color:amb.color+'cc'}}>{amb.name}</span>
            </Link>
          )}
          <span className="text-[10px]" style={{color:n.color+'55'}}>{dateLabel}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={()=>onPin(n.id)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
            style={{backgroundColor:'#1a1a1a', color:n.pinned?n.color:'#444'}}>
            <PushPin size={10} weight={n.pinned?'fill':'regular'}/>
          </button>
          <button onClick={()=>onEdit(n)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:text-mid"
            style={{backgroundColor:'#1a1a1a', color:'#444'}}>
            <PencilSimple size={10}/>
          </button>
          <button onClick={()=>onDelete(n.id)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:text-red-400"
            style={{backgroundColor:'#1a1a1a', color:'#444'}}>
            <Trash size={10}/>
          </button>
        </div>
      </div>
    </div>
  )
}

function NoteEditCard({ editing, setEditing, onSave }) {
  return (
    <div className="rounded-2xl p-4 space-y-3"
      style={{backgroundColor:editing.color+'0d', border:`1px solid ${editing.color}35`}}>
      <textarea autoFocus
        className="w-full rounded-xl px-3 py-2.5 text-[13px] resize-none outline-none"
        style={{backgroundColor:'#111', border:`1px solid ${editing.color}40`, color:'#e2e2e2', minHeight:72}}
        value={editing.text}
        onChange={e=>setEditing(ed=>({...ed,text:e.target.value}))}
      />
      {/* Ámbito */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={()=>setEditing(ed=>({...ed,ambitoId:null,color:'#c9a227'}))}
          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
          style={!editing.ambitoId
            ?{backgroundColor:'#c9a22722',color:'#c9a227',border:'1px solid #c9a22740'}
            :{backgroundColor:'#111',color:'#444',border:'1px solid #1a1a1a'}}>
          Sin ámbito
        </button>
        {AMBITOS.map(a=>{
          const Icon=getAmbitoIcon(a.id), active=editing.ambitoId===a.id
          return(
            <button key={a.id} onClick={()=>setEditing(ed=>({...ed,ambitoId:active?null:a.id,color:active?'#c9a227':a.color}))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
              style={active?{backgroundColor:a.color+'22',color:a.color,border:`1px solid ${a.color}40`}:{backgroundColor:'#111',color:'#444',border:'1px solid #1a1a1a'}}>
              <Icon size={9} weight={active?'fill':'regular'}/>{a.name}
            </button>
          )
        })}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={()=>setEditing(null)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
          style={{backgroundColor:'#1a1a1a',color:'#666'}}>Cancelar</button>
        <button onClick={onSave} className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
          style={{backgroundColor:editing.color+'22',color:editing.color,border:`1px solid ${editing.color}40`}}>
          Guardar cambios
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function NotasPage() {
  const [notes,   setNotes]   = useState(getQuickNotes)
  const [filter,  setFilter]  = useState('all')   // 'all' | 'general' | ambitoId
  const [search,  setSearch]  = useState('')
  const [text,    setText]    = useState('')
  const [ambitoId,setAmbitoId]= useState(null)
  const [editing, setEditing] = useState(null)
  const [showForm,setShowForm]= useState(false)
  const textareaRef = useRef(null)

  useEffect(()=>{ if(showForm) textareaRef.current?.focus() },[showForm])

  const noteColor = ambitoId ? (AMBITOS.find(a=>a.id===ambitoId)?.color||'#c9a227') : '#c9a227'

  const handleAdd = () => {
    if (!text.trim()) return
    setNotes(addQuickNote({ text, color: noteColor, ambitoId }))
    setText(''); setShowForm(false)
  }
  const handlePin    = id => { const n=notes.find(x=>x.id===id); setNotes(updateQuickNote(id,{pinned:!n.pinned})) }
  const handleDelete = id => setNotes(deleteQuickNote(id))
  const handleSaveEdit = () => {
    if(!editing?.text.trim()) return
    setNotes(updateQuickNote(editing.id,{text:editing.text,color:editing.color,ambitoId:editing.ambitoId}))
    setEditing(null)
  }

  // Conteos por filtro
  const counts = useMemo(()=>{
    const c = { all: notes.length, general: notes.filter(n=>!n.ambitoId).length }
    AMBITOS.forEach(a => { c[a.id] = notes.filter(n=>n.ambitoId===a.id).length })
    return c
  },[notes])

  const filtered = useMemo(()=>{
    let list = notes
    if(filter==='general')  list = list.filter(n=>!n.ambitoId)
    else if(filter!=='all') list = list.filter(n=>n.ambitoId===filter)
    if(search.trim()) list = list.filter(n=>n.text.toLowerCase().includes(search.toLowerCase()))
    return [...list].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0))
  },[notes,filter,search])

  // Agrupar por ámbito cuando filter=all
  const grouped = useMemo(()=>{
    if(filter!=='all' || search.trim()) return null
    const pinned = filtered.filter(n=>n.pinned)
    const byAmb  = {}
    filtered.filter(n=>!n.pinned).forEach(n=>{
      const key = n.ambitoId||'general'
      if(!byAmb[key]) byAmb[key]=[]
      byAmb[key].push(n)
    })
    return { pinned, byAmb }
  },[filtered,filter,search])

  const ambFilters = AMBITOS.filter(a=>(counts[a.id]||0)>0)

  return (
    <div className="min-h-screen p-5 space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{backgroundColor:'#c9a22720'}}>
            <NotePencil size={20} weight="fill" style={{color:'#c9a227'}}/>
          </div>
          <div>
            <h1 className="text-[20px] font-black text-hi leading-tight">Notas</h1>
            <p className="text-[12px] text-lo">{notes.length} nota{notes.length!==1?'s':''} guardada{notes.length!==1?'s':''}</p>
          </div>
        </div>
        <button onClick={()=>setShowForm(f=>!f)}
          className="btn-primary flex items-center gap-1.5 text-[12px]"
          style={showForm?{backgroundColor:'#1a1a1a',color:'#666'}:{}}>
          {showForm ? <><X size={13}/> Cancelar</> : <><Plus size={13} weight="bold"/> Nueva nota</>}
        </button>
      </div>

      {/* Formulario nueva nota */}
      {showForm && (
        <div className="rounded-2xl p-4 space-y-3 ambito-animate"
          style={{backgroundColor:'#0a0a0a', border:`1px solid ${noteColor}30`}}>
          <textarea ref={textareaRef}
            className="w-full rounded-xl px-3 py-2.5 text-[13px] resize-none outline-none"
            style={{
              backgroundColor:'#111', border:`1px solid ${noteColor}40`,
              color:'#e2e2e2', minHeight:80, transition:'border-color 0.2s',
            }}
            placeholder="Escribe una nota... (Ctrl+Enter para guardar)"
            value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&e.ctrlKey) handleAdd() }}
          />
          {/* Selector ámbito */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{color:'#383838'}}>Ámbito (opcional)</p>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={()=>setAmbitoId(null)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                style={!ambitoId?{backgroundColor:'#c9a22722',color:'#c9a227',border:'1px solid #c9a22740'}:{backgroundColor:'#111',color:'#444',border:'1px solid #1a1a1a'}}>
                Sin ámbito
              </button>
              {AMBITOS.map(a=>{
                const Icon=getAmbitoIcon(a.id), active=ambitoId===a.id
                return(
                  <button key={a.id} onClick={()=>setAmbitoId(active?null:a.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                    style={active?{backgroundColor:a.color+'22',color:a.color,border:`1px solid ${a.color}40`}:{backgroundColor:'#111',color:'#444',border:'1px solid #1a1a1a'}}>
                    <Icon size={9} weight={active?'fill':'regular'}/>{a.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95"
              style={{
                backgroundColor: text.trim() ? noteColor+'22' : '#111',
                color: text.trim() ? noteColor : '#333',
                border:`1px solid ${text.trim() ? noteColor+'40' : '#1a1a1a'}`,
              }}>
              <Plus size={12} weight="bold"/> Guardar nota
            </button>
          </div>
        </div>
      )}

      {/* Buscador */}
      {notes.length>0 && (
        <div className="relative">
          <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#404040'}}/>
          <input
            className="w-full rounded-xl pl-8 pr-3 py-2.5 text-[13px] outline-none"
            style={{backgroundColor:'#0d0d0d', border:'1px solid #1a1a1a', color:'#d8d8d8'}}
            placeholder="Buscar notas..."
            value={search} onChange={e=>setSearch(e.target.value)}
          />
          {search && (
            <button onClick={()=>setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-lo hover:text-mid">
              <X size={12}/>
            </button>
          )}
        </div>
      )}

      {/* Filtros */}
      {notes.length>0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {[['all','Todas'],['general','Sin ámbito'],...ambFilters.map(a=>[a.id,a.name])].map(([k,l])=>{
            const cnt=counts[k]||0
            if(k!=='all'&&k!=='general'&&cnt===0) return null
            const amb=AMBITOS.find(a=>a.id===k)
            const Icon=amb?getAmbitoIcon(amb.id):null
            return(
              <button key={k} onClick={()=>setFilter(k)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 transition-all"
                style={filter===k
                  ?{backgroundColor:(amb?.color||'#c9a227')+'22',color:amb?.color||'#c9a227',border:`1px solid ${(amb?.color||'#c9a227')}40`}
                  :{backgroundColor:'#0d0d0d',color:'#444',border:'1px solid #1a1a1a'}}>
                {Icon && <Icon size={10} weight="fill" style={{color:filter===k?(amb?.color||'#c9a227'):'#444'}}/>}
                {l}
                <span className="font-mono text-[10px]">{cnt}</span>
              </button>
            )
          }).filter(Boolean)}
        </div>
      )}

      {/* Contenido */}
      {notes.length===0 ? (
        <div className="card py-16 text-center">
          <p className="text-[40px] mb-4">📝</p>
          <p className="text-[15px] font-semibold text-hi mb-1">Sin notas aún</p>
          <p className="text-[12px] text-lo mb-4">Crea tu primera nota rápida.</p>
          <button className="btn-primary" onClick={()=>setShowForm(true)}>
            <Plus size={13} weight="bold" className="inline mr-1"/>Nueva nota
          </button>
        </div>
      ) : filtered.length===0 ? (
        <div className="card py-12 text-center">
          <p className="text-[13px] text-lo">Sin notas en este filtro</p>
        </div>
      ) : grouped ? (
        /* Vista agrupada por ámbito */
        <div className="space-y-5">
          {/* Fijadas */}
          {grouped.pinned.length>0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <PushPin size={10} weight="fill" style={{color:'#c9a227'}}/>
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{color:'#505050'}}>Fijadas</p>
              </div>
              <div className="space-y-2">
                {grouped.pinned.map(n=>(
                  <div key={n.id}>
                    {editing?.id===n.id
                      ? <NoteEditCard editing={editing} setEditing={setEditing} onSave={handleSaveEdit}/>
                      : <NoteCard n={n} onPin={handlePin} onDelete={handleDelete}
                          onEdit={n=>setEditing({id:n.id,text:n.text,color:n.color,ambitoId:n.ambitoId})}/>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Por ámbito */}
          {Object.entries(grouped.byAmb).map(([key,ns])=>{
            const amb = key==='general' ? null : AMBITOS.find(a=>a.id===key)
            const Icon = amb ? getAmbitoIcon(amb.id) : null
            const color = amb?.color||'#c9a227'
            return(
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {Icon
                      ? <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{backgroundColor:color+'20'}}>
                          <Icon size={11} weight="fill" style={{color}}/>
                        </div>
                      : <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{backgroundColor:'#1a1a1a'}}>
                          <NotePencil size={11} style={{color:'#555'}}/>
                        </div>
                    }
                    <p className="text-[12px] font-bold" style={{color:amb?color:'#555'}}>
                      {amb?amb.name:'Sin ámbito'}
                    </p>
                    <span className="text-[10px] font-mono text-lo">{ns.length}</span>
                  </div>
                  {amb && (
                    <Link to={`/ambito/${amb.id}`}
                      className="text-[10px] text-lo hover:text-accent flex items-center gap-0.5 transition-colors">
                      Ver ámbito <ArrowRight size={10}/>
                    </Link>
                  )}
                </div>
                <div className="space-y-2">
                  {ns.map(n=>(
                    <div key={n.id}>
                      {editing?.id===n.id
                        ? <NoteEditCard editing={editing} setEditing={setEditing} onSave={handleSaveEdit}/>
                        : <NoteCard n={n} onPin={handlePin} onDelete={handleDelete}
                            onEdit={n=>setEditing({id:n.id,text:n.text,color:n.color,ambitoId:n.ambitoId})}/>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Vista filtrada (lista plana) */
        <div className="space-y-2">
          {filtered.map(n=>(
            <div key={n.id}>
              {editing?.id===n.id
                ? <NoteEditCard editing={editing} setEditing={setEditing} onSave={handleSaveEdit}/>
                : <NoteCard n={n} onPin={handlePin} onDelete={handleDelete}
                    onEdit={n=>setEditing({id:n.id,text:n.text,color:n.color,ambitoId:n.ambitoId})}/>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
