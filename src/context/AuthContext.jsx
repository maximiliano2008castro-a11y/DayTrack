import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth'
import { auth } from '../firebase'
import { syncOnLogin, setCloudUid, subscribeToCloud, unsubscribeFromCloud } from '../sync'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        await syncOnLogin(u.uid)   // fusiona nube + local
        subscribeToCloud(u.uid)    // escucha cambios en tiempo real
      } else {
        unsubscribeFromCloud()
      }
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const register = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    await sendEmailVerification(cred.user)
    return cred
  }

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const logout = () => signOut(auth)

  const resetPassword = (email) => sendPasswordResetEmail(auth, email)

  const resendVerification = () =>
    user ? sendEmailVerification(user) : Promise.reject('No user')

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, resetPassword, resendVerification }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
