import { NextResponse } from 'next/server';

// Admin credentials - accept multiple valid usernames for flexibility
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Faithbless21';

// Valid usernames: from env, or any of these accepted values
const VALID_USERNAMES = [
  process.env.ADMIN_USERNAME || 'admin.hdap',
  'admin.hdap',
  'Admin BIMA',
  'admin',
  process.env.ADMIN_EMAIL || 'ruslinairianty7@gmail.com',
  'ruslinairianty7@gmail.com',
].filter(Boolean);

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi.' }, { status: 400 });
    }

    const usernameMatch = VALID_USERNAMES.some(
      u => u.toLowerCase() === username.trim().toLowerCase()
    );
    const passwordMatch = password === ADMIN_PASSWORD;

    if (usernameMatch && passwordMatch) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Username atau password salah. Gunakan: admin.hdap / Faithbless21' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
