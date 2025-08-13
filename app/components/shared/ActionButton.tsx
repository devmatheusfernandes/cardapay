import { motion } from "framer-motion";
import React from "react";
import { LoaderCircle } from "lucide-react";

interface ActionButtonProps {
  label: any;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
}

const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onClick,
  icon,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className = "",
  fullWidth = false,
  type = "button",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
      case "secondary":
        return "bg-gray-100 text-gray-700 hover:bg-gray-200";
      case "danger":
        return "bg-red-100 text-red-700 hover:bg-red-200";
      case "success":
        return "bg-green-100 text-green-700 hover:bg-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200";
      default:
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "py-2 px-3 text-xs";
      case "md":
        return "py-3 px-4 text-sm";
      case "lg":
        return "py-4 px-6 text-base";
      default:
        return "py-3 px-4 text-sm";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "w-3 h-3";
      case "md":
        return "w-4 h-4";
      case "lg":
        return "w-5 h-5";
      default:
        return "w-4 h-4";
    }
  };

  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <motion.button
      type={type}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${widthStyles} ${className}`}
    >
      {isLoading ? (
        <LoaderCircle className={`${getIconSize()} animate-spin`} />
      ) : (
        icon
      )}
      {label}
    </motion.button>
  );
};

export default ActionButton;
