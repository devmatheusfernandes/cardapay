'use client';

import { SetStateAction, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase'; // Adjust path as needed
import { LogIn, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
// Import the reusable InputField component
import InputField from '@/app/components/ui/InputField';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-rose-600">Cardapay</h1>
          <p className="mt-2 text-slate-600">Welcome back! Sign in to manage your restaurant.</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <InputField
            icon={Mail}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e: { target: { value: SetStateAction<string>; }; }) => setEmail(e.target.value)}
            placeholder="Email address"
          />

          <InputField
            icon={Lock}
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
          
          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-center text-red-500"
            >
              {error}
            </motion.p>
          )}

          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:bg-opacity-50 transition"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              {!isLoading && <LogIn className="w-5 h-5" />}
            </motion.button>
          </div>
        </form>

        <p className="mt-8 text-sm text-center text-slate-600">
          Don't have an account?{' '}
          <Link href="/sign-up" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign up now
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
