import { Grade } from "@/app/page";
import { Check, X, Minus } from "lucide-react";

interface QuestionCardProps {
  batchId: number;
  questionIndex: number;
  questionText: string;
  models: string[];
  modelAnswers: Record<string, string[]>;
  grades: Record<string, Grade>;
  onGradeChange: (model: string, grade: Grade) => void;
}

export default function QuestionCard({
  questionIndex,
  questionText,
  models,
  modelAnswers,
  grades,
  onGradeChange,
}: QuestionCardProps) {

  // Calculate how many are graded in this question
  const gradedCount = models.filter((m) => grades[m] !== undefined && grades[m] !== null).length;
  const isComplete = gradedCount === models.length;

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm ${isComplete ? 'border-green-300 ring-1 ring-green-100' : 'border-slate-200'}`}>
      
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

            return (
              <div 
                key={model} 
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                  currentGrade === 'correct' ? 'bg-green-50/50 border-green-200' :
                  currentGrade === 'somewhat correct' ? 'bg-yellow-50/50 border-yellow-200' :
                  currentGrade === 'wrong' ? 'bg-red-50/50 border-red-200' :
                  currentGrade === 'no answer' ? 'bg-slate-100/50 border-slate-200' :
                  'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
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
