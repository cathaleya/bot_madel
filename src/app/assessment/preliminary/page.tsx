"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Menghindari timeout saat build di VPS
export const dynamic = "force-dynamic";

const pdiQuestions = [
  "Saya mampu mengidentifikasi kebutuhan informasi digital untuk mendukung penyusunan karya ilmiah.",
  "Saya mampu menyeleksi sumber informasi digital yang valid dan kredibel untuk tugas perkuliahan.",
  "Saya mampu mengorganisasi file-file digital materi kuliah secara sistematis agar mudah dicari.",
  "Saya mampu berkomunikasi secara sopan dan profesional melalui media digital kepada dosen/rekan.",
  "Saya mampu berkolaborasi menggunakan platform berbagi dokumen (seperti Google Docs) secara efektif.",
  "Saya mampu merancang media presentasi atau konten digital untuk mendukung tugas pembelajaran.",
  "Saya mampu menjaga keamanan data pribadi dan akun akademik saya dari ancaman digital.",
  "Saya mampu menggunakan teknologi digital untuk menyelesaikan kendala teknis dalam tugas kuliah.",
];

const labels = [
  "Sangat Mampu",
  "Mampu",
  "Cukup Mampu",
  "Kurang Mampu",
  "Sangat Tidak Mampu"
];

export default function PreliminaryPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showInstructions, setShowInstructions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleAnswer = (qIndex: number, value: number) => {
    setAnswers({ ...answers, [qIndex]: value });
  };

  const isComplete = Object.keys(answers).length === pdiQuestions.length;

  const submitPreliminary = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return router.push("/login");

    setIsSubmitting(true);
    const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);

    try {
      await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type: "PDI-DL", totalScore, answersJson: answers }),
      });
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
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="fa-solid fa-clipboard-check text-2xl"></i>
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">PDI-DL Index</h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Self-Assessment Tahap Awal</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <h3 className="text-[11px] font-black text-emerald-900 uppercase mb-1 tracking-widest">PANDUAN:</h3>
                  <p className="text-[10px] font-bold text-emerald-800 leading-relaxed italic">
                    Pilihlah jawaban yang paling menggambarkan kemampuan diri Anda saat ini. Tidak Ada jawaban yang &quot;absolut benar&quot;. Yang terpenting adalah bagaimana Anda mengaplikasikan pemikiran dan pertimbangan profesional dalam mengatasi situasi yang diberikan.
                  </p>
                </div>
              </div>

              <button onClick={() => setShowInstructions(false)} className="w-full py-5 bg-[#4B5320] text-white font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">SAYA MENGERTI & MULAI</button>
            </motion.div>
          ) : (
            <motion.div key="preliminary" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
               <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-white uppercase drop-shadow-2xl italic tracking-tighter">PDI-DL ASSESSMENT</h2>
                  <div className="w-12 h-1.5 bg-white mx-auto mt-2 rounded-full shadow-lg"></div>
               </div>

               {pdiQuestions.map((q, i) => (
                 <motion.div key={i} className="bg-white border-2 border-slate-200 p-5 rounded-[30px] shadow-xl">
                   <div className="mb-4 p-4 bg-slate-50 border-l-[6px] border-emerald-600 rounded-2xl">
                     <p className="text-[13px] text-slate-900 font-bold leading-tight italic">
                       <span className="text-slate-400 mr-1">#{i + 1}</span> {q}
                     </p>
                   </div>
                   
                   <div className="space-y-2">
                     {labels.map((label, idx) => {
                       const val = 5 - idx;
                       return (
                         <button
                           key={val}
                           onClick={() => handleAnswer(i, val)}
                           className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                             answers[i] === val 
                               ? "bg-emerald-600 border-emerald-600 text-white shadow-xl scale-[1.02]" 
                               : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                           }`}
                         >
                           <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
                           <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[i] === val ? 'border-white' : 'border-slate-200'}`}>
                              {answers[i] === val && <div className="w-2 h-2 bg-white rounded-full"></div>}
                           </div>
                         </button>
                       );
                     })}
                   </div>
                 </motion.div>
               ))}

               <button 
                 disabled={!isComplete || isSubmitting} 
                 onClick={submitPreliminary} 
                 className={`w-full py-5 mt-10 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-2xl ${
                   isComplete && !isSubmitting ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95" : "bg-slate-300 text-slate-500 cursor-not-allowed"
                 }`}
               >
                 {isSubmitting ? "MENGIRIM DATA..." : "SIMPAN & LANJUT KE DASHBOARD"} 
                 {!isSubmitting && <i className="fa-solid fa-arrow-right ml-2"></i>}
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
