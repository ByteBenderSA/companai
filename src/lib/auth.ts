import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
  onboardingCompleted: boolean;
  learningPreferences: {
    experience: string;
    interests: string[];
    timeCommitment: string;
    goals: string[];
    learningStyle: string;
    onboardingPath?: 'beginner' | 'experienced' | 'both';
  };
  progress: {
    totalProjects: number;
    completedSteps: number;
    currentStreak: number;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    xp: number;
    lastActiveDate: string;
  };
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  uid: string;
  displayName?: string;
  photoURL?: string;
  learningPath?: string[];
  selectedTools?: string[];
  usageStats?: {
    ideasGenerated: number;
    aiCallsUsed: number;
  };
}

// Create or update user profile in Firestore
export const createUserProfile = async (firebaseUser: FirebaseUser, additionalData?: Partial<User>): Promise<User> => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    const newUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: additionalData?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      ...(firebaseUser.photoURL && { avatar: firebaseUser.photoURL }),
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      onboardingCompleted: false,
      learningPreferences: {
        experience: '',
        interests: [],
        timeCommitment: '',
        goals: [],
        learningStyle: ''
      },
      progress: {
        totalProjects: 0,
        completedSteps: 0,
        currentStreak: 0,
        level: 'Beginner',
        xp: 0,
        lastActiveDate: new Date().toISOString()
      },
      settings: {
        notifications: true,
        theme: 'system',
        language: 'en'
      },
      uid: firebaseUser.uid,
      ...additionalData
    };

    await setDoc(userRef, {
      ...newUser,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });

    return newUser;
  } else {
    // Update last login time for existing users
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp()
    });

    const existingUser = userSnapshot.data() as User;
    return {
      ...existingUser,
      lastLoginAt: new Date().toISOString()
    };
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name: string): Promise<User> => {
  const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update the user's display name
  await updateProfile(firebaseUser, { displayName: name });
  
  // Create user profile in Firestore
  const user = await createUserProfile(firebaseUser, { name });
  
  return user;
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
  const user = await createUserProfile(firebaseUser);
  return user;
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
  const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
  const user = await createUserProfile(firebaseUser);
  return user;
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

// Get current user profile
export const getCurrentUserProfile = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userRef);
  
  if (userSnapshot.exists()) {
    return userSnapshot.data() as User;
  }
  
  return null;
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
};

// Update onboarding completion
export const completeOnboarding = async (userId: string, preferences: User['learningPreferences']): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    onboardingCompleted: true,
    learningPreferences: preferences
  });
};

// Update user progress
export const updateUserProgress = async (userId: string, progressUpdates: Partial<User['progress']>): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    [`progress.${Object.keys(progressUpdates)[0]}`]: Object.values(progressUpdates)[0],
    'progress.lastActiveDate': new Date().toISOString()
  });
};

// Update user onboarding preferences
export const updateUserOnboarding = async (userId: string, onboardingPath: 'beginner' | 'experienced' | 'both'): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'learningPreferences.onboardingPath': onboardingPath,
    onboardingCompleted: true,
    lastLoginAt: serverTimestamp()
  });
};

// Switch user's onboarding path (for settings)
export const switchOnboardingPath = async (userId: string, newPath: 'beginner' | 'experienced' | 'both'): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'learningPreferences.onboardingPath': newPath,
    lastLoginAt: serverTimestamp()
  });
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user = await getCurrentUserProfile(firebaseUser.uid);
      // Ensure user object always has uid property
      if (user) {
        callback({
          ...user,
          uid: firebaseUser.uid,
          id: firebaseUser.uid
        });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

