'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
}

const Modal = ({ isOpen, onClose, children, title, size = 'md' }: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={onClose} // Close on backdrop click
        >
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
          >
            <div className="flex justify-between items-center p-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">{title}</h2>
              <button 
                onClick={onClose} 
                className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
                {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
