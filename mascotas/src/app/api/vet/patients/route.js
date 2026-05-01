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

    // Find all pets that have a medical record associated with this vet OR are explicitly linked
    const patients = await prisma.pet.findMany({
      where: {
        OR: [
          { medicalRecords: { some: { vetId: session.user.id } } },
          { patientLinks: { some: { vetId: session.user.id } } }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            surname: true,
            phone: true,
            email: true,
          }
        },
        medicalRecords: {
          where: { vetId: session.user.id },
          orderBy: { date: 'desc' },
          include: { vet: true }
        },
        ownerReports: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({ patients }, { status: 200 });

  } catch (error) {
    console.error('Search patients error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
