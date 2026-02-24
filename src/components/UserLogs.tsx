"use client";

import { User, Activity, Trash2 } from "lucide-react";

interface UserLogsProps {
  logs: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onDeleteUser?: (name: string) => void;
}

export default function UserLogs({ logs, isOpen, onClose, isAdmin, onDeleteUser }: UserLogsProps) {
  if (!isOpen) return null;

  const sortedLogs = Object.entries(logs)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const totalActions = sortedLogs.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white h-full w-full sm:max-w-md shadow-2xl p-6 sm:p-8 flex flex-col animate-in slide-in-from-right duration-500"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Activity size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Team Contributions</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <User size={20} />
          </button>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Contributions</span>
          <span className="text-3xl font-black text-slate-900">{totalActions}</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {sortedLogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 italic">No activity recorded yet.</p>
            </div>
          ) : (
            sortedLogs.map((log) => {
              const colors = ['indigo', 'blue', 'purple', 'emerald', 'rose', 'amber', 'cyan', 'pink'];
              let hash = 0;
              for (let i = 0; i < log.name.length; i++) {
                hash = log.name.charCodeAt(i) + ((hash << 5) - hash);
              }
              const color = colors[Math.abs(hash) % colors.length];

              const colorVariants: Record<string, string> = {
                indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600',
                blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600',
                purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-600',
                emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600',
                rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600',
                amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600',
                cyan: 'bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600',
                pink: 'bg-pink-50 text-pink-600 group-hover:bg-pink-600',
              };

              return (
              <div key={log.name} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-slate-300 transition-all shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${colorVariants[color]} rounded-lg flex items-center justify-center font-bold text-sm group-hover:text-white transition-all`}>
                    {log.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{log.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Active contributor</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-indigo-600 font-black text-lg">{log.count}</span>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Grades</span>
                  </div>
                  {isAdmin && onDeleteUser && (
                    <button 
                      onClick={() => {
                        if (confirm(`Delete user "${log.name}" and all their contribution stats?`)) {
                          onDeleteUser(log.name);
                        }
                      }}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            )})
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live Syncing Active
          </p>
        </div>
      </div>
    </div>
  );
}
