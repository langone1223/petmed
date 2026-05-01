import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'USER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { petId, symptoms, symptomsSince, behaviorChanges } = body;

    // Verify ownership
    const pet = await prisma.pet.findUnique({ where: { id: parseInt(petId) } });
    if (!pet || pet.ownerId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const report = await prisma.ownerReport.create({
      data: {
        petId: parseInt(petId),
        symptoms,
        symptomsSince,
        behaviorChanges
      }
    });

    return NextResponse.json({ message: 'Report created successfully', report }, { status: 201 });
  } catch (error) {
    console.error('OwnerReport error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
