import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Rocket, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const COLORS = ['#9333ea', '#3b82f6', '#10b981'];

export function CelebrationModal({ open, onClose, lessonCount }: { open: boolean; onClose: () => void; lessonCount: number }) {
  useEffect(() => {
    if (!open || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const end = Date.now() + 2500;
    let frame = 0;
    const tick = () => {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: COLORS });
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: COLORS });
      if (Date.now() < end) frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="text-center sm:max-w-md">
        <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
          <Trophy className="h-10 w-10 text-white" />
        </div>
        <DialogTitle className="text-2xl">All lessons complete! 🎉</DialogTitle>
        <DialogDescription>
          You've finished all {lessonCount} toolkit lessons. You know what each tool does — now put it to work on your project.
        </DialogDescription>
        <Button asChild className="mt-4 bg-purple-600 text-white hover:bg-purple-700" onClick={onClose}>
          <Link to="/projects">
            <Rocket className="mr-2 h-4 w-4" /> Go to my projects
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
