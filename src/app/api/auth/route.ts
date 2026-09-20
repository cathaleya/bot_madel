import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { name, campus, gender, origin, specialNeeds } = await req.json();

    if (!name || !campus || !gender || !origin || !specialNeeds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        campus,
        gender,
        origin,
        specialNeeds
      }
    });

    return NextResponse.json({ userId: user.id }, { status: 200 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
