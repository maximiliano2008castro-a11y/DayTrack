// ── DayTrack Data Layer ─────────────────────────────────────────────────────
// localStorage-backed store. Each save() also replicates to Firestore.
import { pushKeyToCloud } from './sync'

export const AMBITOS = [
  { id: 'escolar',      name: 'Escolar',      color: '#5b84e8' },
  { id: 'trabajo',      name: 'Trabajo',      color: '#9575cd' },
  { id: 'gym',          name: 'Gym',          color: '#e05c5c' },
  { id: 'alimentacion', name: 'Alimentacion', color: '#e07c4a' },
  { id: 'salud',        name: 'Salud',        color: '#4cae8a' },
  { id: 'finanzas',     name: 'Finanzas',     color: '#c9a227' },
  { id: 'mente',        name: 'Mente',        color: '#7ec45a' },
  { id: 'social',       name: 'Social',       color: '#d4608a' },
  { id: 'hobbies',      name: 'Hobbies',      color: '#a07fcf' },
  { id: 'personal',     name: 'Personal',     color: '#7a8a9a' },
]

export const getAmbito = id => AMBITOS.find(a => a.id === id) || AMBITOS[AMBITOS.length - 1]

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function load(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback }
  catch { return fallback }
}
const save = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val))
  pushKeyToCloud(key, val)   // replica a Firestore en segundo plano
}

// ── HABITS ──────────────────────────────────────────────────────────────────
export const getHabits = () => load('lt2_habits', [])
export const saveHabits = h => save('lt2_habits', h)

export function addHabit(data) {
  const habits = getHabits()
  // legacy: addHabit(name, ambitoId) support
  const entry = typeof data === 'string'
    ? { id: Date.now().toString(), name: data, ambitoId: arguments[1], completedDays: [], createdAt: today(),
        emoji:'✅', frequency:{ type:'diario', days:[], count:1 }, goal:'', color:'' }
    : { id: Date.now().toString(), completedDays: [], createdAt: today(), ...data }
  habits.push(entry)
  saveHabits(habits); return [...habits]
}
export function updateHabit(id, changes) {
  const habits = getHabits().map(h => h.id === id ? { ...h, ...changes } : h)
  saveHabits(habits); return [...habits]
}
export function deleteHabit(id) {
  const h = getHabits().filter(h => h.id !== id); saveHabits(h); return h
}
export function toggleHabitDay(habitId, date) {
  const habits = getHabits()
  const h = habits.find(x => x.id === habitId); if (!h) return habits
  const i = h.completedDays.indexOf(date)
  if (i >= 0) h.completedDays.splice(i, 1); else h.completedDays.push(date)
  saveHabits(habits); return [...habits]
}

// Devuelve true si el hábito aplica para la fecha dada según su frecuencia
export function habitDueOn(habit, dateStr) {
  const freq = habit.frequency || { type: 'diario' }
  if (freq.type === 'diario') return true
  if (freq.type === 'diasSemana') {
    const dow = new Date(dateStr + 'T12:00').getDay() // 0=dom
    return (freq.days || []).includes(dow)
  }
  if (freq.type === 'vecesxsemana') return true // aparece siempre, usuario elige cuándo
  return true
}

// ── OBJECTIVES ──────────────────────────────────────────────────────────────
export const getObjectives = () => load('lt2_objectives', [])
export function addObjective(obj) {
  const list = getObjectives()
  list.push({ id: Date.now().toString(), createdAt: today(), progress: 0, ...obj })
  save('lt2_objectives', list); return [...list]
}
export function updateObjective(id, changes) {
  const list = getObjectives().map(o => o.id === id ? { ...o, ...changes } : o)
  save('lt2_objectives', list); return list
}
export function deleteObjective(id) {
  const list = getObjectives().filter(o => o.id !== id)
  save('lt2_objectives', list); return list
}

