import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

interface AssessmentData {
  type: string;
  totalScore: number;
}

interface SurveyData {
  id: string;
}

interface UserWithAssessments {
  id: string;
  name: string;
  assessments: AssessmentData[];
  surveys: SurveyData[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY ?? '';
  let userData: UserWithAssessments | null = null;

  try {
    const rawUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        assessments: true,
        surveys: true
      }
    });

    if (!rawUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    userData = rawUser as unknown as UserWithAssessments;

    const pdi = userData.assessments.find((a) => a.type === 'PDI-DL');
    const madel = userData.assessments.find((a) => a.type === 'MADEL5C');
    const surveyDone = userData.surveys && userData.surveys.length > 0;

    const allDone = madel && surveyDone;

    // Jika belum menyelesaikan seluruh instrumen, berikan petunjuk pengisian tanpa memanggil API Gemini
    if (!allDone) {
      let missingList = [];
      if (!madel) missingList.push('Tahap 1: MADEL5C (SJT)');
      if (!surveyDone) missingList.push('Tahap 2: Survey Respon');

      const message = `Halo ${userData.name}! Silakan selesaikan instrumen berikut agar diagnosis AI dapat dipetakan secara lengkap: ${missingList.join(', ')}.`;
      return NextResponse.json({ message });
    }

    // Jika seluruh instrumen telah lengkap, panggil Gemini AI Premium secara otomatis
    if (!apiKey) {
      const baseMsg = `Halo ${userData.name}! GEMINI_API_KEY belum terkonfigurasi di file .env server Anda. (Skor MADEL5C: ${madel.totalScore}${pdi ? `, PDI-DL: ${pdi.totalScore}` : ''})`;
      return NextResponse.json({ message: baseMsg });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const pdiLabel  = pdi ? (pdi.totalScore  >= 80 ? 'Sangat Tinggi' : pdi.totalScore  >= 60 ? 'Tinggi' : pdi.totalScore  >= 40 ? 'Cukup' : 'Rendah') : 'Belum Diisi';
    const madelLabel = madel.totalScore >= 300 ? 'Sangat Tinggi' : madel.totalScore >= 225 ? 'Tinggi' : madel.totalScore >= 150 ? 'Cukup' : 'Rendah';
    
    const pdiPromptText = pdi 
      ? `- Skor PDI-DL (Tes Awal): ${pdi.totalScore} (Kategori: ${pdiLabel})`
      : `- Tes Mandiri PDI-DL: Belum diikuti / diisi`;

    const prompt = `
Anda adalah Pakar Psikometrika Digital dari Universitas Negeri Jakarta.
Tulis diagnosis singkat (maksimal 3 sentences, bahasa Indonesia, akademis dan memotivasi) untuk mahasiswa bernama ${userData.name} yang telah MENYELESAIKAN seluruh rangkaian instrumen asesmen platform HDAP.

Data hasil asesmen:
${pdiPromptText}
- Skor MADEL5C : ${madel.totalScore} (Kategori: ${madelLabel})

Panduan:
- Sampaikan selamat atas keberhasilan menyelesaikan seluruh tahapan instrumen.
- Jika skor tinggi: beri pujian dan dorong untuk terus berkembang.
- Jika skor rendah: beri saran konkret dan motivasi positif.
- Sebut nama mahasiswa secara hangat.
- Jangan gunakan bullet point, cukup paragraf singkat.
    `.trim();

    const result = await model.generateContent(prompt);
    const text   = result.response.text();

    return NextResponse.json({ message: text });

  } catch (error: any) {
    console.error('[AI Feedback Error]:', error);

    const errDetail = error?.message || String(error);
    
    // Tampilkan detail error asli dari SDK Google Gemini di layar agar mudah didiagnosis oleh Bapak
    const fallback = (userData)
      ? `Halo ${userData.name}! Sistem mendeteksi seluruh instrumen telah lengkap, namun terjadi kesalahan pada API Gemini: "${errDetail}". Pastikan GEMINI_API_KEY berbayar Anda valid dan kuotanya aktif di VPS.`
      : `Sistem diagnostik AI sedang dalam pemeliharaan. Detail error: "${errDetail}"`;

    return NextResponse.json({ message: fallback });
  }
}
