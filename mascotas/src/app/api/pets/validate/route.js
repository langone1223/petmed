import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'VET') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { petId, field } = body;

    // field should be one of: breedValidated, birthDateValidated, allergiesValidated, microchipValidated
    const validFields = ['breedValidated', 'birthDateValidated', 'allergiesValidated', 'microchipValidated'];
    if (!validFields.includes(field)) {
      return NextResponse.json({ message: 'Invalid validation field' }, { status: 400 });
    }

    const updatedPet = await prisma.pet.update({
      where: { id: parseInt(petId) },
      data: {
        [field]: true,
        validatedById: session.user.id,
        validatedAt: new Date()
      }
    });

    return NextResponse.json({ message: 'Pet field validated', updatedPet }, { status: 200 });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
