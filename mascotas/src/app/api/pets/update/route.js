import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'USER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, species, breed, birthDate, sex, color, photoUrl, microchip,
            pastDiseases, surgeries, knownAllergies, currentMedication, diet,
            currentSymptoms, symptomsSince, behaviorChanges } = body;

    if (!id || !name || !species) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Get current pet to compare fields
    const currentPet = await prisma.pet.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentPet || currentPet.ownerId !== session.user.id) {
      return NextResponse.json({ message: 'Pet not found or unauthorized' }, { status: 403 });
    }

    // Detect changes to invalidate professional verifications
    const updateData = {
      name, species, breed,
      birthDate: birthDate ? new Date(birthDate) : null,
      sex, color, photoUrl, microchip,
      pastDiseases, surgeries, knownAllergies, currentMedication, diet,
      currentSymptoms, symptomsSince, behaviorChanges
    };

    if (currentPet.breed !== breed) updateData.breedValidated = false;
    
    // Compare dates properly
    const currentBirthDateStr = currentPet.birthDate ? currentPet.birthDate.toISOString().split('T')[0] : '';
    const newBirthDateStr = updateData.birthDate ? updateData.birthDate.toISOString().split('T')[0] : '';
    if (currentBirthDateStr !== newBirthDateStr) updateData.birthDateValidated = false;
    
    if (currentPet.microchip !== microchip) updateData.microchipValidated = false;
    if (currentPet.knownAllergies !== knownAllergies) updateData.allergiesValidated = false;

    const updatedPet = await prisma.pet.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return NextResponse.json({ message: 'Pet updated successfully', pet: updatedPet }, { status: 200 });

  } catch (error) {
    console.error('Pet update error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
