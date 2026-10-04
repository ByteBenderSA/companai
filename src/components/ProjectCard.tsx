import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BUILD_STEPS } from '@/lib/build-steps';
import { projectStatus, timeAgo, type Project } from '@/lib/project-model';

const STATUS_STYLE = {
  planning: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  building: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  completed: 'bg-green-100 text-green-800 hover:bg-green-100',
} as const;

export function ProjectCard({ project }: { project: Project }) {
  const status = projectStatus(project.completedSteps);
  const done = project.completedSteps.length;
  const next = BUILD_STEPS.find((s) => !project.completedSteps.includes(s.id));
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      data-testid="project-card"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug text-gray-900">{project.title}</h3>
        <Badge className={`${STATUS_STYLE[status]} shrink-0 capitalize`}>{status}</Badge>
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-gray-600">{project.description}</p>
      <Progress value={(done / BUILD_STEPS.length) * 100} className="mb-2 h-2" aria-label={`${done} of ${BUILD_STEPS.length} stages done`} />
      <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500">
        <span>{next ? `Next: ${next.title}` : 'All stages done 🎉'}</span>
        <span>{timeAgo(project.updatedAt)}</span>
      </div>
    </Link>
  );
}
