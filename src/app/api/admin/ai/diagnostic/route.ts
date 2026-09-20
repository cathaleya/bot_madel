import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { stats, difItems } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY ?? '';

    if (!apiKey) {
      return NextResponse.json({ 
        message: "API Key Gemini belum dikonfigurasi. Pastikan GEMINI_API_KEY tersedia di file .env." 
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });


    const prompt = `
Anda adalah Panel Ahli Psikometrika Senior yang bertugas memberikan ringkasan diagnostik untuk Admin Platform HDAP.
Berdasarkan data statistik berikut, buatlah narasi analisis yang akademis, padat, dan profesional (maksimal 3-4 paragraf singkat).

Data Statistik Kohort (N=${stats.participants}):
- Cronbach's Alpha (Reliabilitas): ${stats.alpha}
- McDonald's Omega: ${stats.omega}
- Model Fit (CFA): RMSEA=${stats.rmsea}, CFI=${stats.cfi}, TLI=${stats.tli}
- Temuan Bias (DIF): ${stats.difCount} butir terdeteksi bias gender.

Detail Butir Bias:
${difItems.map((d: any) => `- ${d.item}: p=${d.p_value}, contrast=${d.contrast}`).join('\n')}

Struktur Laporan:
1. Kesimpulan Kualitas Instrumen (berdasarkan reliabilitas dan model fit).
2. Analisis Bias (interpretasi temuan DIF).
3. Rekomendasi untuk Institusi/Dosen (langkah strategis untuk meningkatkan literasi digital mahasiswa).

Gunakan bahasa Indonesia yang formal dan berwibawa sesuai standar Expert Judgment.
    `.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ diagnostic: text });

  } catch (error) {
    console.error('[Admin AI Diagnostic Error]:', error);
    return NextResponse.json({ 
      error: "Gagal menghasilkan diagnosis AI. Periksa koneksi API Gemini Anda." 
    }, { status: 500 });
  }
}
