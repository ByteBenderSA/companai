import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { switchOnboardingPath } from "@/lib/auth";
import { getUserOnboardingPath } from "@/lib/onboarding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, ChevronDown, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ModeSwitch = () => {
  const { user } = useAuth();
  const [switching, setSwitching] = useState(false);
  
  const currentPath = getUserOnboardingPath(user);

  const handlePathSwitch = async (newPath: 'beginner' | 'experienced' | 'both') => {
    if (!user || switching || newPath === currentPath) return;

    setSwitching(true);
    try {
      await switchOnboardingPath(user.id, newPath);
      
      const pathLabels = {
        beginner: 'Beginner Mode',
        experienced: 'Pro Mode', 
        both: 'Balanced Mode'
      };

      toast({
        title: `Switched to ${pathLabels[newPath]}`,
        description: "Your dashboard will update automatically.",
      });

      // Refresh the page to update all UI components
      window.location.reload();
    } catch (error) {
      console.error('Error switching path:', error);
      toast({
        title: "Switch failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
  };

  if (!user || !currentPath) return null;

  const pathLabels = {
    beginner: 'Beginner',
    experienced: 'Pro',
    both: 'Balanced'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-600 hover:text-gray-900"
          disabled={switching}
        >
          <Settings className="w-4 h-4 mr-2" />
          {pathLabels[currentPath]} Mode
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={() => handlePathSwitch('beginner')}
          className={currentPath === 'beginner' ? 'bg-purple-50' : ''}
        >
          <div className="flex flex-col">
            <span className="font-medium">Beginner Mode</span>
            <span className="text-xs text-gray-500">Full guidance & learning</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handlePathSwitch('experienced')}
          className={currentPath === 'experienced' ? 'bg-blue-50' : ''}
        >
          <div className="flex flex-col">
            <span className="font-medium">Pro Mode</span>
            <span className="text-xs text-gray-500">Minimal, efficient interface</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handlePathSwitch('both')}
          className={currentPath === 'both' ? 'bg-green-50' : ''}
        >
          <div className="flex flex-col">
            <span className="font-medium">Balanced Mode</span>
            <span className="text-xs text-gray-500">Learn & build together</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center">
            <ExternalLink className="w-4 h-4 mr-2" />
            All Settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModeSwitch; 