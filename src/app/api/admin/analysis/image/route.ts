import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const file = searchParams.get('file');
    if (!file) {
      return NextResponse.json({ error: 'Missing file parameter' }, { status: 400 });
    }

    // Secure file path to prevent directory traversal
    const safeFile = path.basename(file);
    const filePath = path.join(process.cwd(), 'public', 'analysis', 'outputs', safeFile);

    if (!fs.existsSync(filePath)) {
      return new Response('Image not found', { status: 404 });
    }

    const data = fs.readFileSync(filePath);
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
