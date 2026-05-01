import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      name, species, breed, birthDate, sex, color, photoUrl, microchip,
      pastDiseases, surgeries, knownAllergies, currentMedication, diet,
      currentSymptoms, symptomsSince, behaviorChanges
    } = body;

    const pet = await prisma.pet.create({
      data: {
        ownerId: session.user.id,
        name,
        species,
        breed,
        birthDate: birthDate ? new Date(birthDate) : null,
        sex,
        color,
        photoUrl,
        microchip,
        pastDiseases,
        surgeries,
        knownAllergies,
        currentMedication,
        diet,
        currentSymptoms,
        symptomsSince,
        behaviorChanges,
        // Validation states false by default
        breedValidated: false,
        birthDateValidated: false,
        allergiesValidated: false,
        microchipValidated: false
      }
    });

    return NextResponse.json({ message: 'Pet created', pet }, { status: 201 });
  } catch (error) {
    console.error('Pet creation error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
