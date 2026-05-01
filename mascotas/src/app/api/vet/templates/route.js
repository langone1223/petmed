import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'VET') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.clinicalTemplate.findMany({
      where: { vetId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'VET') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, presumptiveDiagnosis, confirmedDiagnosis, medicationDetails, professionalIndications } = body;

    if (!title) {
      return NextResponse.json({ message: 'Title required' }, { status: 400 });
    }

    const template = await prisma.clinicalTemplate.create({
      data: {
        vetId: session.user.id,
        title,
        presumptiveDiagnosis,
        confirmedDiagnosis,
        medicationDetails,
        professionalIndications
      }
    });

    return NextResponse.json({ message: 'Template created', template }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
