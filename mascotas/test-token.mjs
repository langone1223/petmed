import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  try {
    const petId = 1; // Assuming pet 1 exists
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const accessData = await prisma.petAccessToken.create({
      data: {
        petId,
        pin,
        token,
        expiresAt
      }
    });
    console.log("Success:", accessData);
  } catch (error) {
    console.error("Error creating token:", error);
  }
}

main();
