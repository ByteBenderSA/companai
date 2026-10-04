import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, Loader2, MessageSquare, Send, Square, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { chatProvider, streamChat, type ChatTurn } from '@/lib/ai';
import { buildMentorSystemPrompt, starterQuestions } from '@/lib/mentor';
import type { Project } from '@/lib/project-model';
import { cn } from '@/lib/utils';
import { ErrorNotice } from './ErrorNotice';
import { Markdown } from './Markdown';

/** Keep requests small: the last few exchanges are plenty of context for a mentor chat. */
const MAX_HISTORY = 12;

interface MentorChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

export function MentorChat({ open, onOpenChange, project }: MentorChatProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const projectId = project?.id;

  // A different project means a different conversation.
  useEffect(() => {
    abortRef.current?.abort();
    setTurns([]);
    setStreaming(null);
    setError(null);
  }, [projectId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [turns, streaming]);

  const busy = streaming !== null;

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    const history: ChatTurn[] = [...turns, { role: 'user', content }];
    setTurns(history);
    setInput('');
    setError(null);
    setStreaming('');

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const reply = await streamChat(history.slice(-MAX_HISTORY), buildMentorSystemPrompt(project), setStreaming, controller.signal);
      setTurns([...history, { role: 'assistant', content: reply }]);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err);
      // Put the question back so the student can retry without retyping.
      setTurns(turns);
      setInput(content);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setStreaming(null);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setStreaming(null);
    setTurns((t) => (t.length && t[t.length - 1].role === 'user' ? t.slice(0, -1) : t));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const provider = chatProvider() === 'deepseek' ? 'DeepSeek' : 'Gemini';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-left text-white">
          <SheetTitle className="flex items-center gap-2 text-white">
            <MessageSquare className="h-4 w-4" /> AI mentor
          </SheetTitle>
          <SheetDescription className="text-xs text-purple-100">
            {project ? `Helping with “${project.title}”` : 'Ask anything about building your app'} · {provider}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
          {turns.length === 0 && !busy && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-white p-4 text-sm text-gray-700">
                Hi! I'm your coding mentor. Ask me about your project, an error message, or what to do next.
              </div>
              <div className="flex flex-col gap-2">
                {starterQuestions(project).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => void send(q)}
                    className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-left text-sm text-purple-800 hover:bg-purple-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((t, i) => (
            <Bubble key={i} role={t.role} content={t.content} />
          ))}
          {busy &&
            (streaming ? (
              <Bubble role="assistant" content={streaming} />
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            ))}
          {error ? <ErrorNotice error={error} onDismiss={() => setError(null)} /> : null}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={onSubmit} className="border-t bg-white p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Ask a question… (Shift+Enter for a new line)"
              rows={2}
              className="max-h-40 min-h-[44px] resize-none"
              aria-label="Message"
            />
            {busy ? (
              <Button type="button" variant="outline" onClick={stop} aria-label="Stop">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim()} className="bg-purple-600 text-white hover:bg-purple-700" aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          {turns.length > 0 && !busy && (
            <button type="button" onClick={() => setTurns([])} className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
              <Trash2 className="h-3 w-3" /> Clear conversation
            </button>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Bubble({ role, content }: ChatTurn) {
  const mine = role === 'user';
  return (
    <div className={cn('flex gap-2', mine && 'flex-row-reverse')}>
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', mine ? 'bg-purple-600' : 'bg-gray-200')}>
        {mine ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-gray-600" />}
      </div>
      <div className={cn('min-w-0 max-w-[85%] rounded-lg px-3 py-2 text-sm', mine ? 'whitespace-pre-wrap bg-purple-600 text-white' : 'border bg-white')}>
        {mine ? content : <Markdown>{content}</Markdown>}
      </div>
    </div>
  );
}

/** Floating button that opens the mentor. */
export function MentorButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-5 right-5 z-30 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-5 text-white shadow-xl hover:from-purple-700 hover:to-blue-700"
      aria-label="Open AI mentor"
    >
      <MessageSquare className="h-5 w-5 sm:mr-2" />
      <span className="hidden sm:inline">Ask the mentor</span>
    </Button>
  );
}
