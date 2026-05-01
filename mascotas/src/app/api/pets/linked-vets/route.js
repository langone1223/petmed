import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'USER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const petId = parseInt(searchParams.get('petId'));

    if (isNaN(petId)) {
      return NextResponse.json({ message: 'Invalid pet ID' }, { status: 400 });
    }

    // Check ownership
    const pet = await prisma.pet.findUnique({
      where: { id: petId, ownerId: session.user.id }
    });

    if (!pet) {
      return NextResponse.json({ message: 'Pet not found or unauthorized' }, { status: 404 });
    }

    const links = await prisma.vetPatientLink.findMany({
      where: { petId },
      include: {
        vet: {
          select: {
            id: true,
            name: true,
            surname: true,
            specialty: true,
            licenseNumber: true
          }
        }
      }
    });

    const vets = links.map(link => link.vet);

    return NextResponse.json(vets, { status: 200 });

  } catch (error) {
    console.error('Error fetching linked vets:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
