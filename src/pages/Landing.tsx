import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Github, KeyRound, Lightbulb, ListChecks, MessageSquare, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';

const STEPS = [
  { icon: Lightbulb, title: 'Describe your idea', text: 'Write a few sentences about the app you want and who it is for.' },
  { icon: Sparkles, title: 'Pick a version', text: 'The AI suggests three concrete takes on your idea, sized to your experience.' },
  { icon: Wand2, title: 'Get your prompts', text: 'Choose colours, layout and features. Get a Lovable prompt for the UI and a Cursor prompt for the backend.' },
  { icon: ListChecks, title: 'Follow the build guide', text: 'Step-by-step stages: Lovable → GitHub → Cursor + Firebase → deploy, with progress tracking.' },
];

const FEATURES = [
  { icon: MessageSquare, title: 'AI mentor', text: 'Ask about errors, commands or next steps. It knows which project and stage you are on.' },
  { icon: BookOpen, title: 'Toolkit lessons', text: 'Short lessons on Lovable, GitHub, Cursor, Firebase, TypeScript and Tailwind.' },
  { icon: KeyRound, title: 'Your own free key', text: 'Uses your free Google Gemini key. It stays in your browser and goes straight to Google.' },
  { icon: Github, title: 'Open source', text: 'AGPL-licensed. Run it for your class or community on your own Firebase project.' },
];

const Landing = () => {
  const { user } = useAuth();
  const primary = user ? { to: '/dashboard', label: 'Go to dashboard' } : { to: '/signup', label: 'Get started — free' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <nav className="container flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <a href="https://github.com/ByteBenderSA/companai" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </Button>
          {!user && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
          )}
          <Button size="sm" asChild className="bg-purple-600 text-white hover:bg-purple-700">
            <Link to={primary.to}>{user ? 'Dashboard' : 'Sign up'}</Link>
          </Button>
        </div>
      </nav>

      <section className="container py-16 text-center sm:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-800">
            <Sparkles className="h-4 w-4" /> For people learning to build with AI tools
          </p>
          <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 sm:text-6xl">
            From app idea to{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">ready-to-paste AI prompts</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl">
            CompanAI turns a rough idea into a clear project plan, writes the prompts for Lovable and Cursor, and guides you stage by stage until your app is live.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild className="h-auto w-full bg-purple-600 px-8 py-4 text-base text-white hover:bg-purple-700 sm:w-auto">
              <Link to={primary.to}>
                {primary.label} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-auto w-full px-8 py-4 text-base sm:w-auto">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-8 bg-white py-16 sm:py-20">
        <div className="container">
          <h2 className="mb-3 text-center text-3xl font-bold text-gray-900 sm:text-4xl">How it works</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-gray-600">The same workflow professional builders use with AI tools — broken into steps you can follow.</p>
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="rounded-xl border bg-gradient-to-br from-white to-purple-50/50 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-purple-700">Step {i + 1}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="text-sm text-gray-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container py-16 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-xl border bg-white p-6">
              <Icon className="h-6 w-6 shrink-0 text-purple-600" />
              <div>
                <h3 className="mb-1 font-semibold">{title}</h3>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-16 text-white">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold">What you'll need</h2>
          <p className="mx-auto mb-8 max-w-2xl text-purple-100">
            A free CompanAI account, a free Gemini API key from Google AI Studio, and free accounts on Lovable, GitHub and Firebase when you reach those stages. Cursor has a free tier too.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to={primary.to}>
              {primary.label} <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t bg-white py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-gray-500 sm:flex-row">
          <Logo />
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://github.com/ByteBenderSA/companai" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
              GitHub
            </a>
            <a href="https://github.com/ByteBenderSA/companai/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
              Contributing
            </a>
            <a href="https://github.com/ByteBenderSA/companai/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
              License (AGPL-3.0)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
