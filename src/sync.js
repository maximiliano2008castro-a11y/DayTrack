// ── DayTrack Cloud Sync (Firestore) ──────────────────────────────────────────
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

const SYNC_KEYS = [
  'lt2_habits', 'lt2_objectives',
  'dt_quick_notes',
  'dt_diet_meals', 'dt_diet_goals', 'dt_meal_plan_weekly', 'dt_recipes', 'dt_food_library',
  'dt_health_log', 'dt_health_goals', 'dt_meds',
  'dt_gym_sessions', 'dt_gym_rutinas', 'dt_gym_week_plan', 'dt_gym_unit',
  'dt_tasks', 'dt_work_tasks',
  'dt_social_events', 'dt_social_contacts',
  'dt_mente_log',
  'dt_finance_entries', 'dt_finance_budgets', 'dt_savings_goals',
  'dt_debts', 'dt_recurring', 'dt_accounts',
  'dt_profile', 'dt_selected_ambitos', 'dt_reminders',
  'dt_hobbies', 'dt_personal_data', 'dt_personal_journal',
]

let _uid            = null
let _unsubSnapshot  = null   // para cancelar el listener al cerrar sesión
let _onRemoteChange = null   // callback que avisa a la app cuando llegan cambios

export const setCloudUid       = uid => { _uid = uid }
export const getCloudUid       = () => _uid
export const setOnRemoteChange = cb  => { _onRemoteChange = cb }

// Escucha cambios en Firestore en tiempo real y actualiza localStorage
export function subscribeToCloud(uid) {
  if (_unsubSnapshot) _unsubSnapshot()   // cancelar listener anterior si hubiera
  const ref = doc(db, 'users', uid)
  _unsubSnapshot = onSnapshot(ref, snap => {
    if (!snap.exists()) return
    const cloud = snap.data()
    let changed = false
    for (const key of SYNC_KEYS) {
      if (cloud[key] === undefined) continue
      const current = localStorage.getItem(key)
      const incoming = JSON.stringify(cloud[key])
      if (current !== incoming) {
        localStorage.setItem(key, incoming)
        changed = true
      }
    }
    if (changed && _onRemoteChange) _onRemoteChange()
  }, () => {}) // silenciar errores de red
}

export function unsubscribeFromCloud() {
  if (_unsubSnapshot) { _unsubSnapshot(); _unsubSnapshot = null }
  _uid = null
}

// Escribe una clave al doc del usuario en Firestore (fire & forget)
export function pushKeyToCloud(key, val) {
  if (!_uid) return
  const ref = doc(db, 'users', _uid)
  setDoc(ref, { [key]: val }, { merge: true }).catch(() => {})
}

// Fusiona dos arrays por id — keeps todos los items únicos de ambos lados
function mergeArrays(cloud, local) {
  if (!Array.isArray(cloud) || !Array.isArray(local)) {
    return Array.isArray(cloud) ? cloud : (Array.isArray(local) ? local : cloud)
  }
  const map = new Map()
  // Primero la nube (más reciente / authoritative)
  for (const item of cloud) {
    if (item?.id) map.set(item.id, item)
    else map.set(JSON.stringify(item), item) // items sin id (edge case)
  }
  // Luego local — solo agrega los que NO están en la nube
  for (const item of local) {
    const key = item?.id || JSON.stringify(item)
    if (!map.has(key)) map.set(key, item)
  }
  return Array.from(map.values())
}

// Fusiona dos objetos — une campos de ambos, nube gana en conflicto
function mergeObjects(cloud, local) {
  if (typeof cloud !== 'object' || cloud === null) return local ?? cloud
  if (typeof local !== 'object' || local === null) return cloud
  return { ...local, ...cloud } // cloud sobreescribe en conflicto
}

// syncOnLogin: jala nube y fusiona con local sin perder nada de ningún lado
export async function syncOnLogin(uid) {
  _uid = uid
  try {
    const ref  = doc(db, 'users', uid)
    const snap = await getDoc(ref)

    // Leer local
    const local = {}
    for (const key of SYNC_KEYS) {
      const raw = localStorage.getItem(key)
      if (raw) {
        try { local[key] = JSON.parse(raw) } catch {}
      }
    }

    if (!snap.exists()) {
      // ── Nube vacía → subir todo lo local ──
      if (Object.keys(local).length > 0) {
        await setDoc(ref, local)
      }
      return false
    }

    // ── Nube tiene datos → fusionar con local ──
    const cloud = snap.data()
    const merged = {}

    for (const key of SYNC_KEYS) {
      const c = cloud[key]
      const l = local[key]

      if (c === undefined && l === undefined) continue

      if (c === undefined) {
        // Solo existe en local → guardar en merged y subir a nube
        merged[key] = l
      } else if (l === undefined) {
        // Solo existe en nube → bajar a local
        merged[key] = c
        localStorage.setItem(key, JSON.stringify(c))
      } else {
        // Existe en ambos → fusionar según tipo
        if (Array.isArray(c) && Array.isArray(l)) {
          merged[key] = mergeArrays(c, l)
        } else if (typeof c === 'object' && c !== null && !Array.isArray(c)) {
          merged[key] = mergeObjects(c, l)
        } else {
          // Primitivo (string, number) → nube gana
          merged[key] = c
        }
        localStorage.setItem(key, JSON.stringify(merged[key]))
      }
    }

    // Subir el merged completo a la nube (para que ambos dispositivos queden igual)
    await setDoc(ref, merged, { merge: true })
    return true

  } catch (e) {
    console.warn('DayTrack sync error:', e)
    return false
  }
}
