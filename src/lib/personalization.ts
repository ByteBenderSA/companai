import type { User } from './auth';
import type { Project } from './firestore';
import { getUserOnboardingPath, getOnboardingConfig } from './onboarding';

export interface PersonalizedRecommendation {
  id: string;
  type: 'lesson' | 'project' | 'action' | 'tip';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  urgency?: string;
  action?: {
    label: string;
    link?: string;
    onClick?: string;
  };
}

export interface DashboardPersonalization {
  primaryMessage: {
    title: string;
    subtitle: string;
    type: 'coaching' | 'progress' | 'achievement' | 'prompt';
  };
  recommendations: PersonalizedRecommendation[];
  nextSteps: string[];
  layoutDensity: 'compact' | 'comfortable' | 'spacious';
  showProgressDetails: boolean;
  highlightedSection: 'learning' | 'building' | 'community' | null;
}

// Analyze user's current state and progress
export const analyzeUserProgress = (
  user: User | null,
  projects: Project[],
  lessonsCompleted: number
) => {
  if (!user) return null;

  const onboardingPath = getUserOnboardingPath(user);
  const daysSinceJoined = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    onboardingPath,
    daysSinceJoined,
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'building').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    stalledProjects: projects.filter(p => {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceUpdate > 7 && p.status === 'building';
    }).length,
    lessonsCompleted,
    totalLessons: 6,
    userLevel: user.progress.level,
    currentStreak: user.progress.currentStreak,
    xp: user.progress.xp
  };
};

// Generate personalized dashboard content
export const getPersonalizedDashboard = (
  user: User | null,
  projects: Project[],
  lessonsCompleted: number
): DashboardPersonalization => {
  const analysis = analyzeUserProgress(user, projects, lessonsCompleted);
  const config = getOnboardingConfig(analysis?.onboardingPath || null);

  if (!analysis) {
    return getDefaultPersonalization();
  }

  const recommendations = generateRecommendations(analysis, projects);
  const primaryMessage = generatePrimaryMessage(analysis, config);
  const nextSteps = generateNextSteps(analysis, projects);

  return {
    primaryMessage,
    recommendations,
    nextSteps,
    layoutDensity: config.showProfessionalUI ? 'compact' : 'comfortable',
    showProgressDetails: config.showLearningProgress,
    highlightedSection: determineHighlightedSection(analysis)
  };
};

// Generate intelligent recommendations
const generateRecommendations = (
  analysis: ReturnType<typeof analyzeUserProgress>,
  projects: Project[]
): PersonalizedRecommendation[] => {
  if (!analysis) return [];

  const recommendations: PersonalizedRecommendation[] = [];

  // For beginners in first few days
  if (analysis.onboardingPath === 'beginner' && analysis.daysSinceJoined <= 3) {
    if (analysis.lessonsCompleted === 0) {
      recommendations.push({
        id: 'first-lesson',
        type: 'lesson',
        title: 'Start Your Learning Journey',
        description: 'Begin with the tech essentials to understand the tools that power modern apps.',
        priority: 'high',
        urgency: 'Start your CompanAI journey!',
        action: {
          label: 'Take First Lesson',
          link: '/lessons'
        }
      });
    } else if (analysis.lessonsCompleted < 3) {
      recommendations.push({
        id: 'continue-learning',
        type: 'lesson',
        title: 'Keep Learning the Essentials',
        description: `You've completed ${analysis.lessonsCompleted}/6 lessons. You're building momentum!`,
        priority: 'high',
        action: {
          label: 'Continue Learning',
          link: '/lessons'
        }
      });
    } else if (analysis.totalProjects === 0) {
      recommendations.push({
        id: 'first-project',
        type: 'project',
        title: 'Ready for Your First Project!',
        description: 'You know the basics. Time to put your knowledge into practice with a real app.',
        priority: 'high',
        urgency: 'Perfect timing to start building!',
        action: {
          label: 'Generate Project Idea',
          link: '/idea-workshop'
        }
      });
    }
  }

  // For experienced users
  if (analysis.onboardingPath === 'experienced') {
    if (analysis.totalProjects === 0 && analysis.daysSinceJoined <= 1) {
      recommendations.push({
        id: 'quick-start',
        type: 'project',
        title: 'Jump Right In',
        description: 'Generate your first project idea and start building immediately.',
        priority: 'high',
        action: {
          label: 'Generate Idea',
          link: '/idea-workshop'
        }
      });
    } else if (analysis.stalledProjects > 0) {
      recommendations.push({
        id: 'stalled-projects',
        type: 'action',
        title: 'Revive Stalled Projects',
        description: `You have ${analysis.stalledProjects} project(s) that haven't been updated recently.`,
        priority: 'medium',
        action: {
          label: 'Review Projects',
          link: '/workspace'
        }
      });
    }
  }

  return recommendations.slice(0, 3);
};

