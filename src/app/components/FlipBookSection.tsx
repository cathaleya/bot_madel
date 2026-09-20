"use client";

import React, { useState, useEffect, useRef } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import HTMLFlipBook from "react-pageflip";

// Configure pdfjs worker safely (client-side only)
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const PDFPage = React.forwardRef((props: any, ref: any) => {
  return (
    <div ref={ref} className="bg-white shadow-2xl">
      <Page 
        pageNumber={props.pageNumber} 
        width={props.width} 
        renderTextLayer={false}
        renderAnnotationLayer={false}
      />
    </div>
  );
});
PDFPage.displayName = "PDFPage";

export default function FlipBookSection() {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState(450);
  const [mounted, setMounted] = useState(false);
  const bookRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Initialize audio object
    audioRef.current = new Audio("/media/page-flip.mp3");
    
    const updateWidth = () => {
      const width = window.innerWidth;
      if (width < 640) setPageWidth(width - 40);
      else if (width < 1024) setPageWidth(500);
      else setPageWidth(600);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const playFlipSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log("Audio play blocked by browser. Click page first."));
    }
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center w-full">
      
      {/* Header / Kontrol */}
      <div className="flex items-center justify-between w-full max-w-4xl mb-8 px-4">
        <div className="flex flex-col">
          <h4 className="text-sm font-black text-white uppercase tracking-tighter italic">Digital Manual</h4>
          <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">
            {numPages ? `${numPages} Halaman Tersedia` : "Memuat Halaman..."}
          </p>
        </div>
        <a 
          href="/media/Panduan_Website_HDAP.pdf" 
          download 
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2"
        >
          <i className="fa-solid fa-download"></i> UNDUH PDF BARU
        </a>
      </div>

      {/* PDF FlipBook Container */}
      <div className="relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] rounded-3xl overflow-hidden bg-slate-800 p-4">
        <Document
          file="/media/Panduan_Website_HDAP.pdf"
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="text-white font-black p-20 animate-pulse">MEMBUKA DOKUMEN...</div>}
        >
          {numPages && (
            /* @ts-ignore */
            <HTMLFlipBook 
              width={pageWidth} 
              height={pageWidth * 1.414} // Rasio A4
              size="fixed"
              minWidth={pageWidth}
              maxWidth={pageWidth}
              minHeight={pageWidth * 1.414}
              maxHeight={pageWidth * 1.414}
              usePortrait={true} // Tampilan 1 halaman agar besar
              startPage={0}
              drawShadow={true}
              flippingTime={1000}
              mobileScrollSupport={true}
              onFlip={playFlipSound} // MEMICU SUARA SAAT DIBALIK
              ref={bookRef}
              className="mx-auto"
            >
              {[...Array(numPages)].map((_, i) => (
                <PDFPage 
                  key={i} 
                  pageNumber={i + 1} 
                  width={pageWidth} 
                />
              ))}
            </HTMLFlipBook>
          )}
        </Document>
      </div>

      {/* Navigasi Bawah */}
      <div className="mt-10 flex items-center gap-6">
        <button 
          onClick={() => bookRef.current?.pageFlip().flipPrev()}
          className="w-14 h-14 rounded-2xl bg-white shadow-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-90 border border-slate-100"
        >
          <i className="fa-solid fa-chevron-left text-lg"></i>
        </button>
        <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
           Geser Halaman
        </div>
        <button 
          onClick={() => bookRef.current?.pageFlip().flipNext()}
          className="w-14 h-14 rounded-2xl bg-white shadow-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-90 border border-slate-100"
        >
          <i className="fa-solid fa-chevron-right text-lg"></i>
        </button>
      </div>
    </div>
  );
}
