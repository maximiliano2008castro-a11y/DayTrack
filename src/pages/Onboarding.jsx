import { useState, useEffect } from 'react'
import {
  ArrowRight, CheckFat, SquaresFour, CheckSquare, Target, Trophy,
  Sparkle,
} from '@phosphor-icons/react'
import { AMBITOS, saveProfile, addHabit } from '../store'
import { getAmbitoIcon } from '../ambitoIcons'

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current, total }) {
  return (
    <div className="flex gap-2 items-center justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-500"
          style={{
            width:  i === current ? 20 : 6,
            height: 6,
            backgroundColor: i === current ? '#2cb99a' : i < current ? '#2cb99a55' : '#242424',
          }}
        />
      ))}
    </div>
  )
}

// ── Feature card (step 2) ─────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-[#111]">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20' }}>
        <Icon size={18} weight="regular" style={{ color }} />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-hi mb-0.5">{title}</p>
        <p className="text-[12px] text-lo leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ── Main Onboarding ───────────────────────────────────────────────────────────
const TOTAL_STEPS = 4

export default function Onboarding({ onComplete }) {
  const [step, setStep]       = useState(0)
  const [visible, setVisible] = useState(true)
  const [name, setName]       = useState('')
  const [selected, setSelected] = useState(['escolar', 'gym', 'mente', 'alimentacion'])
  const [habit, setHabit]     = useState('')
  const [habitAmbito, setHabitAmbito] = useState('escolar')

  const fadeTo = (nextStep) => {
    setVisible(false)
    setTimeout(() => { setStep(nextStep); setVisible(true) }, 280)
  }

  const next = () => {
    if (step < TOTAL_STEPS - 1) fadeTo(step + 1)
    else finish()
  }

  const finish = () => {
    // Save profile
    saveProfile({ name: name.trim() || 'Usuario', selectedAmbitos: selected, createdAt: new Date().toISOString() })

    // Save first habit if user typed one
    if (habit.trim()) {
      addHabit(habit.trim(), habitAmbito)
    }

    onComplete()
  }

  const toggleAmbito = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  const canContinue = step === 0 ? name.trim().length > 0 : true

  return (
    <div
      className="min-h-screen bg-bg flex flex-col items-center justify-center p-6"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #0f1f1a 0%, #0e0e0e 70%)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <SquaresFour size={16} color="#000" weight="fill" />
        </div>
        <span className="text-[16px] font-bold text-hi tracking-tight">DayTrack</span>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-[440px] transition-all duration-300"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
      >
        <Steps current={step} total={TOTAL_STEPS} />

        {/* ── Step 0: Bienvenida + nombre ── */}
        {step === 0 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
              <Sparkle size={32} weight="regular" style={{ color: '#2cb99a' }} />
            </div>
            <h1 className="text-[26px] font-bold text-hi mb-2">Bienvenido</h1>
            <p className="text-[14px] text-lo mb-8 leading-relaxed">
              DayTrack te ayuda a organizar tu vida por ámbitos.<br />
              Habitos, objetivos y logros en un solo lugar.
            </p>
            <div className="text-left mb-6">
              <label className="field-label">Como te llamas?</label>
              <input
                className="field-input text-[15px] h-12"
                placeholder="Tu nombre..."
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canContinue && next()}
                autoFocus
              />
            </div>
          </div>
        )}

        {/* ── Step 1: Que es DayTrack ── */}
        {step === 1 && (
          <div>
            <h2 className="text-[22px] font-bold text-hi mb-1 text-center">Como funciona</h2>
            <p className="text-[13px] text-lo text-center mb-6">Tres herramientas que trabajan juntas</p>
            <div className="space-y-3">
              <FeatureCard
                icon={CheckSquare}
                color="#2cb99a"
                title="Habitos diarios"
                desc="Marca tus rutinas cada dia. Ve tu consistencia en el polígono de rendimiento."
              />
              <FeatureCard
                icon={Target}
                color="#9575cd"
                title="Objetivos por plazo"
                desc="Metas a corto, mediano y largo plazo dentro de cada ambito de tu vida."
              />
              <FeatureCard
                icon={Trophy}
                color="#c9a227"
                title="Logros"
                desc="Registra hitos importantes para mantener la motivacion y ver tu progreso."
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Elegir ambitos ── */}
        {step === 2 && (
          <div>
            <h2 className="text-[22px] font-bold text-hi mb-1 text-center">Tus ambitos</h2>
            <p className="text-[13px] text-lo text-center mb-6">
              Selecciona las areas de tu vida que quieres trabajar.<br/>Puedes cambiar esto despues.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AMBITOS.map(a => {
                const active = selected.includes(a.id)
                const Icon = getAmbitoIcon(a.id)
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAmbito(a.id)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all relative"
                    style={active
                      ? { backgroundColor: a.color + '18', border: `1px solid ${a.color}44`, color: a.color }
                      : { backgroundColor: '#111', border: '1px solid #242424', color: '#555' }
                    }
                  >
                    <Icon size={15} weight={active ? 'fill' : 'regular'} />
                    <span className="text-[13px] font-medium">{a.name}</span>
                    {active && (
                      <CheckFat size={11} weight="fill" className="ml-auto shrink-0" style={{ color: a.color }} />
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-lo text-center mt-3">{selected.length} ambitos seleccionados</p>
          </div>
        )}

        {/* ── Step 3: Primer habito ── */}
        {step === 3 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
              <CheckFat size={30} weight="regular" style={{ color: '#2cb99a' }} />
            </div>
            <h2 className="text-[22px] font-bold text-hi mb-1">Tu primer habito</h2>
            <p className="text-[13px] text-lo mb-6 leading-relaxed">
              Crear un habito ahora para empezar de inmediato.<br/>
              <span className="text-hi">Opcional</span> — puedes saltarte este paso.
            </p>

            <div className="text-left space-y-3 mb-4">
              <div>
                <label className="field-label">Nombre del habito</label>
                <input
                  className="field-input h-11"
                  placeholder="Ej: Leer 20 minutos, Ejercicio..."
                  value={habit}
                  onChange={e => setHabit(e.target.value)}
                  autoFocus
                />
              </div>
              {habit.trim() && (
                <div>
                  <label className="field-label">En que ambito?</label>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {AMBITOS.filter(a => selected.includes(a.id)).map(a => {
                      const Icon = getAmbitoIcon(a.id)
                      return (
                        <button
                          key={a.id}
                          onClick={() => setHabitAmbito(a.id)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all text-left"
                          style={habitAmbito === a.id
                            ? { backgroundColor: a.color + '22', color: a.color, border: `1px solid ${a.color}44` }
                            : { backgroundColor: '#111', border: '1px solid #242424', color: '#555' }
                          }
                        >
                          <Icon size={12} weight={habitAmbito === a.id ? 'fill' : 'regular'} />
                          {a.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Skip link */}
            <button
              onClick={finish}
              className="text-[12px] text-lo hover:text-mid transition-colors block mx-auto mb-1"
            >
              Saltar este paso
            </button>
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={next}
          disabled={!canContinue}
          className="w-full mt-6 h-12 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 transition-all"
          style={{
            backgroundColor: canContinue ? '#2cb99a' : '#1a1a1a',
            color: canContinue ? '#000' : '#333',
            cursor: canContinue ? 'pointer' : 'not-allowed',
          }}
        >
          {step === TOTAL_STEPS - 1 ? (
            <>
              <CheckFat size={16} weight="bold" />
              Entrar a DayTrack
            </>
          ) : (
            <>
              Continuar
              <ArrowRight size={16} weight="bold" />
            </>
          )}
        </button>

        {/* Back link */}
        {step > 0 && (
          <button
            onClick={() => fadeTo(step - 1)}
            className="text-[12px] text-lo hover:text-mid transition-colors block mx-auto mt-3"
          >
            Volver
          </button>
        )}
      </div>

      {/* Bottom note */}
      <p className="text-[11px] text-lo mt-10 text-center">
        Todos los datos se guardan localmente en tu dispositivo.
      </p>
    </div>
  )
}
