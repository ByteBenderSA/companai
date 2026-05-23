import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Code, 
  CheckCircle, 
  Circle, 
  Copy, 
  ExternalLink,
  PlayCircle,
  Book,
  MessageSquare,
  Target
} from "lucide-react";
import WorkflowGuide from "@/components/WorkflowGuide";
import AIAssistant from "@/components/AIAssistant";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProjects, updateProject } from "@/lib/firestore";
import type { Project } from "@/lib/firestore";
import { geminiService } from "@/lib/ai-config";

// Dynamic Prompt Generation Component
const DynamicPromptSection = ({ 
  project, 
  onGenerate, 
  isGenerating, 
  setIsGenerating,
  colorSchemes,
  selectedColorScheme,
  setSelectedColorScheme
}: {
  project: Project | null;
  onGenerate: (project: Project, colorScheme: string) => Promise<string>;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  colorSchemes: any;
  selectedColorScheme: string;
  setSelectedColorScheme: (value: string) => void;
}) => {
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [hasLoadedCache, setHasLoadedCache] = useState(false);
  
  // Load cached prompts when component mounts or project changes
  useEffect(() => {
    // Check both old location (generatedPrompts) and new location (prompts) for backward compatibility
    const hasGeneratedPrompts = project?.generatedPrompts?.lovablePrompt && project?.generatedPrompts?.cursorPrompt;
    const hasStandardPrompts = project?.prompts?.lovable && project?.prompts?.cursor;
    
    if (hasGeneratedPrompts) {
      // Use the generatedPrompts format (newer format)
      const cachedPrompt = `${project.generatedPrompts.lovablePrompt}\n\n---\n\n${project.generatedPrompts.cursorPrompt}`;
      setGeneratedPrompt(cachedPrompt);
      setSelectedColorScheme(project.generatedPrompts.colorScheme || selectedColorScheme);
      setHasLoadedCache(true);
    } else if (hasStandardPrompts) {
      // Use the standard prompts format (existing projects)
      const cachedPrompt = `${project.prompts.lovable}\n\n---\n\n${project.prompts.cursor}`;
      setGeneratedPrompt(cachedPrompt);
      setHasLoadedCache(true);
      console.log('✅ Loaded existing prompts from project.prompts');
    } else {
      setHasLoadedCache(false);
    }
  }, [project]);
  
  const savePromptsToFirestore = async (prompt: string, colorScheme: string) => {
    if (!project) return;
    
    try {
      const lovableSection = prompt.split('---')[0]?.trim() || '';
      const cursorSection = prompt.split('---')[1]?.trim() || '';
      
      const generatedPrompts = {
        lovablePrompt: lovableSection,
        cursorPrompt: cursorSection,
        colorScheme: colorScheme,
        generatedAt: new Date().toISOString(),
        version: "1.0"
      };
      
      await updateProject(project.id, { generatedPrompts });
    } catch (error) {
      console.error('Error saving prompts:', error);
    }
  };
  
  const handleGenerate = async (forceRegenerate = false) => {
    if (!project) return;
    
    setIsGenerating(true);
    try {
      const prompt = await onGenerate(project, selectedColorScheme);
      setGeneratedPrompt(prompt);
      
      // Save the new prompts to Firestore
      await savePromptsToFirestore(prompt, selectedColorScheme);
      
      toast({
        title: forceRegenerate ? "🔄 Prompts Regenerated!" : "✨ AI Prompts Generated!",
        description: forceRegenerate ? "New prompts saved to your project." : "Your custom prompts are ready and saved!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "You can now paste this in Lovable.dev.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">🤖 AI-Generated Development Prompts</h3>
        <div className="flex gap-2">
          <Button 
            onClick={() => handleGenerate(false)}
            disabled={isGenerating || !project}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {hasLoadedCache ? 'Regenerating...' : 'Generating...'}
              </>
            ) : (
              <>
                {hasLoadedCache ? '🔄 Regenerate Prompts' : '✨ Generate Complete Development Prompts'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Color Scheme Selection - Hidden for better UX, shown only when regenerating */}
      {!hasLoadedCache && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">🎨 Choose Color Scheme</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(colorSchemes).map(([key, scheme]: [string, any]) => (
              <button
                key={key}
                onClick={() => setSelectedColorScheme(key)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedColorScheme === key
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div 
                  className="w-full h-3 rounded mb-2"
                  style={{ background: `linear-gradient(to right, ${scheme.primary})` }}
                ></div>
                <div className="text-sm font-medium text-gray-900">{scheme.name}</div>
                <div className="text-xs text-gray-500">{scheme.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!generatedPrompt && !isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-blue-600 mb-2">🚀</div>
          <h4 className="font-semibold text-blue-900 mb-2">Generate Your Custom Development Prompts</h4>
          <p className="text-blue-700 text-sm mb-4">
            Choose your preferred color scheme above, then click "Generate Complete Development Prompts" to create tailored prompts for your <strong>{project?.title}</strong> project.
          </p>
          <p className="text-blue-600 text-xs">
            This AI will analyze your project features and create both a Lovable.dev prompt for the frontend and a Cursor AI prompt for the backend!
          </p>
        </div>
      )}
      
      {generatedPrompt && hasLoadedCache && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              ✨ Existing prompts loaded! 
              {project?.generatedPrompts?.colorScheme && (
                <span>Generated with {project.generatedPrompts.colorScheme.replace('-', ' ')} color scheme</span>
              )}
              {project?.generatedPrompts?.generatedAt && (
                <span className="text-green-600 ml-1">
                  on {new Date(project.generatedPrompts.generatedAt).toLocaleDateString()}
                </span>
              )}
              {!project?.generatedPrompts?.generatedAt && project?.createdAt && (
                <span className="text-green-600 ml-1">
                  Ready to use from your project
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {generatedPrompt && (
        <>
          <div className="space-y-4">
            {/* Split prompts into sections */}
            {(() => {
              const lovableSection = generatedPrompt.split('---')[0]?.trim() || '';
              const cursorSection = generatedPrompt.split('---')[1]?.trim() || '';
              
              return (
                <>
                  {/* Lovable Prompt Section */}
                  {lovableSection && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-blue-50 px-4 py-2 border-b flex items-center justify-between">
                        <h4 className="font-semibold text-blue-900 flex items-center">
                          🎨 Lovable.dev Prompt (Frontend)
                        </h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(lovableSection)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => window.open('https://lovable.dev', '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Open Lovable
                          </Button>
                        </div>
                      </div>
                      <div className="bg-gray-900 p-4 max-w-full">
                        <div className="max-h-[400px] overflow-y-auto">
                          <pre className="text-green-400 text-sm whitespace-pre-wrap break-words">
                            <code>{lovableSection}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cursor Prompt Section */}
                  {cursorSection && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-orange-50 px-4 py-2 border-b flex items-center justify-between">
                        <h4 className="font-semibold text-orange-900 flex items-center">
                          ⚡ Cursor AI Prompt (Backend)
                        </h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(cursorSection)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => window.open('https://cursor.sh', '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Open Cursor
                          </Button>
                        </div>
                      </div>
                      <div className="bg-gray-900 p-4 max-w-full">
                        <div className="max-h-[400px] overflow-y-auto">
                          <pre className="text-green-400 text-sm whitespace-pre-wrap break-words">
                            <code>{cursorSection}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => copyToClipboard(generatedPrompt)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Both Prompts
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleGenerate(true)}
              disabled={isGenerating}
            >
              ✨ Regenerate
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const Workspace = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("instructions");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [selectedColorScheme, setSelectedColorScheme] = useState("blue-purple");
  const [showAI, setShowAI] = useState(false);

  // Color scheme options
  const colorSchemes = {
    "blue-purple": {
      name: "Blue Purple (Professional)",
      primary: "#2563eb to #6366f1",
      description: "Professional and trustworthy"
    },
    "green-teal": {
      name: "Green Teal (Growth)",
      primary: "#059669 to #0d9488", 
      description: "Fresh and growth-oriented"
    },
    "orange-red": {
      name: "Orange Red (Energetic)",
      primary: "#ea580c to #dc2626",
      description: "Bold and energetic"
    },
    "purple-pink": {
      name: "Purple Pink (Creative)",
      primary: "#9333ea to #ec4899",
      description: "Creative and modern"
    },
    "gray-slate": {
      name: "Gray Slate (Minimal)",
      primary: "#475569 to #334155",
      description: "Clean and minimal"
    }
  };

  // AI-powered Lovable prompt generator
  const generateLovablePrompt = async (project: Project, colorScheme: string = "blue-purple"): Promise<string> => {
    const systemPrompt = `You are an expert at creating BOTH Lovable.dev and Cursor AI prompts for complete app development. Create a two-part development plan that perfectly hands off from frontend to backend.

CRITICAL REQUIREMENTS:
1. NEVER change the project title - use it EXACTLY as provided
2. Generate TWO distinct prompts with clear visual separation
3. Lovable prompt: Pure frontend/UI focus with mock data
4. Cursor prompt: Backend development assuming Lovable frontend exists
5. Cursor prompt must reference specific components from Lovable prompt
6. Keep both sections complete - don't cut off mid-sentence

Return the complete two-prompt development plan with clear sections.

# 🚀 **LOVABLE PROMPT - "[EXACT PROJECT TITLE]"**

Create **"[EXACT PROJECT TITLE]"** - a modern, beautiful [difficulty]-friendly app with professional UI/UX design.

## **🎯 APP OVERVIEW:**
[Project description - same as provided]

## **✨ CORE FEATURES TO IMPLEMENT:**

### **MAIN INTERFACE:**

**1. [Feature 1 Name]:**
- **UI Elements:** [Specific buttons, inputs, cards, etc.]
- **User Interactions:** [Click, hover, scroll actions]
- **Visual Feedback:** [Loading states, animations, success messages]
- **Sample Data:** [What mock data to display]

**2. [Feature 2 Name]:**
- **UI Elements:** [Specific buttons, inputs, cards, etc.]
- **User Interactions:** [Click, hover, scroll actions]
- **Visual Feedback:** [Loading states, animations, success messages]
- **Sample Data:** [What mock data to display]

[Continue for ALL features provided...]

### **USER EXPERIENCE:**
- Landing page with hero section and feature overview
- Smooth navigation between screens
- Loading states with skeleton screens
- Success/error toast notifications
- Mobile-responsive design
- Accessible design (WCAG compliant)

### **DESIGN SYSTEM:**
- **Color Palette:** Modern gradient theme (primary: [SELECTED_COLORS])
- **Typography:** Clean, readable font hierarchy (Inter or similar)
- **Components:** Consistent button styles, form inputs, cards using shadcn/ui
- **Layout:** Responsive grid system with proper spacing
- **Icons:** Lucide React icons for consistency

## **📱 SPECIFIC SCREENS TO BUILD:**

### **Screen 1: Landing/Home Page**
- Hero section with app title and value proposition
- Feature overview cards with icons
- Call-to-action button to main functionality
- Sample statistics or testimonials

### **Screen 2: [Main Feature Screen]**
- [Primary functionality UI based on first feature]
- [Input forms, display areas, action buttons]
- [Navigation and breadcrumbs]
- [Results/output display area]

### **Screen 3: [Secondary Feature Screen]**
- [Secondary functionality UI based on second feature]
- [Data visualization or management interface]
- [Filter/sort/search capabilities]
- [Export or sharing options]

### **Screen 4: [Results/Dashboard Screen]**
- [Results display with charts or tables]
- [Summary statistics and insights]
- [Action buttons for next steps]
- [History or saved items view]

## **🎨 DESIGN REQUIREMENTS:**

### **Visual Style:**
- **Modern & Clean:** Plenty of white space, minimal clutter
- **Professional:** Business-ready appearance with polished details
- **Engaging:** Subtle animations and interactive elements
- **Consistent:** Unified design language throughout

### **Technical Specifications:**
- **Framework:** React with TypeScript
- **Styling:** Tailwind CSS with custom components
- **Components:** shadcn/ui for consistent, accessible components
- **Responsive:** Mobile-first design approach
- **Performance:** Optimized images and fast loading
- **SEO:** Proper meta tags and semantic HTML

### **Interactive Elements:**
- Smooth hover effects and transitions
- Form validation with clear error messages
- Loading spinners and progress indicators
- Toast notifications for user actions
- Modal dialogs for confirmations
- Tooltips for helpful guidance

## **🚀 PROJECT-SPECIFIC FEATURES:**
- [List 3-4 unique features specific to this project type]
- Use mock/sample data for demonstrations
- Focus on user experience and visual design
- Make it portfolio-ready and impressive

## **📊 SUCCESS METRICS:**
- [Project name] looks and feels professional
- All [feature list] are visually implemented with mock data
- Responsive design works on all devices
- Ready to impress users and potential employers
- Clean, modern design that showcases your skills

**Build a stunning frontend that demonstrates the full potential of [project name]!**

---

# ⚡ **CURSOR AI PROMPT - "[EXACT PROJECT TITLE]" BACKEND**

I have a complete [EXACT PROJECT TITLE] frontend built with React/TypeScript using Lovable. Now I need you to implement the full backend functionality to make this a production-ready app.

## **🎯 CURRENT FRONTEND STRUCTURE:**
Based on the Lovable prompt above, the frontend now includes:
- [List key components from Lovable prompt]
- [Authentication forms and user interface]
- [Main feature interfaces and workflows]
- [Dashboard and navigation components]

## **🔧 BACKEND IMPLEMENTATION NEEDED:**

### **FIREBASE SETUP & CONFIGURATION:**
- Initialize Firebase project with Authentication, Firestore, and Hosting
- Configure authentication providers (email/password + Google OAuth)
- Set up Firestore security rules for user data protection
- Create database schema specifically for [project name] features
- Implement Firebase Functions for server-side logic

### **AUTHENTICATION SYSTEM:**
- Connect frontend auth forms to Firebase Authentication
- User registration/login with profile creation
- Session management and protected routes
- Password reset and email verification flows
- User preference storage and retrieval

### **CORE FEATURE IMPLEMENTATION:**
[Generate specific backend requirements based on project features]
- [Feature 1]: Database models and API endpoints
- [Feature 2]: Real-time data synchronization
- [Feature 3]: Business logic and data processing
- Data validation and error handling

### **DATABASE ARCHITECTURE:**
Create Firestore collections for:
\`\`\`
users/ - User profiles and authentication data
[project_slug]/ - Main application data
user_preferences/ - Settings and customization
analytics/ - Usage tracking and insights
\`\`\`

### **INTEGRATION REQUIREMENTS:**
- Connect all frontend components to real data
- Implement loading states and error boundaries  
- Set up real-time listeners for live updates
- Add form validation and submission handling
- Create responsive data flows

### **DEPLOYMENT & PRODUCTION:**
- Set up Firebase Hosting for production deployment
- Configure environment variables and security
- Implement monitoring and error tracking
- Performance optimization and caching
- Backup and data recovery procedures

## **🎯 SUCCESS METRICS:**
- All frontend features working with real data
- User authentication and data persistence functional
- [Project-specific success criteria based on features]
- Production-ready and scalable architecture
- Professional error handling and user experience

**Transform the beautiful Lovable frontend into a fully functional, production-ready [project name] app!**

REMEMBER: Frontend is complete, focus on backend integration, real data, and production deployment.`;

    const userPrompt = `Generate BOTH Lovable and Cursor prompts for this project:

Title: ${project.title}
Description: ${project.description}
Features: ${project.features.join(', ')}
Tech Stack: ${project.techStack.join(', ')}
Difficulty: ${project.difficulty}

Make both prompts specific to the actual features and functionality. Ensure the Cursor prompt references what the Lovable prompt creates.`;

    try {
      const selectedColors = colorSchemes[colorScheme]?.primary || "#2563eb to #6366f1";
      const fullPrompt = `${systemPrompt.replace('[SELECTED_COLORS]', selectedColors)}\n\n${userPrompt}`;
      const response = await geminiService.generateLongFormPrompt(fullPrompt);
      
      return response;
    } catch (error) {
      console.error('Error generating Lovable prompt:', error);
      throw new Error('Failed to generate prompt. Please try again.');
    }
  };

  // Tutorial steps with dynamic content based on actual project
  const getTutorialSteps = (project: Project | null) => {
    if (!project) {
      return [{
        id: 1,
        title: "Create Your First Project",
        description: "Start your coding journey",
        completed: false,
        content: {
          instructions: `
🚀 **Welcome to CompanAI!**

Ready to build your first app? Head to the **Idea Workshop** to generate your personalized project with AI assistance.

**What happens next:**
1. **AI generates ideas** based on your interests and skill level
2. **Choose your favorite** and we'll create a complete development plan
3. **Get professional prompts** for Lovable, Cursor, and Firebase
4. **Build a real app** that you can show off to friends and family

**Click "Generate New Idea" in your dashboard to get started!**
          `,
          codeAndPrompts: "",
          resources: ["Idea Workshop", "Getting Started Guide"]
        }
      }];
    }

    const projectSlug = project.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    
    // Clean and validate features - remove asterisks, colons, and malformed text
    const cleanFeatures = project.features
      .map(feature => {
        // Clean up malformed features - comprehensive cleaning
        return feature
          // Remove all trailing punctuation combinations
          .replace(/[\.:\s]*$/, '')
          // Fix specific malformed patterns
          .replace(/^User [Aa]uthentication:\s*Allow students to create accounts and securely log in\.?:?/, 'User Authentication & Login')
          .replace(/^Profile [Cc]reation:\s*Enable students to create profiles.*/, 'Profile Creation & Setup')
          .replace(/^Course [Ss]election:\s*Let students select.*/, 'Course Selection')
          .replace(/^Matching [Aa]lgorithm:\s*Implement.*/, 'Smart Matching Algorithm')
          .replace(/^Study [Pp]artner [Ss]earch:\s*Display.*/, 'Study Partner Search')
          .replace(/^Connection [Rr]equest:\s*Allow.*/, 'Connection Requests')
          .replace(/^User authentication \(sign up, login\)\.?:?/, 'User Authentication & Login')
          .replace(/^Create a ['"]walk request['"] with time, origin, and destination\.?:?/, 'Walk Request Creation')
          .replace(/^Browse available walk requests on a map\.?:?/, 'Interactive Map View')
          .replace(/^Join an existing walk request\.?:?/, 'Join Walk Requests')
          .replace(/^Display user profile information\.?:?/, 'User Profile Management')
          .replace(/^Simple notification system for walk updates.*/, 'Notification System')
          .replace(/User registration and profile creation with location and walking preferences\.?:?/, 'Profile Setup & Preferences')
          .replace(/Display available walking buddies on a map with estimated walking routes\.?:?/, 'Buddy Map & Routes')
          .replace(/A simple walk request feature to send invitations to potential walking partners\.?:?/, 'Walk Invitation System')
          .replace(/Accept and Decline Feature: User can choose to accept or decline an offer\.?:?/, 'Accept/Decline Requests')
          // General cleanup for any remaining malformed patterns
          .replace(/^([^:]+):\s*([^.]+)\.?\s*:?\s*$/, (match, title, description) => {
            // Convert "Title: Long description." to just "Title"
            return title.trim();
          })
          .trim();
      })
      .filter(feature => feature && feature.trim() && feature !== '*' && feature.length > 2)
      .slice(0, 6);
    
    // Fallback features if we don't have enough clean ones
    const fallbackFeatures = [
      'User Registration & Authentication',
      'Profile Setup & Preferences', 
      'Interactive Map Integration',
      'Real-time Matching System',
      'In-App Communication',
      'Safety & Security Features'
    ];
    
    // Combine clean features with fallbacks as needed
    const features = cleanFeatures.length >= 3 ? cleanFeatures : 
      [...cleanFeatures, ...fallbackFeatures].slice(0, 6);
    
    const techStack = project.techStack.join(", ");

    // Dynamic screen content generator based on actual features
    const generateScreenContent = (featureName: string, projectTitle: string) => {
      const lowerFeature = featureName.toLowerCase();
      
      if (lowerFeature.includes('authentication') || lowerFeature.includes('login')) {
        return `- Registration and login forms for ${projectTitle}\n- User account management and security\n- Password reset and verification flows\n- Session management and logout functionality`;
      } else if (lowerFeature.includes('profile') || lowerFeature.includes('setup')) {
        return `- User profile creation and editing\n- Personal information and preferences\n- Settings and configuration options\n- Profile validation and data management`;
      } else if (lowerFeature.includes('text input') || lowerFeature.includes('input') || lowerFeature.includes('paste')) {
        return `- Large text area for pasting job descriptions\n- Input validation and character limits\n- Clear/reset functionality for easy editing\n- Auto-resize text area based on content`;
      } else if (lowerFeature.includes('keyword extraction') || lowerFeature.includes('extraction') || lowerFeature.includes('ai technique')) {
        return `- AI-powered keyword identification algorithm\n- Processing indicators and loading states\n- Skill categorization (technical, soft skills, etc.)\n- Relevance scoring for each keyword`;
      } else if (lowerFeature.includes('frequency analysis') || lowerFeature.includes('frequency') || lowerFeature.includes('analysis')) {
        return `- Interactive frequency table with sorting\n- Visual charts showing keyword distribution\n- Importance ranking based on frequency\n- Filter options for different keyword types`;
      } else if (lowerFeature.includes('highlight') || lowerFeature.includes('highlighting')) {
        return `- Visual highlighting of keywords in original text\n- Color-coded highlighting by importance\n- Toggle highlight on/off functionality\n- Hover effects showing keyword details`;
      } else if (lowerFeature.includes('download') || lowerFeature.includes('export')) {
        return `- Export keywords to various formats (TXT, CSV, PDF)\n- Customizable export templates\n- Include frequency data in exports\n- Quick copy-to-clipboard functionality`;
      } else if (lowerFeature.includes('map') || lowerFeature.includes('location')) {
        return `- Interactive map display and controls\n- Location search and selection\n- Route planning and navigation\n- Location-based filtering and discovery`;
      } else if (lowerFeature.includes('search') || lowerFeature.includes('filter')) {
        return `- Search interface with query input\n- Advanced filtering and sorting options\n- Search results display and pagination\n- Saved searches and search history`;
      } else if (lowerFeature.includes('request') || lowerFeature.includes('invitation')) {
        return `- Send and manage requests or invitations\n- Request status tracking and notifications\n- Accept/decline interface and workflows\n- Request history and activity log`;
      } else if (lowerFeature.includes('chat') || lowerFeature.includes('message')) {
        return `- Real-time chat and messaging interface\n- Conversation threads and message history\n- File sharing and media attachments\n- Message notifications and status indicators`;
      } else if (lowerFeature.includes('dashboard') || lowerFeature.includes('overview')) {
        return `- Main dashboard with key metrics and data\n- Quick access to primary functions\n- Status updates and activity feed\n- Customizable dashboard widgets and layout`;
      } else {
        // Extract specific functionality from feature description
        const featureDesc = featureName.split(':')[1] || featureName;
        return `- ${featureDesc.trim()}\n- Modern, responsive interface design\n- Error handling and user feedback\n- Integration with ${projectTitle} workflow`;
      }
    };

    // Generate screen content for each feature
    const screen2Content = features[0] ? generateScreenContent(features[0], project.title) : '- Core feature implementation with user interface';
    const screen3Content = features[1] ? generateScreenContent(features[1], project.title) : '- Secondary feature with data management';  
    const screen4Content = features[2] ? generateScreenContent(features[2], project.title) : '- Supporting functionality and user experience';

    return [
      {
        id: 1,
        title: "🎨 UI Design & Frontend",
        description: "Create beautiful UI with Lovable",
        completed: project.progress.completedSteps.includes(1),
        content: {
          instructions: `
# 🎨 **Step 1: Build Your Frontend with Lovable**

**Goal:** Create a stunning, responsive UI for **${project.title}** using AI-powered design.

## **📋 Simple Instructions:**

### **1. Generate Your Prompts**
→ Go to the **"Code & Prompts"** tab above
→ Click **"Generate Complete Development Prompts"**
→ Wait 30-60 seconds for AI to create your custom prompts

### **2. Copy Your Lovable Prompt**  
→ Copy the **Lovable.dev Prompt** (the first section)
→ This prompt is specifically designed for your **${project.title}** project

### **3. Build in Lovable**
→ Visit **lovable.dev** in a new tab
→ Create a new project
→ Paste your prompt and click "Generate"
→ Wait 3-5 minutes for your app to be built

### **4. Customize & Download**
→ Customize colors and styling as desired
→ Test on mobile/desktop preview
→ Download your code as a ZIP file

## **✅ You'll Know You're Done When:**
- Your app UI looks amazing and works on mobile
- You've downloaded the code ZIP file
- You're ready to set up GitHub in Step 2

**Start by clicking the "Code & Prompts" tab above!**
          `,
          codeAndPrompts: "DYNAMIC_AI_PROMPT",
          resources: [
            "Lovable.dev Platform",
            "Tailwind CSS Documentation", 
            "shadcn/ui Components",
            "React TypeScript Guide",
            "Mobile-First Design Principles"
          ]
        }
      },
      {
        id: 2,
        title: "📁 GitHub Setup & Code Management",
        description: "Connect to GitHub and clone locally",
        completed: project.progress.completedSteps.includes(2),
        content: {
          instructions: `
# 📁 **Step 2: GitHub Integration & Local Setup**

**Goal:** Connect your Lovable app to GitHub and prepare for Cursor development.

## **🚀 Simple Workflow:**

### **A. Connect GitHub in Lovable:**
1. **In your Lovable project**, look for the GitHub integration button
2. **Click "Connect to GitHub"** (usually in top toolbar or project settings)
3. **Authorize Lovable** to access your GitHub account
4. **Choose repository name:** \`${projectSlug}\` (or similar)
5. **Select "Public"** for portfolio showcase
6. **Let Lovable create the repository** automatically ✨

### **B. Get Your Repository URL:**
1. **Lovable will show you the GitHub URL** after connection
2. **Copy the HTTPS clone URL** (looks like: \`https://github.com/username/${projectSlug}.git\`)
3. **Save this URL** - you'll need it for Cursor

### **C. Clone to Your Computer:**
1. **Open Terminal/Command Prompt** on your computer
2. **Navigate to your projects folder:**
   \`\`\`bash
   cd ~/Documents/Projects  # or wherever you keep projects
   \`\`\`
3. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/YOUR-USERNAME/${projectSlug}.git
   cd ${projectSlug}
   \`\`\`

### **D. Verify Setup:**
1. **Open the folder** in your file explorer
2. **Check that all files are there** (components, pages, etc.)
3. **Repository is ready** for Cursor development!

## **✅ You'll Know You're Done When:**
- ✅ Lovable is connected to GitHub
- ✅ Repository appears in your GitHub account
- ✅ Code is cloned to your local computer
- ✅ You have the folder path ready for Cursor

**Next:** Open this folder in Cursor for Step 3!
          `,
          codeAndPrompts: `
# 🔗 **LOVABLE → GITHUB INTEGRATION**

## **Quick Setup Checklist:**
- ✅ Connect GitHub from Lovable interface
- ✅ Repository auto-created as: \`${projectSlug}\`
- ✅ Set to Public for portfolio showcase
- ✅ Copy the clone URL from Lovable/GitHub

## **Clone Commands:**
\`\`\`bash
# Navigate to your projects folder
cd ~/Documents/Projects

# Clone your repository (replace with your actual URL)
git clone https://github.com/YOUR-USERNAME/${projectSlug}.git

# Enter the project directory
cd ${projectSlug}

# Verify files are there
ls -la
\`\`\`

## **Expected Project Structure:**
\`\`\`
${projectSlug}/
├── src/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── main.tsx
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
\`\`\`

## **Next Steps:**
1. ✅ Folder is ready on your computer
2. ✅ Open this folder in Cursor
3. ✅ Ready for backend development!

## **Troubleshooting:**
- **Can't find GitHub button?** Look in project settings or top toolbar
- **Permission issues?** Make sure you're logged into GitHub in your browser
- **Clone failed?** Check the URL and your internet connection
          `,
          resources: [
            "Lovable GitHub Integration",
            "Git Clone Command Guide",
            "Terminal/Command Prompt Basics",
            "File System Navigation",
            "Cursor Installation Guide"
          ]
        }
      },
      {
        id: 3,
        title: "⚡ Cursor AI Development",
        description: "Add powerful backend functionality",
        completed: project.progress.completedSteps.includes(3),
        content: {
          instructions: `
# ⚡ **Step 3: Supercharge with Cursor AI**

**Goal:** Transform your static UI into a fully functional app with backend integration.

## **🛤️ Cursor Workflow:**

### **A. Setup Cursor:**
1. **Open Cursor AI** (download from cursor.com if needed)
2. **Open your project folder:** File → Open Folder
3. **Navigate to your cloned repository:** \`~/Documents/Projects/${projectSlug}\`
4. **Cursor will recognize** it as a React TypeScript project

### **B. AI-Powered Development:**
1. **Open Cursor Chat** (Ctrl/Cmd + L)
2. **Paste the Ultimate Cursor Prompt** (from Code & Prompts tab)
3. **Let AI analyze** your Lovable frontend code
4. **Follow AI suggestions** for backend integration
5. **Test each feature** as it's implemented

### **C. Implementation Order:**
1. **Firebase Setup** - Authentication & database
2. **Data Models** - User accounts and app data
3. **API Integration** - Connect frontend to backend
4. **Real-time Features** - Live updates and sync
5. **Authentication** - User login and security
6. **Deployment** - Make it live on the internet

## **🎯 What Cursor Will Add:**
- **Firebase Integration** - Real database storage
- **User Authentication** - Login/signup functionality  
- **Data Persistence** - Save user information
- **Real-time Updates** - Live synchronization
- **API Connections** - External service integration
- **Error Handling** - Professional error management
- **Performance** - Fast, optimized code

**Ready to make it functional?** Copy the Cursor prompt and let's build!
          `,
          codeAndPrompts: `
# 🚀 **ULTIMATE CURSOR PROMPT - ${project.title.toUpperCase()}**

I have a complete **${project.title}** frontend built with React/TypeScript from Lovable. Now I need you to implement full backend functionality to make this a production-ready application.

## **🎯 PROJECT OVERVIEW:**
${project.description}

**Tech Stack:** ${techStack}
**Difficulty:** ${project.difficulty}
**Target Users:** ${project.difficulty === 'Beginner' ? 'New developers and general users' : project.difficulty === 'Intermediate' ? 'Users with some technical experience' : 'Power users and developers'}

## **🔥 CORE FEATURES TO IMPLEMENT:**

### **PRIMARY FUNCTIONALITY:**
${features.slice(0, 3).map((feature, i) => `
**${i + 1}. ${feature}:**
- Complete CRUD operations (Create, Read, Update, Delete)
- Real-time data synchronization with Firestore
- User-specific data access and privacy controls
- Input validation and error handling
- Responsive state management`).join('\n')}

### **SECONDARY FEATURES:**
${features.slice(3, 6).map((feature, i) => `
**${i + 4}. ${feature}:**
- Advanced functionality with Firebase integration
- Performance optimization for scalability
- User experience enhancements`).join('\n')}

## **🏗️ BACKEND IMPLEMENTATION NEEDED:**

### **FIREBASE SETUP & CONFIGURATION:**
- Initialize Firebase project with Authentication, Firestore, and Hosting
- Configure authentication providers (email/password + Google OAuth)
- Set up Firestore security rules for user data protection
- Create comprehensive database schema for all app data
- Implement Firebase Functions for server-side logic

### **DATABASE ARCHITECTURE FOR ${project.title.toUpperCase()}:**
Create Firestore collections specifically for your app:
\`\`\`
users/
├── {userId}/
    ├── profile: { name, email, preferences, createdAt }
    ├── settings: { notifications, privacy, theme }
    └── ${projectSlug}_data: { user-specific app data }

${projectSlug}/
├── {itemId}/
    ├── ownerId: string (user who created this item)
    ├── ${features[0] ? features[0].toLowerCase().replace(/[^a-z0-9]/g, '_') : 'main_data'}: { /* ${features[0] || 'Main feature'} data */ }
    ${features[1] ? `├── ${features[1].toLowerCase().replace(/[^a-z0-9]/g, '_')}: { /* ${features[1]} data */ }` : ''}
    ${features[2] ? `├── ${features[2].toLowerCase().replace(/[^a-z0-9]/g, '_')}: { /* ${features[2]} data */ }` : ''}
    ├── metadata: { createdAt, updatedAt, status }
    └── permissions: { isPublic: boolean, sharedWith: [] }

${projectSlug}_settings/
├── app_config: { theme, preferences, feature_flags }
└── user_preferences: { per-user customizations }
\`\`\`

### **AUTHENTICATION SYSTEM:**
- Complete user registration/login with profile creation
- Google OAuth integration for seamless signup
- Password reset and email verification
- User session management and persistence
- Role-based access control (if needed)

### **REAL-TIME FEATURES:**
- Live data synchronization across devices
- Real-time collaboration (if applicable)
- Push notifications for important updates
- Optimistic UI updates for better UX
- Offline support with data sync

### **PROJECT-SPECIFIC INTEGRATIONS:**
${project.features.some(f => f.toLowerCase().includes('ai') || f.toLowerCase().includes('smart') || f.toLowerCase().includes('recommendation')) ? `
- **AI Features:** Implement intelligent functionality for ${project.features.filter(f => f.toLowerCase().includes('ai') || f.toLowerCase().includes('smart') || f.toLowerCase().includes('recommendation')).join(', ')}
- Connect to appropriate AI services for your specific features` : ''}
${project.features.some(f => f.toLowerCase().includes('payment') || f.toLowerCase().includes('purchase') || f.toLowerCase().includes('subscription') || f.toLowerCase().includes('billing')) ? `
- **Payment Features:** Implement secure payment processing for ${project.features.filter(f => f.toLowerCase().includes('payment') || f.toLowerCase().includes('purchase') || f.toLowerCase().includes('subscription') || f.toLowerCase().includes('billing')).join(', ')}
- Set up payment gateway integration` : ''}
${project.features.some(f => f.toLowerCase().includes('map') || f.toLowerCase().includes('location') || f.toLowerCase().includes('geo')) ? `
- **Location Services:** Implement mapping and location features for ${project.features.filter(f => f.toLowerCase().includes('map') || f.toLowerCase().includes('location') || f.toLowerCase().includes('geo')).join(', ')}
- Integrate Google Maps or similar location APIs` : ''}
- **Core Data Management:** Focus on ${project.features.slice(0, 3).join(', ')} functionality
- **Input Validation:** Ensure data integrity for your specific features

### **PERFORMANCE & SCALABILITY:**
- Database query optimization with proper indexing
- Caching strategies for frequently accessed data
- Image optimization and lazy loading
- Code splitting and bundle optimization
- Error tracking and performance monitoring

### **SECURITY IMPLEMENTATION:**
- Comprehensive Firestore security rules
- Input sanitization and XSS protection
- Rate limiting for API endpoints
- Data encryption for sensitive information
- GDPR compliance and privacy controls

## **🎨 FRONTEND INTEGRATION:**

### **CONNECT EXISTING UI TO BACKEND:**
- Hook up all forms to actual data persistence
- Implement authentication context throughout app
- Add loading states and error boundaries
- Create real-time data subscriptions
- Implement optimistic UI updates

### **ENHANCED USER EXPERIENCE:**
- Toast notifications for user actions
- Progressive loading with skeleton screens
- Smooth animations for state transitions
- Error recovery and retry mechanisms
- Accessibility improvements

## **🚀 DEPLOYMENT & HOSTING:**

### **PRODUCTION SETUP:**
- Firebase Hosting configuration
- Environment variables for API keys
- Custom domain setup (optional)
- SSL certificate configuration
- Performance monitoring setup

### **TESTING & QUALITY:**
- Unit tests for critical functions
- Integration tests for user flows
- Performance testing and optimization
- Cross-browser compatibility
- Mobile responsiveness verification

## **📊 SUCCESS METRICS:**
- All features working with real data persistence
- User authentication and authorization functional
- Real-time updates working smoothly
- App performs well under normal usage
- Professional error handling and edge cases covered
- Ready for real users and production traffic

## **🔧 IMPLEMENTATION PRIORITY:**
1. **Firebase Setup** (Authentication + Firestore)
2. **User Management** (Login/Signup/Profiles)
3. **Core Features** (Primary functionality)
4. **Data Persistence** (Save/Load user data)
5. **Real-time Updates** (Live synchronization)
6. **Polish & Performance** (Error handling, optimization)

**Make this app production-ready and impressive enough to showcase in a portfolio!**

## **💡 PROJECT-SPECIFIC REQUIREMENTS:**
- Add TypeScript types for ${project.features.slice(0, 3).join(', ')} data structures
- Implement error handling specifically for ${project.features[0] || 'main functionality'} operations
- Create loading states for ${project.features.join(', ')} interactions
- Focus on making ${project.title} responsive and user-friendly
- Optimize for the specific use case: ${project.description}

**Goal:** Transform this into a fully working ${project.title} that users can actually use for ${project.description}!
          `,
          resources: [
            "Cursor AI Documentation",
            "Firebase Integration Guide",
            "TypeScript Best Practices",
            "React Performance Tips",
            "Production Deployment Checklist"
          ]
        }
      },
      {
        id: 4,
        title: "🌍 Deploy & Share",
        description: "Launch your app to the world",
        completed: project.progress.completedSteps.includes(4),
        content: {
          instructions: `
# 🌍 **Step 4: Launch Your App to the World**

**Goal:** Deploy your fully functional app and share it with friends, family, and potential employers.

## **🚀 Deployment Process:**

### **A. Firebase Hosting Setup:**
1. **Install Firebase CLI:** \`npm install -g firebase-tools\`
2. **Login to Firebase:** \`firebase login\`
3. **Initialize hosting:** \`firebase init hosting\`
4. **Build your app:** \`npm run build\`
5. **Deploy to Firebase:** \`firebase deploy\`

### **B. Custom Domain (Optional):**
1. **Purchase domain** (Namecheap, GoDaddy, etc.)
2. **Add custom domain** in Firebase Console
3. **Update DNS settings** with your registrar
4. **SSL certificate** automatically provided

### **C. Performance Optimization:**
1. **Run Lighthouse audit** in Chrome DevTools
2. **Optimize images** and assets
3. **Enable caching** for static resources
4. **Compress JavaScript** bundles

## **📱 Sharing Your Success:**

### **Portfolio Addition:**
- **Add to GitHub** portfolio section
- **Include live demo** link
- **Write project description** highlighting features
- **Add screenshots** and demo video

### **Social Sharing:**
- **LinkedIn post** about your learning journey
- **Twitter thread** showing before/after
- **Show friends and family** your working app
- **Add to resume** as a project accomplishment

## **🎉 Celebration Time:**
You've just built and deployed a **real, working application**! This is a huge milestone in your coding journey.

**What's Next?**
- Build another project with more advanced features
- Apply for developer positions with your portfolio
- Start freelancing with your new skills
- Teach others what you've learned

**Congratulations, developer!** 🎊
          `,
          codeAndPrompts: `
# 🚀 **DEPLOYMENT COMMANDS**

## **Firebase Hosting Setup:**
\`\`\`bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to your Firebase account
firebase login

# Initialize Firebase in your project
firebase init hosting
# Select: Use existing project
# Choose: ${projectSlug} (or your Firebase project)
# Public directory: dist (or build)
# Single-page app: Yes
# Overwrite index.html: No

# Build your production app
npm run build

# Deploy to Firebase Hosting
firebase deploy

# Your app will be live at:
# https://${projectSlug}.web.app
\`\`\`

## **Performance Check:**
\`\`\`bash
# Run production build locally to test
npm run preview

# Check bundle size
npm run build -- --analyze

# Test lighthouse score
# Open Chrome DevTools → Lighthouse → Generate Report
\`\`\`

## **Custom Domain Setup:**
\`\`\`bash
# Add custom domain in Firebase Console
# Go to Hosting → Add custom domain
# Follow DNS configuration instructions

# Verify domain ownership
# Add TXT record to your DNS
# Add A/CNAME records as instructed
\`\`\`

## **Project Description Template:**
\`\`\`markdown
# 🚀 ${project.title}

**Live Demo:** https://${projectSlug}.web.app
**GitHub:** https://github.com/YOUR-USERNAME/${projectSlug}

## Overview
${project.description}

## ✨ Features
${features.map(feature => `- ${feature}`).join('\n')}

## 🛠️ Built With
${project.techStack.map(tech => `- ${tech}`).join('\n')}

## 🏗️ Development Journey
1. **UI Design:** Lovable.dev for beautiful frontend
2. **Backend Logic:** Cursor AI for full functionality
3. **Database:** Firebase Firestore for real-time data
4. **Authentication:** Firebase Auth for secure login
5. **Hosting:** Firebase Hosting for global deployment

## 📈 What I Learned
- Modern React development with TypeScript
- Firebase integration and real-time databases
- AI-assisted development workflows
- Production deployment and optimization
- User experience design principles

## 🎯 Results
- Fully functional web application
- Real user authentication and data persistence
- Professional-grade UI/UX design
- Scalable architecture ready for growth
- Portfolio-worthy project showcase
\`\`\`

## **Social Media Posts:**

### **LinkedIn:**
🚀 Excited to share my latest project: ${project.title}!

Built using modern web technologies and AI-assisted development:
${features.slice(0, 3).map(f => `✅ ${f}`).join('\n')}

Tech stack: ${techStack}

This project taught me the power of combining AI tools (Lovable, Cursor) with traditional development practices. The future of coding is here!

Live demo: https://${projectSlug}.web.app
Code: https://github.com/YOUR-USERNAME/${projectSlug}

#WebDevelopment #AI #React #Firebase #CompanAI

### **Twitter:**
Just deployed my ${project.title}! 🚀

Built with:
🎨 @lovable_dev for UI
⚡ @cursor_ai for backend
🔥 @firebase for hosting

From idea to production in record time thanks to AI-assisted development.

Live: https://${projectSlug}.web.app

#BuildInPublic #AIForDevelopers #WebDev
\`\`\`
          `,
          resources: [
            "Firebase Hosting Guide",
            "Custom Domain Setup",
            "Performance Optimization",
            "Portfolio Best Practices",
            "Developer Resume Tips"
          ]
        }
      }
    ];
  };

  const tutorialSteps = getTutorialSteps(currentProject);
  const currentStep = currentProject?.progress.currentStep || 0;
  const currentStepData = tutorialSteps[currentStep] || tutorialSteps[0];

  useEffect(() => {
    const fetchUserProjects = async () => {
      if (!user) return;
      
      try {
        const projects = await getUserProjects(user.id);
        setAllProjects(projects);
        
        // Get the most recent project that's not completed
        const activeProject = projects.find(p => p.status !== 'completed') || projects[0];
        setCurrentProject(activeProject || null);
        
        // If no projects exist, we're not really loading anymore
        if (projects.length === 0) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProjects();
  }, [user]);

  const handleCompleteStep = async (stepId: number) => {
    if (!currentProject || !user) return;

    try {
      const updatedCompletedSteps = [...currentProject.progress.completedSteps];
      if (!updatedCompletedSteps.includes(stepId)) {
        updatedCompletedSteps.push(stepId);
      }

      const newCurrentStep = Math.min(stepId, tutorialSteps.length - 1);
      
      await updateProject(currentProject.id, {
        progress: {
          ...currentProject.progress,
          currentStep: newCurrentStep,
          completedSteps: updatedCompletedSteps,
          lastWorkedOn: new Date().toISOString()
        },
        status: updatedCompletedSteps.length === tutorialSteps.length ? 'completed' : currentProject.status
      });

      // Update local state
      setCurrentProject({
        ...currentProject,
        progress: {
          ...currentProject.progress,
          currentStep: newCurrentStep,
          completedSteps: updatedCompletedSteps,
          lastWorkedOn: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
      description: "You can now paste this in your editor.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Show project creation prompt if no projects exist
  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-6 py-4">
            <Link to="/dashboard" className="flex items-center text-purple-600 hover:text-purple-700 mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Workspace</h1>
                <p className="text-gray-600">Ready to build your first project?</p>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlayCircle className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Let's Create Your First Project!
            </h2>
            
            <p className="text-xl text-gray-600 mb-8">
              You haven't created any projects yet. Start by generating some ideas or create a custom project to begin your development journey.
            </p>
            
            <div className="space-y-4">
              <Link to="/idea-workshop">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-6"
                >
                  🚀 Generate Project Ideas
                </Button>
              </Link>
              
              <div className="text-gray-500">or</div>
              
              <Link to="/dashboard">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full md:w-auto border-purple-200 text-purple-700 hover:bg-purple-50 px-8 py-6"
                >
                  <Book className="w-5 h-5 mr-2" />
                  Explore Learning Resources
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Quick Start Tips:</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Start with the AI Idea Workshop to get personalized project suggestions</li>
                <li>• Check out our Learning Resources to understand the development tools</li>
                <li>• Each project comes with step-by-step guidance and AI assistance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <Link to="/dashboard" className="flex items-center text-purple-600 hover:text-purple-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <Code className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {currentProject?.title || "Loading..."}
                </h1>
                <Badge className="bg-blue-100 text-blue-700 px-3 py-1 text-sm font-medium">
                  Step {currentStep + 1} of {tutorialSteps.length}
                </Badge>
              </div>
              
              <p className="text-gray-600 leading-relaxed text-sm max-w-2xl">
                {currentProject?.description || "Loading..."}
              </p>
              
              {/* Progress indicator */}
              <div className="mt-3 flex items-center gap-3">
                <Progress 
                  value={currentProject ? Math.round((currentProject.progress.completedSteps.length / tutorialSteps.length) * 100) : 0} 
                  className="flex-1 h-2" 
                />
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                  {currentProject?.progress.completedSteps.length || 0} / {tutorialSteps.length} steps
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg border-0 sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Project Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tutorialSteps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        index === currentStep 
                          ? 'bg-purple-50 border border-purple-200 shadow-sm' 
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                      onClick={() => handleCompleteStep(step.id)}
                    >
                      {currentProject?.progress.completedSteps.includes(step.id) ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : index === currentStep ? (
                        <div className="w-5 h-5 rounded-full border-2 border-purple-600 bg-purple-100"></div>
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          index === currentStep ? 'text-purple-900' : 'text-gray-900'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {tutorialSteps.map((step, index) => (
              index === currentStep && (
                <Card key={step.id} className="shadow-xl border-0 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {step.id}
                          </div>
                          <CardTitle className="text-xl text-gray-900">{step.title}</CardTitle>
                        </div>
                        <p className="text-gray-600 text-sm ml-11">{step.description}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 bg-white">
                        {step.id === 1 ? "Setup" : step.id === 2 ? "Core" : step.id === 3 ? "Styling" : "Deployment"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <Tabs defaultValue="instructions" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="instructions">Instructions</TabsTrigger>
                        <TabsTrigger value="code">Code & Prompts</TabsTrigger>
                        <TabsTrigger value="resources">Resources</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="instructions" className="mt-6">
                        <div className="max-h-[600px] overflow-y-auto">
                          <WorkflowGuide
                            project={currentProject}
                            currentStep={currentStep}
                            totalSteps={tutorialSteps.length}
                            completedSteps={currentProject?.progress.completedSteps || []}
                          />
                        </div>
                        
                        <div className="flex gap-3 mt-6 pt-4 border-t">
                          <Button
                            onClick={() => handleCompleteStep(step.id)}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Complete
                          </Button>
                          <div className="text-sm text-gray-600 flex items-center">
                            💡 Click the AI assistant button (bottom-right) for personalized help with your {currentProject?.title} project
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="code" className="mt-6">
                        <div className="space-y-4">
                          {step.content.codeAndPrompts === "DYNAMIC_AI_PROMPT" ? (
                            <DynamicPromptSection 
                              project={currentProject} 
                              onGenerate={generateLovablePrompt}
                              isGenerating={generatingPrompt}
                              setIsGenerating={setGeneratingPrompt}
                              colorSchemes={colorSchemes}
                              selectedColorScheme={selectedColorScheme}
                              setSelectedColorScheme={setSelectedColorScheme}
                            />
                          ) : (
                            <>
                              <h3 className="text-lg font-semibold">Copy this prompt to your editor:</h3>
                              <div className="bg-gray-900 rounded-lg p-4 relative max-w-full">
                                <div className="max-h-[500px] overflow-y-auto">
                                  <pre className="text-green-400 text-sm whitespace-pre-wrap break-words">
                                    <code>{step.content.codeAndPrompts}</code>
                                  </pre>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                                  onClick={() => copyToClipboard(step.content.codeAndPrompts)}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="flex gap-2">
                                {step.id === 3 && (
                                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                                    <PlayCircle className="w-4 h-4 mr-2" />
                                    Open in Cursor
                                  </Button>
                                )}
                                {(step.id === 1 || step.id === 4) && (
                                  <Button variant="outline">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open in Lovable
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="resources" className="mt-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Helpful Resources:</h3>
                          <div className="grid gap-3">
                            {step.content.resources.map((resource, index) => {
                              // Define resource URLs
                              const resourceUrls: { [key: string]: string } = {
                                "Lovable.dev Platform": "https://lovable.dev",
                                "Tailwind CSS Documentation": "https://tailwindcss.com/docs",
                                "shadcn/ui Components": "https://ui.shadcn.com",
                                "React TypeScript Guide": "https://react-typescript-cheatsheet.netlify.app",
                                "Mobile-First Design Principles": "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Responsive/Mobile_first",
                                "Cursor AI Documentation": "https://docs.cursor.sh",
                                "Firebase Integration Guide": "https://firebase.google.com/docs/web/setup",
                                "TypeScript Best Practices": "https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html",
                                "React Performance Tips": "https://react.dev/learn/render-and-commit",
                                "Production Deployment Checklist": "https://create-react-app.dev/docs/deployment/",
                                "Firebase Hosting Guide": "https://firebase.google.com/docs/hosting",
                                "Custom Domain Setup": "https://firebase.google.com/docs/hosting/custom-domain",
                                "Performance Optimization": "https://web.dev/performance-scoring/",
                                "Portfolio Best Practices": "https://www.freecodecamp.org/news/15-web-developer-portfolios-to-inspire-you-137fb1743cae/",
                                "Developer Resume Tips": "https://www.freecodecamp.org/news/how-to-write-a-resume-that-works/"
                              };
                              
                              const url = resourceUrls[resource] || `https://www.google.com/search?q=${encodeURIComponent(resource)}`;
                              
                              return (
                              <Card key={index} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Book className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium">{resource}</span>
                                  </div>
                                    <a 
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex"
                                    >
                                      <Button size="sm" variant="ghost" className="hover:bg-blue-50">
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                    </a>
                                </CardContent>
                              </Card>
                              );
                            })}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Floating AI Assistant Button */}
      <Button
        onClick={() => setShowAI(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-2xl"
        title="AI Assistant - Get help with your project"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </Button>

      {/* AI Assistant */}
      {showAI && (
        <AIAssistant 
          onClose={() => setShowAI(false)} 
          currentProject={currentProject}
          allProjects={allProjects}
        />
      )}
    </div>
  );
};

export default Workspace;
