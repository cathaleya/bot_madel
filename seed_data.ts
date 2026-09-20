import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Standard Normal CDF (Phi)
function normalCDF(x: number): number {
  return (1.0 + erf(x / Math.sqrt(2.0))) / 2.0;
}
function erf(x: number): number {
  const sign = (x >= 0) ? 1 : -1;
  x = Math.abs(x);
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}
function randn_bm() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

async function main() {
  console.log('Clearing database...');
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Assessment", "Survey", "User" RESTART IDENTITY CASCADE;');

  // Read questions
  const madelQ = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/app/assessment/madel5c/questions.json'), 'utf8'));
  const prelQ = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/app/assessment/preliminary/questions.json'), 'utf8'));

  // Pre-calculate items difficulty bounds to ensure good fit (avoid misfits)
  // We keep difficulties tight around 0 so items discriminate well for average theta.
  const b_madel = madelQ.map(() => (Math.random() * 2 - 1) * 0.5); // Item difficulty between -0.5 and 0.5
  
  console.log('Generating 500 respondents...');
  const campuses = ['UNJ', 'UHAMKA', 'Atmajaya'];
  const genders = ['Laki-Laki', 'Perempuan'];
  const origins = ['Jawa', 'Luar Jawa'];

  for (let i = 0; i < 500; i++) {
    const campus = campuses[Math.floor(Math.random() * campuses.length)];
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const origin = origins[Math.floor(Math.random() * origins.length)];
    const specialNeeds = Math.random() < 0.95 ? 'tidak' : 'ya';
    
    // Simulate user latent trait (theta)
    const theta = randn_bm();

    // Create User
    const user = await prisma.user.create({
      data: {
        name: `Responden ${i + 1}`,
        campus,
        gender,
        origin,
        specialNeeds
      }
    });

    // 1. Generate MADEL5C Answers (ensure high correlation, no DIF)
    let totalMadel = 0;
    const madelAnswers = madelQ.map((q: any, idx: number) => {
      // Get possible sorted scores for this item
      const scores = q.options.map((o: any) => o.score).sort((a: number, b: number) => a - b);
      // Calculate probability of being at higher end using Item Response Theory (GRM approximation)
      // theta - b gives the continuous position. Add small random noise to prevent 1.0 perfect correlations.
      const rawPos = theta - b_madel[idx] + (randn_bm() * 0.3); 
      const p = normalCDF(rawPos);
      
      // Map probability to score index (e.g. 0 to scores.length - 1)
      let scoreIdx = Math.floor(p * scores.length);
      if (scoreIdx >= scores.length) scoreIdx = scores.length - 1;
      if (scoreIdx < 0) scoreIdx = 0;
      
      const pickedScore = scores[scoreIdx];
      totalMadel += pickedScore;
      
      return { questionId: q.id, score: pickedScore };
    });

    await prisma.assessment.create({
      data: {
        userId: user.id,
        type: 'MADEL5C',
        totalScore: totalMadel,
        answersJson: JSON.stringify(madelAnswers)
      }
    });

    // 2. Generate Preliminary Answers (Simple 1-5 random but slightly correlated with theta)
    let totalPrelim = 0;
    const prelimAnswers = prelQ.map((q: any) => {
      let pScore = Math.round(theta + 3 + (randn_bm() * 0.5));
      if (pScore > 5) pScore = 5;
      if (pScore < 1) pScore = 1;
      totalPrelim += pScore;
      return { questionId: q.id, score: pScore };
    });

    await prisma.assessment.create({
      data: {
        userId: user.id,
        type: 'PDI-DL',
        totalScore: totalPrelim,
        answersJson: JSON.stringify(prelimAnswers)
      }
    });

    // 3. Generate SUS Answers
    let susTotalRaw = 0;
    const susAnswers = Array.from({length: 10}).map((_, idx) => {
      const qNum = idx + 1;
      // Correlate with theta: high theta = good UX (high on odd, low on even)
      let raw = Math.round(theta * 0.5 + 4 + randn_bm() * 0.5);
      if (raw > 5) raw = 5;
      if (raw < 1) raw = 1;
      
      let finalScore = raw;
      if (qNum % 2 === 0) { // even (negative wording) -> reverse
        finalScore = 6 - raw;
      }
      
      susTotalRaw += (qNum % 2 !== 0) ? (finalScore - 1) : (5 - finalScore);
      return { questionId: qNum, score: finalScore };
    });

    const susTotalScore = susTotalRaw * 2.5;

    await prisma.survey.create({
      data: {
        userId: user.id,
        totalScore: susTotalScore,
        answersJson: JSON.stringify(susAnswers),
        feedback: "Cukup baik dan mudah digunakan."
      }
    });

    if ((i + 1) % 50 === 0) console.log(`Inserted ${i + 1}/500 users...`);
  }

  console.log('Data generation completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
