import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Circle,
  Copy, 
  ExternalLink,
  Github,
  Zap,
  Rocket,
  ArrowRight,
  Play,
  Clock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Project } from "@/lib/firestore";

interface WorkflowGuideProps {
  project: Project | null;
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
}

interface WorkflowState {
  hasPrompts: boolean;
  copiedLovablePrompt: boolean;
  visitedLovable: boolean;
  connectedGitHub: boolean;
  startedCursor: boolean;
}

const WorkflowGuide = ({ project, currentStep, totalSteps, completedSteps }: WorkflowGuideProps) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    hasPrompts: false,
    copiedLovablePrompt: false,
    visitedLovable: false,
    connectedGitHub: false,
    startedCursor: false
  });
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // Track workflow state based on current step and completion
  useEffect(() => {
    if (!project) return;
    
    setWorkflowState({
      hasPrompts: project.generatedPrompts?.lovablePrompt ? true : false,
      copiedLovablePrompt: localStorage.getItem(`copied-lovable-${project.id}`) === 'true',
      visitedLovable: localStorage.getItem(`visited-lovable-${project.id}`) === 'true',
      connectedGitHub: localStorage.getItem(`connected-github-${project.id}`) === 'true',
      startedCursor: localStorage.getItem(`started-cursor-${project.id}`) === 'true'
    });
  }, [project]);

  const handleCopyLovablePrompt = () => {
    if (!project?.generatedPrompts?.lovablePrompt) {
      toast({
        title: "⚠️ No Prompt Generated",
        description: "Please generate your prompts first using the Code & Prompts tab",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(project.generatedPrompts.lovablePrompt);
    setWorkflowState(prev => ({ ...prev, copiedLovablePrompt: true }));
    localStorage.setItem(`copied-lovable-${project.id}`, 'true');
    
    toast({
      title: "✅ Lovable Prompt Copied!",
      description: "Now paste it in Lovable.dev to build your frontend",
    });
  };

  const handleOpenLovable = () => {
    window.open('https://lovable.dev', '_blank');
    setWorkflowState(prev => ({ ...prev, visitedLovable: true }));
    localStorage.setItem(`visited-lovable-${project.id}`, 'true');
  };

  const handleOpenCursor = () => {
    window.open('https://cursor.sh', '_blank');
    setWorkflowState(prev => ({ ...prev, startedCursor: true }));
    localStorage.setItem(`started-cursor-${project.id}`, 'true');
  };

  const handleOpenGitHub = () => {
    window.open('https://github.com', '_blank');
    setWorkflowState(prev => ({ ...prev, connectedGitHub: true }));
    localStorage.setItem(`connected-github-${project.id}`, 'true');
  };

  const getInstructions = () => {
    const stepNames = [
      "Frontend Development",
      "GitHub Setup",
      "Backend Development", 
      "Deployment"
    ];

    const currentStepName = stepNames[currentStep] || "Getting Started";

    if (!workflowState.hasPrompts) {
      return {
        title: "🚀 Generate Your Development Prompts",
        message: "Start by going to the 'Code & Prompts' tab above and generating your custom Lovable and Cursor prompts. This creates the complete development plan for your project.",
        action: "Go to Code & Prompts Tab",
        priority: "high" as const,
        timeEstimate: "2 min"
      };
    }

    if (currentStep === 0 && !workflowState.copiedLovablePrompt) {
      return {
        title: "🎨 Copy Your Lovable Prompt",
        message: "Your prompts are ready! Copy your Lovable prompt and paste it at lovable.dev to create your beautiful frontend UI.",
        action: "Copy Lovable Prompt",
        priority: "high" as const,
        timeEstimate: "1 min"
      };
    }

    if (currentStep === 0 && !workflowState.visitedLovable) {
      return {
        title: "✨ Build Your Frontend",
        message: "Prompt copied! Now visit Lovable.dev, create a new project, and paste your prompt. Watch your app UI come to life in minutes.",
        action: "Open Lovable.dev",
        priority: "high" as const,
        timeEstimate: "5-10 min"
      };
    }

    if (currentStep === 1) {
      return {
        title: "📁 Set Up GitHub Repository",
        message: "Frontend looking good? Time to set up version control. Download your code from Lovable and create a GitHub repository to manage your project professionally.",
        action: "Open GitHub",
        priority: "medium" as const,
        timeEstimate: "5 min"
      };
    }

    if (currentStep === 2) {
      return {
        title: "⚡ Add Backend with Cursor",
        message: "Ready for the backend? Open Cursor, import your GitHub repository, and use your Cursor prompt to add database functionality and real features.",
        action: "Open Cursor",
        priority: "medium" as const,
        timeEstimate: "15-30 min"
      };
    }

    return {
      title: "🌍 Deploy Your App",
      message: `${project?.title} is almost ready! Deploy it to Firebase Hosting so the world can see your amazing creation.`,
      action: "View Deployment Guide",
      priority: "low" as const,
      timeEstimate: "10 min"
    };
  };

  const guidance = getInstructions();

     const getActionButton = () => {
     if (!workflowState.hasPrompts) {
       return null; // No action needed, just instruction
     }

     if (currentStep === 0 && !workflowState.copiedLovablePrompt) {
       return (
         <Button
           onClick={handleCopyLovablePrompt}
           className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
         >
           <Copy className="w-4 h-4 mr-2" />
           Copy Lovable Prompt
         </Button>
       );
     }

     if (currentStep === 0 && !workflowState.visitedLovable) {
       return (
         <Button
           onClick={handleOpenLovable}
           className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
         >
           <ExternalLink className="w-4 h-4 mr-2" />
           Open Lovable.dev
         </Button>
       );
     }

     if (currentStep === 1) {
       return (
         <Button
           onClick={handleOpenGitHub}
           className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white"
         >
           <Github className="w-4 h-4 mr-2" />
           Open GitHub
         </Button>
       );
     }

     if (currentStep === 2) {
       return (
         <Button
           onClick={handleOpenCursor}
           className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
         >
           <Zap className="w-4 h-4 mr-2" />
           Open Cursor
         </Button>
       );
     }

     return null;
   };

   const getStepInstructions = (stepNumber: number) => {
     const projectSlug = project?.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') || 'your-project';
     
     switch (stepNumber) {
       case 1:
         return {
           title: "Generate Your AI Development Prompts",
           instructions: [
             "Click the 'Code & Prompts' tab at the top of this page",
             "Choose your preferred color scheme from the options",
             "Click 'Generate Complete Development Prompts' button",
             "Wait 30-60 seconds for AI to analyze your project and create custom prompts",
             "You'll get both a Lovable prompt (frontend) and Cursor prompt (backend)"
           ],
           actionButtons: []
         };
       
               case 2:
          return {
            title: "Build Your Frontend in Lovable",
            instructions: [
              "Copy the Lovable.dev prompt from the Code & Prompts section",
              "Go to lovable.dev and create a new project",
              "Paste your prompt into the project description",
              "Click 'Generate' and wait 3-5 minutes for your app to be built",
              "Customize colors, fonts, and styling as desired",
              "Test your app on mobile and desktop previews"
            ],
            actionButtons: [
              { 
                label: "Copy Lovable Prompt", 
                action: handleCopyLovablePrompt, 
                icon: Copy,
                disabled: !workflowState.hasPrompts,
                color: "bg-blue-600 hover:bg-blue-700"
              },
              { 
                label: "Open Lovable.dev", 
                action: handleOpenLovable, 
                icon: ExternalLink,
                color: "bg-purple-600 hover:bg-purple-700"
              }
            ]
          };
        
        case 3:
          return {
            title: "Connect to GitHub from Lovable",
            instructions: [
              "In your Lovable project, look for the 'Connect to GitHub' option",
              "Click 'Connect to GitHub' and authorize Lovable to access your GitHub",
              "Lovable will automatically create a new repository with your app code",
              "Once connected, go to your GitHub profile to find the new repository",
              "Click on the repository name to open it",
              "Click the green 'Code' button and copy the HTTPS URL",
              "The URL will look like: https://github.com/yourusername/your-project-name.git"
            ],
            actionButtons: [
              { 
                label: "Open GitHub", 
                action: handleOpenGitHub, 
                icon: Github,
                color: "bg-gray-800 hover:bg-gray-900"
              }
            ]
          };
        
        case 4:
          return {
            title: "Clone Repository in Cursor & Add Backend",
            instructions: [
              "Download and install Cursor from cursor.sh (if not already installed)",
              "Open Cursor and create a new folder for your project",
              "Open Cursor's terminal (View → Terminal)",
              "Paste the GitHub HTTPS URL you copied and run: git clone [your-url]",
              "Open the cloned project folder in Cursor",
                                "Go back to CompanAI and copy your Cursor AI prompt",
              "In Cursor, open AI chat (Ctrl/Cmd + L) and paste your prompt",
              "Follow AI suggestions to add Firebase integration and backend features",
              "Test all functionality works correctly",
              "Commit and push your changes back to GitHub"
            ],
            actionButtons: [
              { 
                label: "Open Cursor", 
                action: handleOpenCursor, 
                icon: Zap,
                color: "bg-orange-600 hover:bg-orange-700"
              }
            ]
          };
       
       default:
         return {
           title: "Getting Started",
           instructions: ["Start by generating your AI prompts in the Code & Prompts tab"],
           actionButtons: []
         };
     }
   };

  return (
    <div className="space-y-6">
      {/* Current Step Guidance */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              guidance.priority === 'high' ? 'bg-red-500' :
              guidance.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>
            <CardTitle className="text-lg">{guidance.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{guidance.timeEstimate}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">{guidance.message}</p>
          
          {/* Action Button */}
          <div className="flex gap-2">
            {getActionButton()}
          </div>
        </CardContent>
      </Card>

              {/* Interactive CompanAI Journey */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Your CompanAI Journey
          </CardTitle>
          <p className="text-sm text-gray-600">Click each step to get detailed instructions and track your progress</p>
        </CardHeader>
        <CardContent>
           <div className="space-y-3">
            {[
              { 
                step: 1, 
                title: "Generate AI Prompts", 
                desc: "Create custom Lovable & Cursor prompts",
                 completed: workflowState.hasPrompts,
                 timeEstimate: "2 min"
              },
              { 
                step: 2, 
                title: "Build Frontend in Lovable", 
                desc: "Create your UI with AI assistance",
                 completed: workflowState.visitedLovable,
                 timeEstimate: "5-10 min"
              },
                             { 
                 step: 3, 
                 title: "Connect to GitHub from Lovable", 
                 desc: "Auto-create repository and get clone URL",
                 completed: workflowState.connectedGitHub,
                 timeEstimate: "3 min"
               },
               { 
                 step: 4, 
                 title: "Clone in Cursor & Add Backend", 
                 desc: "Clone repo and build backend with AI",
                 completed: workflowState.startedCursor,
                 timeEstimate: "15-30 min"
               }
             ].map((step, index) => {
               const stepInstructions = getStepInstructions(step.step);
               const isExpanded = expandedStep === step.step;
               
               return (
                 <div key={step.step} className="border rounded-lg overflow-hidden">
                   <div
                     className={`flex items-center gap-4 p-4 transition-all cursor-pointer group ${
                       step.completed 
                         ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                         : index === currentStep
                         ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                         : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                     }`}
                     onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                   >
                     <div className="flex-shrink-0">
                       {step.completed ? (
                         <CheckCircle className="w-6 h-6 text-green-600" />
                       ) : (
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                           index === currentStep 
                             ? 'border-blue-500 bg-blue-500 text-white' 
                             : 'border-gray-300 text-gray-500'
                         }`}>
                           {step.step}
                         </div>
                  )}
                </div>
                     
                <div className="flex-1">
                       <div className="flex items-center justify-between">
                         <h4 className="font-medium text-gray-900">{step.title}</h4>
                         <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-xs">
                             {step.timeEstimate}
                           </Badge>
                           {!step.completed && index === currentStep && (
                             <Play className="w-4 h-4 text-blue-600" />
                           )}
                         </div>
                       </div>
                       <p className="text-sm text-gray-600">{step.desc}</p>
                     </div>
                     
                     <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                       <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                     </div>
                   </div>
                   
                   {/* Expandable Instructions */}
                   {isExpanded && (
                     <div className="border-t bg-white p-6">
                       <h5 className="font-semibold text-gray-900 mb-4">{stepInstructions.title}</h5>
                       <div className="space-y-3 mb-4">
                         {stepInstructions.instructions.map((instruction, idx) => (
                           <div key={idx} className="flex items-start gap-3">
                             <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mt-0.5">
                               {idx + 1}
                             </div>
                             <p className="text-gray-700 leading-relaxed">{instruction}</p>
                           </div>
                         ))}
                       </div>
                       
                       {/* Action Buttons */}
                       {stepInstructions.actionButtons.length > 0 && (
                         <div className="flex gap-2 pt-4 border-t">
                           {stepInstructions.actionButtons.map((button, idx) => (
                             <Button
                               key={idx}
                               onClick={button.action}
                               disabled={button.disabled}
                               className={`${button.color} text-white`}
                             >
                               <button.icon className="w-4 h-4 mr-2" />
                               {button.label}
                             </Button>
                           ))}
                         </div>
                       )}
                </div>
                   )}
                 </div>
               );
             })}
          </div>
          
          {/* Progress Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <div className="text-2xl">
                {completedSteps.length === totalSteps ? '🎉' : '🚀'}
              </div>
              <div>
                <p className="font-medium text-purple-900">
                  {completedSteps.length === totalSteps 
                    ? `Congratulations! You've completed ${project?.title}!` 
                    : `You're doing great! Keep going and you'll have ${project?.title} live soon!`
                  }
                </p>
                <p className="text-purple-700">
                  {completedSteps.length} of {totalSteps} steps completed
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowGuide; 