import React from 'react';

type TextAreaFieldProps = {
  /** Icon component to display inside the textarea */
  icon: React.ElementType<{ className?: string }>;
  /** Additional class names to apply to the container */
  containerClassName?: string;
  /** Number of visible text lines (default: 3) */
  rows?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    { 
      icon: Icon, 
      rows = 3, 
      containerClassName = '', 
      className = '', 
      ...props 
    }, 
    ref
  ) => (
    <div className={`relative ${containerClassName}`}>
      <Icon 
        className="absolute w-5 h-5 text-slate-400 top-3 left-3" 
        aria-hidden="true" 
      />
      <textarea
        ref={ref}
        rows={rows}
        {...props}
        className={`w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg 
                   focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                   transition-all duration-200 outline-none resize-y
                   placeholder:text-slate-400 ${className}`}
      />
    </div>
  )
);

TextAreaField.displayName = 'TextAreaField';
export default TextAreaField;