// Generate primary dashboard message
const generatePrimaryMessage = (
  analysis: ReturnType<typeof analyzeUserProgress>,
  config: ReturnType<typeof getOnboardingConfig>
): DashboardPersonalization['primaryMessage'] => {
  if (!analysis) {
    return {
      title: 'Welcome to CompanAI!',
      subtitle: 'Let\'s get you started.',
      type: 'prompt'
    };
  }

  // Beginner coaching messages
  if (analysis.onboardingPath === 'beginner') {
    if (analysis.lessonsCompleted === 0) {
      return {
        title: 'Ready to Master Modern Development?',
        subtitle: 'Start with the essentials - every expert was once a beginner! 🚀',
        type: 'coaching'
      };
    } else if (analysis.lessonsCompleted < 3) {
      return {
        title: 'You\'re Making Great Progress!',
        subtitle: `${analysis.lessonsCompleted}/6 lessons complete. Keep the momentum going! 💪`,
        type: 'progress'
      };
    } else if (analysis.totalProjects === 0) {
      return {
        title: 'Time to Build Something Real!',
        subtitle: 'You\'ve got the knowledge - now let\'s put it to work! 🔨',
        type: 'achievement'
      };
    } else {
      return {
        title: 'You\'re Becoming a Developer!',
        subtitle: `${analysis.completedProjects} projects built, ${analysis.lessonsCompleted} lessons learned. Amazing! 🎉`,
        type: 'achievement'
      };
    }
  }

  // Experienced user messages
  if (analysis.onboardingPath === 'experienced') {
    if (analysis.totalProjects === 0) {
      return {
        title: 'Ready to Ship Fast?',
        subtitle: 'Generate ideas and build with AI-powered tools.',
        type: 'prompt'
      };
    } else {
      return {
        title: `${analysis.activeProjects} Active Projects`,
        subtitle: `${analysis.completedProjects} shipped, ${analysis.stalledProjects} need attention.`,
        type: 'progress'
      };
    }
  }

  return {
    title: analysis.totalProjects > 0 ? 'Building & Learning!' : 'Choose Your Adventure',
    subtitle: analysis.totalProjects > 0 
      ? 'Perfect balance of learning and doing. Keep it up!' 
      : 'Learn something new or start building - your choice!',
    type: 'coaching'
  };
};

// Generate next steps
const generateNextSteps = (
  analysis: ReturnType<typeof analyzeUserProgress>,
  projects: Project[]
): string[] => {
  if (!analysis) return [];

  const steps: string[] = [];

  if (analysis.onboardingPath === 'beginner') {
    if (analysis.lessonsCompleted < analysis.totalLessons) {
      const nextLessons = ['Lovable', 'Cursor', 'Firebase', 'GitHub', 'TypeScript', 'Tailwind'];
      const nextLesson = nextLessons[analysis.lessonsCompleted];
      steps.push(`Complete the "${nextLesson}" lesson to understand this essential tool`);
    }

    if (analysis.totalProjects === 0 && analysis.lessonsCompleted >= 2) {
      steps.push('Generate your first project idea and start building');
    }

    if (analysis.totalProjects > 0) {
      const activeProject = projects.find(p => p.status === 'building');
      if (activeProject) {
        steps.push(`Continue working on "${activeProject.title}" - you're making progress!`);
      }
    }
  }

  if (analysis.onboardingPath === 'experienced') {
    if (analysis.totalProjects === 0) {
      steps.push('Generate a project idea that matches your experience level');
      steps.push('Import an existing project or start fresh with modern tools');
    }

    if (analysis.stalledProjects > 0) {
      steps.push('Review and prioritize your stalled projects');
    }

    if (analysis.activeProjects > 0) {
      steps.push('Deploy your current projects or add advanced features');
    }
  }

  return steps.slice(0, 3);
};

// Determine which section to highlight
const determineHighlightedSection = (
  analysis: ReturnType<typeof analyzeUserProgress>
): DashboardPersonalization['highlightedSection'] => {
  if (!analysis) return null;

  if (analysis.onboardingPath === 'beginner' && analysis.lessonsCompleted < 3) {
    return 'learning';
  }

  if (analysis.onboardingPath === 'experienced' || analysis.totalProjects === 0) {
    return 'building';
  }

  return null;
};

// Default personalization for edge cases
const getDefaultPersonalization = (): DashboardPersonalization => ({
  primaryMessage: {
    title: 'Welcome to CompanAI!',
    subtitle: 'Let\'s get you started on your development journey.',
    type: 'prompt'
  },
  recommendations: [
    {
      id: 'get-started',
      type: 'action',
      title: 'Get Started',
      description: 'Begin your journey with CompanAI',
      priority: 'high',
      action: {
        label: 'Start Learning',
        link: '/lessons'
      }
    }
  ],
  nextSteps: ['Complete the onboarding to personalize your experience'],
  layoutDensity: 'comfortable',
  showProgressDetails: true,
  highlightedSection: null
});
 