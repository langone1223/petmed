import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'VET') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { petId, healthStatus } = body;

    if (!petId || !healthStatus) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const validStatuses = ['SALUDABLE', 'EN_TRATAMIENTO', 'CRITICO'];
    if (!validStatuses.includes(healthStatus)) {
      return NextResponse.json({ message: 'Invalid health status' }, { status: 400 });
    }

    const updatedPet = await prisma.pet.update({
      where: { id: parseInt(petId) },
      data: { healthStatus }
    });

    return NextResponse.json({ message: 'Pet status updated successfully', pet: updatedPet }, { status: 200 });

  } catch (error) {
    console.error('Pet status update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
