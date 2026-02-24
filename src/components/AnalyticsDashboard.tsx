"use client";

import React, { useMemo } from 'react';
import { MODELS, ALL_BATCHES } from '@/lib/data';
import { GlobalGrades } from '@/app/page';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { X, Activity, BarChart3, Target, AlertTriangle, Scale } from 'lucide-react';

interface AnalyticsDashboardProps {
  data: GlobalGrades;
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalyticsDashboard({ data, isOpen, onClose }: AnalyticsDashboardProps) {
  const metrics = useMemo(() => {
    const rawResults: Record<string, { correct: number, somewhat: number, wrong: number, noAnswer: number, total: number }> = {};
    MODELS.forEach(m => {
      rawResults[m] = { correct: 0, somewhat: 0, wrong: 0, noAnswer: 0, total: 0 };
    });

    ALL_BATCHES.forEach(batch => {
      batch.questions.forEach((_, qIdx) => {
        MODELS.forEach(model => {
          const grade = data?.grades?.[batch.batchId]?.[qIdx]?.[model];
          rawResults[model].total += 1;
          
          if (grade === "correct") rawResults[model].correct += 1;
          else if (grade === "somewhat correct") rawResults[model].somewhat += 1;
          else if (grade === "wrong") rawResults[model].wrong += 1;
          else rawResults[model].noAnswer += 1;
        });
      });
    });

    return MODELS.map(model => {
      const r = rawResults[model];
      const total = Math.max(r.total, 1);
      
      const lct = Number(((r.correct / total) * 100).toFixed(1));
      const echr = Number(((r.wrong / total) * 100).toFixed(1));
      const sgg = Number(((r.somewhat / total) * 100).toFixed(1));
      const acr = Number(((r.noAnswer / total) * 100).toFixed(1));
      
      const rawLbas = (r.correct * 1.0) + (r.somewhat * 0.5) + (r.noAnswer * 0) + (r.wrong * -1.0);
      const lbas = Number(Math.max(0, Math.min(100, (rawLbas / total) * 100)).toFixed(1));

      return {
        name: model,
        LCT: lct,
        ECHR: echr,
        SGG: sgg,
        ACR: acr,
        LBAS: lbas,
        correct: r.correct,
        somewhat: r.somewhat,
        wrong: r.wrong,
        noAnswer: r.noAnswer,
        totalGraded: r.total
      };
    }).sort((a, b) => b.LBAS - a.LBAS);
  }, [data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
      <div className="bg-white w-full h-full md:w-[95%] md:h-[95vh] md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-sm">
              <BarChart3 size={24} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">Live Academic Benchmarks</h2>
              <p className="text-xs md:text-sm text-slate-500 font-medium">BNS Legal AI Evaluation Framework</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          
          {/* Top Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-[100px] flex items-start justify-end p-3 text-emerald-500">
                <Target size={18} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Top Truthfulness (LCT)</span>
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-black text-slate-900">{metrics[0]?.name.split(' ')[0]}</span>
                <span className="text-sm font-semibold text-emerald-600">{metrics[0]?.LCT}% Legal Truth</span>
              </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-[100px] flex items-start justify-end p-3 text-indigo-500">
                <Scale size={18} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Top Academic Index (LBAS)</span>
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-black text-slate-900">{metrics[0]?.name.split(' ')[0]}</span>
                <span className="text-sm font-semibold text-indigo-600">{metrics[0]?.LBAS} LBAS Score</span>
              </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-[100px] flex items-start justify-end p-3 text-red-500">
                <AlertTriangle size={18} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Highest Hallucination (ECHR)</span>
              <div className="flex flex-col">
                {(() => {
                  const sortedEchr = [...metrics].sort((a,b) => b.ECHR - a.ECHR);
                  return (
                    <>
                      <span className="text-2xl md:text-3xl font-black text-slate-900">{sortedEchr[0]?.name.split(' ')[0]}</span>
                      <span className="text-sm font-semibold text-red-600">{sortedEchr[0]?.ECHR}% Fake Citations</span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-[100px] flex items-start justify-end p-3 text-blue-500">
                <Activity size={18} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Graded</span>
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-black text-slate-900">{metrics[0]?.totalGraded * MODELS.length}</span>
                <span className="text-sm font-semibold text-slate-500">evaluations</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: LBAS Leaderboard */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="mb-2">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-1 cursor-help group relative">
                  <Scale size={20} className="text-indigo-600" />
                  LBAS Leaderboard
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  The <strong className="text-slate-700">LegalBench Adjusted Score</strong> (0-100) ranks models by heavily rewarding Truthfulness (LCT) while fundamentally penalizing Extrinsic Hallucinations (ECHR).
                </p>
              </div>
              
              <div className="flex flex-col gap-4 mt-2">
                {metrics.map((m, idx) => (
                  <div key={m.name} className="flex items-center gap-4 group">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-sm border
                      ${idx === 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                        idx === 1 ? 'bg-slate-100 text-slate-600 border-slate-200' : 
                        idx === 2 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-slate-50 text-slate-400 border-slate-100'}
                    `}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-end justify-between mb-1.5">
                        <span className="text-sm font-bold text-slate-800">{m.name}</span>
                        <span className="text-sm font-black text-indigo-600">{m.LBAS}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-300 group-hover:bg-indigo-400'}`}
                          style={{ width: `${m.LBAS}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Charts */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Stacked Bar Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[350px] flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Performance Distribution</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Breakdown of Legal Claim Truthfulness (LCT), Groundedness (SGG), Extrinsic Hallucination (ECHR), and Abstention (ACR).</p>
                </div>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                        labelStyle={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                      <Bar dataKey="correct" name="LCT (Truthful)" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="somewhat" name="SGG (Partial/Granular)" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="wrong" name="ECHR (Hallucinated)" stackId="a" fill="#ef4444" />
                      <Bar dataKey="noAnswer" name="ACR (Safe Abstention)" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Scatter Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-[350px] flex flex-col">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Truthfulness vs. Hallucination Matrix</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Bottom-Right quadrant represents models that are highly truthful (High LCT) while avoiding dangerous fabrications (Low ECHR).</p>
                </div>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        type="number" 
                        dataKey="LCT" 
                        name="Truthfulness (LCT)" 
                        unit="%" 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      >
                      </XAxis>
                      <YAxis 
                        type="number" 
                        dataKey="ECHR" 
                        name="Danger (ECHR)" 
                        unit="%" 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ZAxis type="number" dataKey="LBAS" range={[50, 400]} name="Overall LBAS" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Scatter name="Models" data={metrics} fill="#6366f1">
                        {metrics.map((entry, index) => (
                           <text 
                             key={`label-${index}`} 
                             x={entry.LCT} 
                             y={entry.ECHR} 
                             dy={-15} 
                             textAnchor="middle" 
                             fill="#475569" 
                             fontSize={11} 
                             fontWeight="bold"
                           >
                             {entry.name.split(' ')[0]}
                           </text>
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-xs text-slate-400 mt-2 font-medium">
                  Bottom-Right is Best (High Precision, Low Danger). Bubble size = WLCI Score.
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
