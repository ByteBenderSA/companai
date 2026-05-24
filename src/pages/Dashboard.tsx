import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProjects, subscribeToUserProjects, getUserProgress } from "@/lib/firestore";
import { updateUserOnboarding } from "@/lib/auth";
import { 
  getUserOnboardingPath, 
  needsOnboarding, 
  getDashboardSections, 
  getHeaderMessage,
  getOnboardingConfig
} from "@/lib/onboarding";
import { getPersonalizedDashboard } from "@/lib/personalization";
import type { Project } from "@/lib/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Code, 
  Lightbulb, 
  MessageSquare, 
  Zap, 
  Star, 
  Calendar,
  Trophy,
  Target,
  BookOpen,
  LogOut,
  CheckCircle,
  Rocket
} from "lucide-react";
import AIAssistant from "@/components/AIAssistant";
import WelcomeModal, { type OnboardingPath } from "@/components/WelcomeModal";
import ProductTour from "@/components/ProductTour";
import PersonalizedRecommendations from "@/components/PersonalizedRecommendations";
import ModeSwitch from "@/components/ModeSwitch";
import SettingsModal from "@/components/SettingsModal";
import { Settings as SettingsIcon } from "lucide-react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [showAI, setShowAI] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showProductTour, setShowProductTour] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Get user's onboarding path and configuration
  const onboardingPath = getUserOnboardingPath(user);
  const onboardingConfig = getOnboardingConfig(onboardingPath);
  const dashboardSections = getDashboardSections(onboardingPath);
  const headerMessage = getHeaderMessage(user, onboardingPath);
  
  // Get personalized dashboard content
  const personalization = getPersonalizedDashboard(user, projects, lessonsCompleted);

  // Calculate real progress from user data and projects
  const progress = {
    currentLevel: user?.progress.level || "Beginner",
    nextLevel: user?.progress.level === "Beginner" ? "Intermediate" : 
               user?.progress.level === "Intermediate" ? "Advanced" : "Expert",
    completionPercentage: Math.min(((user?.progress.xp || 0) / 1000) * 100, 100),
    streakDays: user?.progress.currentStreak || 0,
    totalProjects: projects.length,
    completedSteps: user?.progress.completedSteps || 0
  };

  // Generate real recent activity based on user's actual projects and progress
  const recentActivity = [
    ...(projects.slice(0, 2).map(project => ({
      action: project.status === 'completed' ? "Completed" : "Working on",
      item: project.title,
      time: getTimeAgo(project.updatedAt),
      type: "project" as const
    }))),
    {
      action: "Joined",
              item: "CompanAI Community",
      time: getTimeAgo(user?.createdAt || new Date().toISOString()),
      type: "achievement" as const
    }
  ];

  // Helper function to calculate time ago
  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    return `${Math.floor(diffInHours / 24)} days ago`;
  }

  useEffect(() => {
    if (!user) return;

    // Check if user needs onboarding
    const checkOnboarding = async () => {
    if (needsOnboarding(user)) {
      setShowWelcomeModal(true);
    }
    };
    checkOnboarding();

    // Subscribe to user's projects for real-time updates
    const unsubscribe = subscribeToUserProjects(user.id, (userProjects) => {
      setProjects(userProjects);
      setLoading(false);
    });

    // Load lesson progress
    const loadLessonProgress = async () => {
      try {
        const progress = await getUserProgress(user.id, 'tech-essentials');
        if (progress) {
          setLessonsCompleted(progress.completedSteps.length);
        }
      } catch (error) {
        console.error('Error loading lesson progress:', error);
      }
    };

    loadLessonProgress();
    return () => unsubscribe();
  }, [user]);

  const handleOnboardingPathSelection = async (path: OnboardingPath) => {
    if (!user) return;
    
    try {
      // Update user preferences in Firestore
      await updateUserOnboarding(user.id, path);
      
      // Update local user object to prevent modal from showing again
      if (user.learningPreferences) {
        user.learningPreferences.onboardingPath = path;
      } else {
        user.learningPreferences = {
          onboardingPath: path,
          experience: 'beginner',
          interests: [],
          timeCommitment: 'flexible',
          goals: ['learn'],
          learningStyle: 'hands-on'
        };
      }
      user.onboardingCompleted = true;
      
      setShowWelcomeModal(false);
      
      // Show product tour for beginners and "both" users
      if (path === 'beginner' || path === 'both') {
        setShowProductTour(true);
      }
    } catch (error) {
      console.error('Error updating onboarding preferences:', error);
    }
  };

  const handleProductTourComplete = () => {
    setShowProductTour(false);
  };

  const handleProductTourSkip = () => {
    setShowProductTour(false);
  };

  // Dynamic quick actions based on onboarding path
  const getQuickActions = () => {
    const actions = [];
    
    // Generate New Idea
    actions.push({
      title: "Generate New Idea",
      description: onboardingConfig.enableFriendlyTone 
        ? "Get AI-powered project suggestions" 
        : "AI project ideation",
      icon: Lightbulb,
      color: "from-yellow-500 to-orange-500",
      link: "/idea-workshop",
      priority: onboardingConfig.prioritizeBuilder ? 1 : 2
    });

    // Learn Essentials (hidden for experienced users)
    if (onboardingPath !== 'experienced') {
      actions.push({
      title: "Learn Essentials",
        description: onboardingConfig.enableFriendlyTone 
          ? "Understand your tech stack" 
          : "Review technical fundamentals",
      icon: BookOpen,
      color: "from-purple-500 to-indigo-500",
        link: "/lessons",
        priority: onboardingConfig.prioritizeLessons ? 1 : 3,
        tourId: "learn-essentials"
      });
    }

    // Continue Building
    actions.push({
      title: onboardingConfig.enableFriendlyTone ? "Continue Building" : "Build Project",
      description: onboardingConfig.enableFriendlyTone 
        ? "Resume your current project" 
        : "Access development workspace",
      icon: Code,
      color: "from-blue-500 to-cyan-500",
      link: "/workspace",
      priority: onboardingConfig.prioritizeBuilder ? 1 : 2
    });

    // Get Help
    actions.push({
      title: onboardingConfig.enableFriendlyTone ? "Get Help" : "AI Assistant",
      description: onboardingConfig.enableFriendlyTone 
        ? "Chat with your AI mentor" 
        : "Technical assistance and guidance",
      icon: MessageSquare,
      color: "from-green-500 to-teal-500",
      onClick: () => setShowAI(true),
      priority: 4
    });

    // Sort by priority
    return actions.sort((a, b) => a.priority - b.priority);
  };

  const quickActions = getQuickActions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Code className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{headerMessage.title}</h1>
              <p className="text-sm text-gray-600">{headerMessage.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ModeSwitch />
            <Button
              variant="ghost"
              onClick={() => setShowSettings(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="ghost"
              onClick={logout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personalized Recommendations */}
            <PersonalizedRecommendations 
              personalization={personalization}
              onActionClick={(actionId) => {
                if (actionId === 'showAI') {
                  setShowAI(true);
                }
              }}
            />

            {/* Progress Overview */}
            {dashboardSections.showProgressCard && (
              <Card className="shadow-lg border-0" data-tour="progress-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Level Progress</span>
                    <Badge variant="secondary">{progress.currentLevel}</Badge>
                  </div>
                  <Progress value={progress.completionPercentage} className="h-3" />
                  <p className="text-xs text-gray-600 mt-1">
                    {progress.completionPercentage}% to {progress.nextLevel}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{progress.streakDays}</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{progress.totalProjects}</div>
                    <div className="text-sm text-gray-600">Projects</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{progress.completedSteps}</div>
                    <div className="text-sm text-gray-600">Steps Done</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Quick Actions */}
            <Card className="shadow-lg border-0" data-tour="quick-actions">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <div key={index}>
                      {action.link ? (
                        <Link to={action.link}>
                          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer h-full" data-tour={action.tourId}>
                            <CardContent className="p-6 text-center h-full flex flex-col justify-center">
                              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mx-auto mb-4`}>
                                <action.icon className="w-6 h-6 text-white" />
                              </div>
                              <h3 className="font-semibold mb-2">{action.title}</h3>
                              <p className="text-sm text-gray-600">{action.description}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ) : (
                        <Card 
                          className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer h-full"
                          onClick={action.onClick}
                        >
                          <CardContent className="p-6 text-center h-full flex flex-col justify-center">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mx-auto mb-4`}>
                              <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold mb-2">{action.title}</h3>
                            <p className="text-sm text-gray-600">{action.description}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Projects */}
            {projects.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-purple-600" />
                    Your Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((project) => (
                      <div key={project.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{project.title}</h3>
                            <p className="text-gray-600 text-sm">{project.description}</p>
                          </div>
                          <Badge className={
                            project.status === 'completed' ? 'bg-green-100 text-green-700' :
                            project.status === 'building' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {project.status}
                          </Badge>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-medium">
                              {project.progress.completedSteps.length} / {project.progress.totalSteps} steps
                            </span>
                          </div>
                          <Progress 
                            value={Math.round((project.progress.completedSteps.length / project.progress.totalSteps) * 100)} 
                            className="h-2"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {project.techStack.slice(0, 3).map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                          ))}
                          {project.techStack.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{project.techStack.length - 3} more</Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Link to="/workspace" className="flex-1">
                            <Button size="sm" className="w-full">
                              Continue Building
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {projects.length > 3 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm">
                          View All Projects ({projects.length})
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* API Keys */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-purple-600" />
                  API Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  CompanAI runs on your own API keys, stored only in your browser.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowSettings(true)}
                >
                  Manage keys
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-lg border-0" data-tour="recent-activity">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.action}</span> {activity.item}
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            {dashboardSections.showAchievementsCard && (
              <Card className="shadow-lg border-0" data-tour="achievements">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* First Lesson Achievement */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    lessonsCompleted >= 1 ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      lessonsCompleted >= 1 ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {lessonsCompleted >= 1 ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">First Steps</p>
                      <p className="text-xs text-gray-600">Complete your first lesson</p>
                    </div>
                    {lessonsCompleted >= 1 && (
                      <Badge className="bg-green-100 text-green-700">Unlocked</Badge>
                    )}
                  </div>

                  {/* Quick Learner Achievement */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    lessonsCompleted >= 5 ? 'bg-purple-50' : 'bg-gray-50'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      lessonsCompleted >= 5 ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {lessonsCompleted >= 5 ? (
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Zap className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Quick Learner</p>
                      <p className="text-xs text-gray-600">Complete 5 lessons ({lessonsCompleted}/5)</p>
                    </div>
                    {lessonsCompleted >= 5 && (
                      <Badge className="bg-purple-100 text-purple-700">Unlocked</Badge>
                    )}
                  </div>

                  {/* Tech Master Achievement */}
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    lessonsCompleted >= 6 ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      lessonsCompleted >= 6 ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {lessonsCompleted >= 6 ? (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Star className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Tech Master</p>
                      <p className="text-xs text-gray-600">Complete all essential lessons ({lessonsCompleted}/6)</p>
                    </div>
                    {lessonsCompleted >= 6 && (
                      <Badge className="bg-blue-100 text-blue-700">Unlocked</Badge>
                    )}
                  </div>

                  {/* Call to Action */}
                  {lessonsCompleted < 6 && (
                    <div className="pt-2">
                      <Link to="/lessons">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Continue Learning
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onSelectPath={handleOnboardingPathSelection} 
        onClose={() => setShowWelcomeModal(false)}
      />

      {/* Product Tour */}
      <ProductTour 
        isActive={showProductTour}
        onComplete={handleProductTourComplete}
        onSkip={handleProductTourSkip}
      />

      {/* AI Assistant */}
      {showAI && (
        <AIAssistant
          onClose={() => setShowAI(false)}
          currentProject={projects.length > 0 ? projects[0] : null}
          allProjects={projects}
        />
      )}

      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
};

export default Dashboard;
