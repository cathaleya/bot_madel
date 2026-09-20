const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const userCount = await p.user.count();
  const assCount = await p.assessment.count();
  const surCount = await p.survey.count();
  console.log('=== DATABASE STATE ===');
  console.log('Users:', userCount);
  console.log('Assessments:', assCount);
  console.log('Surveys:', surCount);
  
  if (assCount > 0) {
    const assessments = await p.assessment.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 5 });
    console.log('\n=== LATEST ASSESSMENTS ===');
    assessments.forEach(a => console.log(a.type, '-', a.user.name, '-', a.totalScore, '-', a.createdAt));
  }
  
  if (surCount > 0) {
    const surveys = await p.survey.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 5 });
    console.log('\n=== LATEST SURVEYS ===');
    surveys.forEach(s => console.log('SUS -', s.user.name, '-', s.totalScore, '-', s.createdAt));
  }
}

main().catch(e => console.error('DB ERROR:', e.message)).finally(() => p.$disconnect());
