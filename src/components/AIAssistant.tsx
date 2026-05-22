import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, X, Send, MessageSquare, Lightbulb, Code, HelpCircle, Bot, User, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { conversationService, Message as ConversationMessage } from "@/lib/conversations";
import { getChatService, ChatMessage } from "@/lib/ai-config";
import { Timestamp } from "firebase/firestore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { checkUsageLimit, incrementUsage } from '@/lib/subscriptions'
import { UsageLimitModal } from '@/components/ui/usage-limit-modal'
import type { Project } from "@/lib/firestore";

interface AIAssistantProps {
  onClose: () => void;
  currentProject?: Project | null;
  allProjects?: Project[];
}

interface UIMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
  turnId?: string;
}

// Enhanced text formatting component for AI responses
const FormattedMessage = ({ content, onCopyCode }: { content: string; onCopyCode?: (code: string) => void }) => {
  const formatText = (text: string) => {
    // Split by code blocks first
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(
          <span key={`text-${lastIndex}`}>
            {formatInlineText(beforeText)}
          </span>
        );
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2].trim();
      parts.push(
        <div key={`code-${match.index}`} className="my-3 relative group">
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 uppercase">{language}</span>
              <Button
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                onClick={() => onCopyCode?.(code)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <pre className="text-green-400 text-sm">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(
        <span key={`text-${lastIndex}`}>
          {formatInlineText(remainingText)}
        </span>
      );
    }

    return parts.length > 0 ? parts : formatInlineText(text);
  };

  const formatInlineText = (text: string) => {
    // Handle line breaks and create paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, pIndex) => {
      const lines = paragraph.split('\n');
      
      return (
        <div key={pIndex} className={pIndex > 0 ? 'mt-4' : ''}>
          {lines.map((line, lIndex) => {
            // Handle lists
            if (line.match(/^[-*•]\s+/)) {
              return (
                <div key={lIndex} className="flex items-start gap-2 my-1">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>{formatInlineStyling(line.replace(/^[-*•]\s+/, ''))}</span>
                </div>
              );
            }
            
            // Handle numbered lists
            if (line.match(/^\d+\.\s+/)) {
              const number = line.match(/^(\d+)\./)?.[1];
              return (
                <div key={lIndex} className="flex items-start gap-2 my-1">
                  <span className="text-purple-600 font-medium min-w-[1.5rem]">{number}.</span>
                  <span>{formatInlineStyling(line.replace(/^\d+\.\s+/, ''))}</span>
                </div>
              );
            }
            
            // Handle headers
            if (line.match(/^#{1,6}\s+/)) {
              const level = line.match(/^(#{1,6})/)?.[1].length || 1;
              const headerText = line.replace(/^#{1,6}\s+/, '');
              const sizes = ['text-xl', 'text-lg', 'text-base', 'text-sm', 'text-sm', 'text-sm'];
              const weights = ['font-bold', 'font-bold', 'font-semibold', 'font-semibold', 'font-medium', 'font-medium'];
              
              return (
                <h1 key={lIndex} className={`${sizes[level - 1]} ${weights[level - 1]} text-gray-900 my-2`}>
                  {formatInlineStyling(headerText)}
                </h1>
              );
            }
            
            return (
              <div key={lIndex} className={lIndex > 0 ? 'mt-1' : ''}>
                {formatInlineStyling(line)}
              </div>
            );
          })}
        </div>
      );
    });
  };

  const formatInlineStyling = (text: string) => {
    // Handle inline code
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-purple-700">$1</code>');
    
    // Handle bold text
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    
    // Handle italic text
    text = text.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
    
    // Handle links
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
    
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // Could add a toast notification here
  };

  return (
    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
      {formatText(content)}
    </div>
  );
};

// Generate lightweight project context for AI
const generateProjectContext = (currentProject?: Project | null, allProjects?: Project[]): string => {
  if (!currentProject && (!allProjects || allProjects.length === 0)) {
    return "User has no active projects yet.";
  }

  let context = "";

  if (currentProject) {
    const completionRate = currentProject.progress.completedSteps.length;
    const totalSteps = 4; // Assuming 4 steps total
    
    context += `🎯 CURRENT PROJECT: "${currentProject.title}"\n`;
    context += `📝 Description: ${currentProject.description}\n`;
    context += `⚡ Progress: ${completionRate}/${totalSteps} steps completed\n`;
    context += `🔧 Tech Stack: ${currentProject.techStack.join(", ")}\n`;
    context += `💫 Difficulty: ${currentProject.difficulty}\n`;
    
    if (currentProject.features && currentProject.features.length > 0) {
      context += `✨ Key Features: ${currentProject.features.slice(0, 3).join(", ")}${currentProject.features.length > 3 ? "..." : ""}\n`;
    }
    
    // Add specific help based on current step
    const currentStep = currentProject.progress.currentStep || 0;
    if (currentStep === 0) {
      context += `🎨 Current Step: Building UI with Lovable\n`;
    } else if (currentStep === 1) {
      context += `📁 Current Step: GitHub setup & code management\n`;
    } else if (currentStep === 2) {
      context += `⚡ Current Step: Backend development with Cursor AI\n`;
    } else if (currentStep === 3) {
      context += `🚀 Current Step: Deployment & sharing\n`;
    }
    
    context += "\n";
  }

  if (allProjects && allProjects.length > 1) {
    const otherProjects = allProjects.filter(p => p.id !== currentProject?.id).slice(0, 3);
    if (otherProjects.length > 0) {
      context += `📊 OTHER PROJECTS (${allProjects.length - 1} total):\n`;
      otherProjects.forEach(project => {
        const completionRate = project.progress.completedSteps.length;
        context += `• "${project.title}" (${completionRate}/4 steps, ${project.difficulty})\n`;
      });
      context += "\n";
    }
  }

  context += `💡 I can help with: project planning, debugging, code explanations, feature implementation, deployment guidance, and learning concepts.`;
  
  return context;
};

const AIAssistant = ({ onClose, currentProject, allProjects }: AIAssistantProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  
  // Smart scrolling state
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic suggestions based on project context
  const getQuickSuggestions = () => {
    if (currentProject) {
      const currentStep = currentProject.progress.currentStep || 0;
      
      if (currentStep === 0) {
        return [
          { icon: Code, text: `Help me design ${currentProject.title}`, color: "bg-blue-100 text-blue-700" },
          { icon: Lightbulb, text: "Improve my Lovable prompt", color: "bg-yellow-100 text-yellow-700" },
          { icon: HelpCircle, text: "What's the best color scheme?", color: "bg-green-100 text-green-700" },
        ];
      } else if (currentStep === 1) {
        return [
          { icon: Code, text: "Help with GitHub setup", color: "bg-blue-100 text-blue-700" },
          { icon: Lightbulb, text: "Git commands reference", color: "bg-yellow-100 text-yellow-700" },
          { icon: HelpCircle, text: "How to clone my repository?", color: "bg-green-100 text-green-700" },
        ];
      } else if (currentStep === 2) {
        return [
          { icon: Code, text: `Help debug my ${currentProject.title} backend`, color: "bg-blue-100 text-blue-700" },
          { icon: Lightbulb, text: "Optimize my Cursor prompt", color: "bg-yellow-100 text-yellow-700" },
          { icon: HelpCircle, text: "Explain Firebase setup", color: "bg-green-100 text-green-700" },
        ];
      } else {
        return [
          { icon: Code, text: "Help deploy my app", color: "bg-blue-100 text-blue-700" },
          { icon: Lightbulb, text: "Domain setup guide", color: "bg-yellow-100 text-yellow-700" },
          { icon: HelpCircle, text: "Performance optimization tips", color: "bg-green-100 text-green-700" },
        ];
      }
    }
    
    // Default suggestions for users without projects
    return [
      { icon: Lightbulb, text: "Give me a project idea", color: "bg-yellow-100 text-yellow-700" },
      { icon: Code, text: "Help debug my code", color: "bg-blue-100 text-blue-700" },
      { icon: HelpCircle, text: "Explain React hooks", color: "bg-green-100 text-green-700" },
    ];
  };

  const quickSuggestions = getQuickSuggestions();

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Create a new conversation
        const newConversationId = await conversationService.createConversation(user, 'AI Chat Session');
        setConversationId(newConversationId);
        
        // Don't add welcome message here - let it be added naturally on first interaction
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing conversation:', err);
        setError('Failed to initialize chat. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeConversation();
  }, [user, currentProject, allProjects]);

  // Subscribe to messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = conversationService.subscribeToMessages(
      conversationId,
      (firestoreMessages: ConversationMessage[]) => {
        const uiMessages: UIMessage[] = firestoreMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp ? msg.timestamp.toDate() : new Date(),
          turnId: (msg.metadata as any)?.turnId // Safely access turnId from metadata
        }));
        
        // Better message merging - preserve conversation turn order
        setMessages(prevMessages => {
          // Keep only active temp messages (those that are loading)
          const activeTempMessages = prevMessages.filter(m => 
            m.id.startsWith('temp-') && m.isLoading
          );
          
          // Group messages by conversation turns to maintain proper order
          const allMessages = [...activeTempMessages, ...uiMessages];
          
          // Sort by timestamp but ensure user messages come before AI responses in each turn
          const sortedMessages = allMessages.sort((a, b) => {
            // First sort by timestamp for overall chronological order
            const timeA = a.timestamp.getTime();
            const timeB = b.timestamp.getTime();
            
            // If they have the same turnId, user always comes first
            if (a.turnId && b.turnId && a.turnId === b.turnId) {
              if (a.role === 'user' && b.role === 'assistant') return -1;
              if (a.role === 'assistant' && b.role === 'user') return 1;
            }
            
            // If timestamps are very close (same conversation turn), user should come first  
            if (Math.abs(timeA - timeB) < 10000) { // Within 10 seconds
              if (a.role === 'user' && b.role === 'assistant') return -1;
              if (a.role === 'assistant' && b.role === 'user') return 1;
            }
            
            return timeA - timeB;
          });
          
          return sortedMessages;
        });
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [conversationId]);

  // Check if user is at bottom of chat
  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    
    const container = messagesContainerRef.current;
    const threshold = 150; // pixels from bottom
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    
    setIsUserAtBottom(isAtBottom);
    return isAtBottom;
  };

  // Handle scroll events
  const handleScroll = () => {
    const isAtBottom = checkIfAtBottom();
    
    // If user scrolled to bottom, resume auto-scrolling
    if (isAtBottom && !shouldAutoScroll) {
      setShouldAutoScroll(true);
    }
    // If user scrolled away from bottom, pause auto-scrolling
    else if (!isAtBottom && shouldAutoScroll) {
      setShouldAutoScroll(false);
    }
  };

  // Smart auto-scroll: only scroll if user is at bottom
  useEffect(() => {
    if (shouldAutoScroll && isUserAtBottom) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll, isUserAtBottom]);

  // Add scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Force scroll to bottom (for user actions like sending message)
  const forceScrollToBottom = () => {
    setShouldAutoScroll(true);
    setIsUserAtBottom(true);
    scrollToBottom();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple feedback - could enhance with toast
    console.log('Code copied to clipboard');
  };

  const handleSendMessage = async (content: string) => {
    if (!user) return;
    if (!content.trim() || !conversationId || isLoading) return;

    const now = new Date();
    const turnId = `turn-${Date.now()}`;
    
    // INSTANT USER MESSAGE - appears immediately, no delays
    const tempUserMessage: UIMessage = {
      id: `temp-user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: now,
      turnId
    };

    // Add user message to UI immediately - this must happen first!
    setMessages(prev => [...prev, tempUserMessage]);
    
    // Force immediate UI update and scroll
    setTimeout(() => {
      forceScrollToBottom();
      
      // Add AI thinking message after user message is visible
      const tempAIMessage: UIMessage = {
        id: `temp-ai-${Date.now()}`,
        content: 'Thinking...',
        role: 'assistant',
        timestamp: new Date(now.getTime() + 100),
        isLoading: true,
        turnId
      };
      
      setMessages(prev => [...prev, tempAIMessage]);
      setIsLoading(true);
    }, 10); // Very short delay to ensure user message renders first

    // Now start async processing in background
    setTimeout(async () => {
      try {
        // Check usage limit
        const limitCheck = await checkUsageLimit(user.uid, 'ai');
        if (!limitCheck.canUse) {
          setShowLimitModal(true);
          // Remove temp messages
          setMessages(prev => prev.filter(m => 
            m.id !== tempUserMessage.id && !m.id.startsWith(`temp-ai-${turnId}`)
          ));
          return;
        }
        
        // Increment usage counter
        const success = await incrementUsage(user.uid, 'ai');
        if (!success) {
          setShowLimitModal(true);
          // Remove temp messages
          setMessages(prev => prev.filter(m => 
            m.id !== tempUserMessage.id && !m.id.startsWith(`temp-ai-${turnId}`)
          ));
          return;
        }

        setError(null);
        let typingTimeoutId: NodeJS.Timeout | null = null;

        // Use local analysis instead of API call
        const messageAnalysis = getChatService().analyzeUserMessageSync(content);

        // Parallel operations for better performance
        const [, , recentMessages, conversation] = await Promise.all([
          // Add user message to Firestore 
          conversationService.addMessage(
            conversationId,
            content,
            'user',
            {
              intent: messageAnalysis.intent,
              topics: messageAnalysis.topics,
              turnId: turnId
            } as any
          ),
          // Update conversation title if first message
          messages.filter(m => m.role === 'user').length === 0 
            ? conversationService.updateConversationTitle(conversationId, content)
            : Promise.resolve(),
          // Get messages for context (sliding window - always 10 or fewer)
          conversationService.getMessagesForContext(conversationId),
          // Get conversation context
          conversationService.getConversation(conversationId)
        ]);
        
        // Convert to ChatMessage format for Gemini
        const chatMessages: ChatMessage[] = recentMessages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: msg.content
        }));

        // Get conversation context
        const context = conversation?.context;

        let accumulatedResponse = '';
        let displayedResponse = '';
        
        // Function to simulate smooth typing
        const typeText = (fullText: string) => {
          if (typingTimeoutId) clearTimeout(typingTimeoutId);
          
          let currentIndex = displayedResponse.length;
          
          const typeNextChar = () => {
            if (currentIndex < fullText.length) {
              displayedResponse = fullText.substring(0, currentIndex + 1);
              
              setMessages(prev => prev.map(msg => 
                msg.turnId === turnId && msg.role === 'assistant'
                  ? { ...msg, content: displayedResponse, isLoading: false }
                  : msg
              ));
              
              currentIndex++;
              // Faster typing speed - 20-40ms per character
              const delay = Math.random() * 20 + 20;
              typingTimeoutId = setTimeout(typeNextChar, delay);
            }
          };
          
          typeNextChar();
        };
        
        // Generate AI response with smooth streaming
        const aiResponse = await getChatService().generateStreamingResponse(
          chatMessages, 
          context,
          content,
          (chunk: string) => {
            accumulatedResponse += chunk;
            // Trigger smooth typing for the accumulated text
            typeText(accumulatedResponse);
          }
        );

        // Ensure final complete response is displayed
        if (typingTimeoutId) clearTimeout(typingTimeoutId);
        setMessages(prev => prev.map(msg => 
          msg.turnId === turnId && msg.role === 'assistant'
            ? { ...msg, content: aiResponse, isLoading: false }
            : msg
        ));

        // Add final AI response to Firestore
        await conversationService.addMessage(
          conversationId,
          aiResponse,
          'assistant',
          {
            aiModel: 'deepseek-chat',
            topics: messageAnalysis.topics,
            turnId: turnId
          } as any
        );

      } catch (err) {
        console.error('Error sending message:', err);
        setError('Failed to send message. Please try again.');
        
        // Remove temp messages on error
        setMessages(prev => prev.filter(m => 
          m.id !== tempUserMessage.id && m.turnId !== turnId
        ));
      } finally {
        setIsLoading(false);
      }
    }, 20); // Small delay to ensure UI is responsive
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      const messageContent = inputValue;
      setInputValue(""); // Clear input immediately for responsive feel
      handleSendMessage(messageContent);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) {
      handleSendMessage(suggestion);
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>Please log in to use the AI Assistant.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-4 pb-4 px-4 z-50">
      <Card className="w-full max-w-5xl h-[95vh] flex flex-col shadow-2xl">
        <CardHeader className="border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg flex-shrink-0 py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <CardTitle className="text-lg">AI Coding Mentor</CardTitle>
              <Badge className="bg-white/20 text-white text-xs px-2 py-0.5">
                ✨ DeepSeek V3
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
          {/* Error Alert */}
          {error && (
            <Alert className="m-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                {error}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setError(null)}
                  className="ml-2 h-6 px-2 text-red-700 hover:bg-red-100"
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {!isInitialized ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="space-y-2">
                    <p className="text-gray-700 font-medium">Setting up your AI Assistant...</p>
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                    <p className="text-sm text-gray-500">Loading your project context...</p>
                  </div>
                </div>
              </div>
            ) : messages.length === 0 ? (
              // Show welcome message when no messages exist
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-white border border-gray-100 text-gray-800 p-4 rounded-lg shadow-sm">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm leading-relaxed">
                        Hi! I'm your AI coding mentor 👋<br/><br/>
                        {generateProjectContext(currentProject, allProjects)}<br/><br/>
                        How can I help you today? I can assist with code, debug issues, explain concepts, or guide you through your development journey!
                      </p>
                    </div>
                    <p className="text-xs mt-3 pt-2 border-t text-gray-500 border-gray-100">
                      {new Date().toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                          : 'bg-gray-200'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      
                      {/* Message */}
                      <div
                        className={`p-4 rounded-lg shadow-sm ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                            : 'bg-white border border-gray-100 text-gray-800'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <div className="prose prose-sm max-w-none">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed text-white">{message.content}</p>
                          </div>
                        ) : message.isLoading ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                              <span className="text-gray-600 text-sm">Thinking...</span>
                            </div>
                          </div>
                        ) : (
                          <FormattedMessage content={message.content} onCopyCode={copyToClipboard} />
                        )}
                        
                        <p className="text-xs mt-3 pt-2 border-t text-gray-500 border-gray-100">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
            

            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length === 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={`text-xs ${suggestion.color} border-0 hover:opacity-80`}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    disabled={isLoading}
                  >
                    <suggestion.icon className="w-3 h-3 mr-1" />
                    {suggestion.text}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t bg-white p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything about coding, debugging, or your project..."
                disabled={isLoading}
                className="flex-1"
                autoComplete="off"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !inputValue.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Usage Limit Modal */}
      <UsageLimitModal 
        isOpen={showLimitModal} 
        onClose={() => setShowLimitModal(false)} 
        type="ai"
      />
    </div>
  );
};

export default AIAssistant;