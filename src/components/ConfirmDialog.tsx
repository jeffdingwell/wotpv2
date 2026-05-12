import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = "Confirm action", message }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white max-w-sm w-full shadow-2xl overflow-hidden pointer-events-auto"
            >
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertCircle className="text-red-500" size={24} />
                  <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                </div>
                <p className="text-gray-500 leading-relaxed font-light">
                  {message}
                </p>
              </div>

              <div className="flex border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-4 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors uppercase tracking-widest"
                >
                  No
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="flex-1 px-4 py-4 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors uppercase tracking-widest"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
