"use client";

import { useState, useEffect } from "react";
import { ALL_BATCHES, MODELS } from "@/lib/data";
import QuestionCard from "@/components/QuestionCard";
import { Download, CheckCircle, FolderOpen } from "lucide-react";

export type Grade = "correct" | "incorrect" | "empty" | null;

// The state structure: grades[batchId][questionIndex][modelName] = Grade
export type GlobalGrades = Record<number, Record<number, Record<string, Grade>>>;

export default function Home() {
  const [activeBatchId, setActiveBatchId] = useState<number>(1);
  const [grades, setGrades] = useState<GlobalGrades>({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("bns_eval_grades_v2");
    if (saved) {
      try {
        setGrades(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load grades from local storage", e);
      }
    }
  }, []);

  // Save to localStorage when grades change
  useEffect(() => {
    if (Object.keys(grades).length > 0) {
      localStorage.setItem("bns_eval_grades_v2", JSON.stringify(grades));
    }
  }, [grades]);

  const handleGradeChange = (
    batchId: number,
    questionIndex: number,
    model: string,
    grade: Grade
  ) => {
    setGrades((prev) => {
      const next = { ...prev };
      if (!next[batchId]) next[batchId] = {};
      if (!next[batchId][questionIndex]) next[batchId][questionIndex] = {};
      next[batchId][questionIndex] = {
        ...next[batchId][questionIndex],
        [model]: grade,
      };
      return next;
    });
  };

  const handleExport = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      models: MODELS,
      batches: ALL_BATCHES.map((b) => ({
        batchId: b.batchId,
        questions: b.questions.map((q, qIndex) => {
          const questionGrades: Record<string, any> = {};
          MODELS.forEach((model) => {
            const grade = grades[b.batchId]?.[qIndex]?.[model] || null;
            questionGrades[model] = {
              answer: b.modelAnswers[model]?.[qIndex] || "No answer extracted",
              evaluation: grade,
            };
          });
          return {
            questionIndex: qIndex,
            questionText: q,
            evaluations: questionGrades,
          };
        }),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bns_eval_results_all_batches_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeBatch = ALL_BATCHES.find((b) => b.batchId === activeBatchId);
  if (!activeBatch) return null;

  // Calculate overall progress across all batches
  const totalQuestions = ALL_BATCHES.reduce((acc, b) => acc + b.questions.length, 0);
  let gradedQuestionsCount = 0;
  ALL_BATCHES.forEach((b) => {
    b.questions.forEach((_, qIndex) => {
      const qGrades = grades[b.batchId]?.[qIndex];
      // A question is "graded" if ALL models have a non-null grade
      if (qGrades) {
        const hasAllModelsGraded = MODELS.every((m) => qGrades[m] !== undefined && qGrades[m] !== null);
        if (hasAllModelsGraded) {
          gradedQuestionsCount++;
        }
      }
    });
  });
  
  const progressPercentage = Math.round((gradedQuestionsCount / totalQuestions) * 100) || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <CheckCircle size={20} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              IPC vs BNS Evaluator
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Progress</span>
              <div className="flex items-center gap-3">
                <div className="w-48 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700 w-12 text-right">{gradedQuestionsCount}/{totalQuestions}</span>
              </div>
            </div>
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm ml-4"
            >
              <Download size={16} />
              Export JSON
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Batch Navigation */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-fit">
          {ALL_BATCHES.map((batch) => (
            <button
              key={batch.batchId}
              onClick={() => setActiveBatchId(batch.batchId)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeBatchId === batch.batchId
                  ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <FolderOpen size={16} className={activeBatchId === batch.batchId ? "text-indigo-600" : "text-slate-400"} />
              Batch {batch.batchId}
            </button>
          ))}
        </div>

        {/* Dashboard Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Batch {activeBatch.batchId} Evaluation</h2>
          <p className="text-slate-500 mt-2 text-lg">
            Reviewing {activeBatch.questions.length} questions. Compare the AI outputs against the official BNS framework.
          </p>
        </div>

        {/* Questions List */}
        <div className="space-y-8">
          {activeBatch.questions.map((question, qIndex) => (
            <QuestionCard
              key={`${activeBatch.batchId}-${qIndex}`}
              batchId={activeBatch.batchId}
              questionIndex={qIndex}
              questionText={question}
              models={MODELS}
              modelAnswers={activeBatch.modelAnswers}
              grades={grades[activeBatch.batchId]?.[qIndex] || {}}
              onGradeChange={(model, grade) => handleGradeChange(activeBatch.batchId, qIndex, model, grade)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
