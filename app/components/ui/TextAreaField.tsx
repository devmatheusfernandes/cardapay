import React from 'react';

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon: React.ElementType;
}

const TextAreaField = ({ icon: Icon, ...props }: TextAreaFieldProps) => (
    <div className="relative">
        <Icon className="absolute w-5 h-5 text-slate-400 top-3 left-3" />
        <textarea {...props} rows={3} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 transition" />
    </div>
);

export default TextAreaField;
