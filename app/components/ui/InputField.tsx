import React from "react";

type InputFieldProps = {
  /** Icon component to display inside the input */
  icon: React.ElementType<{ className?: string }>;
  /** Additional class names to apply to the container */
  containerClassName?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ icon: Icon, containerClassName = "", className = "", ...props }, ref) => (
    <div className={`relative ${containerClassName}`}>
      <Icon
        className="absolute w-5 h-5 text-slate-400 top-3 left-3"
        aria-hidden="true"
      />
      <input
        ref={ref}
        {...props}
        className={`w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg 
                   focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                   transition-all duration-200 outline-none
                   placeholder:text-slate-500 text-slate-600 ${className}`}
      />
    </div>
  )
);

InputField.displayName = "InputField";
export default InputField;
