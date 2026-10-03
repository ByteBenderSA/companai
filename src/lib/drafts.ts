// The Idea Workshop's in-progress state, saved so a refresh or closed tab doesn't lose work.
// One document per user at ideaDrafts/{uid}.
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { normalizeDraft, type IdeaDraft } from './draft-model';

export { EMPTY_DRAFT, normalizeDraft, type IdeaDraft, type WorkshopStep } from './draft-model';

const draftRef = (uid: string) => doc(db, 'ideaDrafts', uid);

export async function loadDraft(uid: string): Promise<IdeaDraft> {
  const snap = await getDoc(draftRef(uid));
  return normalizeDraft(snap.exists() ? snap.data() : undefined);
}

export async function saveDraft(uid: string, draft: IdeaDraft): Promise<void> {
  await setDoc(draftRef(uid), { ...draft, updatedAt: serverTimestamp() });
}

export async function clearDraft(uid: string): Promise<void> {
  await deleteDoc(draftRef(uid));
}
