"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";

// Import FlipBookSection secara dinamis
const FlipBookSection = dynamic(() => import("./components/FlipBookSection"), { 
  ssr: false,
  loading: () => <div className="text-white font-black animate-pulse py-20 text-center">MEMUAT PANDUAN...</div>
});

// Komponen Client murni tidak memerlukan force-dynamic karena tidak melakukan server fetching.

export default function Home() {
  const router = useRouter();

  return (
    <div className="font-sans selection:bg-blue-100 overflow-x-hidden">

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md px-6 md:px-12 py-6 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r border-slate-200 pr-6 mr-2">
            <Image src="/logo_madel5c.png" alt="MADEL-5C Logo" width={55} height={55} className="object-contain" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tighter text-[#1E3A8A] uppercase leading-tight">MADEL-5C</span>
            <span className="text-[9px] font-black text-[#2563EB] uppercase tracking-[0.2em]">E-ASSESSMENT PLATFORM</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-3 border-r border-slate-200 pr-6 mr-2">
            <Image src="/logo_penari.png" alt="Penari" width={42} height={42} className="object-contain" />
            <Image src="/logo_dikti.png" alt="DIKTI" width={42} height={42} className="object-contain" />
            <Image src="/logo_unj.png" alt="UNJ" width={42} height={42} className="object-contain" />
          </div>
          <a href="#about" className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-blue-600 transition-colors">
            TENTANG PLATFORM
          </a>
          <a href="#manual" className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-blue-600 transition-colors">
            BUKU PANDUAN
          </a>
          <a href="https://e-assessment.id/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors border-l border-slate-200 pl-6 ml-2">
            PAYUNG RISET <i className="fa-solid fa-arrow-up-right-from-square ml-1 text-[8px]"></i>
          </a>
          <button
            onClick={() => router.push("/login")}
            className="ml-4 px-6 py-2 bg-[#2563EB] text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
          >
            MASUK PORTAL
          </button>
        </div>
      </nav>


      {/* ════════════════════════════════════════
          HALAMAN 1 — HERO
      ════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-24 pb-12">
        <div className="absolute inset-0 z-0">
          <Image
            src="/media/bg_landing.jpg"
            alt="Praktek Literasi Digital 1"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative z-10 w-full px-6 md:px-14 lg:px-20">
          <p className="text-sm md:text-2xl lg:text-[28px] font-black italic text-[#4338CA] uppercase tracking-tight leading-tight mb-4 drop-shadow-sm max-w-[90%]">
            HYBRID-DIAGNOSTIC ASSESSMENT PLATFORM (HDAP)
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-[75px] xl:text-[90px] font-black italic text-[#2563EB] uppercase tracking-tighter leading-[1.1] md:leading-none drop-shadow-md break-words max-w-5xl">
            E-ASSESSMEN LITERASI DIGITAL.
          </h1>
          
          <div className="mt-12 md:mt-16 max-w-sm md:max-w-md bg-white/80 backdrop-blur-lg p-6 md:p-8 rounded-3xl border border-white/50 shadow-2xl">
            <p className="text-sm md:text-base text-slate-800 font-bold leading-relaxed">
              Integrasi Analisis Item Response Theory dengan kecerdasan Generative AI untuk memetakan kompetensi Literasi Digital secara objektif.
            </p>
            <button 
              onClick={() => router.push("/login")}
              className="mt-8 w-full md:w-auto px-10 py-4 bg-[#2563EB] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all active:scale-95"
            >
              MULAI SEKARANG
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          HALAMAN 2 — VIDEO TUTORIAL (TANPA FILTER)
      ════════════════════════════════════════ */}
      <section id="about" className="relative min-h-screen py-32 px-6 md:px-14 lg:px-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/media/praktek_2.jpeg"
            alt="Praktek Literasi Digital 2"
            fill
            className="object-cover"
          />
          {/* Filter dihapus sesuai permintaan */}
        </div>

        <div className="max-w-7xl mx-auto w-full flex flex-col items-center gap-12 text-center relative z-10">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-6xl font-black italic text-slate-900 uppercase tracking-tighter leading-tight drop-shadow-lg">
              PANDUAN VISUAL PLATFORM
            </h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
            <p className="text-slate-800 font-black uppercase tracking-[0.4em] text-[9px] drop-shadow-sm">Video Tutorial Lengkap</p>
          </div>

          <div className="w-full max-w-6xl aspect-video bg-slate-900 rounded-3xl md:rounded-[48px] shadow-2xl overflow-hidden border-4 md:border-8 border-white relative group">
             <video className="w-full h-full object-contain" controls>
               <source src="/media/video_HDAP.mp4" type="video/mp4" />
             </video>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          HALAMAN 3 — FLIPBOOK MANUAL (TANPA FILTER)
      ════════════════════════════════════════ */}
      <section id="manual" className="relative min-h-screen py-32 px-4 md:px-14 lg:px-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/media/praktek_3.jpeg"
            alt="Praktek Literasi Digital 3"
            fill
            className="object-cover"
          />
          {/* Filter dihapus sesuai permintaan */}
        </div>

        <div className="max-w-7xl mx-auto w-full flex flex-col items-center gap-12 relative z-10">
          <div className="space-y-4 text-center">
            <h2 className="text-3xl md:text-6xl font-black italic text-slate-900 uppercase tracking-tighter leading-tight drop-shadow-lg">
              BUKU PANDUAN DIGITAL
            </h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
            <p className="text-slate-800 font-black uppercase tracking-[0.4em] text-[9px] drop-shadow-sm">Manual Penggunaan Platform</p>
          </div>

          <div className="w-full flex justify-center">
             <FlipBookSection />
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white text-slate-900 py-16 px-6 md:px-14 border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl">
              <i className="fa-solid fa-graduation-cap text-lg"></i>
            </div>
            <div className="text-left">
              <span className="font-black text-lg tracking-tighter block uppercase leading-none">MADEL5C · HDAP</span>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Institutional Research Platform</span>
            </div>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            © 2025 HDAP. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
