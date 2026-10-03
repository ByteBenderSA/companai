// Lesson progress, one document per user at userProgress/{uid}.
import { arrayRemove, arrayUnion, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const progressRef = (uid: string) => doc(db, 'userProgress', uid);

export function subscribeToCompletedLessons(
  uid: string,
  onData: (lessonIds: string[]) => void,
  onError: (err: Error) => void
): () => void {
  return onSnapshot(
    progressRef(uid),
    (snap) => {
      const ids = snap.exists() ? snap.data().completedLessons : undefined;
      onData(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : []);
    },
    onError
  );
}

export async function setLessonComplete(uid: string, lessonId: string, done: boolean): Promise<void> {
  await setDoc(
    progressRef(uid),
    {
      completedLessons: done ? arrayUnion(lessonId) : arrayRemove(lessonId),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
