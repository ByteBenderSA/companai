import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
}

function toAppUser(u: FirebaseUser): AppUser {
  const email = u.email ?? '';
  return { uid: u.uid, email, name: u.displayName || email.split('@')[0] || 'Builder' };
}

/** Make sure users/{uid} exists. Profile data is informational; nothing privileged lives there. */
async function ensureProfile(u: FirebaseUser): Promise<void> {
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const { name, email } = toAppUser(u);
    await setDoc(ref, { name, email, createdAt: serverTimestamp() });
  }
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(user, { displayName: name.trim() });
  await ensureProfile(user);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signInWithGoogle(): Promise<void> {
  const { user } = await signInWithPopup(auth, googleProvider);
  await ensureProfile(user);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(callback: (user: AppUser | null) => void): () => void {
  return onAuthStateChanged(auth, (u) => callback(u ? toAppUser(u) : null));
}

/** The signed-in user as it is right now (e.g. after updating the display name). */
export function currentAppUser(): AppUser | null {
  return auth.currentUser ? toAppUser(auth.currentUser) : null;
}
