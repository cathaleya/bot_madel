import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assessments: true,
        surveys: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const pdi = user.assessments.find((a) => a.type === "PDI-DL");
    const madel = user.assessments.find((a) => a.type === "MADEL5C");

    const pdiAnswers = pdi?.answersJson ? JSON.parse(pdi.answersJson) : null;
    const madelAnswers = madel?.answersJson ? JSON.parse(madel.answersJson) : null;

    let c1 = 4.0;
    let c2 = 4.2;
    let c3 = 3.8;
    let c4 = 3.5;
    let c5 = 4.0;

    if (madelAnswers) {
      const questionsPath = path.join(process.cwd(), 'src/app/assessment/madel5c/questions.json');
      const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

      let sumC1 = 0, countC1 = 0;
      let sumC2 = 0, countC2 = 0;
      let sumC3 = 0, countC3 = 0;
      let sumC4 = 0, countC4 = 0;
      let sumC5 = 0, countC5 = 0;

      questions.forEach((q: any, idx: number) => {
        const val = parseInt(madelAnswers[idx] || 0);
        if (q.dim.includes("C1")) {
          sumC1 += val;
          countC1++;
        } else if (q.dim.includes("C2")) {
          sumC2 += val;
          countC2++;
        } else if (q.dim.includes("C3")) {
          sumC3 += val;
          countC3++;
        } else if (q.dim.includes("C4")) {
          sumC4 += val;
          countC4++;
        } else if (q.dim.includes("C5")) {
          sumC5 += val;
          countC5++;
        }
      });

      if (countC1 > 0) c1 = sumC1 / countC1;
      if (countC2 > 0) c2 = sumC2 / countC2;
      if (countC3 > 0) c3 = sumC3 / countC3;
      if (countC4 > 0) c4 = sumC4 / countC4;
      if (countC5 > 0) c5 = sumC5 / countC5;
    }

    const stats = {
      preliminary: pdi?.totalScore || 0,
      pdiAnswers,
      madel5c: madel?.totalScore || 0,
      madelAnswers,
      surveyDone: user.surveys.length > 0,
      radar: [
        Math.round(c1 * 20),
        Math.round(c2 * 20),
        Math.round(c3 * 20),
        Math.round(c4 * 20),
        Math.round(c5 * 20)
      ]
    };

    return NextResponse.json({ user, stats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