// ── QUICK NOTES (Dashboard) ──────────────────────────────────────────────────
export const getQuickNotes = () => load('dt_quick_notes', [])
export function addQuickNote({ text, color='#2cb99a', pinned=false, ambitoId=null }) {
  const list = getQuickNotes()
  const note = { id: Date.now().toString(), text: text.trim(), color, pinned, ambitoId, createdAt: today(), updatedAt: today() }
  list.unshift(note)
  save('dt_quick_notes', list)
  return [...list]
}
export function updateQuickNote(id, changes) {
  const list = getQuickNotes().map(n => n.id===id ? {...n,...changes, updatedAt:today()} : n)
  save('dt_quick_notes', list); return [...list]
}
export function deleteQuickNote(id) {
  const list = getQuickNotes().filter(n => n.id !== id)
  save('dt_quick_notes', list); return [...list]
}

// ── ACHIEVEMENTS ────────────────────────────────────────────────────────────
export const getAchievements = () => load('lt2_achievements', [])
export function addAchievement(a) {
  const list = getAchievements()
  list.unshift({ id: Date.now().toString(), date: today(), ...a })
  save('lt2_achievements', list); return [...list]
}
export function deleteAchievement(id) {
  const list = getAchievements().filter(a => a.id !== id)
  save('lt2_achievements', list); return list
}

// ── GYM ─────────────────────────────────────────────────────────────────────
export const getRutinas   = () => load('dt_gym_rutinas', [])
export const saveRutinas  = r => save('dt_gym_rutinas', r)
export const getWeekPlan  = () => load('dt_gym_week_plan', {})
export const saveWeekPlan = p => save('dt_gym_week_plan', p)
export const getGymUnit     = () => load('dt_gym_unit', 'kg')
export const saveGymUnit    = u => save('dt_gym_unit', u)
export const getGymRestSecs = () => load('dt_gym_rest_secs', 90)
export const saveGymRestSecs= s => save('dt_gym_rest_secs', s)

export const getGymSessions = () => load('dt_gym_sessions', [])
export function addGymSession(session) {
  const list = getGymSessions()
  list.unshift(session)
  save('dt_gym_sessions', list)
  return [...list]
}
export function getLastWeightsForExercise(name) {
  for (const session of getGymSessions()) {
    for (const ex of (session.exercises || [])) {
      if (ex.name === name) {
        const ws = (ex.sets || []).map(s => Number(s.weight) || 0)
        if (ws.some(w => w > 0)) return ws
      }
    }
  }
  return []
}

export const getActiveGymSession  = () => load('dt_gym_active_session', null)
export const saveActiveGymSession = s => save('dt_gym_active_session', s)
export const clearActiveGymSession = () => save('dt_gym_active_session', null)

export const getWorkouts = () => load('dt_gym_workouts', [])
export function saveWorkout(workout) {
  const list = getWorkouts()
  const i = list.findIndex(w => w.date === workout.date)
  if (i >= 0) list[i] = workout; else list.unshift(workout)
  save('dt_gym_workouts', list); return [...list]
}
export function getTodayWorkout() {
  return getWorkouts().find(w => w.date === today()) || { date: today(), exercises: [] }
}

// ── ESCOLAR ─────────────────────────────────────────────────────────────────
export const getMaterias = () => load('dt_escolar_materias', [])
export function addMateria(m) {
  const list = getMaterias()
  list.push({ id: Date.now().toString(), createdAt: today(), ...m })
  save('dt_escolar_materias', list); return [...list]
}
export function deleteMateria(id) {
  const list = getMaterias().filter(m => m.id !== id)
  save('dt_escolar_materias', list); return list
}

export const getTasks = () => load('dt_escolar_tasks', [])
export function addTask(t) {
  const list = getTasks()
  list.unshift({ id: Date.now().toString(), createdAt: today(), done: false, ...t })
  save('dt_escolar_tasks', list); return [...list]
}
export function toggleTask(id) {
  const list = getTasks().map(t => t.id === id ? { ...t, done: !t.done } : t)
  save('dt_escolar_tasks', list); return list
}
export function updateTask(id, changes) {
  const list = getTasks().map(t => t.id === id ? { ...t, ...changes } : t)
  save('dt_escolar_tasks', list); return list
}
export function deleteTask(id) {
  const list = getTasks().filter(t => t.id !== id); save('dt_escolar_tasks', list); return list
}

