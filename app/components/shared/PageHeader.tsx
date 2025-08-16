import { motion } from "framer-motion";
import React from "react";

interface ActionButton {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  isActive?: boolean;
  activeLabel?: string;
  activeIcon?: React.ReactNode;
}

interface SecondaryAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: ActionButton;
  secondaryAction?: SecondaryAction;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actionButton,
  secondaryAction,
  className = "",
}) => {
  const getButtonStyles = (
    variant: string = "primary",
    isActive: boolean = false
  ) => {
    const baseStyles =
      "flex items-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-colors";

    if (isActive && variant === "primary") {
      return `${baseStyles} bg-red-100 text-red-700 hover:bg-red-200`;
    }

    switch (variant) {
      case "primary":
        return `${baseStyles} bg-emerald-100 text-emerald-700 hover:bg-emerald-200`;
      case "secondary":
        return `${baseStyles} bg-gray-100 text-gray-700 hover:bg-gray-200`;
      case "danger":
        return `${baseStyles} bg-red-100 text-red-700 hover:bg-red-200`;
      default:
        return `${baseStyles} bg-emerald-100 text-emerald-700 hover:bg-emerald-200`;
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 ${className}`}
    >
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-emerald-900 bg-clip-text bg-gradient-to-r from-emerald-600 to-purple-600">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>

      <div className="flex gap-3">
        {secondaryAction &&
          (secondaryAction.href ? (
            <a
              href={secondaryAction.href}
              className={getButtonStyles(secondaryAction.variant)}
            >
              {secondaryAction.label}
            </a>
          ) : (
            <button
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className={`${getButtonStyles(secondaryAction.variant)} ${
                secondaryAction.disabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {secondaryAction.label}
            </button>
          ))}
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className={getButtonStyles(
              actionButton.variant,
              actionButton.isActive
            )}
          >
            {actionButton.isActive && actionButton.activeIcon
              ? actionButton.activeIcon
              : actionButton.icon}
            {actionButton.isActive && actionButton.activeLabel
              ? actionButton.activeLabel
              : actionButton.label}
          </button>
        )}
      </div>
    </motion.header>
  );
};

export default PageHeader;
