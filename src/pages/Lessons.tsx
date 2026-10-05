import { usePageTitle } from '@/hooks/use-page-title';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Code, Database, ExternalLink, Github, Heart, Loader2, Palette, SquarePen, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/AppLayout';
import { CelebrationModal } from '@/components/CelebrationModal';
import { dataErrorMessage } from '@/lib/data-errors';
import { useUser } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { LESSONS, type Lesson } from '@/lib/lessons';
import { setLessonComplete, subscribeToCompletedLessons } from '@/lib/progress';

const ICONS: Record<Lesson['icon'], LucideIcon> = {
  lovable: Heart,
  github: Github,
  cursor: SquarePen,
  firebase: Database,
  typescript: Code,
  tailwind: Palette,
};

function LessonView({ lesson, done, busy, onToggle, onNavigate }: { lesson: Lesson; done: boolean; busy: boolean; onToggle: () => Promise<boolean>; onNavigate: (id: string | null) => void }) {
  const index = LESSONS.findIndex((l) => l.id === lesson.id);
  const prev = LESSONS[index - 1];
  const next = LESSONS[index + 1];
  const Icon = ICONS[lesson.icon];

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" onClick={() => onNavigate(null)}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> All lessons
      </Button>

      <header className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${lesson.color}`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{lesson.title}</h1>
          <p className="text-gray-600">{lesson.description}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <Clock className="h-3.5 w-3.5" /> {lesson.timeEstimate}
          </p>
        </div>
      </header>

      <Card>
        <CardContent className="space-y-6 pt-6 text-gray-700">
          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">What is it?</h2>
            <p>{lesson.whatIs}</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Why it matters</h2>
            <p>{lesson.whyImportant}</p>
          </section>
          {lesson.videoUrl && (
            <section>
              <h2 className="mb-2 text-lg font-semibold text-gray-900">Watch</h2>
              <div className="aspect-video overflow-hidden rounded-lg bg-gray-100">
                <iframe
                  src={lesson.videoUrl}
                  title={`${lesson.title} video`}
                  className="h-full w-full"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Key features</h2>
            <ul className="space-y-1.5">
              {lesson.keyFeatures.map((f) => (
                <li key={f} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {f}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-lg bg-purple-50 p-4">
            <h2 className="mb-2 text-lg font-semibold text-purple-900">How you'll use it</h2>
            <p className="text-purple-900">{lesson.howWeUse}</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Quick tips</h2>
            <ul className="list-disc space-y-1.5 pl-5">
              {lesson.quickTips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">Learn more</h2>
            <div className="flex flex-wrap gap-2">
              {lesson.resources.map((r) => (
                <Button key={r.url} variant="outline" size="sm" asChild>
                  <a href={r.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> {r.title}
                  </a>
                </Button>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>

      <div className="space-y-3 rounded-xl border bg-white p-4">
        {done ? (
          <p className="flex items-center gap-2 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" /> You've completed this lesson.
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!done ? (
            <Button
              onClick={async () => {
                const ok = await onToggle();
                if (ok && next) onNavigate(next.id);
              }}
              disabled={busy}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              {next ? 'Complete & next lesson' : 'Mark lesson complete'}
            </Button>
          ) : next ? (
            <Button onClick={() => onNavigate(next.id)} className="bg-purple-600 text-white hover:bg-purple-700">
              Next: {next.title.split(' — ')[0]} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => onNavigate(null)} className="bg-purple-600 text-white hover:bg-purple-700">
              Back to all lessons
            </Button>
          )}
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {prev && (
              <Button variant="ghost" size="sm" onClick={() => onNavigate(prev.id)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
              </Button>
            )}
            {!done && next && (
              <Button variant="ghost" size="sm" onClick={() => onNavigate(next.id)}>
                Skip <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
            {done && (
              <Button variant="ghost" size="sm" onClick={() => void onToggle()} disabled={busy} className="text-gray-500">
                Mark as not done
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

const Lessons = () => {
  const user = useUser();
  const [params, setParams] = useSearchParams();
  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(
    () =>
      subscribeToCompletedLessons(
        user.uid,
        (ids) => {
          setCompleted(ids);
          setLoading(false);
        },
        () => setLoading(false)
      ),
    [user.uid]
  );

  const selected = LESSONS.find((l) => l.id === params.get('lesson')) ?? null;
  usePageTitle(selected ? selected.title : 'Lessons');

  const navigate = (id: string | null) => {
    setParams(id ? { lesson: id } : {});
    window.scrollTo({ top: 0 });
  };

  /** Returns true when the change was saved. */
  const toggle = async (lesson: Lesson): Promise<boolean> => {
    const done = !completed.includes(lesson.id);
    setBusy(true);
    try {
      await setLessonComplete(user.uid, lesson.id, done);
      if (done) {
        const total = new Set([...completed, lesson.id]).size;
        if (total === LESSONS.length) setCelebrate(true);
        else toast({ title: 'Lesson complete', description: `${total} of ${LESSONS.length} done.` });
      }
      return true;
    } catch (err) {
      toast({ title: "Couldn't save", description: dataErrorMessage(err), variant: 'destructive' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout>
      {selected ? (
        <LessonView lesson={selected} done={completed.includes(selected.id)} busy={busy} onToggle={() => toggle(selected)} onNavigate={navigate} />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tech Stack Essentials</h1>
              <p className="text-gray-600">Short lessons on the tools you'll use to build your app.</p>
            </div>
            <div className="w-full sm:w-64">
              <div className="mb-1 flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>
                  {completed.length}/{LESSONS.length}
                </span>
              </div>
              <Progress value={(completed.length / LESSONS.length) * 100} className="h-2" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16" aria-label="Loading">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LESSONS.map((lesson, i) => {
                const Icon = ICONS[lesson.icon];
                const done = completed.includes(lesson.id);
                return (
                  <Link
                    key={lesson.id}
                    to={`?lesson=${lesson.id}`}
                    className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    data-testid="lesson-card"
                  >
                  <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-r ${lesson.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        {done ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Done</Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Lesson {i + 1}</span>
                        )}
                      </div>
                      <CardTitle className="text-base">{lesson.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col justify-between gap-3">
                      <p className="text-sm text-gray-600">{lesson.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-3.5 w-3.5" /> {lesson.timeEstimate}
                        </span>
                        <span className="font-medium text-purple-700">{done ? 'Review' : 'Start'} →</span>
                      </div>
                    </CardContent>
                  </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
      <CelebrationModal open={celebrate} onClose={() => setCelebrate(false)} lessonCount={LESSONS.length} />
    </AppLayout>
  );
};

export default Lessons;
