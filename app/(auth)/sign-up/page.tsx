"use client";

import { SetStateAction, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../../../lib/firebase";
// 1. Adicionar o ícone de Calendário
import { UserPlus, Mail, Lock, ChevronLeft, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import InputField from "@/app/components/ui/InputField";
import toast from "react-hot-toast";
import BackButton from "@/app/components/shared/BackButton";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // 2. Adicionar estado para a data de nascimento
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get("plan");
    const trial = searchParams.get("trial");

    // Se os parâmetros existirem, salve a intenção do usuário
    if (plan && trial) {
      const intent = { plan, trial };
      localStorage.setItem("redirectIntent", JSON.stringify(intent));
      console.log("Intenção de assinatura salva:", intent);
    }
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // 3. Implementar a lógica de validação de idade
    if (!birthDate) {
      setError("Por favor, insira sua data de nascimento.");
      setIsLoading(false);
      return;
    }

    const today = new Date();
    const dob = new Date(birthDate);
    // Calcula a idade
    let age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();
    // Ajusta a idade caso o aniversário ainda não tenha ocorrido no ano corrente
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < dob.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      setError("Você precisa ter pelo menos 18 anos para se cadastrar.");
      setIsLoading(false);
      return;
    }
    // Fim da validação de idade

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await sendEmailVerification(userCredential.user);
      toast.success(
        "Conta criada com sucesso! Um e-mail de verificação foi enviado."
      );
      router.push("/dashboard");
    } catch (err: any) {
      let errorMessage = "Falha ao criar conta. Por favor, tente novamente.";
      switch (err.code) {
        case "auth/email-already-in-use":
          errorMessage = "Este e-mail já está em uso.";
          break;
        case "auth/invalid-email":
          errorMessage = "Por favor, insira um e-mail válido.";
          break;
        case "auth/weak-password":
          errorMessage = "A senha é muito fraca.";
          break;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-slate-50 text-slate-900 px-4 relative">
      <BackButton pathLink="/" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-slate-100"
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center"
            >
              <UserPlus className="w-8 h-8 text-emerald-600" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Cardapay</h1>
          <p className="mt-2 text-slate-600">Crie sua conta para começar.</p>
        </motion.div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <InputField
              icon={Mail}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Endereço de e-mail"
            />
          </motion.div>

          {/* 4. Adicionar o campo de data de nascimento no formulário */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <label
              htmlFor="birthDate"
              className="block text-sm font-medium text-slate-700 mb-1 pl-1"
            >
              Data de Nascimento
            </label>
            <InputField
              icon={Calendar}
              id="birthDate"
              name="birthDate"
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }} // Atraso ajustado
          >
            <InputField
              icon={Lock}
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
            />
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }} // Atraso ajustado
          >
            <InputField
              icon={Lock}
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua senha"
            />
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden text-sm text-center text-red-500 pt-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }} // Atraso ajustado
            className="pt-2"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 transition-all"
            >
              {isLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="block w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  Criar Conta <UserPlus className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }} // Atraso ajustado
          className="mt-6 text-sm text-center text-slate-600"
        >
          Já tem uma conta?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition"
          >
            Faça login
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
