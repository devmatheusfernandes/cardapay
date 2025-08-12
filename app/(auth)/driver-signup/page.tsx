"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { UserPlus, Mail, Lock, User, Phone, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import InputField from "@/app/components/ui/InputField";
import { toast, Toaster } from "react-hot-toast";

const BackButton = () => (
  <Link
    href="/"
    className="absolute top-4 left-4 md:top-6 md:left-6 cursor-pointer"
  >
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer flex items-center gap-1 text-slate-600 hover:text-emerald-600 transition-colors"
    >
      <ChevronLeft className="w-8 h-8" />
      <span className="text-md font-medium">Voltar</span>
    </motion.button>
  </Link>
);

const generateDriverCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function DriverSignUpPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading("Criando sua conta...");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const driverCode = generateDriverCode();
      const driverRef = doc(db, "drivers", user.uid);
      await setDoc(driverRef, {
        uid: user.uid,
        name: name,
        phone: phone,
        email: user.email,
        code: driverCode,
        restaurantId: null,
        createdAt: Timestamp.now(),
      });

      toast.success("Conta criada com sucesso!", { id: toastId });
      router.push("/driver/dashboard");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        toast.error("Este email já está em uso.", { id: toastId });
      } else {
        toast.error("Não foi possível criar a conta.", { id: toastId });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-18 md:py-0 bg-gradient-to-br from-emerald-50 to-slate-50 text-slate-900 px-4 relative">
      <BackButton />
      <Toaster position="top-center" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl border border-slate-100"
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
          <h1 className="text-3xl font-bold text-slate-800">
            Cadastro de Entregador
          </h1>
          <p className="mt-2 text-slate-600">
            Crie sua conta para começar a fazer entregas
          </p>
        </motion.div>

        <form onSubmit={handleSignUp} className="space-y-6">
          {[
            {
              icon: User,
              type: "text",
              value: name,
              onChange: setName,
              placeholder: "Seu nome completo",
              required: true,
            },
            {
              icon: Phone,
              type: "tel",
              value: phone,
              onChange: setPhone,
              placeholder: "Seu telefone",
              required: true,
            },
            {
              icon: Mail,
              type: "email",
              value: email,
              onChange: setEmail,
              placeholder: "Seu email",
              required: true,
            },
            {
              icon: Lock,
              type: "password",
              value: password,
              onChange: setPassword,
              placeholder: "Crie uma senha",
              required: true,
            },
            {
              icon: Lock,
              type: "password",
              value: confirmPassword,
              onChange: setConfirmPassword,
              placeholder: "Confirme sua senha",
              required: true,
            },
          ].map((field, index) => (
            <motion.div
              key={index}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <InputField
                icon={field.icon}
                type={field.type}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            </motion.div>
          ))}

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
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
                  Criar Conta
                  <UserPlus className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-sm text-center text-slate-600"
        >
          Já tem uma conta?{" "}
          <Link
            href="/driver-login"
            className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition"
          >
            Faça login
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
