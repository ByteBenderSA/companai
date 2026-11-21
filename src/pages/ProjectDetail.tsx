import { usePageTitle } from '@/hooks/use-page-title';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/AppLayout';
import { CopyButton } from '@/components/CopyButton';
import { ErrorNotice } from '@/components/ErrorNotice';
import { dataErrorMessage } from '@/lib/data-errors';
import { IdeaCustomizationForm } from '@/components/IdeaCustomizationForm';
import { Markdown } from '@/components/Markdown';
import { MentorButton, MentorChat } from '@/components/MentorChat';
import { PromptCards } from '@/components/PromptCards';
import { useProject } from '@/hooks/use-projects';
import { toast } from '@/hooks/use-toast';
import { generateBuildPrompts } from '@/lib/ai';
import { BUILD_STEPS } from '@/lib/build-steps';
import { ideaFromProject, projectStatus, type BuildStepId, type Project } from '@/lib/project-model';
import { featureLabels } from '@/lib/build-report-model';
import { deleteProject, saveProjectPrompts, setProjectStep } from '@/lib/projects';
import { DEFAULT_CUSTOMIZATION, type Customization } from '@/lib/prompts';

function RegenerateDialog({ project, open, onOpenChange }: { project: Project; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [customization, setCustomization] = useState<Customization>(() => ({ ...DEFAULT_CUSTOMIZATION, ...project.customization }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const prompts = await generateBuildPrompts(ideaFromProject(project), customization);
      await saveProjectPrompts(project.id, prompts, customization);
      toast({ title: 'New prompts saved' });
      onOpenChange(false);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate new prompts</DialogTitle>
          <DialogDescription>Choose the look and features, and the AI writes fresh Lovable and Cursor prompts. Your current prompts are replaced.</DialogDescription>
        </DialogHeader>
        {error ? <ErrorNotice error={error} onRetry={() => void submit()} /> : null}
        <IdeaCustomizationForm value={customization} onChange={setCustomization} onSubmit={() => void submit()} busy={busy} existingFeatures={featureLabels(project.features)} />
      </DialogContent>
    </Dialog>
  );
}

const TOOL = {
  lovable: { name: 'Lovable', url: 'https://lovable.dev', open: 'Open Lovable' },
  cursor: { name: 'Cursor', url: 'https://cursor.com', open: 'Get Cursor' },
} as const;

/** The one thing to do now: the next unfinished stage, with its prompt and tool one click away. */
function NextUpCard({ project, onShowGuide }: { project: Project; onShowGuide: (step: BuildStepId) => void }) {
  const index = BUILD_STEPS.findIndex((s) => !project.completedSteps.includes(s.id));
  if (index === -1) {
    return (
      <Card className="border-green-200 bg-green-50" data-testid="next-up">
        <CardContent className="flex flex-col gap-2 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-800">All four stages done 🎉</p>
          <p className="text-green-900">Share your live link, add a README with a screenshot, and put it in your portfolio. Then plan a v2 feature with the mentor.</p>
        </CardContent>
      </Card>
    );
  }
  const step = BUILD_STEPS[index];
  const prompt = step.usesPrompt ? project.prompts[step.usesPrompt] : undefined;
  const tool = step.usesPrompt ? TOOL[step.usesPrompt] : undefined;
  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white" data-testid="next-up">
      <CardContent className="space-y-3 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
          Next up · Stage {index + 1} of {BUILD_STEPS.length}
        </p>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
          <p className="text-sm text-gray-600">{step.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {prompt && tool && <CopyButton text={prompt} label={`Copy ${tool.name} prompt`} variant="primary" />}
          {tool && (
            <Button size="sm" variant="outline" asChild>
              <a href={tool.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" /> {tool.open}
              </a>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onShowGuide(step.id)}>
            Step-by-step guide ↓
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BuildGuide({ project, open, onOpenChange }: { project: Project; open: string; onOpenChange: (id: string) => void }) {
  const [pending, setPending] = useState<BuildStepId | null>(null);

  const toggle = async (step: BuildStepId, done: boolean) => {
    setPending(step);
    try {
      await setProjectStep(project, step, done);
      if (done && BUILD_STEPS.every((s) => s.id === step || project.completedSteps.includes(s.id))) {
        toast({ title: '🎉 Project complete!', description: 'Share your link and add it to your portfolio.' });
      }
      if (done) {
        // Move straight on to the next unfinished stage.
        const next = BUILD_STEPS.find((s) => s.id !== step && !project.completedSteps.includes(s.id));
        if (next) onOpenChange(next.id);
      }
    } catch (err) {
      toast({ title: "Couldn't save", description: dataErrorMessage(err), variant: 'destructive' });
    } finally {
      setPending(null);
    }
  };

  return (
    <Accordion type="single" collapsible value={open} onValueChange={onOpenChange} className="space-y-3">
      {BUILD_STEPS.map((step, i) => {
        const done = project.completedSteps.includes(step.id);
        return (
          <AccordionItem key={step.id} value={step.id} className="scroll-mt-20 rounded-lg border bg-white px-4" data-testid={`step-${step.id}`} id={`step-${step.id}`}>
            <AccordionTrigger className="gap-3 py-4 hover:no-underline">
              <span className="flex items-center gap-3 text-left">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done ? 'bg-green-600 text-white' : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span>
                  <span className="block font-semibold">{step.title}</span>
                  <span className="block text-sm font-normal text-gray-500">{step.summary}</span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-5">
              <Markdown>{step.guide(project.title)}</Markdown>
              {step.usesPrompt && !project.prompts[step.usesPrompt] && (
                <p className="text-sm text-amber-700">This project has no {step.usesPrompt === 'lovable' ? 'Lovable' : 'Cursor'} prompt yet — use “Generate new prompts” above.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {step.links.map((l) => (
                  <Button key={l.url} size="sm" variant="outline" asChild>
                    <a href={l.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      {l.label}
                    </a>
                  </Button>
                ))}
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm font-medium">
                <Checkbox checked={done} disabled={pending !== null} onCheckedChange={(c) => void toggle(step.id, c === true)} aria-label={`Mark "${step.title}" as done`} />
                {pending === step.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {done ? 'Done — nice work!' : 'Mark this stage as done'}
              </label>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { project, loading, error } = useProject(projectId);
  usePageTitle(project?.title ?? 'Project');
  const [regenOpen, setRegenOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mentorOpen, setMentorOpen] = useState(false);
  const [openStep, setOpenStep] = useState('');

  // Open the first unfinished stage when a project is first shown.
  const loadedId = project?.id;
  useEffect(() => {
    if (!loadedId || !project) return;
    setOpenStep(BUILD_STEPS.find((s) => !project.completedSteps.includes(s.id))?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when a different project loads
  }, [loadedId]);

  const showGuide = (step: BuildStepId) => {
    setOpenStep(step);
    requestAnimationFrame(() => document.getElementById(`step-${step}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleDelete = async () => {
    if (!project) return;
    try {
      await deleteProject(project.id);
      toast({ title: 'Project deleted' });
      navigate('/projects');
    } catch (err) {
      toast({ title: "Couldn't delete", description: dataErrorMessage(err), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-16" aria-label="Loading">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </AppLayout>
    );
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-md space-y-4 text-center">
          {error ? <ErrorNotice error={new Error(dataErrorMessage(error))} /> : <h1 className="text-xl font-semibold">Project not found</h1>}
          <p className="text-gray-600">It may have been deleted, or it belongs to another account.</p>
          <Button asChild variant="outline">
            <Link to="/projects">Back to projects</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const done = project.completedSteps.length;
  const status = projectStatus(project.completedSteps);

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-20">
        <Link to="/projects" className="inline-flex items-center text-sm font-medium text-purple-700 hover:text-purple-900">
          <ArrowLeft className="mr-1 h-4 w-4" /> All projects
        </Link>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {status}
            </Badge>
            <Badge variant="outline">{project.difficulty}</Badge>
            {project.timeEstimate && <Badge variant="outline">{project.timeEstimate}</Badge>}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-gray-700">{project.description}</p>
          {project.features.length > 0 && (
            <details className="text-sm text-gray-700">
              <summary className="cursor-pointer font-medium">Features ({project.features.length})</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {project.features.map((f) => (
                  <li key={f.id}>{f.label}</li>
                ))}
              </ul>
            </details>
          )}
          <div className="flex items-center gap-3 pt-1">
            <Progress value={(done / BUILD_STEPS.length) * 100} className="h-2 flex-1" />
            <span className="whitespace-nowrap text-sm text-gray-600">
              {done} / {BUILD_STEPS.length} stages
            </span>
          </div>
        </div>

        <NextUpCard project={project} onShowGuide={showGuide} />

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-xl">Your prompts</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setRegenOpen(true)}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Generate new prompts
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.promptsSource === 'template' && (
              <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                These are starter prompts. Click <span className="font-medium">Generate new prompts</span> for prompts tailored to your design and features.
              </p>
            )}
            {project.prompts.lovable || project.prompts.cursor ? (
              <PromptCards prompts={project.prompts} />
            ) : (
              <p className="text-sm text-gray-600">No prompts saved yet.</p>
            )}
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Build guide</h2>
          <BuildGuide project={project} open={openStep} onOpenChange={setOpenStep} />
        </section>

        <div className="border-t pt-6">
          <Button variant="ghost" className="text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Delete project
          </Button>
        </div>
      </div>

      {regenOpen && <RegenerateDialog project={project} open={regenOpen} onOpenChange={setRegenOpen} />}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{project.title}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes the project and its prompts. It can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MentorButton onClick={() => setMentorOpen(true)} />
      <MentorChat open={mentorOpen} onOpenChange={setMentorOpen} project={project} />
    </AppLayout>
  );
};

export default ProjectDetail;
