import { motion } from "framer-motion";
import Link from "next/link"; // Correct import for Next.js Link
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  pathLink: string;
}

const BackButton: React.FC<BackButtonProps> = ({ pathLink }) => (
  <Link
    href={pathLink}
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

export default BackButton;
