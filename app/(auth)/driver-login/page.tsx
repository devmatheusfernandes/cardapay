"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { LogIn, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import InputField from "@/app/components/ui/InputField";
import { toast } from "react-hot-toast";
import BackButton from "@/app/components/shared/BackButton";

export default function DriverLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const toastId = toast.loading("Entrando...");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login bem-sucedido!", { id: toastId });
      router.push("/driver/dashboard");
    } catch (err: any) {
      toast.error("Email ou senha inválidos.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-slate-50 text-slate-900 px-4 relative">
      <BackButton pathLink={"/"} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-8 space-y-8 bg-emerald-100 rounded-2xl shadow-xl border border-slate-100"
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
              <LogIn className="w-8 h-8 text-emerald-600" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold text-emerald-900">
            Cardapay Entregas
          </h1>
          <p className="mt-2 text-slate-600">Acesse sua conta de entregador</p>
        </motion.div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <InputField
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu email"
              required
            />
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <InputField
              icon={Lock}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
            />
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
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
                  Entrar
                  <LogIn className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-sm text-center text-slate-600"
        >
          É proprietário de um restaurante?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition"
          >
            Acesse aqui
          </Link>
        </motion.p>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-center text-slate-600"
        >
          Quer fazer entregas?{" "}
          <Link
            href="/driver-signup"
            className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition"
          >
            Acesse aqui
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
