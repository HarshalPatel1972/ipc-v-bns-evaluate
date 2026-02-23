import { Grade } from "@/app/page";
import { Check, X, Minus, HelpCircle } from "lucide-react";

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
  batchId,
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
                  currentGrade === 'incorrect' ? 'bg-red-50/50 border-red-200' :
                  currentGrade === 'empty' ? 'bg-slate-100/50 border-slate-200' :
                  'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <span className="text-sm font-bold text-slate-700">{model}</span>
                    {currentGrade === 'correct' && <Check size={16} className="text-green-600" />}
                    {currentGrade === 'incorrect' && <X size={16} className="text-red-600" />}
                    {currentGrade === 'empty' && <Minus size={16} className="text-slate-500" />}
                  </div>
                  <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap leading-relaxed font-medium">
                    {answer}
                  </p>
                </div>

                {/* Grading Controls */}
                <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-slate-100/50">
                  <button
                    onClick={() => onGradeChange(model, "correct")}
                    className={`flex-1 flex justify-center p-2 rounded-md transition-all ${
                      currentGrade === "correct"
                        ? "bg-green-500 text-white shadow-sm"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                    title="Correct"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => onGradeChange(model, "incorrect")}
                    className={`flex-1 flex justify-center p-2 rounded-md transition-all ${
                      currentGrade === "incorrect"
                        ? "bg-red-500 text-white shadow-sm"
                        : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                    title="Incorrect"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => onGradeChange(model, "empty")}
                    className={`flex-1 flex justify-center p-2 rounded-md transition-all ${
                      currentGrade === "empty"
                        ? "bg-slate-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    title="No Answer / Empty"
                  >
                    <Minus size={16} />
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
