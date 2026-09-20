import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getFilePath = (type: string | null) => {
  switch (type) {
    case 'preliminary':
      return path.join(process.cwd(), 'src/app/assessment/preliminary/questions.json');
    case 'survey':
      return path.join(process.cwd(), 'src/app/survey/questions.json');
    case 'madel5c':
    default:
      return path.join(process.cwd(), 'src/app/assessment/madel5c/questions.json');
  }
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const filePath = getFilePath(type);

    const fileData = fs.readFileSync(filePath, 'utf8');
    const questions = JSON.parse(fileData);
    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    console.error('Error reading questions:', error);
    return NextResponse.json({ error: 'Failed to read questions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const filePath = getFilePath(type);

    const questions = await req.json();
    fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), 'utf8');
    return NextResponse.json({ message: 'Questions updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating questions:', error);
    return NextResponse.json({ error: 'Failed to update questions' }, { status: 500 });
  }
}
