import { usePageTitle } from '@/hooks/use-page-title';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Loader2, RotateCcw, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppLayout } from '@/components/AppLayout';
import { ErrorNotice } from '@/components/ErrorNotice';
import { GeneratingPanel } from '@/components/GeneratingPanel';
import { dataErrorMessage } from '@/lib/data-errors';
import { IdeaCustomizationForm } from '@/components/IdeaCustomizationForm';
import { PromptCards } from '@/components/PromptCards';
import { useUser } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { generateBuildPrompts, generateIdeas } from '@/lib/ai';
import { clearDraft, EMPTY_DRAFT, loadDraft, saveDraft, type IdeaDraft, type WorkshopStep } from '@/lib/drafts';
import { isIdeaInputReady, type Idea, type IdeaInput, type SkillLevel } from '@/lib/ideas';
import { createProject } from '@/lib/projects';
import { templatePrompts } from '@/lib/prompts';
import { cn } from '@/lib/utils';

const STEPS: { id: WorkshopStep; label: string }[] = [
  { id: 'describe', label: 'Describe' },
  { id: 'choose', label: 'Choose' },
  { id: 'customize', label: 'Customise' },
  { id: 'prompts', label: 'Prompts' },
];

function Stepper({ current }: { current: WorkshopStep }) {
  const index = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="mx-auto mb-8 flex max-w-xl items-center justify-between gap-2" aria-label="Progress">
      {STEPS.map((s, i) => (
        <li key={s.id} className="flex flex-1 items-center gap-2" aria-current={i === index ? 'step' : undefined}>
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              i < index ? 'bg-green-600 text-white' : i === index ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
            )}
          >
            {i < index ? <Check className="h-4 w-4" /> : i + 1}
          </span>
          <span className={cn('hidden text-sm sm:inline', i === index ? 'font-semibold text-gray-900' : 'text-gray-500')}>{s.label}</span>
          {i < STEPS.length - 1 && <span className="h-px flex-1 bg-gray-200" />}
        </li>
      ))}
    </ol>
  );
}

function StepCaption({ current }: { current: WorkshopStep }) {
  const index = STEPS.findIndex((s) => s.id === current);
  return (
    <p className="-mt-5 mb-6 text-center text-sm font-medium text-gray-600 sm:hidden">
      Step {index + 1} of {STEPS.length} · {STEPS[index].label}
    </p>
  );
}

const SKILLS: { id: SkillLevel; label: string }[] = [
  { id: 'beginner', label: "Beginner — I'm just starting out" },
  { id: 'intermediate', label: 'Intermediate — I have built a few things' },
  { id: 'advanced', label: "Advanced — I'm comfortable with code" },
];