export const getSchedule = () => load('dt_escolar_schedule', [])
export function addScheduleEntry(entry) {
  const list = getSchedule()
  list.push({ id: Date.now().toString(), ...entry })
  save('dt_escolar_schedule', list); return [...list]
}
export function deleteScheduleEntry(id) {
  const list = getSchedule().filter(e => e.id !== id)
  save('dt_escolar_schedule', list); return list
}

export const getNotes = () => load('dt_escolar_notes', [])
export function addNote(note) {
  const list = getNotes()
  list.unshift({ id: Date.now().toString(), createdAt: today(), ...note })
  save('dt_escolar_notes', list); return [...list]
}
export function deleteNote(id) {
  const list = getNotes().filter(n => n.id !== id); save('dt_escolar_notes', list); return list
}

// ── ALIMENTACION ─────────────────────────────────────────────────────────────
const WEEK_KEYS = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo']
const _base = [
  { name:'Desayuno', time:'07:00' },
  { name:'Almuerzo', time:'13:00' },
  { name:'Cena',     time:'20:00' },
]
const DEFAULT_WEEKLY_PLAN = Object.fromEntries(
  WEEK_KEYS.map(k => [k, _base.map((m,i) => ({ id:`${k}-d${i}`, ...m }))])
)
export const getMealPlanWeekly  = () => load('dt_meal_plan_weekly', DEFAULT_WEEKLY_PLAN)
export const saveMealPlanWeekly = p  => save('dt_meal_plan_weekly', p)
// legacy (kept for compat)
export const getMealPlan  = () => load('dt_meal_plan', _base.map((m,i)=>({id:`mp${i}`,...m})))
export const saveMealPlan = p  => save('dt_meal_plan', p)

export const getFoodLibrary = () => load('dt_food_library', [])
export function addFoodToLibrary(food) {
  const list = getFoodLibrary()
  const entry = { id: Date.now().toString(), custom: true, ...food }
  list.push(entry); save('dt_food_library', list); return [...list]
}
export function deleteFoodFromLibrary(id) {
  const list = getFoodLibrary().filter(f => f.id !== id)
  save('dt_food_library', list); return list
}

export const getMeals = () => load('dt_diet_meals', [])
export function addMeal(meal) {
  const list = getMeals()
  list.push({ id: Date.now().toString(), date: today(), ...meal })
  save('dt_diet_meals', list); return [...list]
}
export function deleteMeal(id) {
  const list = getMeals().filter(m => m.id !== id); save('dt_diet_meals', list); return list
}
export const getDietGoals = () => load('dt_diet_goals', { protein: 120, carbs: 250, fat: 60, calories: 2200 })
export const saveDietGoals = g => save('dt_diet_goals', g)

