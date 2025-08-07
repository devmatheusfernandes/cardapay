import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ElementType;
}

const InputField = ({ icon: Icon, ...props }: InputFieldProps) => (
    <div className="relative">
        <Icon className="absolute w-5 h-5 text-slate-400 top-3 left-3" />
        <input {...props} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-rose-500 focus:border-rose-500 transition" />
    </div>
);

export default InputField;
