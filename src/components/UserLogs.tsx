"use client";

import { User, Activity } from "lucide-react";

interface UserLog {
  name: string;
  count: number;
  lastActive: string;
}

interface UserLogsProps {
  logs: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserLogs({ logs, isOpen, onClose }: UserLogsProps) {
  if (!isOpen) return null;

  const sortedLogs = Object.entries(logs)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const totalActions = sortedLogs.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-white h-full w-full max-w-sm shadow-2xl p-8 flex flex-col animate-in slide-in-from-right duration-500"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Activity size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">User Activity</h2>
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
            sortedLogs.map((log) => (
              <div key={log.name} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition-all shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {log.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{log.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Active contributor</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-indigo-600 font-black text-lg">{log.count}</span>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Grades</span>
                </div>
              </div>
            ))
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
