import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BuildPrompts } from '@/lib/prompts';
import { CopyButton } from './CopyButton';

const TOOLS = {
  lovable: {
    tab: 'Lovable (frontend)',
    heading: 'Lovable prompt',
    url: 'https://lovable.dev',
    open: 'Open Lovable',
    howTo: 'Copy this, open Lovable, paste it into the prompt box on the home page, and press Enter.',
  },
  cursor: {
    tab: 'Cursor (backend)',
    heading: 'Cursor prompt',
    url: 'https://cursor.com',
    open: 'Get Cursor',
    howTo: 'Use this after your Lovable project is on GitHub and open in Cursor. Paste it into the chat panel and work through it one step at a time.',
  },
} as const;

function PromptPanel({ tool, text }: { tool: keyof typeof TOOLS; text: string }) {
  const [expanded, setExpanded] = useState(false);
  const t = TOOLS[tool];
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">{t.howTo}</p>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={text} label="Copy prompt" variant="primary" />
        <Button size="sm" variant="outline" asChild>
          <a href={t.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-4 w-4" />
            {t.open}
          </a>
        </Button>
      </div>
      <div className="relative">
        <pre
          className={`overflow-x-auto whitespace-pre-wrap break-words rounded-lg border bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-800 sm:text-sm ${
            expanded ? '' : 'max-h-72 overflow-y-hidden'
          }`}
          data-testid={`${tool}-prompt`}
        >
          {text}
        </pre>
        {!expanded && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-lg bg-gradient-to-t from-gray-50" />}
      </div>
      <Button size="sm" variant="ghost" onClick={() => setExpanded((e) => !e)}>
        {expanded ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
        {expanded ? 'Show less' : 'Show full prompt'}
      </Button>
    </div>
  );
}

export function PromptCards({ prompts }: { prompts: Partial<BuildPrompts> }) {
  const available = (['lovable', 'cursor'] as const).filter((k) => prompts[k]);
  if (available.length === 0) return null;
  return (
    <Tabs defaultValue={available[0]} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        {(['lovable', 'cursor'] as const).map((k) => (
          <TabsTrigger key={k} value={k} disabled={!prompts[k]} className="text-xs sm:text-sm">
            {TOOLS[k].tab}
          </TabsTrigger>
        ))}
      </TabsList>
      {available.map((k) => (
        <TabsContent key={k} value={k} className="mt-4">
          <PromptPanel tool={k} text={prompts[k] ?? ''} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