// ── FINANZAS ─────────────────────────────────────────────────────────────────
export const getFinanceEntries = () => load('dt_finance_entries', [])
export function addFinanceEntry(entry) {
  const list = getFinanceEntries()
  list.unshift({ id: Date.now().toString(), date: today(), accountId: '', ...entry })
  save('dt_finance_entries', list); return [...list]
}
export function deleteFinanceEntry(id) {
  const list = getFinanceEntries().filter(e => e.id !== id)
  save('dt_finance_entries', list); return list
}
// Presupuesto por categoría
export const getBudgets = () => load('dt_finance_budgets', {})
export const saveBudgets = b => save('dt_finance_budgets', b)
// Metas de ahorro
export const getSavingsGoals = () => load('dt_savings_goals', [])
export function addSavingsGoal(g) {
  const list = getSavingsGoals()
  list.push({ id: Date.now().toString(), current: 0, createdAt: today(), ...g })
  save('dt_savings_goals', list); return [...list]
}
export function updateSavingsGoal(id, changes) {
  const list = getSavingsGoals().map(g => g.id===id ? {...g,...changes} : g)
  save('dt_savings_goals', list); return [...list]
}
export function deleteSavingsGoal(id) {
  const list = getSavingsGoals().filter(g => g.id!==id)
  save('dt_savings_goals', list); return [...list]
}
// Gastos recurrentes
export const getRecurring = () => load('dt_recurring', [])
export function addRecurring(r) {
  const list = getRecurring()
  list.push({ id: Date.now().toString(), ...r })
  save('dt_recurring', list); return [...list]
}
export function deleteRecurring(id) {
  const list = getRecurring().filter(r => r.id!==id)
  save('dt_recurring', list); return [...list]
}
// Deudas
export const getDebts = () => load('dt_debts', [])
export function addDebt(d) {
  const list = getDebts()
  list.push({ id: Date.now().toString(), paid: false, createdAt: today(), ...d })
  save('dt_debts', list); return [...list]
}
export function updateDebt(id, changes) {
  const list = getDebts().map(d => d.id===id ? {...d,...changes} : d)
  save('dt_debts', list); return [...list]
}
export function deleteDebt(id) {
  const list = getDebts().filter(d => d.id!==id)
  save('dt_debts', list); return [...list]
}
// Cuentas / bolsillos
export const getAccounts = () => load('dt_accounts', [])
export function addAccount(a) {
  const list = getAccounts()
  list.push({ id: Date.now().toString(), ...a })
  save('dt_accounts', list); return [...list]
}
export function updateAccount(id, changes) {
  const list = getAccounts().map(a => a.id===id ? {...a,...changes} : a)
  save('dt_accounts', list); return [...list]
}
export function deleteAccount(id) {
  const list = getAccounts().filter(a => a.id!==id)
  save('dt_accounts', list); return [...list]
}

// ── SALUD ────────────────────────────────────────────────────────────────────
const HEALTH_DEFAULT = { date:'', water:0, sleep:0, sleepStart:'', sleepEnd:'', sleepQuality:3,
  weight:null, steps:0, mood:3, heartRate:null, heartRateMax:null,
  bpSystolic:null, bpDiastolic:null, temperature:null, symptoms:'', notes:'' }
export const getHealthLog = () => load('dt_health_log', [])
export function saveTodayHealth(data) {
  const list = getHealthLog()
  const i = list.findIndex(e => e.date === today())
  const entry = { ...HEALTH_DEFAULT, date: today(), ...data }
  if (i >= 0) list[i] = entry; else list.unshift(entry)
  save('dt_health_log', list); return [...list]
}
export function getTodayHealth() {
  return getHealthLog().find(e => e.date === today()) || { ...HEALTH_DEFAULT, date: today() }
}
// Metas de salud personalizables
export const getHealthGoals = () => load('dt_health_goals', { water:8, sleep:8, steps:10000 })
export const saveHealthGoals = g => save('dt_health_goals', g)
// Medicamentos / suplementos
export const getMeds = () => load('dt_meds', [])
export function addMed(m) {
  const list = getMeds()
  list.push({ id: Date.now().toString(), name: m.name, dose: m.dose||'', times: m.times||1, color: m.color||'#2cb99a' })
  save('dt_meds', list); return [...list]
}
export function deleteMed(id) { const l=getMeds().filter(m=>m.id!==id); save('dt_meds',l); return l }
// Registro de tomas de medicamentos (por fecha)
export const getMedLog = () => load('dt_med_log', {})
export function toggleMedTaken(medId, date) {
  const log = getMedLog()
  const key = `${date}_${medId}`
  log[key] = !log[key]
  save('dt_med_log', log); return {...log}
}

