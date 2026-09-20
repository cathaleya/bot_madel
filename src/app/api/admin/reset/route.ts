import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';

export async function POST(req: Request) {
  try {
    console.log("Admin requesting database and analysis reset...");

    // 1. Clear database records using Prisma (in order of relations)
    await prisma.survey.deleteMany({});
    await prisma.assessment.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("Database tables cleared successfully.");

    // 2. Clear cached psychometric outputs and scree plots
    const outputDir = path.join(process.cwd(), 'public', 'analysis', 'outputs');
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      let deletedCount = 0;
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(outputDir, file));
          deletedCount++;
        } catch (err) {
          console.error(`Failed to delete cache file ${file}:`, err);
        }
      });
      console.log(`Cleared ${deletedCount} files from analysis outputs directory.`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database tables and analysis cache cleared successfully." 
    }, { status: 200 });

  } catch (error) {
    console.error('Error executing admin reset:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
