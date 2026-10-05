import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout, GoogleIcon, OrDivider } from '@/components/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle, signUpWithEmail } from '@/lib/auth';
import { authErrorMessage, isUserCancelled } from '@/lib/auth-errors';

const Signup = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const attempt = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (!isUserCancelled(err)) setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Choose a password with at least 6 characters.');
      return;
    }
    void attempt(() => signUpWithEmail(email, password, name));
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Free and open source. You'll add your own Gemini key after signing up."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-purple-700 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void attempt(signInWithGoogle)}>
        <GoogleIcon /> Sign up with Google
      </Button>
      <OrDivider />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="Ada Lovelace" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="text-xs text-gray-500">
            At least 6 characters.
          </p>
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full bg-purple-600 text-white hover:bg-purple-700" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Signup;
