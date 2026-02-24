"use client";

import { useState } from "react";
import { User, X } from "lucide-react";

interface UserModalProps {
  onNameSubmit: (name: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserModal({ onNameSubmit, isOpen, onClose }: UserModalProps) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 to-purple-600" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
            <User size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome to Evaluator</h2>
          <p className="text-slate-500 mb-8 px-4">
            Enter your name to track your contributions and collaborate with others in real-time.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Harshal Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-lg"
              />
            </div>
            
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] text-lg"
            >
              Continue to Evaluation
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
