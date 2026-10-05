import { usePageTitle } from '@/hooks/use-page-title';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Circle, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/AppLayout';
import { ErrorNotice } from '@/components/ErrorNotice';
import { dataErrorMessage } from '@/lib/data-errors';
import { MentorButton, MentorChat } from '@/components/MentorChat';
import { ProjectCard } from '@/components/ProjectCard';
import { useUser } from '@/contexts/AuthContext';
import { useOpenSettings } from '@/contexts/SettingsDialogContext';
import { useProjects } from '@/hooks/use-projects';
import { BUILD_STEPS } from '@/lib/build-steps';
import { LESSONS } from '@/lib/lessons';
import { subscribeToCompletedLessons } from '@/lib/progress';
import { useSettings } from '@/lib/settings';

interface ChecklistItem {
  done: boolean;
  title: string;
  detail: string;
  action: { label: string; to?: string; onClick?: () => void };
}

function Checklist({ items }: { items: ChecklistItem[] }) {
  const doneCount = items.filter((i) => i.done).length;
  if (doneCount === items.length) return null;
  return (
    <Card className="border-purple-200" data-testid="getting-started">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-lg">
          Getting started
          <span className="text-sm font-normal text-gray-500">
            {doneCount} of {items.length} done
          </span>
        </CardTitle>
        <Progress value={(doneCount / items.length) * 100} className="h-2" />
      </CardHeader>
      <CardContent>
        <ol className="divide-y">
          {items.map((item) => (
            <li key={item.title} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                {item.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-gray-300" />}
                <div>
                  <p className={item.done ? 'font-medium text-gray-500 line-through' : 'font-medium text-gray-900'}>{item.title}</p>
                  {!item.done && <p className="text-sm text-gray-600">{item.detail}</p>}
                </div>
              </div>
              {!item.done &&
                (item.action.to ? (
                  <Button asChild size="sm" variant="outline" className="shrink-0 self-start sm:self-auto">
                    <Link to={item.action.to}>{item.action.label}</Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="shrink-0 self-start sm:self-auto" onClick={item.action.onClick}>
                    {item.action.label}
                  </Button>
                ))}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

const Dashboard = () => {
  usePageTitle('Dashboard');
  const user = useUser();
  const settings = useSettings();
  const openSettings = useOpenSettings();
  const { projects, loading, error } = useProjects(user.uid);
  const [lessonsDone, setLessonsDone] = useState<string[]>([]);
  const [mentorOpen, setMentorOpen] = useState(false);

  useEffect(() => subscribeToCompletedLessons(user.uid, setLessonsDone, () => undefined), [user.uid]);

  const latest = projects[0] ?? null;
  const nextStep = latest ? BUILD_STEPS.find((s) => !latest.completedSteps.includes(s.id)) : undefined;
  const firstName = user.name.split(' ')[0];

  const checklist: ChecklistItem[] = [
    {
      done: Boolean(settings.geminiApiKey.trim()),
      title: 'Add your free Gemini API key',
      detail: 'Takes about two minutes and powers every AI feature.',
      action: { label: 'Add key', onClick: openSettings },
    },
    {
      done: projects.length > 0,
      title: 'Turn your idea into a project',
      detail: 'Describe your app in the Idea Workshop and save the version you like.',
      action: { label: 'Open workshop', to: '/idea-workshop' },
    },
    {
      done: projects.some((p) => p.completedSteps.includes('lovable')),
      title: 'Build your UI in Lovable',
      detail: 'Paste your Lovable prompt, then tick the stage off on your project page.',
      action: { label: latest ? 'Open project' : 'See projects', to: latest ? `/projects/${latest.id}` : '/projects' },
    },
    {
      done: lessonsDone.length > 0,
      title: 'Learn the toolkit',
      detail: 'Short lessons on Lovable, GitHub, Cursor and Firebase.',
      action: { label: 'Start lessons', to: '/lessons' },
    },
  ];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Welcome, {firstName}!</h1>
        <p className="text-gray-600">Here's where you left off.</p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorNotice error={new Error(dataErrorMessage(error))} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {!loading && !latest && <Checklist items={checklist} />}

          {loading ? (
            <div className="flex justify-center py-12" aria-label="Loading">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : latest ? (
            <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
              <CardContent className="space-y-3 p-6">
                <p className="text-sm text-purple-100">Continue building</p>
                <h2 className="text-2xl font-bold">{latest.title}</h2>
                <p className="text-purple-50">{nextStep ? `Next stage: ${nextStep.title} — ${nextStep.summary}` : 'Every stage is done. Time to share it!'}</p>
                <Button asChild variant="secondary" className="mt-2">
                  <Link to={`/projects/${latest.id}`}>
                    Open project <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <Lightbulb className="h-8 w-8 text-yellow-500" />
                <h2 className="text-xl font-semibold">Start with an idea</h2>
                <p className="text-gray-600">Describe the app you want to build. The AI suggests three versions and writes the prompts for you.</p>
                <Button asChild className="bg-purple-600 text-white hover:bg-purple-700">
                  <Link to="/idea-workshop">Open the Idea Workshop</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* With a project in progress, continuing it matters most; the checklist moves below. */}
          {!loading && latest && <Checklist items={checklist} />}

          {projects.length > 1 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent projects</h2>
                <Link to="/projects" className="text-sm font-medium text-purple-700 hover:underline">
                  View all ({projects.length})
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.slice(1, 5).map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-purple-600" /> Lessons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={(lessonsDone.length / LESSONS.length) * 100} className="h-2" />
              <p className="text-sm text-gray-600">
                {lessonsDone.length} of {LESSONS.length} lessons complete
              </p>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/lessons">{lessonsDone.length ? 'Continue learning' : 'Start learning'}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Stuck?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>The AI mentor knows your latest project and can explain errors, commands and next steps.</p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setMentorOpen(true)}>
                Ask the mentor
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <MentorButton onClick={() => setMentorOpen(true)} />
      <MentorChat open={mentorOpen} onOpenChange={setMentorOpen} project={latest} />
    </AppLayout>
  );
};

export default Dashboard;
