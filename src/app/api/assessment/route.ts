import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, type, totalScore, answersJson } = await req.json();

    if (!userId || !type || totalScore === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await prisma.assessment.create({
      data: {
        userId,
        type,
        totalScore,
        answersJson: JSON.stringify(answersJson)
      },
      include: { user: true }
    });

    // Real-time sync to Google Sheets
    try {
      const { syncToGoogleSheets } = await import('@/lib/googleSync');
      await syncToGoogleSheets({
        userId: result.userId,
        name: result.user.name,
        type: result.type,
        score: result.totalScore,
        gender: result.user.gender,
        campus: result.user.campus,
        answers: answersJson
      });
    } catch (e) {
      console.error("Google Sheets sync failed:", e);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error saving assessment result:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const userId = searchParams.get('userId');

  try {
    const results = await prisma.assessment.findMany({
      where: userId ? { userId } : (type ? { type } : {}),
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
