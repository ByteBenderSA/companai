import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  label?: string;
  size?: 'xs' | 'sm';
  variant?: 'outline' | 'dark' | 'primary';
  className?: string;
}

export function CopyButton({ text, label = 'Copy', size = 'sm', variant = 'outline', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      toast({ title: "Couldn't copy", description: 'Select the text and copy it manually.', variant: 'destructive' });
    }
  };

  if (size === 'xs') {
    return (
      <button
        type="button"
        onClick={copy}
        className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-white/10', variant === 'dark' ? 'text-gray-300 hover:text-white' : 'text-gray-600', className)}
        aria-label={copied ? 'Copied' : `${label} to clipboard`}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : label}
      </button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={variant === 'primary' ? 'default' : 'outline'}
      onClick={copy}
      className={cn(variant === 'primary' && 'bg-purple-600 text-white hover:bg-purple-700', className)}
    >
      {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
      {copied ? 'Copied!' : label}
    </Button>
  );
}
