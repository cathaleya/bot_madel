"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Menghindari timeout saat build di VPS
export const dynamic = "force-dynamic";

const susQuestions = [
  "Saya rasa saya akan sering menggunakan sistem ini.",
  "Saya rasa sistem ini terlalu rumit padahal bisa dibuat lebih sederhana.",
  "Saya rasa sistem ini mudah digunakan.",
  "Saya rasa saya membutuhkan bantuan orang teknis untuk dapat menggunakan sistem ini.",
  "Saya rasa berbagai fungsi dalam sistem ini terintegrasi dengan baik.",
  "Saya rasa terlalu banyak hal yang tidak konsisten pada sistem ini.",
  "Saya rasa orang lain akan belajar menggunakan sistem ini dengan cepat.",
  "Saya rasa sistem ini sangat membingungkan ketika digunakan.",
  "Saya rasa saya tidak menemui hambatan saat menggunakan sistem ini.",
  "Saya rasa saya perlu membiasakan diri terlebih dahulu sebelum menggunakan sistem ini."
];

export default function SurveyPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState("");
  const [showInstructions, setShowInstructions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAnswer = (qIndex: number, value: number) => {
    setAnswers({ ...answers, [qIndex]: value });
  };

  const isComplete = Object.keys(answers).length === susQuestions.length;

  const submitSurvey = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return router.push("/login");

    setIsSubmitting(true);

    let totalScore = 0;
    Object.entries(answers).forEach(([idx, val]) => {
      const qNum = parseInt(idx) + 1;
      if (qNum % 2 !== 0) { totalScore += (val - 1); } 
      else { totalScore += (5 - val); }
    });

    try {
      await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          totalScore, 
          answersJson: answers,
          feedback: feedback // Mengirimkan masukan pengguna
        }),
      });
      
      // KEMBALI KE DASHBOARD UNTUK MELIHAT HASIL
      router.push("/dashboard");
    } catch (err) { 
      console.error(err); 
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-slate-100"
         style={{ 
           backgroundImage: "url('/unj_bg_v2.png')",
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundAttachment: 'fixed'
         }}>

      <main className="relative z-10 max-w-xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {showInstructions ? (
            <motion.div 
              key="instructions"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-white p-8 rounded-[40px] shadow-3xl border border-slate-200"
            >
              <div className="flex items-center gap-3 mb-6 border-b pb-6">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Evaluasi Sistem</h1>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <h3 className="text-[11px] font-black text-amber-900 uppercase mb-1 tracking-widest">INSTRUKSI:</h3>
                  <p className="text-[10px] font-bold text-amber-800 leading-relaxed italic">
                    Berikan penilaian jujur Anda mengenai pengalaman menggunakan sistem HDAP ini. Penilaian Anda sangat berharga untuk pengembangan platform.
                  </p>
                </div>
              </div>

              <button onClick={() => setShowInstructions(false)} className="w-full py-5 bg-black text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">SAYA SIAP & MULAI SURVEY</button>
            </motion.div>
          ) : (
            <motion.div key="survey" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
               <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-white uppercase drop-shadow-2xl italic tracking-tighter">SURVEY KEPUASAN (SUS)</h2>
                  <div className="w-12 h-1.5 bg-white mx-auto mt-2 rounded-full shadow-lg"></div>
               </div>

               {susQuestions.map((q, i) => (
                 <motion.div key={i} className="bg-white border-2 border-slate-200 p-5 rounded-[30px] shadow-xl">
                   <div className="mb-4 p-4 bg-slate-50 border-l-[6px] border-slate-900 rounded-2xl">
                     <p className="text-[13px] text-slate-900 font-bold leading-tight italic">
                       <span className="text-slate-400 mr-1">#{i + 1}</span> {q}
                     </p>
                   </div>
                   
                   <div className="flex justify-between items-center gap-2 px-2">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter w-12 leading-none">Sangat Setuju</span>
                     <div className="flex justify-between gap-2 flex-1 max-w-[240px]">
                        {[5, 4, 3, 2, 1].map((val) => (
                          <button
                            key={val}
                            onClick={() => handleAnswer(i, val)}
                            className={`w-10 h-10 rounded-xl font-black text-xs transition-all flex items-center justify-center border-2 ${
                              answers[i] === val 
                                ? "bg-black border-black text-white shadow-xl scale-110" 
                                : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                     </div>
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter w-12 text-right leading-none">Tidak Setuju</span>
                   </div>
                 </motion.div>
               ))}

               {/* KOLOM FEEDBACK KHUSUS (BARU) */}
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                 className="bg-white border-2 border-blue-200 p-6 rounded-[30px] shadow-2xl mt-8"
               >
                 <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs">
                      <i className="fa-solid fa-comment-dots"></i>
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">MASUKAN & SARAN (FEEDBACK)</h3>
                 </div>
                 <textarea
                   className="w-full bg-blue-50/50 border-2 border-blue-100 rounded-2xl p-4 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-400 outline-none transition-all"
                   rows={4}
                   placeholder="Tuliskan pengalaman atau saran Anda untuk perbaikan website HDAP kedepannya..."
                   value={feedback}
                   onChange={(e) => setFeedback(e.target.value)}
                 />
                 <p className="text-[9px] font-bold text-blue-400 mt-2 italic">* Masukan Anda sangat membantu riset pengembangan platform ini.</p>
               </motion.div>

               <button 
                 disabled={!isComplete || isSubmitting} 
                 onClick={submitSurvey} 
                 className={`w-full py-5 mt-10 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-2xl ${
                   isComplete && !isSubmitting ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95" : "bg-slate-300 text-slate-500 cursor-not-allowed"
                 }`}
               >
                 {isSubmitting ? "MENGIRIM DATA..." : "SIMPAN & LIHAT HASIL"} 
                 {!isSubmitting && <i className="fa-solid fa-circle-check ml-2"></i>}
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
