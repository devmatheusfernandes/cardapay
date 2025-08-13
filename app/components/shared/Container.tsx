import { motion } from "framer-motion";
import React from "react";

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
}

interface SubContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "white" | "gray";
}

// Main section container for full page layouts
const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen bg-gradient-to-b from-slate-50 to-white pt-8 pb-22 px-4 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Sub container for content blocks within sections
const SubContainer: React.FC<SubContainerProps> = ({
  children,
  className = "",
  variant = "default",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "white":
        return "bg-white";
      case "gray":
        return "bg-gray-50";
      case "default":
      default:
        return "bg-emerald-50";
    }
  };

  return (
    <div
      className={`${getVariantStyles()} rounded-xl shadow-xs overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};

export { SectionContainer, SubContainer };
