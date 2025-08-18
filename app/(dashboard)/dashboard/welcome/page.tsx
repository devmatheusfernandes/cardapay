"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import WelcomeModal from "@/app/components/profile/WelcomeModal";

export default function WelcomePage() {
  const router = useRouter();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Show the welcome modal after a short delay
    const timer = setTimeout(() => {
      setShowWelcomeModal(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-10 rounded-xl shadow-lg text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-800">Parabéns!</h1>
          <p className="text-slate-600 mt-2 mb-6">
            Seu plano foi ativado com sucesso.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
          >
            Vamos lá
          </button>
        </div>
      </div>

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </>
  );
}
