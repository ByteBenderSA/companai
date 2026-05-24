import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { LearningPath } from './firestore';

const TECH_ESSENTIALS_PATH: LearningPath = {
  id: 'tech-essentials',
  title: 'Tech Stack Essentials',
  description: 'Learn the fundamental tools that power your apps - no more building blindly!',
  difficulty: 'Beginner',
  estimatedTime: '1 hour',
  steps: [
    {
      id: 'lovable',
      title: 'Lovable - AI App Builder',
      description: 'The magic wand that turns your ideas into working apps',
      type: 'lesson',
      timeEstimate: '8 min',
      order: 0
    },
    {
      id: 'cursor',
      title: 'Cursor - AI Code Editor',
      description: 'Your intelligent coding companion that understands your project',
      type: 'lesson',
      timeEstimate: '10 min',
      order: 1
    },
    {
      id: 'firebase',
      title: 'Firebase - Your App\'s Backend',
      description: 'Google\'s platform that handles all the behind-the-scenes magic',
      type: 'lesson',
      timeEstimate: '12 min',
      order: 2
    },
    {
      id: 'github',
      title: 'GitHub - Code Version Control',
      description: 'The time machine for your code and collaboration hub',
      type: 'lesson',
      timeEstimate: '15 min',
      order: 3
    },
    {
      id: 'typescript',
      title: 'TypeScript - JavaScript\'s Smart Sibling',
      description: 'Catch errors before they happen and write more reliable code',
      type: 'lesson',
      timeEstimate: '10 min',
      order: 4
    },
    {
      id: 'tailwind',
      title: 'Tailwind CSS - Styling Made Simple',
      description: 'Build beautiful interfaces without writing custom CSS',
      type: 'lesson',
      timeEstimate: '8 min',
      order: 5
    }
  ],
  prerequisites: [],
  outcomes: [
    'Understand what each tool does and why it\'s important',
            'Know how to use each tool in the CompanAI workflow',
    'Build apps with confidence, not blindly',
    'Have a solid foundation for advanced features'
  ],
  isPublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const initializeTechEssentials = async (): Promise<void> => {
  try {
    const pathRef = doc(db, 'learning-paths', 'tech-essentials');
    const pathSnapshot = await getDoc(pathRef);
    
    if (!pathSnapshot.exists()) {
      await setDoc(pathRef, TECH_ESSENTIALS_PATH);
      console.log('✅ Tech essentials learning path initialized');
    } else {
      console.log('📚 Tech essentials learning path already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing tech essentials:', error);
  }
}; 