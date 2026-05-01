import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/security';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'VET') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      petId, temperature, heartRate, respiratoryRate, realWeight, generalStatus, physicalExam,
      presumptiveDiagnosis, confirmedDiagnosis, medicationDetails, professionalIndications,
      vaccineType, vaccineDate, nextDose, dewormingProduct, dewormingDate, dewormingType,
      diagnosedDiseases, performedSurgeries, patientEvolution, labResults, xRays, ultrasounds
    } = body;

    const parsedPetId = parseInt(petId);

    const record = await prisma.medicalRecord.create({
      data: {
        petId: parsedPetId,
        vetId: session.user.id,
        temperature: sanitizeInput(temperature),
        heartRate: sanitizeInput(heartRate),
        respiratoryRate: sanitizeInput(respiratoryRate),
        realWeight: sanitizeInput(realWeight),
        generalStatus: sanitizeInput(generalStatus),
        physicalExam: sanitizeInput(physicalExam),
        presumptiveDiagnosis: sanitizeInput(presumptiveDiagnosis),
        confirmedDiagnosis: sanitizeInput(confirmedDiagnosis),
        medicationDetails: sanitizeInput(medicationDetails),
        professionalIndications: sanitizeInput(professionalIndications),
        vaccineType: sanitizeInput(vaccineType),
        vaccineDate: vaccineDate ? new Date(vaccineDate) : null,
        nextDose: nextDose ? new Date(nextDose) : null,
        dewormingProduct: sanitizeInput(dewormingProduct),
        dewormingDate: dewormingDate ? new Date(dewormingDate) : null,
        dewormingType: sanitizeInput(dewormingType),
        diagnosedDiseases: sanitizeInput(diagnosedDiseases),
        performedSurgeries: sanitizeInput(performedSurgeries),
        patientEvolution: sanitizeInput(patientEvolution),
        labResults: sanitizeInput(labResults),
        xRays: sanitizeInput(xRays),
        ultrasounds: sanitizeInput(ultrasounds),
        digitalSignature: true
      }
    });

    // Auto update health status logic
    let newHealthStatus = "SALUDABLE";
    if (presumptiveDiagnosis || confirmedDiagnosis || medicationDetails) {
      newHealthStatus = "EN_TRATAMIENTO";
    }
    if (generalStatus && generalStatus.toLowerCase().includes('crítico')) {
      newHealthStatus = "CRITICO";
    }
    
    await prisma.pet.update({
      where: { id: parsedPetId },
      data: { healthStatus: newHealthStatus }
    });

    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'MEDICAL_RECORD_CREATED',
        userId: session.user.id,
        userRole: 'VET',
        petId: parsedPetId,
        ipAddress: ip,
        details: JSON.stringify({ recordId: record.id, healthStatus: newHealthStatus })
      }
    });

    logger.info('RECORD_CREATED', 'Medical record created', { recordId: record.id, petId: parsedPetId, vetId: session.user.id });

    return NextResponse.json({ message: 'Record created', record }, { status: 201 });
  } catch (error) {
    logger.error('RECORD_CREATION_ERROR', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
