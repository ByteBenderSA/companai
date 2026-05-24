import type { User } from './auth';

export type OnboardingPath = 'beginner' | 'experienced' | 'both';

export interface OnboardingConfig {
  showProductTour: boolean;
  showAchievements: boolean;
  showLearningProgress: boolean;
  showProfessionalUI: boolean;
  prioritizeLessons: boolean;
  prioritizeBuilder: boolean;
  showGamification: boolean;
  enableFriendlyTone: boolean;
}

// Get the user's onboarding path
export const getUserOnboardingPath = (user: User | null): OnboardingPath | null => {
  if (!user || !user.learningPreferences.onboardingPath) {
    return null;
  }
  return user.learningPreferences.onboardingPath;
};

// Check if user needs onboarding
export const needsOnboarding = (user: User | null): boolean => {
  if (!user) return false;
  return !user.onboardingCompleted || !user.learningPreferences.onboardingPath;
};

// Get onboarding configuration based on path
export const getOnboardingConfig = (path: OnboardingPath | null): OnboardingConfig => {
  if (!path) {
    return getBeginnerConfig(); // Default to beginner for safety
  }

  switch (path) {
    case 'beginner':
      return getBeginnerConfig();
    case 'experienced':
      return getExperiencedConfig();
    case 'both':
      return getBothConfig();
    default:
      return getBeginnerConfig();
  }
};

// Beginner configuration - full onboarding experience
const getBeginnerConfig = (): OnboardingConfig => ({
  showProductTour: true,
  showAchievements: true,
  showLearningProgress: true,
  showProfessionalUI: false,
  prioritizeLessons: true,
  prioritizeBuilder: false,
  showGamification: true,
  enableFriendlyTone: true,
});

// Experienced configuration - minimal, professional experience
const getExperiencedConfig = (): OnboardingConfig => ({
  showProductTour: false,
  showAchievements: false,
  showLearningProgress: false,
  showProfessionalUI: true,
  prioritizeLessons: false,
  prioritizeBuilder: true,
  showGamification: false,
  enableFriendlyTone: false,
});

// Both configuration - balanced experience
const getBothConfig = (): OnboardingConfig => ({
  showProductTour: true, // Show tour but allow skipping
  showAchievements: true,
  showLearningProgress: true,
  showProfessionalUI: false,
  prioritizeLessons: false, // Equal priority
  prioritizeBuilder: false, // Equal priority
  showGamification: true,
  enableFriendlyTone: true,
});

// Generate quick actions based on onboarding path
export const getQuickActionsForPath = (path: OnboardingPath | null) => {
  const config = getOnboardingConfig(path);
  
  const baseActions = [
    {
      id: 'idea-workshop',
      title: "Generate New Idea",
      description: "Get AI-powered project suggestions",
      icon: 'Lightbulb',
      color: "from-yellow-500 to-orange-500",
      link: "/idea-workshop",
      priority: config.prioritizeBuilder ? 1 : 2
    },
    {
      id: 'lessons',
      title: "Learn Essentials",
      description: config.enableFriendlyTone 
        ? "Understand your tech stack" 
        : "Review technical fundamentals",
      icon: 'BookOpen',
      color: "from-purple-500 to-indigo-500",
      link: "/lessons",
      priority: config.prioritizeLessons ? 1 : 3,
      hidden: path === 'experienced' // Hide for experienced users
    },
    {
      id: 'workspace',
      title: config.enableFriendlyTone ? "Continue Building" : "Build Project",
      description: config.enableFriendlyTone 
        ? "Resume your current project" 
        : "Access development workspace",
      icon: 'Code',
      color: "from-blue-500 to-cyan-500",
      link: "/workspace",
      priority: config.prioritizeBuilder ? 1 : 2
    },
    {
      id: 'ai-assistant',
      title: config.enableFriendlyTone ? "Get Help" : "AI Assistant",
      description: config.enableFriendlyTone 
        ? "Chat with your AI mentor" 
        : "Technical assistance and guidance",
      icon: 'MessageSquare',
      color: "from-green-500 to-teal-500",
      onClick: 'showAI',
      priority: 4
    }
  ];

  // Filter out hidden actions and sort by priority
  return baseActions
    .filter(action => !action.hidden)
    .sort((a, b) => a.priority - b.priority);
};

// Get dashboard sections to show based on path
export const getDashboardSections = (path: OnboardingPath | null) => {
  const config = getOnboardingConfig(path);
  
  return {
    showProgressCard: config.showLearningProgress,
    showAchievementsCard: config.showAchievements,
    showRecentActivity: true, // Always show
    showProjectsCard: true, // Always show
    useCompactLayout: config.showProfessionalUI,
    showWelcomeMessage: config.enableFriendlyTone,
  };
};

// Get header message based on path
export const getHeaderMessage = (user: User | null, path: OnboardingPath | null) => {
  const config = getOnboardingConfig(path);
  
  if (!user) return { title: "Welcome!", subtitle: "Ready to build?" };
  
  if (config.enableFriendlyTone) {
    return {
      title: `Welcome back, ${user.name}!`,
      subtitle: "Ready to build something amazing?"
    };
  } else {
    return {
      title: `Hello, ${user.name}`,
      subtitle: "Development workspace ready"
    };
  }
}; 