"use client";

import React, { useRef, useState, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Komponen Client murni tidak memerlukan force-dynamic karena tidak melakukan server fetching.

// Teks Monograf (Disederhanakan untuk Flipbook)
const BOOK_PAGES = [
  {
    type: "cover",
    image: "/buku_cover.png",
    title: "MONOGRAF MADEL5C",
    subtitle: "Pengembangan Instrumen E-Asesmen Literasi Digital"
  },
  {
    type: "content",
    title: "DAFTAR ISI",
    content: `
      1. Bab 1: Pendahuluan
      2. Bab 2: Landasan Teoretis
      3. Bab 3: Metodologi Penelitian
      4. Bab 4: Validasi Konstruk
      5. Bab 5: Hasil Penelitian
      6. Bab 6: Implementasi Teknologi
      7. Bab 7: Diagnosa AI
      8. Bab 8: Studi Kasus
      ... dan Lampiran Lengkap
    `
  },
  {
    type: "content",
    title: "BAB 1: PENDAHULUAN",
    content: `
      Mahasiswa calon guru, sebagai aktor kunci dalam keberlanjutan inovasi pendidikan, dituntut memiliki literasi digital yang melampaui kemahiran operasional. Literasi digital kontemporer mencakup integrasi kognitif, etika, dan aspek sosial dalam memproses informasi.
      
      Asesmen literasi digital harus dipandang sebagai instrumen strategis untuk menjamin kualitas lulusan LPTK. Instrumen berbasis Situational Judgment Test (SJT) menawarkan solusi metodologis yang lebih autentik.
    `
  },
  {
    type: "content",
    title: "BAB 2: LANDASAN TEORETIS",
    content: `
      Instrumen MADEL5C merujuk pada DigCompEdu. Kerangka kerja ini mencakup 5 Dimensi:
      1. Keterlibatan Profesional
      2. Sumber Daya Digital
      3. Pengajaran dan Pembelajaran
      4. Penilaian
      5. Pemberdayaan Peserta Didik
      
      Teori Aktivitas Engeström digunakan sebagai Grand Theory untuk memahami kontradiksi dalam sistem aktivitas digital.
    `
  },
  {
    type: "content",
    title: "BAB 3 & 4: METODOLOGI",
    content: `
      Validasi konten menggunakan Aiken's V dengan hasil rata-rata 0.86 (Sangat Kuat).
      
      Psikometri Modern (Model Rasch) digunakan untuk kalibrasi butir. Transformasi Logit memastikan objektivitas pengukuran. Reliabilitas Person sebesar 0.89 dan Item sebesar 0.95 menunjukkan stabilitas instrumen yang sangat tinggi.
    `
  },
  {
    type: "image",
    image: "/buku_stats.png",
    caption: "Visualisasi Data Psikometri & Pemetaan Kompetensi"
  },
  {
    type: "content",
    title: "BAB 5 & 6: HASIL & TEKNOLOGI",
    content: `
      Temuan menunjukkan dimensi Digital Safety (EKD) merupakan yang paling rendah. Mahasiswa cenderung mengompromikan keamanan demi kenyamanan teknologi.
      
      Platform HDAP dibangun menggunakan Next.js 14 dan PostgreSQL. Arsitektur ini mendukung pemrosesan data real-time untuk kebutuhan diagnostik massal.
    `
  },
  {
    type: "content",
    title: "BAB 7 & 8: DIAGNOSA AI",
    content: `
      Inovasi utama adalah penggunaan Generative AI untuk interpretasi kualitatif. Sistem memberikan "makna" di balik skor angka.
      
      Studi kasus di PGSD menunjukkan 90% responden merasa umpan balik AI sangat relevan dengan kelemahan yang selama ini tidak mereka sadari (unconscious incompetence).
    `
  },
  {
    type: "content",
    title: "BAB 9 - 16: IMPLIKASI",
    content: `
      LPTK direkomendasikan untuk mewajibkan asesmen diagnostik di awal dan akhir masa studi. AI tidak menggantikan peran guru, melainkan memperkuat fungsi kognitif rutin, sementara guru fokus pada bimbingan afektif.
      
      Masa depan pendidikan bergantung pada kemampuan kita untuk tetap menjadi "manusia" di tengah kepungan algoritma.
    `
  },
  {
    type: "content",
    title: "DAFTAR PUSTAKA",
    content: `
      - Aiken, L. R. (1985). Educational and Psychological Measurement.
      - Bond & Fox. (2015). Applying the Rasch Model.
      - Engeström. (2014). Learning by Expanding.
      - UNESCO. (2023). Generative AI in Education.
      - Wilson, M. (2024). Constructing Measures.
    `
  },
  {
    type: "cover",
    image: "/unj_bg.png",
    title: "TERIMA KASIH",
    subtitle: "Riset BIMA - Universitas Negeri Jakarta"
  }
];

const Page = React.forwardRef((props: any, ref: any) => {
  return (
    <div className="bg-white shadow-2xl border border-slate-100" ref={ref} data-density="hard">
      <div className="h-full flex flex-col p-8 md:p-12 relative overflow-hidden">
        {/* Page Number */}
        <div className="absolute bottom-6 right-8 text-[10px] font-black text-slate-300 tracking-widest">
           PAGE {props.number}
        </div>
        
        {props.children}
      </div>
    </div>
  );
});

Page.displayName = "Page";

export default function BukuPanduan() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const bookRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center py-10 px-4 overflow-hidden">
      
      {/* ─── HEADER ─── */}
      <div className="max-w-4xl w-full mb-8 flex items-center justify-between">
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-black text-[10px] uppercase tracking-widest"
        >
          <i className="fa-solid fa-arrow-left"></i> Kembali ke Beranda
        </button>
        <div className="text-right">
          <h2 className="text-xl font-black text-[#1E3A8A] tracking-tighter uppercase italic leading-none">Buku Panduan</h2>
          <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1">E-Asesmen Literasi Digital</p>
        </div>
      </div>

      {/* ─── FLIPBOOK ENGINE ─── */}
      <div className="relative group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] rounded-lg overflow-hidden">
        {/* @ts-ignore */}
        <HTMLFlipBook 
          width={450} 
          height={650} 
          size="stretch"
          minWidth={300}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}
          startPage={0}
          showCover={true}
          mobileScrollSupport={true}
          className="book-container"
          ref={bookRef}
        >
          {BOOK_PAGES.map((page, index) => (
            <Page key={index} number={index + 1}>
              {page.type === "cover" ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="relative w-full aspect-[3/4] mb-8 rounded-xl overflow-hidden shadow-2xl">
                    <Image src={page.image!} alt={page.title!} fill className="object-cover" />
                  </div>
                  <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tighter mb-2 italic leading-tight">{page.title}</h3>
                  <div className="w-12 h-1 bg-blue-600 mb-4"></div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed max-w-[200px]">
                    {page.subtitle}
                  </p>
                </div>
              ) : page.type === "image" ? (
                <div className="h-full flex flex-col">
                   <div className="relative w-full flex-1 rounded-2xl overflow-hidden shadow-inner border border-slate-100 bg-slate-50 mb-6">
                      <Image src={page.image!} alt="Illustration" fill className="object-cover" />
                   </div>
                   <p className="text-[11px] font-bold text-slate-500 italic text-center leading-relaxed px-4">
                      &quot;{page.caption}&quot;
                   </p>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <h4 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-6 border-b pb-4 border-slate-100 flex items-center justify-between">
                     {page.title}
                     <i className="fa-solid fa-bookmark text-blue-200"></i>
                  </h4>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <p className="text-[13px] text-slate-700 font-bold leading-[1.8] text-justify whitespace-pre-line mb-6">
                      {page.content}
                    </p>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Anotasi Penulis</p>
                       <p className="text-[11px] text-slate-600 italic mt-1 font-medium">Data ini diekstrak dari Monograf Pengembangan HDAP 2025.</p>
                    </div>
                  </div>
                </div>
              )}
            </Page>
          ))}
        </HTMLFlipBook>
      </div>

      {/* ─── CONTROLS ─── */}
      <div className="mt-10 flex items-center gap-6">
        <button 
          onClick={() => bookRef.current.pageFlip().flipPrev()}
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-xl transition-all active:scale-90"
        >
          <i className="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <div className="px-6 py-2 bg-white rounded-full shadow-md">
           <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Buka halaman untuk membaca</span>
        </div>
        <button 
          onClick={() => bookRef.current.pageFlip().flipNext()}
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-xl transition-all active:scale-90"
        >
          <i className="fa-solid fa-chevron-right text-lg"></i>
        </button>
      </div>

      <style jsx global>{`
        .book-container {
          box-shadow: 0 0 50px rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
