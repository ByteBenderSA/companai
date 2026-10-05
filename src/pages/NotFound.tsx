import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 text-center">
    <Logo />
    <h1 className="text-4xl font-bold text-gray-900">Page not found</h1>
    <p className="text-gray-600">The link may be old or mistyped.</p>
    <Button asChild className="bg-purple-600 text-white hover:bg-purple-700">
      <Link to="/">Go to the home page</Link>
    </Button>
  </div>
);

export default NotFound;
