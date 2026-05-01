import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'VET') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        pets: {
          include: {
            medicalRecords: {
              include: { vet: true }
            },
            ownerReports: true,
            validatedBy: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Sanitize user data
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
