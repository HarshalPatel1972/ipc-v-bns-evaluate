"use client";

import { useState, useEffect } from "react";
import { ALL_BATCHES, MODELS } from "@/lib/data";
import QuestionCard from "@/components/QuestionCard";
import UserModal from "@/components/UserModal";
import UserLogs from "@/components/UserLogs";
import { Download, CheckCircle, FolderOpen, Users, LogIn, Shield, Lock, Trash2 } from "lucide-react";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");

  useEffect(() => {
    const savedAdmin = localStorage.getItem("eval_admin_session");
    if (savedAdmin === "true") setIsAdmin(true);
  }, []);
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

  // Loading state
  // Admin Powers
  const handleAdminLogin = () => {
    if (adminPinInput === "1972") {
      setIsAdmin(true);
      localStorage.setItem("eval_admin_session", "true");
      setShowAdminPinModal(false);
      setAdminPinInput("");
    } else {
      alert("Invalid Admin PIN");
      setAdminPinInput("");
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("eval_admin_session");
  };

  const handleDeleteUser = (nameToDelete: string) => {
    setData((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as GlobalGrades;
      if (next.userStats) {
        delete next.userStats[nameToDelete];
      }
      
      // Also clear their name from all graded cards to be thorough
      if (next.gradedBy) {
        Object.keys(next.gradedBy).forEach(bId => {
          const batch = next.gradedBy[Number(bId)];
          Object.keys(batch).forEach(qIdx => {
            const question = batch[Number(qIdx)];
            Object.keys(question).forEach(mName => {
              if (question[mName] === nameToDelete) {
                delete question[mName];
              }
            });
          });
        });
      }
      
      setLastLocalChange(Date.now());
      return next;
    });
  };

  const handleWipeAllData = () => {
    if (confirm("CRITICAL ACTION: Wipe all grades, user stats, and progress from the database? This cannot be undone.")) {
      setData({ grades: {}, gradedBy: {}, userStats: {} });
      setLastLocalChange(Date.now());
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Loading Evaluation Workspace...</h2>
      </div>
    );
  }

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
      if (!next.userStats) next.userStats = {};
      
      // Get previous state for this specific answer
      const prevGrade = next.grades[batchId]?.[questionIndex]?.[model];
      const prevAuthor = next.gradedBy[batchId]?.[questionIndex]?.[model];

      // Update Grade
      if (!next.grades[batchId]) next.grades[batchId] = {};
      if (!next.grades[batchId][questionIndex]) next.grades[batchId][questionIndex] = {};
      next.grades[batchId][questionIndex][model] = grade;

      // Update Attribution
      if (!next.gradedBy[batchId]) next.gradedBy[batchId] = {};
      if (!next.gradedBy[batchId][questionIndex]) next.gradedBy[batchId][questionIndex] = {};
      
      if (grade === null) {
        delete next.gradedBy[batchId][questionIndex][model];
      } else {
        next.gradedBy[batchId][questionIndex][model] = userName;
      }

      // Logic for userStats (Scoring)
      // CASE 1: Adding a new grade where there was nothing
      if (!prevGrade && grade) {
        next.userStats[userName] = (next.userStats[userName] || 0) + 1;
      }
      // CASE 2: Removing a grade entirely (un-clicking)
      else if (prevGrade && !grade) {
        if (prevAuthor) {
          next.userStats[prevAuthor] = Math.max(0, (next.userStats[prevAuthor] || 0) - 1);
        }
      }
      // CASE 3: Changing a grade that was set by SOMEONE ELSE
      else if (prevGrade && grade && prevAuthor !== userName) {
        // Take 1 away from the previous person
        if (prevAuthor) {
          next.userStats[prevAuthor] = Math.max(0, (next.userStats[prevAuthor] || 0) - 1);
        }
        // Give 1 to the new person
        next.userStats[userName] = (next.userStats[userName] || 0) + 1;
      }
      // CASE 4: Changing the grade value (e.g. Correct to Wrong) by the SAME person
      // No change needed to counts!

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
      <UserLogs 
        isOpen={showLogs} 
        onClose={() => setShowLogs(false)} 
        logs={data.userStats || {}} 
        isAdmin={isAdmin}
        onDeleteUser={handleDeleteUser}
      />

      {/* Admin PIN Modal */}
      {showAdminPinModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-xs w-full text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-600">
              <Lock size={24} />
            </div>
            <h2 className="text-xl font-bold mb-2">Admin Access</h2>
            <p className="text-sm text-slate-500 mb-6">Enter secret 4-digit PIN</p>
            <input 
              type="password" 
              maxLength={4}
              value={adminPinInput}
              onChange={(e) => setAdminPinInput(e.target.value)}
              className="w-full text-center text-2xl tracking-[1em] font-mono py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAdminPinModal(false)}
                className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdminLogin}
                className="flex-1 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div 
              className="bg-indigo-600 p-1.5 sm:p-2 rounded-lg text-white flex-shrink-0 cursor-default"
              onClick={() => setShowAdminPinModal(true)}
            >
              <CheckCircle size={18} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-base sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 truncate">
                BNS Evaluator
              </h1>
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">v2.3.0</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            {/* Desktop Progress Bar */}
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Progress</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-700">{gradedQuestionsCount}/{totalQuestions}</span>
              </div>
            </div>

            {/* Sync Status - Smaller on mobile */}
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-50 border border-slate-200 min-w-[60px] sm:min-w-[100px] justify-center">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${syncStatus === "saving" ? "bg-yellow-400 animate-pulse" : syncStatus === "error" ? "bg-red-500" : "bg-green-500"}`} />
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden xs:block">
                {syncStatus === "saving" ? "Saving" : syncStatus === "error" ? "Error" : "Synced"}
              </span>
            </div>

            {/* User Profile & My Contributions */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <button 
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 hover:bg-slate-50 border-r border-slate-100 transition-all text-slate-700"
              >
                {userName ? (
                  <>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-indigo-600 text-white flex items-center justify-center text-[8px] sm:text-[10px] font-black uppercase">
                      {userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap hidden md:block">{userName}</span>
                  </>
                ) : (
                  <>
                    <LogIn size={14} />
                    <span className="text-xs font-bold hidden xs:block">Sign In</span>
                  </>
                )}
              </button>
              
              <div className="px-1.5 sm:px-3 py-1 sm:py-1.5 flex flex-col items-center justify-center min-w-[40px] sm:min-w-[80px]">
                <span className="text-[7px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none mb-0.5">My Score</span>
                <span className="text-[10px] sm:text-xs font-black text-indigo-600 leading-none">
                  {userName ? (data.userStats?.[userName] || 0) : 0}
                </span>
              </div>
            </div>

            {isAdmin && (
              <button 
                onClick={handleAdminLogout}
                className="p-2 sm:p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all border border-red-100"
                title="Logout as Admin"
              >
                <Shield size={18} />
              </button>
            )}
            
            <button onClick={handleExport} className="p-2 sm:p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm flex-shrink-0">
              <Download size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Batch Navigation - Horizontally Scrollable on Mobile */}
        <div className="mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-max min-w-full">
            {ALL_BATCHES.map((batch) => (
              <button
                key={batch.batchId}
                onClick={() => setActiveBatchId(batch.batchId)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeBatchId === batch.batchId
                    ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <FolderOpen size={14} className={activeBatchId === batch.batchId ? "text-indigo-600" : "text-slate-400"} />
                Batch {batch.batchId}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Batch {activeBatch.batchId} Evaluation</h2>
            <p className="text-slate-500 mt-1 text-lg">Compare AI model responses against the official BNS framework.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button 
                onClick={handleWipeAllData}
                className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-all border border-red-100"
              >
                <Trash2 size={16} />
                Wipe All Data
              </button>
            )}
            <button 
              onClick={() => setShowLogs(true)}
              className="flex items-center gap-2 text-indigo-600 font-bold text-sm bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100 w-fit"
            >
              <Users size={16} />
              View Team Activity
            </button>
          </div>
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

      {/* Persistent Bottom Progress Bar for Mobile */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-3 flex lg:hidden items-center justify-between z-40 bg-white/90 backdrop-blur-md">
        <div className="flex flex-col gap-1 w-full max-w-[200px]">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Progress: {progressPercentage}%</span>
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>
        <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
          <span className="text-xs font-black text-indigo-700">{gradedQuestionsCount} / {totalQuestions}</span>
        </div>
      </div>
    </div>
  );
}

