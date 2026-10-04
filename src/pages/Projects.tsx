import { Link } from 'react-router-dom';
import { FolderKanban, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { ErrorNotice } from '@/components/ErrorNotice';
import { dataErrorMessage } from '@/lib/data-errors';
import { ProjectCard } from '@/components/ProjectCard';
import { useUser } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';

const Projects = () => {
  const user = useUser();
  const { projects, loading, error } = useProjects(user.uid);

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Each project keeps its prompts and a step-by-step build guide.</p>
        </div>
        <Button asChild className="bg-purple-600 text-white hover:bg-purple-700">
          <Link to="/idea-workshop">
            <Lightbulb className="mr-1.5 h-4 w-4" /> New project
          </Link>
        </Button>
      </div>

      {error && <ErrorNotice error={new Error(dataErrorMessage(error))} />}

      {loading ? (
        <div className="flex justify-center py-16" aria-label="Loading">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : projects.length === 0 && !error ? (
        <div className="mx-auto max-w-md rounded-xl border border-dashed bg-white p-8 text-center">
          <FolderKanban className="mx-auto mb-3 h-10 w-10 text-purple-400" />
          <h2 className="mb-1 text-lg font-semibold">No projects yet</h2>
          <p className="mb-4 text-sm text-gray-600">Start in the Idea Workshop: describe your app and save the version you like.</p>
          <Button asChild className="bg-purple-600 text-white hover:bg-purple-700">
            <Link to="/idea-workshop">Open the Idea Workshop</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Projects;
