import { Grade } from "@/app/page";
import { Check, X, Minus } from "lucide-react";

interface QuestionCardProps {
  questionIndex: number;
  questionText: string;
  models: string[];
  modelAnswers: Record<string, string[]>;
  grades: Record<string, Grade>;
  onGradeChange: (model: string, grade: Grade) => void;
  gradedBy?: Record<string, string>; // modelName -> userName
}

export default function QuestionCard({
  questionIndex,
  questionText,
  models,
  modelAnswers,
  grades,
  onGradeChange,
  gradedBy = {}
}: QuestionCardProps) {

  // Calculate initials and unique color from name
  const getUserStyle = (name: string) => {
    if (!name) return { initials: '', color: 'indigo' };
    
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    // Simple hash to get a consistent color for the same name
    const colors = ['indigo', 'blue', 'purple', 'emerald', 'rose', 'amber', 'cyan', 'pink'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];
    
    return { initials, color };
  };

  // Calculate how many are graded in this question
  const gradedCount = models.filter((m) => grades[m] !== undefined && grades[m] !== null).length;
  const isComplete = gradedCount === models.length;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm relative ${isComplete ? 'border-green-300 ring-1 ring-green-100' : 'border-slate-200'}`}>
      
      {/* Question Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shadow-sm">
              {questionIndex + 1}
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 leading-snug">
                {questionText || "Question text not available"}
              </h3>
            </div>
          </div>
          <div className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {gradedCount}/{models.length} Graded
          </div>
        </div>
      </div>

      {/* Grid of AI Answers */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {models.map((model) => {
            const answer = modelAnswers[model][questionIndex] || "No answer extracted";
            const currentGrade = grades[model];
            const authorName = gradedBy[model];
            const { initials, color } = getUserStyle(authorName || '');

            // dynamic class names based on user color
            const borderColors: Record<string, string> = {
              indigo: 'border-indigo-500 text-indigo-600',
              blue: 'border-blue-500 text-blue-600',
              purple: 'border-purple-500 text-purple-600',
              emerald: 'border-emerald-500 text-emerald-600',
              rose: 'border-rose-500 text-rose-600',
              amber: 'border-amber-500 text-amber-600',
              cyan: 'border-cyan-500 text-cyan-600',
              pink: 'border-pink-500 text-pink-600',
            };

            return (
              <div 
                key={model} 
                className={`flex flex-col justify-between rounded-xl border p-4 transition-all duration-300 relative group ${
                  currentGrade === 'correct' ? 'bg-green-50/50 border-green-300 ring-1 ring-green-100' :
                  currentGrade === 'somewhat correct' ? 'bg-yellow-50/50 border-yellow-300 ring-1 ring-yellow-100' :
                  currentGrade === 'wrong' ? 'bg-red-50/50 border-red-300 ring-1 ring-red-100' :
                  currentGrade === 'no answer' ? 'bg-slate-100/50 border-slate-300' :
                  'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* User Active Badge/Initials */}
                {authorName && (
                  <div 
                    className={`absolute -top-2 -right-2 w-7 h-7 bg-white border-2 ${borderColors[color]} rounded-lg flex items-center justify-center text-[10px] font-black z-10 shadow-sm`}
                    title={`Graded by ${authorName}`}
                  >
                    {initials}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <span className="text-sm font-bold text-slate-700">{model}</span>
                    {currentGrade === 'correct' && <Check size={16} className="text-green-600" />}
                    {currentGrade === 'somewhat correct' && <Check size={16} className="text-yellow-600" />}
                    {currentGrade === 'wrong' && <X size={16} className="text-red-600" />}
                    {currentGrade === 'no answer' && <Minus size={16} className="text-slate-500" />}
                  </div>
                  <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap leading-relaxed font-medium">
                    {answer}
                  </p>
                </div>

                {/* Grading Controls */}
                <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-slate-100/50">
                  <button
                    onClick={() => onGradeChange(model, currentGrade === "correct" ? null : "correct")}
                    className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs font-semibold ${
                      currentGrade === "correct"
                        ? "bg-green-500 text-white shadow-sm ring-1 ring-green-600"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                    title="Correct"
                  >
                    <Check size={14} className="mb-0.5" />
                    Correct
                  </button>
                  <button
                    onClick={() => onGradeChange(model, currentGrade === "somewhat correct" ? null : "somewhat correct")}
                    className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs font-semibold ${
                      currentGrade === "somewhat correct"
                        ? "bg-yellow-500 text-white shadow-sm ring-1 ring-yellow-600"
                        : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                    }`}
                    title="Somewhat Correct"
                  >
                    <Check size={14} className="mb-0.5" />
                    Somewhat
                  </button>
                  <button
                    onClick={() => onGradeChange(model, currentGrade === "wrong" ? null : "wrong")}
                    className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs font-semibold ${
                      currentGrade === "wrong"
                        ? "bg-red-500 text-white shadow-sm ring-1 ring-red-600"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                    title="Wrong"
                  >
                    <X size={14} className="mb-0.5" />
                    Wrong
                  </button>
                  <button
                    onClick={() => onGradeChange(model, currentGrade === "no answer" ? null : "no answer")}
                    className={`flex flex-col items-center justify-center p-2 rounded-md transition-all text-xs font-semibold ${
                      currentGrade === "no answer"
                        ? "bg-slate-500 text-white shadow-sm ring-1 ring-slate-600"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    title="No Answer"
                  >
                    <Minus size={14} className="mb-0.5" />
                    No Answer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

