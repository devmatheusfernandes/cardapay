"use client";

import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";

export default function WelcomeTrialPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <Gift className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-slate-800">
          Bem-vindo ao seu teste!
        </h1>
        <p className="text-slate-600 mt-2 mb-6">
          Você tem 7 dias para explorar todos os recursos gratuitamente.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
        >
          Começar a explorar
        </button>
      </div>
    </div>
  );
}