function DescribeStep({ input, onChange, onSubmit, busy }: { input: IdeaInput; onChange: (i: IdeaInput) => void; onSubmit: () => void; busy: boolean }) {
  const set = (key: keyof IdeaInput, value: string) => onChange({ ...input, [key]: value });
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Tell us about your app idea</CardTitle>
        <p className="text-sm text-gray-600">A rough idea is fine — the AI will turn it into three concrete project options.</p>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="appName">App name *</Label>
            <Input id="appName" placeholder="e.g. StudyBuddy" value={input.appName} onChange={(e) => set('appName', e.target.value)} maxLength={80} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">What does it do? *</Label>
            <Textarea
              id="description"
              placeholder="e.g. Helps university students find study partners for the same course and book study sessions."
              value={input.description}
              onChange={(e) => set('description', e.target.value)}
              className="min-h-[100px]"
              maxLength={1500}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="targetAudience">Who is it for?</Label>
            <Input
              id="targetAudience"
              placeholder="e.g. First-year students"
              value={input.targetAudience}
              onChange={(e) => set('targetAudience', e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="keyFeatures">Must-have features</Label>
            <Textarea
              id="keyFeatures"
              placeholder="e.g. course matching, chat, shared calendar"
              value={input.keyFeatures}
              onChange={(e) => set('keyFeatures', e.target.value)}
              maxLength={1000}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Your coding experience</legend>
            <RadioGroup value={input.skillLevel} onValueChange={(v) => set('skillLevel', v)}>
              {SKILLS.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <RadioGroupItem value={s.id} id={`skill-${s.id}`} />
                  <Label htmlFor={`skill-${s.id}`} className="font-normal">
                    {s.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </fieldset>
          <Button type="submit" size="lg" disabled={busy || !isIdeaInputReady(input)} className="h-auto w-full bg-purple-600 py-4 text-base text-white hover:bg-purple-700">
            {busy ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating ideas… (about 15–30 seconds)
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate 3 project ideas
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function IdeaCard({ idea, onCustomize, onQuickSave, busy }: { idea: Idea; onCustomize: () => void; onQuickSave: () => void; busy: boolean }) {
  return (
    <Card className="flex flex-col" data-testid="idea-card">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{idea.difficulty}</Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> {idea.timeEstimate}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-snug">{idea.title}</CardTitle>
        <p className="text-sm text-gray-600">{idea.description}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div>
          <h4 className="mb-1.5 text-sm font-semibold">Features</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            {idea.features.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        {idea.learningObjectives.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-sm font-semibold">You'll learn</h4>
            <p className="text-sm text-gray-600">{idea.learningObjectives.join(' · ')}</p>
          </div>
        )}
        {idea.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {idea.techStack.map((t) => (
              <Badge key={t} variant="outline" className="text-xs font-normal">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button onClick={onCustomize} disabled={busy} className="w-full bg-purple-600 text-white hover:bg-purple-700">
          Choose & customise
        </Button>
        <Button onClick={onQuickSave} disabled={busy} variant="ghost" size="sm" className="w-full text-gray-600">
          <Save className="mr-1.5 h-4 w-4" /> Quick save with starter prompts
        </Button>
      </CardFooter>
    </Card>
  );
}

const IdeaWorkshop = () => {
  usePageTitle('Idea Workshop');
  const user = useUser();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<IdeaDraft>(EMPTY_DRAFT);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<null | 'ideas' | 'prompts' | 'saving'>(null);
  const [error, setError] = useState<unknown>(null);
  // What to re-run when the student clicks “Try again” (resolved against the latest state).
  const [failed, setFailed] = useState<null | 'ideas' | 'prompts' | { idea: Idea; ai: boolean }>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let cancelled = false;
    loadDraft(user.uid)
      .then((d) => {
        if (cancelled) return;
        setDraft(d);
        if (d.step !== 'describe') toast({ title: 'Welcome back', description: 'We restored where you left off.' });
      })
      .catch(() => {
        // Starting fresh is fine if the draft can't be read.
      })
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [user.uid]);

  /** Update state and persist. Typing is debounced; step changes save immediately. */
  const update = useCallback(
    (next: IdeaDraft, immediate = true) => {
      setDraft(next);
      clearTimeout(saveTimer.current);
      const persist = () => saveDraft(user.uid, next).catch(() => undefined);
      if (immediate) void persist();
      else saveTimer.current = setTimeout(persist, 1200);
    },
    [user.uid]
  );

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const run = async (kind: 'ideas' | 'prompts' | 'saving', action: () => Promise<void>, retry: NonNullable<typeof failed>) => {
    setBusy(kind);
    setError(null);
    if (kind !== 'saving') window.scrollTo({ top: 0, behavior: 'smooth' });
    setFailed(null);
    try {
      await action();
    } catch (err) {
      setError(kind === 'saving' ? new Error(dataErrorMessage(err)) : err);
      setFailed(retry);
    } finally {
      setBusy(null);
    }
  };

  const handleGenerateIdeas = () =>
    run(
      'ideas',
      async () => {
        const ideas = await generateIdeas(draft.input);
        update({ ...draft, step: 'choose', ideas, selectedIndex: null, prompts: null });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      'ideas'
    );

  const generating = busy === 'ideas' || busy === 'prompts';
  const selected = draft.selectedIndex !== null ? draft.ideas[draft.selectedIndex] : null;

  const handleGeneratePrompts = () =>
    run(
      'prompts',
      async () => {
        if (!selected) return;
        const prompts = await generateBuildPrompts(selected, draft.customization);
        update({ ...draft, step: 'prompts', prompts });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      'prompts'
    );

  const saveProject = (idea: Idea, withAiPrompts: boolean) =>
    run(
      'saving',
      async () => {
        const prompts = withAiPrompts && draft.prompts ? draft.prompts : templatePrompts(idea);
        const id = await createProject(user.uid, idea, prompts, withAiPrompts ? 'ai' : 'template', withAiPrompts ? draft.customization : undefined);
        clearTimeout(saveTimer.current);
        await clearDraft(user.uid).catch(() => undefined);
        toast({ title: 'Project saved', description: `“${idea.title}” is ready in your projects.` });
        navigate(`/projects/${id}`);
      },
      { idea, ai: withAiPrompts }
    );

  const retry = () => {
    if (failed === 'ideas') void handleGenerateIdeas();
    else if (failed === 'prompts') void handleGeneratePrompts();
    else if (failed) void saveProject(failed.idea, failed.ai);
  };

  const startOver = () => {
    clearTimeout(saveTimer.current);
    setDraft(EMPTY_DRAFT);
    setError(null);
    void clearDraft(user.uid).catch(() => undefined);
    setConfirmReset(false);
  };

  const goTo = (step: WorkshopStep) => {
    setError(null);
    update({ ...draft, step });
  };

  return (
    <AppLayout>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Idea Workshop</h1>
        <p className="mt-2 text-gray-600">Turn a rough idea into ready-to-paste prompts for Lovable and Cursor.</p>
      </div>

      {!loaded ? (
        <div className="flex justify-center py-16" aria-label="Loading">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <>
          <Stepper current={draft.step} />
          <StepCaption current={draft.step} />

          {error ? (
            <div className="mx-auto mb-6 max-w-3xl">
              <ErrorNotice error={error} onRetry={failed ? retry : undefined} onDismiss={() => setError(null)} />
            </div>
          ) : null}

          {busy === 'ideas' && (
            <GeneratingPanel
              title="Generating your project ideas"
              estimate="15–30 seconds"
              stages={['Reading your idea…', 'Sketching three different versions…', 'Choosing features and tech for each…', 'Sizing them to your experience…', 'Almost there…']}
            />
          )}
          {busy === 'prompts' && (
            <GeneratingPanel
              title="Writing your Lovable and Cursor prompts"
              estimate="20–40 seconds"
              stages={['Planning the screens…', 'Writing the Lovable prompt…', 'Designing the database…', 'Writing the Cursor prompt step by step…', 'Almost there…']}
            />
          )}

          {!generating && draft.step === 'describe' && (
            <DescribeStep input={draft.input} onChange={(input) => update({ ...draft, input }, false)} onSubmit={handleGenerateIdeas} busy={busy !== null} />
          )}

          {!generating && draft.step === 'choose' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Pick the version you like best</h2>
                <p className="text-gray-600">Customise it for tailored prompts, or quick-save it with starter prompts.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {draft.ideas.map((idea, i) => (
                  <IdeaCard
                    key={`${idea.title}-${i}`}
                    idea={idea}
                    busy={busy !== null}
                    onCustomize={() => update({ ...draft, step: 'customize', selectedIndex: i, prompts: null })}
                    onQuickSave={() => void saveProject(idea, false)}
                  />
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={() => goTo('describe')} disabled={busy !== null}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Edit my description
                </Button>
                <Button variant="outline" onClick={handleGenerateIdeas} disabled={busy !== null}>
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Generate 3 new ideas
                </Button>
              </div>
            </div>
          )}

          {!generating && draft.step === 'customize' && selected && (
            <div className="mx-auto max-w-3xl space-y-6">
              <Button variant="ghost" onClick={() => goTo('choose')} disabled={busy !== null}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to ideas
              </Button>
              <div>
                <h2 className="text-2xl font-bold">Customise “{selected.title}”</h2>
                <p className="text-gray-600">{selected.description}</p>
              </div>
              <IdeaCustomizationForm
                value={draft.customization}
                onChange={(customization) => update({ ...draft, customization }, false)}
                onSubmit={handleGeneratePrompts}
                busy={busy !== null}
                existingFeatures={selected.features}
              />
            </div>
          )}

          {!generating && draft.step === 'prompts' && selected && draft.prompts && (
            <div className="mx-auto max-w-4xl space-y-6">
              <div className="text-center">
                <Badge className="mb-3 bg-green-100 text-green-800 hover:bg-green-100">Ready to build</Badge>
                <h2 className="text-2xl font-bold">Your prompts for “{selected.title}”</h2>
                <p className="text-gray-600">Save the project to keep these prompts and follow the step-by-step build guide.</p>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <PromptCards prompts={draft.prompts} />
                </CardContent>
              </Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" onClick={() => void saveProject(selected, true)} disabled={busy !== null} className="bg-green-600 text-white hover:bg-green-700">
                  {busy === 'saving' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                  Save project & start building
                </Button>
                <Button size="lg" variant="outline" onClick={() => goTo('customize')} disabled={busy !== null}>
                  <ArrowLeft className="mr-2 h-5 w-5" /> Change options
                </Button>
              </div>
            </div>
          )}

          {draft.step !== 'describe' && (
            <div className="mt-10 text-center">
              <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => setConfirmReset(true)} disabled={busy !== null}>
                Start over with a new idea
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start over?</AlertDialogTitle>
            <AlertDialogDescription>This clears the ideas and prompts in the workshop. Saved projects are not affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={startOver}>Start over</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default IdeaWorkshop;
