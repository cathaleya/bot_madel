import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Debug endpoint: returns counts of all tables
export async function GET() {
  try {
    const [userCount, assessmentCount, surveyCount, users, assessments, surveys] = await Promise.all([
      prisma.user.count(),
      prisma.assessment.count(),
      prisma.survey.count(),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.assessment.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.survey.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    return NextResponse.json({
      counts: { userCount, assessmentCount, surveyCount },
      latestUsers: users,
      latestAssessments: assessments,
      latestSurveys: surveys,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
