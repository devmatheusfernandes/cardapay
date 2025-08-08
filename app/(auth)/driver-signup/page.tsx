'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../../lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { UserPlus, Mail, Lock, User, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import InputField from '@/app/components/ui/InputField';
import { toast, Toaster } from 'react-hot-toast';

const generateDriverCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function DriverSignUpPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Criando sua conta...');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const driverCode = generateDriverCode();
      const driverRef = doc(db, 'drivers', user.uid);
      await setDoc(driverRef, {
        uid: user.uid,
        name: name,
        phone: phone,
        email: user.email,
        code: driverCode,
        restaurantId: null,
        createdAt: Timestamp.now(),
      });

      toast.success('Conta criada com sucesso!', { id: toastId });
      router.push('/driver/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        toast.error('Este email já está em uso.', { id: toastId });
      } else {
        toast.error('Não foi possível criar a conta.', { id: toastId });
      }
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
          <h1 className="text-4xl font-bold text-rose-600">Cadastro de Entregador</h1>
          <p className="mt-2 text-slate-600">Crie sua conta para começar a fazer entregas.</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          <InputField icon={User} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" required />
          <InputField icon={Phone} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Seu telefone" required />
          <InputField icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu email" required />
          <InputField icon={Lock} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crie uma senha" required />
          <InputField icon={Lock} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme sua senha" required />
          
          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-white bg-rose-600 hover:bg-rose-700 transition"
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
              {!isLoading && <UserPlus className="w-5 h-5" />}
            </motion.button>
          </div>
        </form>
         <p className="mt-8 text-sm text-center text-slate-600">
          Já tem uma conta?{' '}
          <Link href="/driver-login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Faça login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
