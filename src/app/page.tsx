"use client";

import { useState, useEffect } from "react";
import { ALL_BATCHES, MODELS } from "@/lib/data";
import QuestionCard from "@/components/QuestionCard";
import UserModal from "@/components/UserModal";
import UserLogs from "@/components/UserLogs";
import { Download, CheckCircle, FolderOpen, Users, LogIn } from "lucide-react";

export type Grade = "correct" | "somewhat correct" | "wrong" | "no answer" | null;

// The state structure: 
// grades[batchId][questionIndex][modelName] = Grade
// gradedBy[batchId][questionIndex][modelName] = userName
export type GlobalGrades = {
  grades: Record<number, Record<number, Record<string, Grade>>>;
  gradedBy: Record<number, Record<number, Record<string, string>>>;
  userStats: Record<string, number>;
};

export default function Home() {
  const [activeBatchId, setActiveBatchId] = useState<number>(1);
  const [data, setData] = useState<GlobalGrades>({ grades: {}, gradedBy: {}, userStats: {} });
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastLocalChange, setLastLocalChange] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">("synced");
  
  // User Management
  const [userName, setUserName] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Load username on mount
  useEffect(() => {
    const savedName = localStorage.getItem('evaluator_user_name');
    if (savedName) {
      setUserName(savedName);
    } else {
      setShowUserModal(true);
    }
  }, []);

  const handleNameSubmit = (name: string) => {
    setUserName(name);
    localStorage.setItem('evaluator_user_name', name);
    setShowUserModal(false);
  };

  // Load from global API
  const fetchGrades = async () => {
    if (Date.now() - lastLocalChange < 5000) return;

    try {
      const res = await fetch('/api/grades', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      
      setData(prev => {
        if (JSON.stringify(prev) === JSON.stringify(json)) return prev;
        
        // Ensure the data structure is always valid even if server returns partially empty
        return {
          grades: json?.grades || {},
          gradedBy: json?.gradedBy || {},
          userStats: json?.userStats || {}
        };
      });
      setIsLoaded(true);
    } catch (e) {
      console.error("Failed to load global grades", e);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    fetchGrades();
    const interval = setInterval(fetchGrades, 5000);
    return () => clearInterval(interval);
  }, [lastLocalChange]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Loading Evaluation Workspace...</h2>
      </div>
    );
  }

  // Save to global API when data changes
  useEffect(() => {
    if (!isLoaded || lastLocalChange === 0) return;
    
    const saveData = async () => {
      setSyncStatus("saving");
      try {
        const res = await fetch('/api/grades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res.ok) setSyncStatus("synced");
        else setSyncStatus("error");
      } catch (e) {
        setSyncStatus("error");
      }
    };

    const timeout = setTimeout(saveData, 1000);
    return () => clearTimeout(timeout);
  }, [data, isLoaded, lastLocalChange]);

  const handleGradeChange = (
    batchId: number,
    questionIndex: number,
    model: string,
    grade: Grade
  ) => {
    // If no name, prompt them
    if (!userName) {
      setShowUserModal(true);
      return;
    }

    setLastLocalChange(Date.now());
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as GlobalGrades;
      
      // Ensure structure exists
      if (!next.grades) next.grades = {};
      if (!next.gradedBy) next.gradedBy = {};
      
      // Update Grade
      if (!next.grades[batchId]) next.grades[batchId] = {};
      if (!next.grades[batchId][questionIndex]) next.grades[batchId][questionIndex] = {};
      
      const prevGrade = next.grades[batchId][questionIndex][model];
      next.grades[batchId][questionIndex][model] = grade;

      // Update Attribution
      if (!next.gradedBy[batchId]) next.gradedBy[batchId] = {};
      if (!next.gradedBy[batchId][questionIndex]) next.gradedBy[batchId][questionIndex] = {};
      
      if (grade === null) {
        delete next.gradedBy[batchId][questionIndex][model];
      } else {
        next.gradedBy[batchId][questionIndex][model] = userName;
      }

      // Update userStats (only if new or changed)
      if (userName) {
        if (!next.userStats) next.userStats = {};
        
        // If they changed a grade or added a new one, count it
        if (!prevGrade && grade) {
          next.userStats[userName] = (next.userStats[userName] || 0) + 1;
        } else if (prevGrade && !grade) {
          next.userStats[userName] = Math.max(0, (next.userStats[userName] || 0) - 1);
        }
      }

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
          const questionGrades: Record<string, { answer: string; evaluation: Grade | null, author?: string }> = {};
          MODELS.forEach((model) => {
            const grade = data?.grades?.[b.batchId]?.[qIndex]?.[model] || null;
            const author = data?.gradedBy?.[b.batchId]?.[qIndex]?.[model];
            questionGrades[model] = {
              answer: b.modelAnswers[model]?.[qIndex] || "No answer extracted",
              evaluation: grade,
              author: author
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

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bns_eval_results_complete_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeBatch = ALL_BATCHES.find((b) => b.batchId === activeBatchId);
  if (!activeBatch) return null;

  // Calculate overall progress
  const totalQuestions = ALL_BATCHES.reduce((acc, b) => acc + (b?.questions?.length || 0), 0);
  let gradedQuestionsCount = 0;
  
  if (data?.grades) {
    ALL_BATCHES.forEach((b) => {
      const batchGrades = data.grades[b.batchId];
      if (batchGrades) {
        b.questions.forEach((_, qIndex) => {
          const qGrades = batchGrades[qIndex];
          if (qGrades) {
            const hasAllModelsGraded = MODELS.every((m) => qGrades[m] !== undefined && qGrades[m] !== null);
            if (hasAllModelsGraded) gradedQuestionsCount++;
          }
        });
      }
    });
  }
  
  const progressPercentage = Math.round((gradedQuestionsCount / totalQuestions) * 100) || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <UserModal isOpen={showUserModal} onClose={() => setShowUserModal(false)} onNameSubmit={handleNameSubmit} />
      <UserLogs isOpen={showLogs} onClose={() => setShowLogs(false)} logs={data.userStats || {}} />

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
            {/* Progress Bar */}
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Progress</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-700">{gradedQuestionsCount}/{totalQuestions}</span>
              </div>
            </div>

            {/* Sync Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 min-w-[100px] justify-center">
              <div className={`w-2 h-2 rounded-full ${syncStatus === "saving" ? "bg-yellow-400 animate-pulse" : syncStatus === "error" ? "bg-red-500" : "bg-green-500"}`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {syncStatus === "saving" ? "Saving" : syncStatus === "error" ? "Error" : "Synced"}
              </span>
            </div>

            {/* User Profile */}
            <button 
              onClick={() => userName ? setShowLogs(true) : setShowUserModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-all text-indigo-700 group"
            >
              {userName ? (
                <>
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black uppercase">
                    {userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </div>
                  <span className="text-xs font-bold whitespace-nowrap hidden sm:block">{userName}</span>
                  <Users size={14} className="text-indigo-400 group-hover:text-indigo-600" />
                </>
              ) : (
                <>
                  <LogIn size={14} />
                  <span className="text-xs font-bold">Sign In</span>
                </>
              )}
            </button>
            
            <button onClick={handleExport} className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm">
              <Download size={18} />
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

        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Batch {activeBatch.batchId} Evaluation</h2>
            <p className="text-slate-500 mt-1 text-lg">Compare AI model responses against the official BNS framework.</p>
          </div>
          <button 
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100 w-fit"
          >
            <Users size={16} />
            View Team Activity
          </button>
        </div>

        <div className="space-y-8">
          {activeBatch.questions.map((question, qIndex) => (
            <QuestionCard
              key={`${activeBatch.batchId}-${qIndex}`}
              questionIndex={qIndex}
              questionText={question}
              models={MODELS}
              modelAnswers={activeBatch.modelAnswers}
              grades={data?.grades?.[activeBatch.batchId]?.[qIndex] || {}}
              gradedBy={data?.gradedBy?.[activeBatch.batchId]?.[qIndex] || {}}
              onGradeChange={(model, grade) => handleGradeChange(activeBatch.batchId, qIndex, model, grade)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

