import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, surname, dni, phone, address } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        surname,
        dni,
        phone,
        address
      }
    });

    return NextResponse.json({ message: 'Profile updated successfully', user }, { status: 200 });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
