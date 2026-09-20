import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'settings.json');

export async function GET() {
  try {
    const fileData = fs.readFileSync(filePath, 'utf8');
    const settings = JSON.parse(fileData);
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Error reading settings:', error);
    return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const settings = await req.json();
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
    return NextResponse.json({ message: 'Settings updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
