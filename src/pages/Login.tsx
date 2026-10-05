import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout, GoogleIcon, OrDivider } from '@/components/AuthLayout';
import { resetPassword, signInWithEmail, signInWithGoogle } from '@/lib/auth';
import { authErrorMessage, isUserCancelled } from '@/lib/auth-errors';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const attempt = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      navigate(from, { replace: true });
    } catch (err) {
      if (!isUserCancelled(err)) setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void attempt(() => signInWithEmail(email, password));
  };

  const onForgot = async () => {
    if (!email.trim()) {
      setError('Type your email address above, then click "Forgot password?" again.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await resetPassword(email);
      setNotice(`If an account exists for ${email.trim()}, a password reset link is on its way. Check your spam folder too.`);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to keep building."
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-purple-700 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void attempt(signInWithGoogle)}>
        <GoogleIcon /> Continue with Google
      </Button>
      <OrDivider />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button type="button" onClick={() => void onForgot()} className="text-xs font-medium text-purple-700 hover:underline" disabled={busy}>
              Forgot password?
            </button>
          </div>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-md bg-green-50 p-3 text-sm text-green-800">
            {notice}
          </p>
        )}
        <Button type="submit" className="w-full bg-purple-600 text-white hover:bg-purple-700" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log in
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
