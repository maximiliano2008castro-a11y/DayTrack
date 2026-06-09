import { useState } from 'react'
import { FloppyDisk, SmileySad, SmileyMeh, SmileyBlank, Smiley, SmileyWink } from '@phosphor-icons/react'
import AmbitoHeader from '../../components/AmbitoHeader'
import { getHabits, getTodayPersonal, saveTodayPersonal, getPersonalLog } from '../../store'

const MOODS = [SmileySad, SmileyMeh, SmileyBlank, Smiley, SmileyWink]

export default function PersonalView({ ambito }) {
  const habits = getHabits()
  const [entry, setEntry] = useState(getTodayPersonal)
  const [log] = useState(() => getPersonalLog().slice(0, 14))
  const [saved, setSaved] = useState(false)

  const update = (key, val) => { setEntry(e => ({ ...e, [key]: val })); setSaved(false) }
  const save = () => { saveTodayPersonal(entry); setSaved(true) }

  return (
    <div className="min-h-screen">
      <AmbitoHeader ambito={ambito} habits={habits} extra={
        <button onClick={save} className="btn-primary flex items-center gap-1.5 ml-auto">
          <FloppyDisk size={14} /> {saved ? 'Guardado' : 'Guardar dia'}
        </button>
      } />

      <div className="p-3 md:p-6 flex flex-col md:grid md:grid-cols-[1fr_220px] gap-4 md:gap-5">
        <div className="space-y-4">
          {/* Mood */}
          <div className="card">
            <p className="section-title">Como estuvo tu dia?</p>
            <div className="flex gap-3">
              {MOODS.map((MoodIcon, i) => (
                <button key={i} onClick={() => update('mood', i + 1)}
                  className="flex-1 py-3 rounded-xl flex items-center justify-center transition-all"
                  style={entry.mood === i + 1
                    ? { backgroundColor: ambito.color + '20', border: `1px solid ${ambito.color}44` }
                    : { backgroundColor: '#111', border: '1px solid #242424' }}>
                  <MoodIcon size={22} weight={entry.mood === i + 1 ? 'fill' : 'regular'}
                    style={{ color: entry.mood === i + 1 ? ambito.color : '#555' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Win of the day */}
          <div className="card">
            <p className="section-title">Logro del dia</p>
            <input className="field-input"
              placeholder="Cual fue tu mayor logro hoy?"
              value={entry.win || ''}
              onChange={e => update('win', e.target.value)}
            />
          </div>

          {/* Gratitude */}
          <div className="card">
            <p className="section-title">3 cosas por las que estoy agradecido</p>
            <textarea className="field-input h-24 resize-none"
              placeholder="1. &#10;2. &#10;3. "
              value={entry.gratitude || ''}
              onChange={e => update('gratitude', e.target.value)}
            />
          </div>

          {/* Reflection */}
          <div className="card">
            <p className="section-title">Reflexion del dia</p>
            <textarea className="field-input h-32 resize-none"
              placeholder="Como fue tu dia? Que aprendiste? Que podrias mejorar manana?"
              value={entry.reflection || ''}
              onChange={e => update('reflection', e.target.value)}
            />
          </div>
        </div>

        {/* Sidebar: history */}
        <div className="space-y-4">
          <div className="card">
            <p className="section-title">Historial</p>
            {log.length === 0 ? <p className="text-[12px] text-lo">Sin entradas aun.</p> : (
              <div className="space-y-2">
                {log.map(e => (
                  <div key={e.date} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                    {(() => { const MI = MOODS[(e.mood || 3) - 1]; return <MI size={14} weight="regular" style={{ color: '#555', flexShrink: 0 }} /> })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-mono text-lo">{e.date}</p>
                      {e.win && <p className="text-[11px] text-mid truncate">{e.win}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Streak of entries */}
          <div className="card text-center">
            <p className="text-[10px] text-lo mb-1">Dias con entrada</p>
            <p className="text-[36px] font-bold font-mono text-hi">{log.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
