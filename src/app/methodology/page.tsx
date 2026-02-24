import Link from "next/link";
import { ArrowLeft, BookOpen, Scale, AlertTriangle, CheckCircle, Target, Activity, FileText } from "lucide-react";

export default function Methodology() {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 font-sans text-slate-800">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center h-16 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold border border-indigo-100">
            <BookOpen size={14} />
            Official Documentation
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-24">
        
        {/* Title Block */}
        <div className="mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Advanced Legal AI Benchmarks
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl font-medium">
            A mathematically rigorous evaluation framework designed to quantify Generative AI performance on the Indian Penal Code (IPC) to Bharatiya Nyaya Sanhita (BNS) transition.
          </p>
        </div>

        <div className="prose prose-slate prose-indigo max-w-none">
          <p className="text-lg leading-relaxed text-slate-600 mb-8">
            Evaluating Large Language Models (LLMs) in high-stakes domains like Law requires moving beyond generic &quot;accuracy&quot; metrics. In legal informatics, a confident but fabricated assertion (hallucination) is catastrophically more dangerous than simply admitting ignorance. The framework below establishes a penalization paradigm inspired by global academic standards (e.g., LegalBench) to ensure AI is statistically safe for Indian jurisprudence.
          </p>

          <hr className="my-12 border-slate-200" />

          {/* Metric 1 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                <CheckCircle size={22} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">Legal Claim Truthfulness (LCT)</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              The baseline metric for substantive legal correctness. LCT measures the rate at which an LLM accurately interprets a legal scenario and pinpoints the exact, currently active statutory provision (down to the prevailing sub-clause) without conflating it with repealed law.
            </p>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm inline-block">
              <code className="text-sm font-bold text-slate-800 tracking-wide">
                LCT = (N_Truthful / N_Total) × 100
              </code>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm border border-red-200">
                <AlertTriangle size={22} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">Extrinsic Citation Hallucination Rate (ECHR)</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              <strong>The primary safety metric involving critical failure.</strong> Plausible but fabricated legal citations are known as &quot;extrinsic hallucinations.&quot; The ECHR calculates the frequency with which an LLM confidently asserts a legal fact supported by a non-existent statute, or insists an obsolete IPC section is active BNS law. High ECHR renders a model legally hostile.
            </p>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm inline-block">
              <code className="text-sm font-bold text-slate-800 tracking-wide">
               ECHR = (N_Hallucinated / N_Total) × 100
              </code>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                <Target size={22} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">Substantive Groundedness & Granularity (SGG)</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              This metric evaluates macro-level legislative awareness. It isolates &quot;partially correct&quot; outputs where the model successfully transitions to the correct BNS Chapter or general offense block, but lacks the high-resolution granularity to name the exact sub-section. It proves the model has unlearned legacy bias, even if it lacks precision.
            </p>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm inline-block">
              <code className="text-sm font-bold text-slate-800 tracking-wide">
               SGG = (N_Partially_Correct / N_Total) × 100
              </code>
            </div>
          </div>

           {/* Metric 4 */}
           <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shadow-sm border border-slate-200">
                <Activity size={22} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 m-0">Abstention & Calibration Rate (ACR)</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              A mathematically calibrated model knows what it doesn&apos;t know. The ACR tracks how often a model correctly recognizes epistemic uncertainty (often triggered by trap questions involving repealed statutes like IPC Sedition 124A) and safely refuses to answer rather than hallucinating an equivalent.
            </p>
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm inline-block">
              <code className="text-sm font-bold text-slate-800 tracking-wide">
               ACR = (N_Abstained / N_Total) × 100
              </code>
            </div>
          </div>

          <hr className="my-12 border-slate-200" />

          {/* LBAS Score */}
          <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-3xl mb-12 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <Scale size={24} />
              </div>
              <h2 className="text-3xl font-black text-indigo-900 m-0">LegalBench Adjusted Score (LBAS)</h2>
            </div>
            
            <p className="text-indigo-900/80 text-lg leading-relaxed mb-6 font-medium">
              The definitive composite leaderboard index mapping 0-100. It solves the &quot;Precision vs Danger Paradox&quot; by heavily penalizing hallucinations.
            </p>

            <div className="bg-white rounded-2xl p-6 border border-indigo-100 shadow-sm mb-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">The LBAS Penalization Formula</h3>
              <ul className="space-y-3 font-medium text-slate-700 m-0 p-0 list-none">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-black w-14">+1.0</span> <span className="text-slate-400">pts</span> for strict Truthfulness (LCT).
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500 font-black w-14">+0.5</span> <span className="text-slate-400">pts</span> for Groundedness (SGG).
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-400 font-black w-14">0.0</span> <span className="text-slate-400">pts</span> for Safe Abstention (ACR).
                </li>
                <li className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-red-500 font-black w-14">-1.0</span> <span className="text-slate-400">pts</span> penalty for Extrinsic Hallucinations (ECHR).
                </li>
              </ul>
            </div>

            <div className="flex gap-4 items-start">
              <div className="mt-1 text-red-500"><AlertTriangle size={20} /></div>
              <div>
                <h4 className="font-bold text-red-900 mb-1">Why do some models score 0?</h4>
                <p className="text-sm text-red-800/80 leading-relaxed m-0">
                  If an AI model hallucinates more fake legal citations than it gets correct (e.g., generating 20 true facts but 70 dangerous fabrications), its mathematical reliability falls below zero. Because a net-negative reliability model is entirely unsafe for any form of legal query extraction, the LBAS strictly floors the final index ranking at 0.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-16 flex justify-center">
             <Link href="/" className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-1">
                <FileText size={20} />
                Return to Live Dashboard
             </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
