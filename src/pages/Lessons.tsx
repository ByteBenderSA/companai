import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import CelebrationModal from "@/components/ui/celebration-modal";
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Play, 
  Star,
  Zap,
  Database,
  Code,
  Palette,
  Github,
  Edit,
  Heart,
  Trophy,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { getUserProgress, updateUserProgress, type UserProgress } from "@/lib/firestore";
import { initializeTechEssentials } from "@/lib/seedLessons";

interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  timeEstimate: string;
  difficulty: 'Beginner' | 'Intermediate';
  content: {
    whatIs: string;
    whyImportant: string;
    keyFeatures: string[];
    howWeUse: string;
    quickTips: string[];
    videoUrl?: string;
    resources: Array<{ title: string; url: string }>;
  };
}

const TECH_LESSONS: Lesson[] = [
  {
    id: "lovable",
    title: "Lovable - AI App Builder",
    description: "The magic wand that turns your ideas into working apps",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    timeEstimate: "8 min",
    difficulty: "Beginner",
    content: {
      whatIs: "Lovable is an AI-powered app builder that creates full-stack applications from simple descriptions. Think of it as having a senior developer who can build your entire app just by understanding what you want.",
      whyImportant: "Instead of spending months learning complex coding concepts, Lovable lets you focus on the WHAT (your app idea) while it handles the HOW (the technical implementation). It's like having a magical translator between your ideas and working code.",
      keyFeatures: [
        "Natural language to code - just describe what you want",
        "Full-stack apps - frontend, backend, and database all handled",
        "Real-time preview - see your app as it's being built",
        "Modern tech stack - React, TypeScript, and more",
        "Instant deployment - from idea to live app in minutes"
      ],
      howWeUse: "In CompanAI, we use Lovable as your primary building tool. You'll describe your app idea, and Lovable will generate the initial codebase. Then you can iterate, add features, and customize - all through natural conversation with AI.",
      quickTips: [
        "Be specific in your descriptions - the more detail, the better results",
        "Start simple and add complexity gradually",
        "Use the preview feature to see changes in real-time",
        "Don't worry about perfect prompts - you can always refine"
      ],
      resources: [
        { title: "Lovable Official Docs", url: "https://docs.lovable.dev" },
        { title: "Best Practices Guide", url: "https://docs.lovable.dev/best-practices" }
      ]
    }
  },
  {
    id: "cursor",
    title: "Cursor - AI Code Editor",
    description: "Your intelligent coding companion that understands your project",
    icon: Edit,
    color: "from-blue-500 to-cyan-500",
    timeEstimate: "10 min",
    difficulty: "Beginner",
    content: {
      whatIs: "Cursor is an AI-powered code editor built on VS Code. It's like having a senior developer sitting next to you, understanding your entire codebase and helping you write, debug, and improve your code.",
      whyImportant: "While Lovable creates your initial app, Cursor is where you'll refine, customize, and add advanced features. It understands context, suggests improvements, and helps you learn coding patterns as you work.",
      keyFeatures: [
        "Context-aware AI - understands your entire project",
        "Intelligent code completion and suggestions",
        "Natural language code generation",
        "Built-in debugging and error fixing",
        "Git integration for version control"
      ],
      howWeUse: "After Lovable creates your app, you'll use Cursor to customize it. Import your project, and Cursor will understand the structure. Ask it to add features, fix bugs, or explain code - it's your coding mentor.",
      quickTips: [
        "Use Cmd/Ctrl+K to chat with AI about your code",
        "Highlight code and ask questions about it",
        "Use Tab to accept AI suggestions",
        "Ask for explanations of complex code sections"
      ],
      resources: [
        { title: "Cursor Documentation", url: "https://cursor.sh/docs" },
        { title: "Cursor VS Code Migration", url: "https://cursor.sh/vscode" }
      ]
    }
  },
  {
    id: "firebase",
    title: "Firebase - Your App's Backend",
    description: "Google's platform that handles all the behind-the-scenes magic",
    icon: Database,
    color: "from-orange-500 to-red-500",
    timeEstimate: "12 min",
    difficulty: "Beginner",
    content: {
      whatIs: "Firebase is Google's backend-as-a-service platform. Think of it as the invisible foundation that powers your app - handling user accounts, storing data, sending notifications, and hosting your app online.",
      whyImportant: "Building a backend from scratch takes months. Firebase gives you enterprise-grade backend services instantly. It's like having a team of backend engineers working for you 24/7, handling scaling, security, and reliability.",
      keyFeatures: [
        "Authentication - secure user login/signup",
        "Firestore - real-time database that syncs across devices",
        "Hosting - deploy your app with one command", 
        "Storage - handle images and files securely",
        "Analytics - understand how users interact with your app"
      ],
      howWeUse: "Every CompanAI app uses Firebase as its backend. Your user accounts, project data, AI conversations - everything is stored and managed by Firebase. It automatically syncs across all your devices and keeps your data secure.",
      quickTips: [
        "Firestore is real-time - changes sync instantly across devices",
        "Security rules protect your data automatically",
        "Firebase console lets you see your data in real-time",
        "Start with free tier - it's generous for learning projects"
      ],
      resources: [
        { title: "Firebase Documentation", url: "https://firebase.google.com/docs" },
        { title: "Firestore Getting Started", url: "https://firebase.google.com/docs/firestore" }
      ]
    }
  },
  {
    id: "github",
    title: "GitHub - Code Version Control",
    description: "The time machine for your code and collaboration hub",
    icon: Github,
    color: "from-gray-700 to-gray-900",
    timeEstimate: "15 min",
    difficulty: "Beginner",
    content: {
      whatIs: "GitHub is like Google Drive for code, but with superpowers. It tracks every change to your code, lets you collaborate with others, and serves as your portfolio to show off your projects to the world.",
      whyImportant: "GitHub is essential for any developer. It's your backup system, collaboration tool, and professional portfolio all in one. Every tech company uses GitHub, and having projects there shows you understand modern development workflows.",
      keyFeatures: [
        "Version control - track every change, never lose code",
        "Collaboration - work with others seamlessly",
        "Portfolio - showcase your projects professionally",
        "Issues & Planning - organize your project development",
        "Actions - automate testing and deployment"
      ],
      howWeUse: "Every CompanAI project gets its own GitHub repository. This gives you version control, lets you collaborate with others, and creates a professional portfolio. Plus, many deployment platforms connect directly to GitHub.",
      quickTips: [
        "Commit small, focused changes with clear messages",
        "Use branches for new features",
        "README files are your project's first impression",
        "GitHub Pages can host your projects for free"
      ],
      videoUrl: "https://www.youtube.com/embed/pBy1zgt0XPc",
      resources: [
        { title: "GitHub Hello World", url: "https://guides.github.com/activities/hello-world/" },
        { title: "Git Handbook", url: "https://guides.github.com/introduction/git-handbook/" }
      ]
    }
  },
  {
    id: "typescript",
    title: "TypeScript - JavaScript's Smart Sibling",
    description: "Catch errors before they happen and write more reliable code",
    icon: Code,
    color: "from-blue-600 to-indigo-600",
    timeEstimate: "10 min",
    difficulty: "Beginner",
    content: {
      whatIs: "TypeScript is JavaScript with superpowers. It adds 'types' to JavaScript, which means you can specify what kind of data your variables should hold. It's like having a spell-checker for your code that catches mistakes before your app runs.",
      whyImportant: "JavaScript is flexible but error-prone. TypeScript catches bugs while you're writing code, not when users are using your app. It makes your code more reliable, easier to understand, and helps you build with confidence.",
      keyFeatures: [
        "Type safety - catch errors at development time",
        "Better IDE support - smarter autocomplete and suggestions",
        "Code documentation - types serve as living documentation",
        "Refactoring confidence - rename and restructure safely",
        "Modern JavaScript features - use latest language features"
      ],
      howWeUse: "All CompanAI projects use TypeScript by default. You don't need to master it immediately - start with basic types and gradually learn more. The AI assistants (Lovable and Cursor) will help you with TypeScript syntax.",
      quickTips: [
        "Start with basic types: string, number, boolean",
        "Let TypeScript infer types when possible",
        "Use interfaces to describe object shapes", 
        "Don't fear 'any' type while learning - gradually replace it"
      ],
      resources: [
        { title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/" },
        { title: "TypeScript in 5 Minutes", url: "https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html" }
      ]
    }
  },
  {
    id: "tailwind",
    title: "Tailwind CSS - Styling Made Simple",
    description: "Build beautiful interfaces without writing custom CSS",
    icon: Palette,
    color: "from-cyan-500 to-teal-500",
    timeEstimate: "8 min",
    difficulty: "Beginner",
    content: {
      whatIs: "Tailwind CSS is a utility-first CSS framework. Instead of writing custom CSS, you use pre-built classes like 'bg-blue-500' for blue background or 'text-center' for centered text. It's like having a giant box of LEGO blocks for styling.",
      whyImportant: "Traditional CSS gets messy quickly. Tailwind keeps your styles organized, consistent, and easy to maintain. It's designed by experts to look great, so your apps automatically have professional design aesthetics.",
      keyFeatures: [
        "Utility classes - style elements directly in HTML",
        "Responsive design - built-in mobile-first approach",
        "Design system - consistent colors, spacing, and typography",
        "Dark mode support - toggle themes effortlessly",
        "Component-friendly - works great with React components"
      ],
      howWeUse: "Every CompanAI project uses Tailwind for styling. You'll use classes like 'bg-purple-600 text-white p-4 rounded-lg' to style elements. The AI assistants know Tailwind well and will suggest the right classes for your designs.",
      quickTips: [
        "Start with basic utilities: margin (m-), padding (p-), colors (bg-, text-)",
        "Use the official docs for class reference",
        "Responsive design: use sm:, md:, lg: prefixes",
        "Create consistent spacing with the built-in scale"
      ],
      resources: [
        { title: "Tailwind CSS Documentation", url: "https://tailwindcss.com/docs" },
        { title: "Tailwind Play (Online Editor)", url: "https://play.tailwindcss.com/" }
      ]
    }
  }
];

const Lessons = () => {
  const { user } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Initialize tech essentials learning path and load user's lesson progress
    const loadProgress = async () => {
      try {
        // Ensure the learning path exists
        await initializeTechEssentials();
        
        const progress = await getUserProgress(user.id, 'tech-essentials');
        if (progress) {
          setCompletedLessons(progress.completedSteps.map(step => TECH_LESSONS[step]?.id).filter(Boolean));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading lesson progress:', error);
        setLoading(false);
      }
    };

    loadProgress();
  }, [user]);

  const completeLesson = async (lessonId: string) => {
    if (!user || completedLessons.includes(lessonId)) return;

    const lessonIndex = TECH_LESSONS.findIndex(lesson => lesson.id === lessonId);
    if (lessonIndex === -1) return;

    const newCompletedLessons = [...completedLessons, lessonId];
    setCompletedLessons(newCompletedLessons);

    // Update progress in Firestore
    const progress: UserProgress = {
      userId: user.id,
      pathId: 'tech-essentials',
      currentStep: Math.max(...newCompletedLessons.map(id => TECH_LESSONS.findIndex(l => l.id === id))),
      completedSteps: newCompletedLessons.map(id => TECH_LESSONS.findIndex(l => l.id === id)),
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      ...(newCompletedLessons.length === TECH_LESSONS.length ? { completedAt: new Date().toISOString() } : {})
    };

    try {
      await updateUserProgress(progress);
      
      // Check for Quick Learner achievement (5 lessons in a day)
      if (newCompletedLessons.length >= 5) {
        // You could trigger achievement notification here
        console.log('🎉 Quick Learner achievement unlocked!');
      }
    } catch (error) {
      console.error('Error updating lesson progress:', error);
    }
  };

  const progressPercentage = (completedLessons.length / TECH_LESSONS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 w-fit">
                  ← Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Tech Stack Essentials</h1>
                <p className="text-gray-600">Learn the tools that power your apps - no more building blindly!</p>
              </div>
            </div>
            <div className="text-left lg:text-right">
              <div className="text-2xl font-bold text-purple-600">{completedLessons.length}/{TECH_LESSONS.length}</div>
              <div className="text-sm text-gray-600">Lessons Complete</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            {completedLessons.length >= 5 && (
              <div className="flex items-center gap-2 mt-2 text-sm text-purple-600">
                <Trophy className="w-4 h-4" />
                <span className="font-medium">Quick Learner Achievement Unlocked!</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {!selectedLesson ? (
          // Lesson Grid
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TECH_LESSONS.map((lesson) => {
              const isCompleted = completedLessons.includes(lesson.id);
              const IconComponent = lesson.icon;
              
              return (
                <Card 
                  key={lesson.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                    isCompleted ? 'ring-2 ring-green-500 ring-opacity-50' : ''
                  }`}
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${lesson.color} flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      {isCompleted && (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{lesson.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{lesson.timeEstimate}</span>
                      </div>
                      <Badge variant={lesson.difficulty === 'Beginner' ? 'secondary' : 'default'}>
                        {lesson.difficulty}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          // Lesson Detail View
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedLesson(null)}
              className="mb-6"
            >
              ← Back to Lessons
            </Button>
            
            <Card className="shadow-lg border-0">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-r ${selectedLesson.color} flex items-center justify-center`}>
                    <selectedLesson.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{selectedLesson.title}</CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{selectedLesson.timeEstimate}</span>
                      </div>
                      <Badge variant={selectedLesson.difficulty === 'Beginner' ? 'secondary' : 'default'}>
                        {selectedLesson.difficulty}
                      </Badge>
                      {completedLessons.includes(selectedLesson.id) && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* What Is It? */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Play className="w-5 h-5 text-blue-600" />
                    What is {selectedLesson.title.split(' - ')[0]}?
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{selectedLesson.content.whatIs}</p>
                </section>

                {/* Why Important */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Why is it Important?
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{selectedLesson.content.whyImportant}</p>
                </section>

                {/* Key Features */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Key Features
                  </h3>
                  <ul className="space-y-2">
                    {selectedLesson.content.keyFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* How We Use It */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    How We Use It in CompanAI
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{selectedLesson.content.howWeUse}</p>
                </section>

                {/* Quick Tips */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-orange-600" />
                    Quick Tips
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedLesson.content.quickTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                        <ArrowRight className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Video (if available) */}
                {selectedLesson.content.videoUrl && (
                  <section>
                    <h3 className="text-lg font-semibold mb-3">Quick Tutorial Video</h3>
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <iframe
                        src={selectedLesson.content.videoUrl}
                        title={`${selectedLesson.title} Tutorial`}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  </section>
                )}

                {/* Resources */}
                <section>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-blue-600" />
                    Learn More
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedLesson.content.resources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{resource.title}</span>
                      </a>
                    ))}
                  </div>
                </section>

                {/* Complete Lesson & Navigation */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                  {/* Previous Lesson */}
                  <div>
                    {(() => {
                      const currentIndex = TECH_LESSONS.findIndex(l => l.id === selectedLesson.id);
                      const previousLesson = currentIndex > 0 ? TECH_LESSONS[currentIndex - 1] : null;
                      
                      return previousLesson ? (
                        <Button 
                          variant="outline"
                          onClick={() => setSelectedLesson(previousLesson)}
                          className="text-gray-600 border-gray-300 hover:bg-gray-50"
                        >
                          ← Previous: {previousLesson.title.split(' - ')[0]}
                        </Button>
                      ) : <div></div>;
                    })()}
                  </div>

                  {/* Complete Button */}
                  <div className="flex justify-center">
                  {completedLessons.includes(selectedLesson.id) ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Lesson Completed!</span>
                    </div>
                  ) : (
                    <Button 
                        onClick={() => {
                          completeLesson(selectedLesson.id);
                          // Auto-navigate to next lesson after completion
                          const currentIndex = TECH_LESSONS.findIndex(l => l.id === selectedLesson.id);
                          const nextLesson = currentIndex < TECH_LESSONS.length - 1 ? TECH_LESSONS[currentIndex + 1] : null;
                          if (nextLesson) {
                            setTimeout(() => {
                              setSelectedLesson(nextLesson);
                            }, 1500);
                          }
                        }}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      size="lg"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Mark as Complete
                    </Button>
                  )}
                  </div>

                  {/* Next Lesson */}
                  <div>
                    {(() => {
                      const currentIndex = TECH_LESSONS.findIndex(l => l.id === selectedLesson.id);
                      const nextLesson = currentIndex < TECH_LESSONS.length - 1 ? TECH_LESSONS[currentIndex + 1] : null;
                      
                      return nextLesson ? (
                        <Button 
                          onClick={() => setSelectedLesson(nextLesson)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          Next: {nextLesson.title.split(' - ')[0]} →
                        </Button>
                      ) : (
                        completedLessons.includes(selectedLesson.id) && (
                          <Button 
                            onClick={() => {
                              setShowCelebration(true);
                              setSelectedLesson(null);
                            }}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          >
                            🎉 All Done! →
                          </Button>
                        )
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Celebration Modal */}
      <CelebrationModal 
        isOpen={showCelebration} 
        onClose={() => setShowCelebration(false)} 
      />
    </div>
  );
};

export default Lessons; 