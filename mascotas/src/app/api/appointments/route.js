import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    let appointments;

    if (session.user.role === 'VET') {
      appointments = await prisma.appointment.findMany({
        where: { vetId: session.user.id },
        include: {
          pet: true,
          owner: { select: { name: true, surname: true, phone: true } }
        },
        orderBy: { date: 'asc' }
      });
    } else {
      appointments = await prisma.appointment.findMany({
        where: { ownerId: session.user.id },
        include: {
          pet: true,
          vet: { select: { name: true, surname: true, address: true, phone: true } }
        },
        orderBy: { date: 'asc' }
      });
    }

    return NextResponse.json({ appointments }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching appointments' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'USER') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { vetId, petId, date, reason } = body;

    if (!vetId || !petId || !date) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        vetId: parseInt(vetId),
        ownerId: session.user.id,
        petId: parseInt(petId),
        date: new Date(date),
        reason
      }
    });

    // Fire email asynchronously to Vet
    const vet = await prisma.user.findUnique({ where: { id: parseInt(vetId) } });
    if (vet && vet.email) {
      sendEmail({
        to: vet.email,
        subject: '🐾 Nueva solicitud de turno - PETMED',
        html: `<h2>Tienes una nueva solicitud de turno</h2><p>Por favor revisa tu panel PETMED para confirmar el turno solicitado.</p>`
      }).catch(e => logger.error('EMAIL_SEND_ERROR', e));
    }

    return NextResponse.json({ message: 'Appointment requested', appointment }, { status: 200 });
  } catch (error) {
    logger.error('APPOINTMENT_CREATE_ERROR', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'VET') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { appointmentId, status, notes } = body;

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(appointmentId) },
      data: { status, notes },
      include: { owner: true }
    });

    // Notify Owner
    if (appointment.owner && appointment.owner.email) {
      const statusText = status === 'CONFIRMED' ? 'Confirmado ✅' : 'Rechazado ❌';
      sendEmail({
        to: appointment.owner.email,
        subject: `🐾 Turno ${statusText} - PETMED`,
        html: `<h2>Tu turno ha sido actualizado</h2>
               <p>Estado: <strong>${statusText}</strong></p>
               ${notes ? `<p>Notas del veterinario: ${notes}</p>` : ''}`
      }).catch(e => logger.error('EMAIL_SEND_ERROR', e));
    }

    return NextResponse.json({ message: 'Appointment updated', appointment }, { status: 200 });
  } catch (error) {
    logger.error('APPOINTMENT_UPDATE_ERROR', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
