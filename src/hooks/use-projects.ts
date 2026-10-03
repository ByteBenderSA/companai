import { useEffect, useState } from 'react';
import { subscribeToProject, subscribeToProjects } from '@/lib/projects';
import type { Project } from '@/lib/project-model';

interface ListState {
  projects: Project[];
  loading: boolean;
  error: Error | null;
}

export function useProjects(ownerId: string): ListState {
  const [state, setState] = useState<ListState>({ projects: [], loading: true, error: null });
  useEffect(() => {
    setState({ projects: [], loading: true, error: null });
    return subscribeToProjects(
      ownerId,
      (projects) => setState({ projects, loading: false, error: null }),
      (error) => setState((s) => ({ ...s, loading: false, error }))
    );
  }, [ownerId]);
  return state;
}

interface ItemState {
  project: Project | null;
  loading: boolean;
  error: Error | null;
}

export function useProject(projectId: string | undefined): ItemState {
  const [state, setState] = useState<ItemState>({ project: null, loading: true, error: null });
  useEffect(() => {
    if (!projectId) {
      setState({ project: null, loading: false, error: null });
      return;
    }
    setState({ project: null, loading: true, error: null });
    return subscribeToProject(
      projectId,
      (project) => setState({ project, loading: false, error: null }),
      (error) => setState({ project: null, loading: false, error })
    );
  }, [projectId]);
  return state;
}
