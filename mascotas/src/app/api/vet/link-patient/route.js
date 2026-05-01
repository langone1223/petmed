import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/security';
import { logger } from '@/lib/logger';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'VET') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
    const isAllowed = await checkRateLimit(ip, '/api/vet/link-patient');
    if (!isAllowed) {
      logger.warn('RATE_LIMIT_EXCEEDED', 'Too many link attempts', { ip, vetId: session.user.id });
      return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const { petId, pin } = body;

    if (!petId || !pin) {
      return NextResponse.json({ message: 'Missing petId or pin' }, { status: 400 });
    }

    const parsedPetId = parseInt(petId);

    // Verify PIN
    const accessToken = await prisma.petAccessToken.findFirst({
      where: {
        petId: parsedPetId,
        pin: pin.toString(),
        isUsed: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!accessToken) {
      // Find token to increase attempts if exists
      const existingToken = await prisma.petAccessToken.findFirst({
        where: { petId: parsedPetId, isUsed: false, expiresAt: { gt: new Date() } }
      });
      if (existingToken) {
        const newAttempts = existingToken.attempts + 1;
        await prisma.petAccessToken.update({
          where: { id: existingToken.id },
          data: { 
            attempts: newAttempts,
            isUsed: newAttempts >= 5 // Invalidate if >= 5
          }
        });
      }
      logger.warn('INVALID_PIN', 'Failed to link patient with invalid PIN', { vetId: session.user.id, petId: parsedPetId });
      return NextResponse.json({ message: 'Invalid or expired PIN' }, { status: 403 });
    }

    // Mark as used
    await prisma.petAccessToken.update({
      where: { id: accessToken.id },
      data: { isUsed: true }
    });

    // Link Patient
    const link = await prisma.vetPatientLink.upsert({
      where: {
        vetId_petId: { vetId: session.user.id, petId: parsedPetId }
      },
      update: {},
      create: {
        vetId: session.user.id,
        petId: parsedPetId
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'PATIENT_LINKED',
        userId: session.user.id,
        userRole: 'VET',
        petId: parsedPetId,
        ipAddress: ip,
        details: JSON.stringify({ method: 'PIN', linkId: link.id })
      }
    });

    logger.info('PATIENT_LINKED', 'Successfully linked patient', { vetId: session.user.id, petId: parsedPetId });

    return NextResponse.json({ message: 'Patient linked successfully', link }, { status: 200 });

  } catch (error) {
    logger.error('LINK_PATIENT_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
