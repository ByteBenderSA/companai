import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Project interface
export interface Project {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  techStack: string[];
  features: string[];
  timeEstimate: string;
  marketPotential: 'Low' | 'Medium' | 'High';
  status: 'idea' | 'planning' | 'building' | 'completed' | 'deployed';
  progress: {
    currentStep: number;
    totalSteps: number;
    completedSteps: number[];
    lastWorkedOn: string;
  };
  prompts: {
    lovable?: string;
    cursor?: string;
    firebase?: string;
    deployment?: string;
  };
  generatedPrompts?: {
    lovablePrompt?: string;
    cursorPrompt?: string;
    colorScheme?: string;
    generatedAt?: string;
    version?: string;
  };
  resources: {
    links: string[];
    tutorials: string[];
    documentation: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// AI Conversation interface
export interface Conversation {
  id: string;
  userId: string;
  title?: string;
  messages: Message[];
  context: {
    currentProject?: string;
    userLevel: string;
    lastTopic: string;
    suggestions: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    projectId?: string;
    helpType?: 'code' | 'concept' | 'debugging' | 'project-planning';
    satisfaction?: number;
  };
}

// Learning Path interface
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  steps: LearningStep[];
  prerequisites: string[];
  outcomes: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LearningStep {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'project' | 'exercise' | 'quiz';
  content?: string;
  resources?: string[];
  timeEstimate: string;
  order: number;
}

// User Progress interface
export interface UserProgress {
  userId: string;
  pathId: string;
  currentStep: number;
  completedSteps: number[];
  startedAt: string;
  lastAccessedAt: string;
  completedAt?: string;
  notes?: string;
}

// Idea Workflow interface - for saving incremental progress
export interface IdeaWorkflow {
  id: string;
  userId: string;
  currentStep: 'input' | 'ideas' | 'customize' | 'prompts';
  formData: {
    appName: string;
    description: string;
    targetAudience: string;
    keyFeatures: string;
    skillLevel: string;
  };
  generatedIdeas: Array<{
    id: number;
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    timeEstimate: string;
    techStack: string[];
    marketPotential: string;
    features: string[];
    why: string;
    learningObjectives: string[];
    roadmap: string[];
  }>;
  selectedIdea?: {
    id: number;
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    timeEstimate: string;
    techStack: string[];
    marketPotential: string;
    features: string[];
    why: string;
    learningObjectives: string[];
    roadmap: string[];
  };
  customization?: {
    colorScheme: string;
    layoutStyle: string;
    fontVibe: string;
    features: string[];
    customFeatures: string;
    userFlow: string;
    customHexColor?: string;
  };
  refinedPrompts?: string;
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
  projectId?: string; // Set when saved as project
}

// Project CRUD operations
export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const projectRef = doc(collection(db, 'projects'));
  const newProject: Project = {
    ...project,
    id: projectRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(projectRef, {
    ...newProject,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return projectRef.id;
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  const projectRef = doc(db, 'projects', projectId);
  const projectSnapshot = await getDoc(projectRef);
  
  if (projectSnapshot.exists()) {
    return projectSnapshot.data() as Project;
  }
  
  return null;
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  const projectsRef = collection(db, 'projects');
  const q = query(
    projectsRef,
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Project);
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  const projectRef = doc(db, 'projects', projectId);
  await updateDoc(projectRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const projectRef = doc(db, 'projects', projectId);
  await deleteDoc(projectRef);
};

// Conversation CRUD operations
export const createConversation = async (conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const conversationRef = doc(collection(db, 'conversations'));
  const newConversation: Conversation = {
    ...conversation,
    id: conversationRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(conversationRef, {
    ...newConversation,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return conversationRef.id;
};

export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversationSnapshot = await getDoc(conversationRef);
  
  if (conversationSnapshot.exists()) {
    return conversationSnapshot.data() as Conversation;
  }
  
  return null;
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(20)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Conversation);
};

export const addMessageToConversation = async (conversationId: string, message: Message): Promise<void> => {
  const conversationRef = doc(db, 'conversations', conversationId);
  const conversation = await getConversation(conversationId);
  
  if (conversation) {
    const updatedMessages = [...conversation.messages, message];
    await updateDoc(conversationRef, {
      messages: updatedMessages,
      updatedAt: serverTimestamp()
    });
  }
};

// Learning Path operations
export const getLearningPaths = async (): Promise<LearningPath[]> => {
  const pathsRef = collection(db, 'learning-paths');
  const q = query(
    pathsRef,
    where('isPublic', '==', true),
    orderBy('difficulty'),
    orderBy('title')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as LearningPath);
};

export const getUserProgress = async (userId: string, pathId: string): Promise<UserProgress | null> => {
  const progressRef = doc(db, 'learning-paths', pathId, 'progress', userId);
  const progressSnapshot = await getDoc(progressRef);
  
  if (progressSnapshot.exists()) {
    return progressSnapshot.data() as UserProgress;
  }
  
  return null;
};

export const updateUserProgress = async (progress: UserProgress): Promise<void> => {
  const progressRef = doc(db, 'learning-paths', progress.pathId, 'progress', progress.userId);
  await setDoc(progressRef, {
    ...progress,
    lastAccessedAt: serverTimestamp()
  }, { merge: true });
};

// Real-time listeners
export const subscribeToUserProjects = (userId: string, callback: (projects: Project[]) => void) => {
  const projectsRef = collection(db, 'projects');
  const q = query(
    projectsRef,
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => doc.data() as Project);
    callback(projects);
  });
};

export const subscribeToConversation = (conversationId: string, callback: (conversation: Conversation | null) => void) => {
  const conversationRef = doc(db, 'conversations', conversationId);
  return onSnapshot(conversationRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Conversation);
    } else {
      callback(null);
    }
  });
};

// Idea Workflow CRUD operations
export const createIdeaWorkflow = async (workflow: Omit<IdeaWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const workflowRef = doc(collection(db, 'ideaWorkflows'));
  const newWorkflow: IdeaWorkflow = {
    ...workflow,
    id: workflowRef.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(workflowRef, {
    ...newWorkflow,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return workflowRef.id;
};

export const updateIdeaWorkflow = async (workflowId: string, updates: Partial<IdeaWorkflow>): Promise<void> => {
  const workflowRef = doc(db, 'ideaWorkflows', workflowId);
  await updateDoc(workflowRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const getIdeaWorkflow = async (workflowId: string): Promise<IdeaWorkflow | null> => {
  const workflowRef = doc(db, 'ideaWorkflows', workflowId);
  const workflowSnapshot = await getDoc(workflowRef);
  
  if (workflowSnapshot.exists()) {
    return workflowSnapshot.data() as IdeaWorkflow;
  }
  
  return null;
};

export const getUserActiveIdeaWorkflow = async (userId: string): Promise<IdeaWorkflow | null> => {
  const workflowsRef = collection(db, 'ideaWorkflows');
  const q = query(
    workflowsRef,
    where('userId', '==', userId),
    where('isCompleted', '==', false),
    orderBy('updatedAt', 'desc'),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.docs.length > 0) {
    return snapshot.docs[0].data() as IdeaWorkflow;
  }
  
  return null;
};

export const getUserIdeaWorkflows = async (userId: string): Promise<IdeaWorkflow[]> => {
  const workflowsRef = collection(db, 'ideaWorkflows');
  const q = query(
    workflowsRef,
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as IdeaWorkflow);
};

export const completeIdeaWorkflow = async (workflowId: string, projectId?: string): Promise<void> => {
  const workflowRef = doc(db, 'ideaWorkflows', workflowId);
  await updateDoc(workflowRef, {
    isCompleted: true,
    projectId: projectId,
    updatedAt: serverTimestamp()
  });
};

export const deleteIdeaWorkflow = async (workflowId: string): Promise<void> => {
  const workflowRef = doc(db, 'ideaWorkflows', workflowId);
  await deleteDoc(workflowRef);
}; 