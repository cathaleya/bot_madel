
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, totalScore, answersJson, feedback } = await req.json();

    if (!userId || totalScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let formattedAnswersJson = "";
    if (typeof answersJson === 'string') {
      try {
        // Validate if it is already stringified JSON
        JSON.parse(answersJson);
        formattedAnswersJson = answersJson;
      } catch (e) {
        formattedAnswersJson = JSON.stringify({});
      }
    } else if (typeof answersJson === 'object' && answersJson !== null) {
      formattedAnswersJson = JSON.stringify(answersJson);
    } else {
      formattedAnswersJson = JSON.stringify({});
    }

    const result = await prisma.survey.create({
      data: {
        userId,
        totalScore,
        answersJson: formattedAnswersJson,
        feedback: feedback || ""
      } as any,
      include: { user: true }
    });

    // Real-time sync to Google Sheets
    try {
      const { syncToGoogleSheets } = await import('@/lib/googleSync');
      const r = result as any;
      await syncToGoogleSheets({
        userId: r.userId,
        name: r.user.name,
        type: "SURVEY-SUS",
        score: r.totalScore,
        gender: r.user.gender,
        campus: r.user.campus,
        answers: answersJson,
        feedback: feedback || ""
      });
    } catch (e) {
      console.error("Google Sheets sync failed:", e);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error saving survey result:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const results = await prisma.survey.findMany({
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Error fetching survey results:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
