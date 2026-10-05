import { Code } from 'lucide-react';

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600">
        <Code className="h-4 w-4 text-white" />
      </span>
      <span className="bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-lg font-bold text-transparent">CompanAI</span>
    </span>
  );
}
