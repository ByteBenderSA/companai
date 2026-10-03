import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Idea } from './ideas';
import {
  newProjectFields,
  normalizeProject,
  projectStatus,
  toggleStep,
  type BuildStepId,
  type Project,
} from './project-model';
import type { BuildPrompts, Customization } from './prompts';

const projectsCol = collection(db, 'projects');

export async function createProject(
  ownerId: string,
  idea: Idea,
  prompts: BuildPrompts,
  source: 'ai' | 'template',
  customization?: Customization
): Promise<string> {
  const ref = doc(projectsCol);
  await setDoc(ref, {
    ...newProjectFields(ownerId, idea, prompts, source, customization),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Live list of the user's projects, newest activity first. Returns an unsubscribe function. */
export function subscribeToProjects(
  ownerId: string,
  onData: (projects: Project[]) => void,
  onError: (err: Error) => void
): () => void {
  const q = query(projectsCol, where('ownerId', '==', ownerId), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => normalizeProject(d.id, d.data()))),
    onError
  );
}

/** Live single project. Calls onData(null) if it doesn't exist or isn't yours. */
export function subscribeToProject(
  projectId: string,
  onData: (project: Project | null) => void,
  onError: (err: Error) => void
): () => void {
  return onSnapshot(
    doc(projectsCol, projectId),
    (snap) => onData(snap.exists() ? normalizeProject(snap.id, snap.data()) : null),
    (err) => {
      // Rules deny reads of other people's projects; treat that as "not found".
      if ((err as { code?: string }).code === 'permission-denied') onData(null);
      else onError(err);
    }
  );
}

export async function saveProjectPrompts(projectId: string, prompts: BuildPrompts, customization: Customization): Promise<void> {
  await updateDoc(doc(projectsCol, projectId), {
    prompts,
    promptsSource: 'ai',
    customization,
    updatedAt: serverTimestamp(),
  });
}

export async function setProjectStep(project: Project, step: BuildStepId, done: boolean): Promise<void> {
  const completedSteps = toggleStep(project.completedSteps, step, done);
  await updateDoc(doc(projectsCol, project.id), {
    completedSteps,
    status: projectStatus(completedSteps),
    // Older documents kept step numbers here; drop them once migrated so un-ticking works.
    progress: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteDoc(doc(projectsCol, projectId));
}
