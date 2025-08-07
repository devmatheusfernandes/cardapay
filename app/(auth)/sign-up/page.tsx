'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase'; // Adjust path as needed
import { UserPlus, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// NOTE: In a real project, Button and Input would be reusable components in `/components/ui`
// For simplicity here, they are styled directly.

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
        setError('Password should be at least 6 characters.');
        setIsLoading(false);
        return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // After successful sign-up, we'll redirect the user to the dashboard.
      // In a more complex app, you might redirect to an onboarding flow.
      router.push('/dashboard');
    } catch (err: any) {
      // Handle Firebase errors
      let errorMessage = 'Failed to create an account. Please try again.';
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email address is already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'The password is too weak.';
          break;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600">Cardapay</h1>
          <p className="mt-2 text-gray-600">Create your account to get started.</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute w-5 h-5 text-gray-400 top-3.5 left-4" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute w-5 h-5 text-gray-400 top-3.5 left-4" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition"
            />
          </div>
          
          {/* Confirm Password Input */}
          <div className="relative">
            <Lock className="absolute w-5 h-5 text-gray-400 top-3.5 left-4" />
            <input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 transition"
            />
          </div>
          
          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-center text-red-500"
            >
              {error}
            </motion.p>
          )}

          {/* Submit Button */}
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-opacity-50 transition"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
              {!isLoading && <UserPlus className="w-5 h-5" />}
            </motion.button>
          </div>
        </form>

        <p className="mt-8 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-teal-600 hover:text-teal-700">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
