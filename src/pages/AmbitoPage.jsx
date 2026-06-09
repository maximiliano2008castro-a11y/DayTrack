import { useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { AMBITOS, getQuickNotes, addQuickNote, updateQuickNote, deleteQuickNote } from '../store'
import { getAmbitoIcon } from '../ambitoIcons'
import { Plus, NotePencil, PushPin, Trash, PencilSimple, X, ArrowRight } from '@phosphor-icons/react'
import GymView          from './ambitos/GymView'
import EscolarView      from './ambitos/EscolarView'
import AlimentacionView from './ambitos/AlimentacionView'
import FinanzasView     from './ambitos/FinanzasView'
import MenteView        from './ambitos/MenteView'
import SaludView        from './ambitos/SaludView'
import TrabajoView      from './ambitos/TrabajoView'
import HobbiesView      from './ambitos/HobbiesView'
import SocialView       from './ambitos/SocialView'
import PersonalView     from './ambitos/PersonalView'

const VIEWS = {
  gym:          GymView,
  escolar:      EscolarView,
  alimentacion: AlimentacionView,
  finanzas:     FinanzasView,
  mente:        MenteView,
  salud:        SaludView,
  trabajo:      TrabajoView,
  hobbies:      HobbiesView,
  social:       SocialView,
  personal:     PersonalView,
}

// ── Widget de notas del ámbito ────────────────────────────────────────────────
function AmbitoNotesWidget({ ambito }) {
  const [notes,   setNotes]   = useState(() => getQuickNotes().filter(n => n.ambitoId === ambito.id))
  const [text,    setText]    = useState('')
  const [open,    setOpen]    = useState(false)
  const [editing, setEditing] = useState(null)

  const allNotes = getQuickNotes().filter(n => n.ambitoId === ambito.id)
  const sorted = [...allNotes].sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0))

  const refresh = () => setNotes(getQuickNotes().filter(n => n.ambitoId === ambito.id))

  const handleAdd = () => {
    if (!text.trim()) return
    addQuickNote({ text, color: ambito.color, ambitoId: ambito.id })
    setText(''); refresh()
  }
  const handlePin = id => {
    const n = getQuickNotes().find(x => x.id===id)
    updateQuickNote(id, { pinned: !n.pinned }); refresh()
  }
  const handleDelete = id => { deleteQuickNote(id); refresh() }
  const handleSaveEdit = () => {
    if (!editing?.text.trim()) return
    updateQuickNote(editing.id, { text: editing.text }); setEditing(null); refresh()
  }

  const Icon = getAmbitoIcon(ambito.id)

  return (
    <div className="mx-5 mb-5 rounded-2xl overflow-hidden"
      style={{backgroundColor:'#0a0a0a', border:`1px solid ${ambito.color}20`}}>

      {/* Header colapsable */}
      <button className="w-full flex items-center justify-between px-4 py-3 transition-all"
        style={{backgroundColor:'transparent'}}
        onClick={()=>setOpen(o=>!o)}>
        <div className="flex items-center gap-2">
          <NotePencil size={13} weight="fill" style={{color:ambito.color+'99'}}/>
          <span className="text-[12px] font-bold" style={{color:ambito.color+'aa'}}>
            Notas de {ambito.name}
          </span>
          {sorted.length>0 &&
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono"
              style={{backgroundColor:ambito.color+'18', color:ambito.color+'cc'}}>
              {sorted.length}
            </span>
          }
        </div>
        <div className="flex items-center gap-2">
          <Link to="/notas" onClick={e=>e.stopPropagation()}
            className="text-[10px] text-lo hover:text-accent flex items-center gap-0.5 transition-colors">
            Ver todas <ArrowRight size={9}/>
          </Link>
          <span className="text-lo text-[12px]">{open?'▲':'▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3" style={{borderTop:`1px solid ${ambito.color}15`}}>
          {/* Input rápido */}
          <div className="flex gap-2 mt-3">
            <input
              className="flex-1 rounded-xl px-3 py-2 text-[12px] outline-none"
              style={{backgroundColor:'#111', border:`1px solid ${ambito.color}30`, color:'#e2e2e2'}}
              placeholder={`Nueva nota para ${ambito.name}...`}
              value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleAdd()}
            />
            <button onClick={handleAdd}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90"
              style={{
                backgroundColor: text.trim() ? ambito.color+'22' : '#111',
                border:`1px solid ${text.trim() ? ambito.color+'40' : '#1a1a1a'}`,
                color: text.trim() ? ambito.color : '#333',
              }}>
              <Plus size={14} weight="bold"/>
            </button>
          </div>

          {/* Lista */}
          {sorted.length===0 ? (
            <p className="text-[11px] text-lo text-center py-3">Sin notas para este ámbito aún</p>
          ) : (
            <div className="space-y-2">
              {sorted.map(n=>(
                <div key={n.id}>
                  {editing?.id===n.id ? (
                    <div className="rounded-xl p-2.5 space-y-2"
                      style={{backgroundColor:ambito.color+'0d', border:`1px solid ${ambito.color}25`}}>
                      <textarea autoFocus
                        className="w-full rounded-lg px-2.5 py-2 text-[12px] resize-none outline-none"
                        style={{backgroundColor:'#111', border:`1px solid ${ambito.color}35`, color:'#e2e2e2', minHeight:56}}
                        value={editing.text}
                        onChange={e=>setEditing(ed=>({...ed,text:e.target.value}))}
                      />
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={()=>setEditing(null)} className="px-2 py-1 rounded-lg text-[10px]"
                          style={{backgroundColor:'#1a1a1a',color:'#555'}}>Cancelar</button>
                        <button onClick={handleSaveEdit} className="px-2 py-1 rounded-lg text-[10px] font-bold"
                          style={{backgroundColor:ambito.color+'22',color:ambito.color}}>Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex items-start gap-2 px-3 py-2.5 rounded-xl transition-all"
                      style={{backgroundColor:ambito.color+'08', border:`1px solid ${n.pinned?ambito.color+'35':ambito.color+'15'}`}}>
                      {n.pinned && <PushPin size={9} weight="fill" className="shrink-0 mt-0.5" style={{color:ambito.color}}/>}
                      <p className="flex-1 text-[12px] leading-relaxed" style={{color:'#ccc', whiteSpace:'pre-wrap'}}>{n.text}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button onClick={()=>handlePin(n.id)}
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{color:n.pinned?ambito.color:'#444'}}>
                          <PushPin size={9} weight={n.pinned?'fill':'regular'}/>
                        </button>
                        <button onClick={()=>setEditing({id:n.id,text:n.text})}
                          className="w-5 h-5 rounded flex items-center justify-center hover:text-mid"
                          style={{color:'#444'}}>
                          <PencilSimple size={9}/>
                        </button>
                        <button onClick={()=>handleDelete(n.id)}
                          className="w-5 h-5 rounded flex items-center justify-center hover:text-red-400"
                          style={{color:'#444'}}>
                          <Trash size={9}/>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── AmbitoPage ────────────────────────────────────────────────────────────────
export default function AmbitoPage() {
  const { id } = useParams()
  const ambito = AMBITOS.find(a => a.id === id)
  if (!ambito) return <Navigate to="/" replace />
  const View = VIEWS[id]
  if (!View) return <Navigate to="/" replace />

  return (
    <div key={id} className="ambito-animate">
      <View ambito={ambito} />
      <AmbitoNotesWidget ambito={ambito} />
    </div>
  )
}