// ── MENTE ─────────────────────────────────────────────────────────────────────
export const getMenteLog = () => load('dt_mente_log', [])
export function saveTodayMente(data) {
  const list = getMenteLog()
  const i = list.findIndex(e => e.date === today())
  const entry = { date: today(), mood: 3, energy: 3, anxiety: 3, meditation: 0,
    journal: '', gratitude: '', prompts: {}, breathingCycles: 0, affirmationRead: false, ...data }
  if (i >= 0) list[i] = entry; else list.unshift(entry)
  save('dt_mente_log', list); return [...list]
}
export function getTodayMente() {
  return getMenteLog().find(e => e.date === today()) ||
    { date: today(), mood: 3, energy: 3, anxiety: 3, meditation: 0,
      journal: '', gratitude: '', prompts: {}, breathingCycles: 0, affirmationRead: false }
}
// Afirmaciones personalizadas
export const getAffirmations = () => load('dt_affirmations', [])
export function addAffirmation(text) {
  const list = getAffirmations()
  list.push({ id: Date.now().toString(), text, createdAt: today() })
  save('dt_affirmations', list); return [...list]
}
export function deleteAffirmation(id) {
  const list = getAffirmations().filter(a => a.id !== id)
  save('dt_affirmations', list); return [...list]
}

// ── TRABAJO ──────────────────────────────────────────────────────────────────
export const getWorkTasks = () => load('dt_work_tasks', [])
export function addWorkTask(t) {
  const list = getWorkTasks()
  list.unshift({ id: Date.now().toString(), createdAt: today(), done: false, status: 'todo', estimatedHours: 0, tags: [], dueDate: '', ...t })
  save('dt_work_tasks', list); return [...list]
}
export function updateWorkTask(id, changes) {
  const list = getWorkTasks().map(t => t.id === id ? { ...t, ...changes } : t)
  save('dt_work_tasks', list); return list
}
export function toggleWorkTask(id) {
  const list = getWorkTasks().map(t => t.id === id ? { ...t, done: !t.done, status: t.done ? 'todo' : 'done' } : t)
  save('dt_work_tasks', list); return list
}
export function deleteWorkTask(id) {
  const list = getWorkTasks().filter(t => t.id !== id); save('dt_work_tasks', list); return list
}
// Jornada laboral
export const getWorkSessions = () => load('dt_work_sessions', [])
export function startWorkSession() {
  const sessions = getWorkSessions()
  const existing = sessions.find(s => s.date === today())
  if (existing && !existing.end) return sessions
  const s = { id: Date.now().toString(), date: today(), start: new Date().toTimeString().slice(0,5), end: null, duration: 0 }
  sessions.unshift(s); save('dt_work_sessions', sessions); return [...sessions]
}
export function endWorkSession() {
  const sessions = getWorkSessions()
  const idx = sessions.findIndex(s => s.date === today() && !s.end)
  if (idx < 0) return sessions
  const s = sessions[idx]
  const [sh, sm] = s.start.split(':').map(Number)
  const now = new Date()
  const duration = Math.round(((now.getHours()*60+now.getMinutes()) - (sh*60+sm)))
  sessions[idx] = { ...s, end: now.toTimeString().slice(0,5), duration }
  save('dt_work_sessions', sessions); return [...sessions]
}
// Pomodoro history
export const getPomHistory = () => load('dt_pom_history', [])
export function addPomEntry(taskId, taskTitle) {
  const list = getPomHistory()
  list.unshift({ id: Date.now().toString(), date: today(), taskId, taskTitle, completedAt: new Date().toTimeString().slice(0,5) })
  save('dt_pom_history', list); return [...list]
}
// Meeting notes
export const getMeetingNotes = () => load('dt_meeting_notes', [])
export function addMeetingNote(n) {
  const list = getMeetingNotes()
  list.unshift({ id: Date.now().toString(), date: today(), ...n })
  save('dt_meeting_notes', list); return [...list]
}
export function deleteMeetingNote(id) {
  const list = getMeetingNotes().filter(n => n.id !== id)
  save('dt_meeting_notes', list); return list
}

