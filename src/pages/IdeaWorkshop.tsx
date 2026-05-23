import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  ArrowLeft, 
  Wand2, 
  Target, 
  Users, 
  Clock,
  Code,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Loader2,
  Rocket,
  Star,
  Brain,
  Sparkles,
  Zap,
  Copy,
  Check,
  ExternalLink,
  Database
} from "lucide-react";
import { geminiService } from "@/lib/ai-config";
import { useAuth } from "@/contexts/AuthContext";
import { 
  createProject, 
  createIdeaWorkflow, 
  updateIdeaWorkflow, 
  getUserActiveIdeaWorkflow, 
  completeIdeaWorkflow,
  type IdeaWorkflow 
} from "@/lib/firestore";
import { checkUsageLimit, incrementUsage } from '@/lib/subscriptions'
import { UsageLimitModal } from '@/components/ui/usage-limit-modal'
import { IdeaCustomizationForm } from '@/components/IdeaCustomizationForm'
import { RefinedPrompts } from '@/components/RefinedPrompts'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface GeneratedIdea {
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
  projectId?: string;
}

// Enhanced Loading Component
const IdeaGenerationLoader = () => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: Brain, text: "Analyzing your interests...", duration: 1500 },
    { icon: Sparkles, text: "Generating creative concepts...", duration: 2000 },
    { icon: Code, text: "Designing technical architecture...", duration: 1800 },
    { icon: Target, text: "Calculating market potential...", duration: 1200 },
    { icon: Zap, text: "Finalizing perfect matches...", duration: 1000 }
  ];

  const tips = [
    "💡 The best apps solve real problems for real people",
    "🚀 Start simple, then add complexity as you learn",
    "📱 Mobile-first thinking leads to better user experiences",
    "🎯 Focus on one core feature that works perfectly",
    "💪 Every expert was once a beginner - you've got this!"
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2;
        
        // Update current step based on progress
        const stepIndex = Math.floor((newProgress / 100) * steps.length);
        setCurrentStep(Math.min(stepIndex, steps.length - 1));
        
        return Math.min(newProgress, 100);
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const currentStepData = steps[currentStep];
  const CurrentIcon = currentStepData?.icon || Brain;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CurrentIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Creating Your Perfect Project Ideas</h3>
            <p className="text-purple-100">Our AI is analyzing your preferences to generate personalized suggestions</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CurrentIcon className="w-5 h-5 text-purple-600 animate-bounce" />
              <span className="font-medium text-gray-900">{currentStepData?.text}</span>
            </div>
          </div>

          {/* Loading Steps */}
          <div className="space-y-3 mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={index} className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  isActive ? 'bg-purple-50 border border-purple-200' : 
                  isCompleted ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-purple-600 text-white animate-pulse' :
                    isCompleted ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-sm ${
                    isActive ? 'text-purple-900 font-medium' :
                    isCompleted ? 'text-green-900' : 'text-gray-600'
                  }`}>
                    {step.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Pro Tip</h4>
                <p className="text-sm text-blue-800">{tips[currentStep % tips.length]}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Skeleton Card Component
const IdeaCardSkeleton = () => (
  <Card className="shadow-lg border-0 animate-pulse">
    <CardContent className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded mb-4 w-full"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>

      <div className="mb-4">
        <div className="h-4 bg-gray-200 rounded mb-2 w-24"></div>
        <div className="flex flex-wrap gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-6 bg-gray-200 rounded w-16"></div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="h-4 bg-gray-200 rounded mb-2 w-32"></div>
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <div className="h-4 bg-gray-200 rounded mb-2 w-32"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>

      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </CardContent>
  </Card>
);

const IdeaWorkshop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'input' | 'ideas' | 'customize' | 'prompts'>('input');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(true);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [showRecoveryNotice, setShowRecoveryNotice] = useState(false);
  const [formData, setFormData] = useState({
    appName: "",
    description: "",
    targetAudience: "",
    keyFeatures: "",
    skillLevel: "beginner"
  });
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const [refinedPrompts, setRefinedPrompts] = useState<string>("");

  // Load existing workflow on component mount
  useEffect(() => {
    const loadExistingWorkflow = async () => {
      if (!user) {
        setIsLoadingWorkflow(false);
        return;
      }

      try {
        const activeWorkflow = await getUserActiveIdeaWorkflow(user.uid || user.id);
        if (activeWorkflow) {
          console.log('📋 Found existing workflow, recovering data:', activeWorkflow);
          
          // Restore all state from the workflow
          setCurrentWorkflowId(activeWorkflow.id);
          setCurrentStep(activeWorkflow.currentStep);
          setFormData(activeWorkflow.formData);
          setGeneratedIdeas(activeWorkflow.generatedIdeas || []);
          setSelectedIdea(activeWorkflow.selectedIdea || null);
          setRefinedPrompts(activeWorkflow.refinedPrompts || "");
          
          // Show recovery notice if not on input step
          if (activeWorkflow.currentStep !== 'input') {
            setShowRecoveryNotice(true);
            setTimeout(() => setShowRecoveryNotice(false), 5000);
          }
        }
      } catch (error) {
        console.error('Error loading existing workflow:', error);
      } finally {
        setIsLoadingWorkflow(false);
      }
    };

    loadExistingWorkflow();
  }, [user]);

  // Auto-save workflow data whenever state changes
  const saveWorkflowData = async (updates: Partial<IdeaWorkflow>) => {
    if (!user || isLoadingWorkflow) return;

    try {
      const userId = user.uid || user.id;
      
      if (currentWorkflowId) {
        // Update existing workflow
        await updateIdeaWorkflow(currentWorkflowId, updates);
        console.log('💾 Workflow data auto-saved');
      } else {
        // Create new workflow
        const newWorkflowData: Omit<IdeaWorkflow, 'id' | 'createdAt' | 'updatedAt'> = {
          userId,
          currentStep: 'input',
          formData,
          generatedIdeas: [],
          isCompleted: false,
          ...updates
        };
        
        const workflowId = await createIdeaWorkflow(newWorkflowData);
        setCurrentWorkflowId(workflowId);
        console.log('💾 New workflow created and saved:', workflowId);
      }
    } catch (error) {
      console.error('Error saving workflow data:', error);
    }
  };

  const parseAIResponse = (response: string, index: number): GeneratedIdea => {
    console.log('Raw AI Response:', response);
    
    // Robust fallback structure
    const fallbackIdea: GeneratedIdea = {
      id: index + 1,
      title: "Custom Project Idea",
      description: "A modern web application designed to help users solve real-world problems with intuitive design and powerful features.",
      difficulty: "Beginner" as const,
      timeEstimate: "2-3 weeks",
      techStack: ["React", "TypeScript", "Tailwind CSS", "Firebase"],
      marketPotential: "Medium",
      features: ["User Registration & Authentication", "Data Input & Management", "Real-time Updates", "Responsive Design", "User Dashboard", "Export Functionality"],
      why: "Perfect for learning modern web development",
      learningObjectives: ["React Components", "State Management", "Database Integration", "UI/UX Design"],
      roadmap: ["Project Setup", "User Interface", "Backend Integration", "Testing & Polish", "Deployment"]
    };

    try {
      // Step 1: Try to extract and parse JSON from the response
      let jsonData = null;
      
      // Multiple strategies to extract JSON
      const jsonExtractionStrategies = [
        // Strategy 1: Direct JSON (ideal case)
        () => JSON.parse(response.trim()),
        
        // Strategy 2: JSON Array in code blocks
        () => {
          const codeBlockMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
          return codeBlockMatch ? JSON.parse(codeBlockMatch[1]) : null;
        },
        
        // Strategy 3: JSON Object in code blocks
        () => {
          const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          return codeBlockMatch ? JSON.parse(codeBlockMatch[1]) : null;
        },
        
        // Strategy 4: JSON Array between brackets
        () => {
          const jsonMatch = response.match(/(\[[\s\S]*\])/);
          return jsonMatch ? JSON.parse(jsonMatch[1]) : null;
        },
        
        // Strategy 5: JSON Object between curly braces
        () => {
          const jsonMatch = response.match(/(\{[\s\S]*\})/);
          return jsonMatch ? JSON.parse(jsonMatch[1]) : null;
        },
        
        // Strategy 6: Extract JSON-like content and clean it
        () => {
          let cleaned = response
            .replace(/^[^{[]*/, '') // Remove everything before first { or [
            .replace(/[^}\]]*$/, '') // Remove everything after last } or ]
            .trim();
          
          if ((cleaned.startsWith('{') && cleaned.endsWith('}')) || 
              (cleaned.startsWith('[') && cleaned.endsWith(']'))) {
            return JSON.parse(cleaned);
          }
          return null;
        }
      ];

      // Try each extraction strategy
      for (const strategy of jsonExtractionStrategies) {
        try {
          jsonData = strategy();
          if (jsonData && (typeof jsonData === 'object' || Array.isArray(jsonData))) {
            console.log('Successfully extracted JSON:', jsonData);
            break;
          }
        } catch (e) {
          // Continue to next strategy
          continue;
        }
      }

      // Step 2: Handle array responses (multiple ideas)
      if (Array.isArray(jsonData)) {
        console.log('Processing array of ideas, selecting index:', index);
        const ideaData = jsonData[index] || jsonData[0] || null;
        if (ideaData) {
          jsonData = ideaData;
        } else {
          console.log('No valid idea found at index, falling back');
          jsonData = null;
        }
      }

      // Step 3: Validate and structure the JSON data
      if (jsonData) {
        const validateField = (field: any, fallback: any) => {
          return field && (typeof field === typeof fallback) ? field : fallback;
        };

        const validateArray = (arr: any, fallback: any[], maxLength = 10) => {
          if (Array.isArray(arr) && arr.length > 0) {
            return arr.filter(item => typeof item === 'string' && item.trim().length > 0).slice(0, maxLength);
          }
          return fallback;
        };

        const validateDifficulty = (diff: any): 'Beginner' | 'Intermediate' | 'Advanced' => {
          const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
          return validDifficulties.includes(diff) ? diff : 'Beginner';
        };

        const result: GeneratedIdea = {
          id: index + 1,
          title: validateField(jsonData.title, fallbackIdea.title),
          description: validateField(jsonData.description, fallbackIdea.description),
          difficulty: validateDifficulty(jsonData.difficulty),
          timeEstimate: validateField(jsonData.timeEstimate, fallbackIdea.timeEstimate),
          techStack: validateArray(jsonData.techStack, fallbackIdea.techStack, 6),
          marketPotential: validateField(jsonData.marketPotential, fallbackIdea.marketPotential),
          features: validateArray(jsonData.features, fallbackIdea.features, 8),
          learningObjectives: validateArray(jsonData.learningObjectives, fallbackIdea.learningObjectives, 6),
          why: `Perfect for learning ${jsonData.learningObjectives?.slice(0, 2).join(" and ") || "development skills"}`,
          roadmap: ["UI Design & Planning", "Core Feature Development", "Database Integration", "Testing & Polish", "Deployment & Launch"]
        };

        console.log('Successfully parsed JSON result:', result);
        return result;
      }

      // Step 4: If JSON parsing failed, fall back to smart text parsing
      console.log('JSON parsing failed, falling back to text parsing');
      return parseTextFallback(response, index, fallbackIdea);

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return {
        ...fallbackIdea,
        title: `Project Idea ${index + 1}`,
        description: response.slice(0, 200) + "..."
      };
    }
  };

  // Fallback text parsing function
  const parseTextFallback = (response: string, index: number, fallbackIdea: GeneratedIdea): GeneratedIdea => {
    const cleanResponse = response.replace(/\*\*/g, '').trim();
    
    // Extract title
    let title = "";
    const titleMatch = cleanResponse.match(/(?:title|name|project):\s*["']?([^"\n]+)["']?/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      const lines = cleanResponse.split('\n').filter(l => l.trim());
      title = lines[0]?.replace(/^\d+\.\s*/, '').trim() || fallbackIdea.title;
    }

    // Extract description
    let description = "";
    const descMatch = cleanResponse.match(/(?:description|about|overview):\s*(.+?)(?:\n\n|\n[A-Z]|$)/is);
    if (descMatch) {
      description = descMatch[1].trim();
    } else {
      description = cleanResponse.slice(0, 200) + "...";
    }

    // Smart feature generation based on title keywords
    const keywords = title.toLowerCase();
    let features = fallbackIdea.features;
    
    if (keywords.includes('fitness') || keywords.includes('health')) {
      features = ["Workout Tracking", "Progress Analytics", "Goal Setting", "Exercise Library", "Social Sharing", "Nutrition Logging"];
    } else if (keywords.includes('task') || keywords.includes('todo') || keywords.includes('productivity')) {
      features = ["Task Creation", "Due Date Reminders", "Priority Levels", "Categories", "Progress Tracking", "Team Collaboration"];
    } else if (keywords.includes('social') || keywords.includes('chat') || keywords.includes('community')) {
      features = ["User Profiles", "Real-time Messaging", "Friend System", "Content Sharing", "Notifications", "Privacy Controls"];
    }

    return {
      id: index + 1,
      title,
      description,
      difficulty: 'Beginner' as const,
      timeEstimate: "2-3 weeks",
      techStack: ["React", "TypeScript", "Tailwind CSS", "Firebase"],
      marketPotential: "Medium",
      features,
      why: `Perfect for learning ${keywords.includes('mobile') ? 'mobile development' : 'web development'}`,
      learningObjectives: ["React Components", "State Management", "Database Integration", "UI/UX Design"],
      roadmap: ["Project Setup", "User Interface", "Backend Integration", "Testing & Polish", "Deployment"]
    };
  };

  const handleGenerateIdeas = async () => {
    if (!user) return;
    
    // Check usage limit before generating
    const limitCheck = await checkUsageLimit(user.uid, 'idea');
    if (!limitCheck.canUse) {
      setShowLimitModal(true);
      return;
    }
    
    // Increment usage counter
    const success = await incrementUsage(user.uid, 'idea');
    if (!success) {
      setShowLimitModal(true);
      return;
    }
    
    if (!formData.appName.trim()) return;

    // Save form data before generating
    await saveWorkflowData({
      currentStep: 'input',
      formData
    });

    setIsGenerating(true);
    try {
      const userInput = `App Name: ${formData.appName}
Description: ${formData.description}
Target Audience: ${formData.targetAudience}
Key Features: ${formData.keyFeatures}
Skill Level: ${formData.skillLevel}`;

      const response = await geminiService.generateProjectIdea(userInput, formData.skillLevel);
      const ideas = response.split("---").map((idea, index) => parseAIResponse(idea.trim(), index));
      
      setGeneratedIdeas(ideas);
      setCurrentStep('ideas');

      // Save generated ideas immediately
      await saveWorkflowData({
        currentStep: 'ideas',
        formData,
        generatedIdeas: ideas
      });
      
    } catch (error) {
      console.error("Error generating ideas:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleIdeaSelection = async (idea: GeneratedIdea) => {
    setSelectedIdea(idea);
    setCurrentStep('customize');

    // Save selected idea immediately
    await saveWorkflowData({
      currentStep: 'customize',
      formData,
      generatedIdeas,
      selectedIdea: idea
    });
  };

  const handleCustomizationSubmit = async (customization: any) => {
    if (!selectedIdea || !user) return;

    // Save customization data before generating prompts
    await saveWorkflowData({
      currentStep: 'customize',
      formData,
      generatedIdeas,
      selectedIdea,
      customization
    });

    setIsRefining(true);
    try {
      const refinedPromptResponse = await geminiService.generateRefinedPrompt(selectedIdea, customization);
      setRefinedPrompts(refinedPromptResponse);
      setCurrentStep('prompts');

      // Save refined prompts immediately - this is the most critical data!
      await saveWorkflowData({
        currentStep: 'prompts',
        formData,
        generatedIdeas,
        selectedIdea,
        customization,
        refinedPrompts: refinedPromptResponse
      });
      
    } catch (error) {
      console.error("Error generating refined prompts:", error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSaveAsProject = async (idea: GeneratedIdea) => {
    if (!user) return;

    setIsSaving(true);
    try {
      let prompts = { lovable: undefined, cursor: undefined };
      
      // If we have refined prompts (from customization flow), use them
      if (refinedPrompts) {
        const parsedPrompts = refinedPrompts.split('## CURSOR PROMPT');
        prompts.lovable = parsedPrompts[0]?.replace('## LOVABLE.DEV PROMPT', '').trim();
        prompts.cursor = parsedPrompts[1]?.trim();
      } else {
        // Create basic template prompts for quick save path (no API calls)
        prompts.lovable = `Create a ${idea.title} application with the following specifications:

**Project Overview:**
${idea.description}

**Key Features:**
${idea.features.map(feature => `- ${feature}`).join('\n')}

**Tech Stack:**
${idea.techStack.map(tech => `- ${tech}`).join('\n')}

**UI Requirements:**
- Modern, clean design with purple/blue color scheme
- Responsive layout that works on desktop and mobile
- Dashboard-style layout with sidebar navigation
- Use Tailwind CSS for styling
- Include proper TypeScript types

**Core Components Needed:**
- Authentication system (login/signup)
- Main dashboard
- Navigation component
- User profile management
- ${idea.features.slice(0, 3).map(feature => `- ${feature} component`).join('\n')}

**Styling Guidelines:**
- Use gradient backgrounds (purple to blue)
- Modern card-based layouts
- Proper spacing and typography
- Hover effects and smooth transitions
- Accessible color contrasts

Please create a complete, production-ready frontend application with proper component structure, routing, and state management.`;

        prompts.cursor = `Implement the backend for ${idea.title} with the following requirements:

**Project Overview:**
${idea.description}

**Database Schema:**
Design tables/collections for:
- Users (authentication, profiles)
- ${idea.features.slice(0, 4).map(feature => `- ${feature.toLowerCase().replace(/\s+/g, '_')} data`).join('\n')}

**API Endpoints:**
- Authentication (register, login, logout)
- User management (profile, settings)
- ${idea.features.slice(0, 3).map(feature => `- ${feature} CRUD operations`).join('\n')}

**Tech Stack:**
${idea.techStack.filter(tech => !['React', 'TypeScript', 'Tailwind CSS'].includes(tech)).map(tech => `- ${tech}`).join('\n')}
- RESTful API design
- JWT authentication
- Input validation and sanitization
- Error handling and logging

**Security Requirements:**
- Password hashing (bcrypt)
- JWT token management
- Input validation
- CORS configuration
- Rate limiting

**Features to Implement:**
${idea.features.map(feature => `- ${feature}`).join('\n')}

Please implement a secure, scalable backend with proper error handling, validation, and documentation.`;
      }

      const projectData = {
        title: idea.title,
        description: idea.description,
        category: 'AI Generated',
        difficulty: idea.difficulty,
        timeEstimate: idea.timeEstimate,
        techStack: idea.techStack,
        marketPotential: idea.marketPotential as 'Low' | 'Medium' | 'High',
        features: idea.features,
        ownerId: user.id,
        status: 'planning' as const,
        progress: {
          currentStep: 0,
          completedSteps: [],
          totalSteps: idea.roadmap.length,
          lastWorkedOn: new Date().toISOString()
        },
        prompts: {
          lovable: prompts.lovable,
          cursor: prompts.cursor
        },
        resources: {
          links: [],
          tutorials: [],
          documentation: []
        }
      };

      const projectId = await createProject(projectData);
      
      // Complete the workflow and link to the project
      if (currentWorkflowId) {
        await completeIdeaWorkflow(currentWorkflowId, projectId);
      }
      
      // Update the idea with the project ID
      setGeneratedIdeas(prev => 
        prev.map(prevIdea => 
          prevIdea.id === idea.id 
            ? { ...prevIdea, projectId }
            : prevIdea
        )
      );

      navigate('/workspace');
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartOver = async () => {
    // Complete current workflow if it exists
    if (currentWorkflowId) {
      await completeIdeaWorkflow(currentWorkflowId);
    }

    // Reset all state
    setCurrentStep('input');
    setCurrentWorkflowId(null);
    setFormData({
      appName: "",
      description: "",
      targetAudience: "",
      keyFeatures: "",
      skillLevel: "beginner"
    });
    setGeneratedIdeas([]);
    setSelectedIdea(null);
    setRefinedPrompts("");
  };

  // Show loading state while recovering workflow
  if (isLoadingWorkflow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Loading your idea workshop...</h2>
            <p className="text-gray-500 mt-2">Checking for any saved progress</p>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'input':
        return renderInputForm();
      case 'ideas':
        return renderIdeasSelection();
      case 'customize':
        return renderCustomization();
      case 'prompts':
        return renderRefinedPrompts();
      default:
        return renderInputForm();
    }
  };

  const renderInputForm = () => (
    <Card className="max-w-2xl mx-auto border-0 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          Tell Us About Your App Idea
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="appName" className="text-base font-medium">App Name</Label>
          <Input
            id="appName"
            placeholder="e.g., FitTracker Pro"
            value={formData.appName}
            onChange={(e) => setFormData(prev => ({ ...prev, appName: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-base font-medium">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your app idea in a few sentences..."
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="targetAudience" className="text-base font-medium">Target Audience</Label>
          <Input
            id="targetAudience"
            placeholder="e.g., Fitness enthusiasts, busy professionals"
            value={formData.targetAudience}
            onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="keyFeatures" className="text-base font-medium">Key Features</Label>
          <Textarea
            id="keyFeatures"
            placeholder="What are the main features you want in your app?"
            value={formData.keyFeatures}
            onChange={(e) => setFormData(prev => ({ ...prev, keyFeatures: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-base font-medium mb-3 block">Your Coding Experience</Label>
          <RadioGroup
            value={formData.skillLevel}
            onValueChange={(value) => setFormData(prev => ({ ...prev, skillLevel: value }))}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="beginner" id="beginner" />
              <Label htmlFor="beginner">Beginner - I'm just starting out</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="intermediate" id="intermediate" />
              <Label htmlFor="intermediate">Intermediate - I have some experience</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="advanced" id="advanced" />
              <Label htmlFor="advanced">Advanced - I'm comfortable with coding</Label>
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={handleGenerateIdeas}
          disabled={isGenerating || !formData.appName.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-6 text-lg"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Generating Ideas...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate App Ideas
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const renderIdeasSelection = () => (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Choose Your App Concept</h2>
        <p className="text-gray-600">Select the variation that best matches your vision</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {generatedIdeas.map((idea, index) => (
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => handleIdeaSelection(idea)}>
            <CardHeader>
              <CardTitle className="text-xl">{idea.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">{idea.description}</p>
              
              <div>
                <h4 className="font-semibold mb-2">Key Features:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {idea.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                {idea.techStack.slice(0, 3).map((tech, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{tech}</Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                  onClick={() => handleIdeaSelection(idea)}
                >
                  Customize & Build
                </Button>
                <Button 
                  variant="outline" 
                  className="px-4"
                  onClick={() => handleSaveAsProject(idea)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save as Project'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button variant="outline" onClick={handleStartOver}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>
    </div>
  );

  const renderCustomization = () => (
    <div>
      <div className="text-center mb-6">
        <Button variant="outline" onClick={() => setCurrentStep('ideas')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Ideas
        </Button>
      </div>
      
      <IdeaCustomizationForm
        selectedIdea={selectedIdea}
        onSubmit={handleCustomizationSubmit}
        isLoading={isRefining}
      />
    </div>
  );

  const renderRefinedPrompts = () => (
    <RefinedPrompts
      prompts={refinedPrompts}
      selectedIdea={selectedIdea}
      onStartOver={handleStartOver}
      onSaveAsProject={() => selectedIdea && handleSaveAsProject(selectedIdea)}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Recovery Notice */}
      {showRecoveryNotice && (
        <div className="bg-green-100 border-l-4 border-green-500 p-4">
          <div className="container mx-auto px-6">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
              <div>
                <p className="text-green-700 font-medium">
                  ✨ Progress recovered! We've restored your previous idea workshop session.
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Your ideas, customizations, and prompts are safe and ready to continue.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="py-12">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
          <Link to="/dashboard">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200 px-4 py-2">
            <Zap className="w-4 h-4 mr-2" />
            AI-Powered Idea Workshop
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Transform Your Idea
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get professional development prompts tailored to your vision
          </p>
        </div>

        {renderCurrentStep()}

        <UsageLimitModal 
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          type="idea"
        />
        </div>
      </div>
    </div>
  );
};

export default IdeaWorkshop;
