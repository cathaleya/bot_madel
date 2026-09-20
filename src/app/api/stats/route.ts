import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST: record a page visit
export async function POST() {
  try {
    // We track visits using a simple approach - count users who logged in today
    // or we can use a lightweight visit log if needed
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

// GET: returns platform stats including daily visits
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalUsers, totalAssessments, totalSurveys, todayUsers] = await Promise.all([
      prisma.user.count(),
      prisma.assessment.count(),
      prisma.survey.count(),
      prisma.user.count({
        where: { createdAt: { gte: today } }
      }),
    ]);

    // Active users in last 7 days (users who submitted assessment)
    const recentActive = await prisma.assessment.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date for chart
    const dailyMap: Record<string, number> = {};
    recentActive.forEach(a => {
      const d = a.createdAt.toISOString().split('T')[0];
      dailyMap[d] = (dailyMap[d] || 0) + 1;
    });

    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      daily.push({ date: key, count: dailyMap[key] || 0 });
    }

    // Total visits today = assessments submitted today
    const todayAssessments = await prisma.assessment.count({
      where: { createdAt: { gte: today } }
    });

    return NextResponse.json({
      totalUsers,
      totalAssessments,
      totalSurveys,
      todayUsers,
      todayAssessments,
      daily
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