// ── HOBBIES ──────────────────────────────────────────────────────────────────
export const getHobbyProjects = () => load('dt_hobby_projects', [])
export function addHobbyProject(p) {
  const list = getHobbyProjects()
  list.unshift({ id: Date.now().toString(), createdAt: today(), status: 'activo', totalMinutes: 0, ...p })
  save('dt_hobby_projects', list); return [...list]
}
export function logHobbyTime(projectId, minutes) {
  const list = getHobbyProjects().map(p =>
    p.id === projectId ? { ...p, totalMinutes: (p.totalMinutes || 0) + minutes, lastSession: today() } : p
  )
  save('dt_hobby_projects', list); return list
}
export function deleteHobbyProject(id) {
  const list = getHobbyProjects().filter(p => p.id !== id); save('dt_hobby_projects', list); return list
}
export function updateHobbyProject(id, changes) {
  const list = getHobbyProjects().map(p => p.id === id ? { ...p, ...changes } : p)
  save('dt_hobby_projects', list); return list
}

// Hobby time sessions log
export const getHobbyLog = () => load('dt_hobby_log', [])
export function addHobbySession(projectId, minutes, note = '') {
  const log = getHobbyLog()
  log.unshift({ id: Date.now().toString(), projectId, minutes, note, date: today() })
  save('dt_hobby_log', log)
  // update project totals + last session
  const projects = getHobbyProjects().map(p =>
    p.id === projectId ? { ...p, totalMinutes: (p.totalMinutes||0)+minutes, lastSession: today() } : p
  )
  save('dt_hobby_projects', projects)
  return log
}

// Wishlist
export const getHobbyWishlist = () => load('dt_hobby_wishlist', [])
export function addHobbyWish(item) {
  const list = getHobbyWishlist()
  list.unshift({ id: Date.now().toString(), done: false, priority: 'media', budget: '', ...item })
  save('dt_hobby_wishlist', list); return [...list]
}
export function updateHobbyWish(id, changes) {
  const list = getHobbyWishlist().map(w => w.id === id ? { ...w, ...changes } : w)
  save('dt_hobby_wishlist', list); return list
}
export function deleteHobbyWish(id) {
  const list = getHobbyWishlist().filter(w => w.id !== id)
  save('dt_hobby_wishlist', list); return list
}

// Hobby goals
export const getHobbyGoals = () => load('dt_hobby_goals', [])
export function addHobbyGoal(g) {
  const list = getHobbyGoals()
  list.unshift({ id: Date.now().toString(), ...g })
  save('dt_hobby_goals', list); return [...list]
}
export function deleteHobbyGoal(id) {
  const list = getHobbyGoals().filter(g => g.id !== id)
  save('dt_hobby_goals', list); return list
}

// ── SOCIAL ────────────────────────────────────────────────────────────────────
export const getSocialEvents = () => load('dt_social_events', [])
export function addSocialEvent(e) {
  const list = getSocialEvents()
  list.push({ id: Date.now().toString(), ...e })
  list.sort((a, b) => a.date.localeCompare(b.date))
  save('dt_social_events', list); return [...list]
}
export function deleteSocialEvent(id) {
  const list = getSocialEvents().filter(e => e.id !== id); save('dt_social_events', list); return list
}
export function updateSocialEvent(id, changes) {
  const list = getSocialEvents().map(e => e.id === id ? { ...e, ...changes } : e)
  save('dt_social_events', list); return list
}

// Contacts
export const getContacts = () => load('dt_contacts', [])
export function addContact(c) {
  const list = getContacts()
  list.push({ id: Date.now().toString(), name:'', emoji:'🧑', category:'amigo', birthday:'', notes:'', tags:[], ...c })
  save('dt_contacts', list); return [...list]
}
export function updateContact(id, changes) {
  const list = getContacts().map(c => c.id === id ? { ...c, ...changes } : c)
  save('dt_contacts', list); return list
}
export function deleteContact(id) {
  const list = getContacts().filter(c => c.id !== id); save('dt_contacts', list); return list
}

