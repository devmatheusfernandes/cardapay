'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { LogIn, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import InputField from '@/app/components/ui/InputField';
import { toast, Toaster } from 'react-hot-toast';

export default function DriverLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading('Entrando...');

    try {
      // Aqui, apenas autenticamos. A verificação se é um entregador será feita no painel.
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Login bem-sucedido!', { id: toastId });
      router.push('/driver/dashboard');
    } catch (err: any) {
      toast.error('Email ou senha inválidos.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-900">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-rose-600">Cardapay Entregas</h1>
          <p className="mt-2 text-slate-600">Acesse sua conta de entregador.</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <InputField
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu email"
            required
          />
          <InputField
            icon={Lock}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
          />
          
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-white bg-rose-600 hover:bg-rose-700 transition"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
              {!isLoading && <LogIn className="w-5 h-5" />}
            </motion.button>
          </div>
        </form>
         <p className="mt-8 text-sm text-center text-slate-600">
          É proprietário de um restaurante?{' '}
          <Link href="/sign-in" className="font-medium text-indigo-600 hover:text-indigo-700">
            Acesse aqui
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
