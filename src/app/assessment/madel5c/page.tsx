"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Menghindari timeout saat build di VPS
export const dynamic = "force-dynamic";

interface Option {
  text: string;
  score: number;
}

interface Question {
  id?: number;
  scenario: string;
  options: Option[];
}

export default function Madel5cAssessment() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showStageBreak, setShowStageBreak] = useState(false);
  const [breakStage, setBreakStage] = useState(1);
  const router = useRouter();

  const optionColors = [
    "bg-white border-slate-100 text-slate-900",
    "bg-white border-slate-100 text-slate-900",
    "bg-white border-slate-100 text-slate-900",
    "bg-white border-slate-100 text-slate-900",
    "bg-white border-slate-100 text-slate-900"
  ];

  const shuffleArray = (array: Option[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/questions?type=madel5c', { cache: 'no-store' });
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const shuffledQuestions = data.map((q: Question) => ({
          ...q,
          options: shuffleArray(q.options)
        }));
        setQuestions(shuffledQuestions);
      } else {
        console.error("Data soal kosong atau bukan array");
      }
    } catch (err) { 
      console.error("Gagal mengambil soal:", err); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchQuestions(); 
  }, [fetchQuestions]);

  const submitAssessment = useCallback(async (finalAnswers: Record<number, number>) => {
    const userId = localStorage.getItem("userId");
    if (!userId) return router.push("/login");
    const totalScore = Object.values(finalAnswers).reduce((a, b) => a + b, 0);
    try {
      await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type: "MADEL5C", totalScore, answersJson: finalAnswers }),
      });
      // Tampilkan kartu terima kasih
      setIsSubmitted(true);
    } catch (err) { console.error(err); }
  }, [router]);

  const handleAnswer = (idx: number) => {
    if (!questions[currentStep]) return;
    const selectedOption = questions[currentStep].options[idx];
    const newAnswers = { ...answers, [currentStep]: selectedOption.score };
    setAnswers(newAnswers);
    setTimeout(() => {
      if (currentStep === 9) {
        setBreakStage(1);
        setShowStageBreak(true);
      } else if (currentStep === 19) {
        setBreakStage(2);
        setShowStageBreak(true);
      } else if (currentStep < questions.length - 1) { 
        setCurrentStep(currentStep + 1); 
        window.scrollTo(0,0); 
      }
      else { 
        submitAssessment(newAnswers); 
      }
    }, 300);
  };

  const handleNextStage = () => {
    setShowStageBreak(false);
    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-black text-xs uppercase tracking-widest text-slate-400">Menghubungkan ke Database Soal...</p>
    </div>
  );

  if (questions.length === 0) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <i className="fa-solid fa-triangle-exclamation text-rose-500 text-4xl mb-4"></i>
      <p className="font-black text-sm uppercase tracking-widest text-slate-900 mb-4">Soal gagal dimuat.</p>
      <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Coba Lagi</button>
    </div>
  );

  return (
    <div className="min-h-screen relative"
         style={{ backgroundImage: "url('/unj_bg_v2.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>

      <main className="relative z-10 max-w-lg mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-10 rounded-[50px] shadow-3xl border border-slate-200 text-center"
            >
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <i className="fa-solid fa-circle-check text-5xl"></i>
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-4 italic">TERIMA KASIH BANYAK!</h2>
              <div className="w-12 h-1.5 bg-emerald-500 mx-auto rounded-full mb-6"></div>
              <p className="text-sm font-bold text-slate-600 leading-relaxed mb-8">
                Anda telah berhasil menyelesaikan instrumen asesmen MADEL5C. Silakan melanjutkan untuk mengisi survey evaluasi sistem.
              </p>
              <button 
                onClick={() => router.push("/survey")}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all active:scale-95"
              >
                LANJUT KE SURVEY KEPUASAN <i className="fa-solid fa-arrow-right ml-2"></i>
              </button>
            </motion.div>
          ) : showInstructions ? (
            <motion.div key="instructions" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-[40px] shadow-3xl border border-slate-200"
            >
              <div className="flex items-center gap-4 mb-6 border-b pb-6">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="fa-solid fa-list-check text-2xl"></i>
                </div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Panduan MADEL5C</h1>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h3 className="text-[11px] font-black text-emerald-900 uppercase mb-1">Cara Pengisian:</h3>
                  <p className="text-[10px] font-bold text-emerald-800 leading-relaxed italic">
                    &quot;Baca skenario situasi nyata yang muncul, lalu pilih satu tindakan yang menurut Anda paling tepat.&quot;
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <h3 className="text-[11px] font-black text-blue-900 uppercase mb-1">Struktur Pengisian:</h3>
                  <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                    Instrumen terdiri dari <strong className="font-black text-blue-900">30 butir</strong> yang dibagi menjadi <strong className="font-black text-blue-900">3 tahap pengisian</strong> (masing-masing 10 butir) dengan sebaran dimensi yang seimbang. Anda dapat beristirahat sejenak di sela-sela perpindahan tahap.
                  </p>
                </div>
              </div>

              <button onClick={() => setShowInstructions(false)} className="w-full py-5 bg-[#4B5320] text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">MULAI ASESMEN AKHIR</button>
            </motion.div>
          ) : showStageBreak ? (
            <motion.div key="break" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-[40px] shadow-3xl border border-slate-200 text-center"
            >
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <i className="fa-solid fa-mug-hot text-4xl animate-bounce"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-3">
                Tahap {breakStage} Selesai!
              </h2>
              <div className="w-12 h-1 bg-amber-500 mx-auto rounded-full mb-4"></div>
              <p className="text-[12px] font-bold text-slate-600 leading-relaxed mb-6">
                Hebat! Anda telah menyelesaikan 10 butir pada Tahap {breakStage}. 
                Istirahatlah sejenak untuk mengistirahatkan mata dan meregangkan tubuh Anda sebelum melanjutkan ke Tahap {breakStage + 1}.
              </p>
              <button 
                onClick={handleNextStage}
                className="w-full py-5 bg-[#4B5320] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
              >
                LANJUT KE TAHAP {breakStage + 1} <i className="fa-solid fa-arrow-right ml-2"></i>
              </button>
            </motion.div>
          ) : (
            <motion.div key="assessment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xl flex justify-between items-center">
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Tahap {Math.floor(currentStep / 10) + 1} dari 3</p>
                   <span className="text-lg font-black text-slate-900 italic">Skenario #{(currentStep % 10) + 1} dari 10</span>
                </div>
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                   <div className="h-full bg-[#4B5320] transition-all duration-500" style={{ width: `${(((currentStep % 10) + 1) / 10) * 100}%` }}></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[40px] shadow-3xl border border-slate-200">
                <div className="mb-6 p-6 bg-slate-50 border-l-[6px] border-[#4B5320] rounded-2xl shadow-inner">
                  <p className="text-[14px] text-slate-900 font-bold leading-relaxed italic">&quot;{questions[currentStep]?.scenario}&quot;</p>
                </div>
                <div className="space-y-3">
                  {questions[currentStep]?.options?.map((opt, idx: number) => (
                    <button key={idx} onClick={() => handleAnswer(idx)}
                      className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                        answers[currentStep] === opt.score 
                        ? "bg-[#4B5320] border-[#4B5320] text-white shadow-xl scale-[1.02]" 
                        : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-[13px] font-bold leading-tight block">{opt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
