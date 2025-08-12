"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, CheckCircle, Calendar } from "lucide-react";
import InputField from "../ui/InputField";

// The shape of the data the modal collects and submits
export interface ProfileData {
  name: string;
  phone: string;
}

interface ProfileSetupModalProps {
  isOpen: boolean;
  onSubmit: (data: ProfileData) => Promise<void>;
  onClose: () => void;
  initialData?: ProfileData; // To pre-fill the form for editing
  title: string; // To set a custom title e.g., "Complete seu Perfil" vs "Editar Perfil"
}

export default function ProfileSetupModal({
  isOpen,
  onSubmit,
  onClose,
  initialData,
  title,
}: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // When the modal opens, pre-fill the form if initialData is provided (for editing)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setPhone(initialData.phone || "");
    }
  }, [initialData]);

  const validateAndSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Phone validation (Brazilian format)
    const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;
    if (!phoneRegex.test(phone)) {
      setError("Por favor, insira um telefone válido (ex: 11 99999-9999).");
      return;
    }

    if (!name.trim() || !phone.trim()) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({ name, phone });
      // The parent component handles closing the modal via the onClose prop
    } catch (err) {
      setError("Ocorreu um erro ao salvar. Tente novamente.");
      setIsLoading(false); // Only set loading false on error
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="text-center relative z-10 mb-8">
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-bold text-slate-800"
              >
                {title}
              </motion.h2>
            </div>

            <form
              onSubmit={validateAndSubmit}
              className="space-y-5 relative z-10"
            >
              <InputField
                icon={User}
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
              />
              <InputField
                icon={Phone}
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefone (ex: 11 99999-9999)"
              />

              {error && (
                <p className="text-sm text-center text-red-500">{error}</p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 transition-all"
              >
                {isLoading ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="block w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    {" "}
                    Salvar <CheckCircle className="w-5 h-5" />{" "}
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
