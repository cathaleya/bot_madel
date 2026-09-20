import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Helper to escape values in CSV to handle quotes, commas, and newlines safely
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Robustly parse JSON strings even if double or triple stringified
function parseAnswersJson(raw: any): Record<string, any> {
  if (!raw) return {};
  let data = raw;
  while (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'string' && parsed === data) break;
      data = parsed;
    } catch (e) {
      break;
    }
  }
  if (typeof data !== 'object' || data === null) return {};
  return data;
}

// Safely extract numeric score or clean value for item index (0-indexed or 1-indexed)
function getQuestionScore(answers: Record<string, any>, index: number): string {
  if (!answers || typeof answers !== 'object') return '';
  let val = answers[index] ?? answers[String(index)] ?? answers[`Q${index + 1}`] ?? answers[`q${index + 1}`] ?? answers[`Q${index}`];
  if (val && typeof val === 'object') {
    val = val.score ?? val.value ?? val.answer ?? val.val ?? val.selected;
  }
  if (val === null || val === undefined) return '';
  const strVal = String(val).trim();
  if (strVal === '[object Object]' || strVal === 'undefined' || strVal === 'null') return '';
  return strVal;
}


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const instrument = searchParams.get('instrument') || 'all';

    let csvContent = "";
    let filename = "";

    if (instrument === 'madel5c') {
      const assessments = await prisma.assessment.findMany({
        where: { type: 'MADEL5C' },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });

      const questionsPath = path.join(process.cwd(), 'src/app/assessment/madel5c/questions.json');
      const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

      // Header: Timestamp, UserID, Name, Gender, Campus, Origin, SpecialNeeds, TotalScore, Q1, Q2, ..., Q30
      let header = ["Timestamp", "UserID", "Name", "Gender", "Campus", "Origin", "SpecialNeeds", "TotalScore"];
      for (let i = 1; i <= 30; i++) {
        header.push(`Q${i}`);
      }
      csvContent += header.join(",") + "\n";

      assessments.forEach(a => {
        let row = [
          new Date(a.createdAt).toISOString(),
          a.userId,
          a.user.name,
          a.user.gender,
          a.user.campus,
          a.user.origin,
          a.user.specialNeeds,
          a.totalScore
        ].map(escapeCsvValue);

        let answers: any = {};
        try {
          answers = JSON.parse(a.answersJson);
        } catch (e) {
          answers = {};
        }

        const idToScore: Record<number, any> = {};
        questions.forEach((q: any, idx: number) => {
          const val = answers[idx];
          if (val !== undefined) {
            idToScore[q.id] = val;
          }
        });

        for (let id = 1; id <= 30; id++) {
          const val = idToScore[id] !== undefined ? idToScore[id] : "";
          row.push(escapeCsvValue(val));
        }

        csvContent += row.join(",") + "\n";
      });

      filename = `HDAP_Export_MADEL5C_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (instrument === 'pdi-dl') {
      const assessments = await prisma.assessment.findMany({
        where: { type: 'PDI-DL' },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });

      // Header: Timestamp, UserID, Name, Gender, Campus, Origin, SpecialNeeds, TotalScore, Q1, Q2, ..., Q8
      let header = ["Timestamp", "UserID", "Name", "Gender", "Campus", "Origin", "SpecialNeeds", "TotalScore"];
      for (let i = 1; i <= 8; i++) {
        header.push(`Q${i}`);
      }
      csvContent += header.join(",") + "\n";

      assessments.forEach(a => {
        let row = [
          new Date(a.createdAt).toISOString(),
          a.userId,
          a.user.name,
          a.user.gender,
          a.user.campus,
          a.user.origin,
          a.user.specialNeeds,
          a.totalScore
        ].map(escapeCsvValue);

        let answers: any = {};
        try {
          answers = JSON.parse(a.answersJson);
        } catch (e) {
          answers = {};
        }

        for (let i = 0; i < 8; i++) {
          const val = answers[i] !== undefined ? answers[i] : "";
          row.push(escapeCsvValue(val));
        }

        csvContent += row.join(",") + "\n";
      });

      filename = `HDAP_Export_PDI-DL_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (instrument === 'sus') {
      const surveys = await prisma.survey.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });

      // Header: Timestamp, UserID, Name, Gender, Campus, Origin, SpecialNeeds, TotalScore, Q1, Q2, ..., Q10, Feedback
      let header = ["Timestamp", "UserID", "Name", "Gender", "Campus", "Origin", "SpecialNeeds", "TotalScore"];
      for (let i = 1; i <= 10; i++) {
        header.push(`Q${i}`);
      }
      header.push("Feedback");
      csvContent += header.join(",") + "\n";

      surveys.forEach(s => {
        let row = [
          new Date(s.createdAt).toISOString(),
          s.userId,
          s.user.name,
          s.user.gender,
          s.user.campus,
          s.user.origin,
          s.user.specialNeeds,
          s.totalScore
        ].map(escapeCsvValue);

        const answers = parseAnswersJson(s.answersJson);

        for (let i = 0; i < 10; i++) {
          const val = getQuestionScore(answers, i);
          row.push(escapeCsvValue(val));
        }

        row.push(escapeCsvValue((s as any).feedback ?? ''));

        csvContent += row.join(",") + "\n";
      });

      filename = `HDAP_Export_SUS_${new Date().toISOString().split('T')[0]}.csv`;

    } else {
      // Default: 'all' combined wide format
      const assessments = await prisma.assessment.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
      
      const surveys = await prisma.survey.findMany({
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });

      const questionsPath = path.join(process.cwd(), 'src/app/assessment/madel5c/questions.json');
      const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

      // Header: Timestamp, UserID, Name, Gender, Campus, Origin, SpecialNeeds, Instrument, TotalScore, Q1, Q2, ..., Q30, Feedback
      let header = ["Timestamp", "UserID", "Name", "Gender", "Campus", "Origin", "SpecialNeeds", "Instrument", "TotalScore"];
      for (let i = 1; i <= 30; i++) {
        header.push(`Q${i}`);
      }
      header.push("Feedback");
      csvContent += header.join(",") + "\n";

      assessments.forEach(a => {
        let row = [
          new Date(a.createdAt).toISOString(),
          a.userId,
          a.user.name,
          a.user.gender,
          a.user.campus,
          a.user.origin,
          a.user.specialNeeds,
          a.type,
          a.totalScore
        ].map(escapeCsvValue);

        let answers: any = {};
        try {
          answers = JSON.parse(a.answersJson);
        } catch (e) {
          answers = {};
        }

        if (a.type === 'MADEL5C') {
          const idToScore: Record<number, any> = {};
          questions.forEach((q: any, idx: number) => {
            const val = answers[idx];
            if (val !== undefined) {
              idToScore[q.id] = val;
            }
          });

          for (let id = 1; id <= 30; id++) {
            const val = idToScore[id] !== undefined ? idToScore[id] : "";
            row.push(escapeCsvValue(val));
          }
        } else {
          for (let i = 0; i < 30; i++) {
            const val = answers[i] !== undefined ? answers[i] : "";
            row.push(escapeCsvValue(val));
          }
        }

        row.push(''); // Feedback column is empty for assessments

        csvContent += row.join(",") + "\n";
      });

      surveys.forEach(s => {
        let row = [
          new Date(s.createdAt).toISOString(),
          s.userId,
          s.user.name,
          s.user.gender,
          s.user.campus,
          s.user.origin,
          s.user.specialNeeds,
          "SURVEY-SUS",
          s.totalScore
        ].map(escapeCsvValue);

        const answers = parseAnswersJson(s.answersJson);

        for (let i = 0; i < 30; i++) {
          const val = i < 10 ? getQuestionScore(answers, i) : "";
          row.push(escapeCsvValue(val));
        }

        row.push(escapeCsvValue((s as any).feedback ?? ''));

        csvContent += row.join(",") + "\n";
      });

      filename = `HDAP_Export_All_${new Date().toISOString().split('T')[0]}.csv`;
    }

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=${filename}`
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
