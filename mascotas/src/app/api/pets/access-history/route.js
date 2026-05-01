import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'USER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const petId = searchParams.get('petId');

    if (!petId) {
      return NextResponse.json({ message: 'Missing petId' }, { status: 400 });
    }

    const parsedPetId = parseInt(petId);

    // Ensure owner owns the pet
    const pet = await prisma.pet.findFirst({
      where: { id: parsedPetId, ownerId: session.user.id }
    });

    if (!pet) {
      return NextResponse.json({ message: 'Pet not found' }, { status: 404 });
    }

    // Fetch AuditLogs for this pet, specifically PATIENT_LINKED action
    const logs = await prisma.auditLog.findMany({
      where: { petId: parsedPetId, action: 'PATIENT_LINKED' },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Map userIds to Vet names
    const vetIds = logs.map(l => l.userId);
    const vets = await prisma.user.findMany({
      where: { id: { in: vetIds } },
      select: { id: true, name: true, surname: true }
    });
    
    const vetMap = {};
    vets.forEach(v => vetMap[v.id] = `Dr. ${v.name} ${v.surname}`);

    const history = logs.map(l => ({
      id: l.id,
      vetName: vetMap[l.userId] || 'Veterinario Desconocido',
      date: l.createdAt
    }));

    return NextResponse.json({ history }, { status: 200 });

  } catch (error) {
    console.error('Access history error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
