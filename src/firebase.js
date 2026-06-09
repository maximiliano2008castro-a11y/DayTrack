import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            "AIzaSyBDsxR4SpWYwkWpusjAN3SPPx6WCnzhvEA",
  authDomain:        "daytrack-d81b4.firebaseapp.com",
  projectId:         "daytrack-d81b4",
  storageBucket:     "daytrack-d81b4.firebasestorage.app",
  messagingSenderId: "616955746811",
  appId:             "1:616955746811:web:b8dda5185fd39159d9535e",
  measurementId:     "G-Q5G75SMJMD",
}

const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)
export default app
