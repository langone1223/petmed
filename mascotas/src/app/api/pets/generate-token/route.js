import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { checkRateLimit, generateSecurePIN } from '../../../../lib/security';
import { logger } from '../../../../lib/logger';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
    const isAllowed = await checkRateLimit(ip, '/api/pets/generate-token');
    
    if (!isAllowed) {
      logger.warn('RATE_LIMIT_EXCEEDED', 'Too many PIN generations', { ip });
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { petId } = await req.json();

    // Verify ownership
    const pet = await prisma.pet.findFirst({
      where: { id: parseInt(petId), ownerId: session.user.id }
    });

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found or unauthorized' }, { status: 404 });
    }

    const pin = generateSecurePIN();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous active tokens for this pet
    await prisma.petAccessToken.updateMany({
      where: { petId: pet.id, isUsed: false, expiresAt: { gt: new Date() } },
      data: { isUsed: true } // Mark as used/invalidated
    });

    const accessData = await prisma.petAccessToken.create({
      data: {
        petId: pet.id,
        pin,
        token,
        expiresAt
      }
    });

    logger.info('PIN_GENERATED', 'Owner generated new PIN for pet', { petId: pet.id, ownerId: session.user.id });

    return NextResponse.json({ pin: accessData.pin, expiresAt: accessData.expiresAt });

  } catch (error) {
    logger.error('GENERATE_PIN_ERROR', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