// Interactions
export const getInteractions = () => load('dt_interactions', [])
export function addInteraction(inter) {
  const list = getInteractions()
  list.unshift({ id: Date.now().toString(), date: today(), ...inter })
  save('dt_interactions', list); return [...list]
}
export function deleteInteraction(id) {
  const list = getInteractions().filter(i => i.id !== id); save('dt_interactions', list); return list
}

// Social quality log (daily score)
export const getSocialLog = () => load('dt_social_log', [])
export function saveTodaySocial(data) {
  const list = getSocialLog()
  const i = list.findIndex(e => e.date === today())
  const entry = { date: today(), score: 3, notes: '', ...data }
  if (i >= 0) list[i] = entry; else list.unshift(entry)
  save('dt_social_log', list)
}
export function getTodaySocial() {
  return getSocialLog().find(e => e.date === today()) || { date: today(), score: 3, notes: '' }
}

// Social goals
export const getSocialGoals = () => load('dt_social_goals', [])
export function addSocialGoal(g) {
  const list = getSocialGoals()
  list.push({ id: Date.now().toString(), active: true, ...g })
  save('dt_social_goals', list); return [...list]
}
export function deleteSocialGoal(id) {
  const list = getSocialGoals().filter(g => g.id !== id); save('dt_social_goals', list); return list
}
export function updateSocialGoal(id, changes) {
  const list = getSocialGoals().map(g => g.id === id ? { ...g, ...changes } : g)
  save('dt_social_goals', list); return list
}

// ── PERSONAL ─────────────────────────────────────────────────────────────────
export const getPersonalLog = () => load('dt_personal_log', [])
export function saveTodayPersonal(data) {
  const list = getPersonalLog()
  const i = list.findIndex(e => e.date === today())
  const entry = { date: today(), mood: 3, reflection: '', gratitude: '', win: '', ...data }
  if (i >= 0) list[i] = entry; else list.unshift(entry)
  save('dt_personal_log', list); return [...list]
}
export function getTodayPersonal() {
  return getPersonalLog().find(e => e.date === today()) || { date: today(), mood: 3, reflection: '', gratitude: '', win: '' }
}

// ── RECIPES ──────────────────────────────────────────────────────────────────
export const getRecipes = () => load('dt_recipes', [])
export function addRecipe(recipe) {
  const list = getRecipes()
  const entry = { id: Date.now().toString(), ...recipe }
  list.unshift(entry); save('dt_recipes', list); return [...list]
}
export function updateRecipe(id, changes) {
  const list = getRecipes().map(r => r.id === id ? { ...r, ...changes } : r)
  save('dt_recipes', list); return list
}
export function deleteRecipe(id) {
  const list = getRecipes().filter(r => r.id !== id)
  save('dt_recipes', list); return list
}

// ── USER PROFILE ─────────────────────────────────────────────────────────────
export const getProfile  = () => load('dt_profile', null)
export const saveProfile = p  => save('dt_profile', p)
export const getSelectedAmbitos = () => {
  const p = load('dt_profile', null)
  if (!p || !p.selectedAmbitos || p.selectedAmbitos.length === 0)
    return AMBITOS.map(a => a.id)
  return p.selectedAmbitos
}
export const setSelectedAmbitos = (ids) => {
  const p = load('dt_profile', null) || {}
  save('dt_profile', { ...p, selectedAmbitos: ids })
}
export const clearAll    = () => {
  const keys = ['dt_profile','lt2_habits','lt2_objectives','lt2_achievements',
    'dt_gym_rutinas','dt_gym_week_plan','dt_gym_sessions','dt_gym_workouts','dt_escolar_materias','dt_escolar_tasks','dt_escolar_schedule','dt_escolar_notes',
    'dt_meal_plan','dt_meal_plan_weekly','dt_food_library','dt_diet_meals','dt_diet_goals','dt_finance_entries','dt_health_log',
    'dt_mente_log','dt_work_tasks','dt_hobby_projects','dt_social_events','dt_personal_log']
  keys.forEach(k => localStorage.removeItem(k))
}

