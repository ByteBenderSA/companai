import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Rocket, Star } from "lucide-react";
import confetti from 'canvas-confetti';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CelebrationModal = ({ isOpen, onClose }: CelebrationModalProps) => {
  // Trigger confetti when modal opens
  if (isOpen) {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#9333ea', '#3b82f6', '#10b981']
      });
      
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#9333ea', '#3b82f6', '#10b981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center py-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Star className="w-6 h-6 text-yellow-400 fill-current" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Tech Master Achievement Unlocked! 🎉
          </h2>
          
          <p className="text-gray-600 mb-6">
            Congratulations! You've completed all the essential tech lessons. 
            You're now equipped with the knowledge to build amazing apps!
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-700 mb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Your Achievements
              </h3>
              <ul className="text-sm text-purple-600 space-y-1">
                <li>✓ Mastered 6 essential development tools</li>
                <li>✓ Ready to build full-stack applications</li>
                <li>✓ Unlocked Tech Master badge</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => onClose()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Start Building Your App
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CelebrationModal; 