-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT,
    "surname" TEXT,
    "dni" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "profilePicture" TEXT,
    "licenseNumber" TEXT,
    "specialty" TEXT,
    "yearsOfExperience" INTEGER,
    "university" TEXT,
    "bio" TEXT,
    "workplacePhotos" TEXT,
    "socialMedia" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" SERIAL NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "birthDate" TIMESTAMP(3),
    "sex" TEXT,
    "color" TEXT,
    "photoUrl" TEXT,
    "microchip" TEXT,
    "breedValidated" BOOLEAN NOT NULL DEFAULT false,
    "birthDateValidated" BOOLEAN NOT NULL DEFAULT false,
    "allergiesValidated" BOOLEAN NOT NULL DEFAULT false,
    "microchipValidated" BOOLEAN NOT NULL DEFAULT false,
    "healthStatus" TEXT NOT NULL DEFAULT 'SALUDABLE',
    "validatedById" INTEGER,
    "validatedAt" TIMESTAMP(3),
    "pastDiseases" TEXT,
    "surgeries" TEXT,
    "knownAllergies" TEXT,
    "currentMedication" TEXT,
    "diet" TEXT,
    "currentSymptoms" TEXT,
    "symptomsSince" TEXT,
    "behaviorChanges" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerReport" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "symptoms" TEXT NOT NULL,
    "symptomsSince" TEXT,
    "behaviorChanges" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "vetId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "petId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalTemplate" (
    "id" SERIAL NOT NULL,
    "vetId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "presumptiveDiagnosis" TEXT,
    "confirmedDiagnosis" TEXT,
    "medicationDetails" TEXT,
    "professionalIndications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VetPatientLink" (
    "id" SERIAL NOT NULL,
    "vetId" INTEGER NOT NULL,
    "petId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VetPatientLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "vetId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" TEXT,
    "heartRate" TEXT,
    "respiratoryRate" TEXT,
    "realWeight" TEXT,
    "generalStatus" TEXT,
    "physicalExam" TEXT,
    "presumptiveDiagnosis" TEXT,
    "confirmedDiagnosis" TEXT,
    "medicationDetails" TEXT,
    "professionalIndications" TEXT,
    "vaccineType" TEXT,
    "vaccineDate" TIMESTAMP(3),
    "nextDose" TIMESTAMP(3),
    "dewormingProduct" TEXT,
    "dewormingDate" TIMESTAMP(3),
    "dewormingType" TEXT,
    "diagnosedDiseases" TEXT,
    "performedSurgeries" TEXT,
    "patientEvolution" TEXT,
    "labResults" TEXT,
    "xRays" TEXT,
    "ultrasounds" TEXT,
    "digitalSignature" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetAccessToken" (
    "id" SERIAL NOT NULL,
    "petId" INTEGER NOT NULL,
    "pin" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "userRole" TEXT,
    "petId" INTEGER,
    "ipAddress" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" SERIAL NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VetPatientLink_vetId_petId_key" ON "VetPatientLink"("vetId", "petId");

-- CreateIndex
CREATE UNIQUE INDEX "PetAccessToken_token_key" ON "PetAccessToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_ip_endpoint_key" ON "RateLimit"("ip", "endpoint");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerReport" ADD CONSTRAINT "OwnerReport_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalTemplate" ADD CONSTRAINT "ClinicalTemplate_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetPatientLink" ADD CONSTRAINT "VetPatientLink_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetPatientLink" ADD CONSTRAINT "VetPatientLink_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetAccessToken" ADD CONSTRAINT "PetAccessToken_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
