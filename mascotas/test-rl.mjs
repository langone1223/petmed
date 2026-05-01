import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const record = await prisma.rateLimit.findUnique({
      where: { ip_endpoint: { ip: "127.0.0.1", endpoint: "/api/pets/generate-token" } }
    });
    console.log("Record found:", record);
  } catch (error) {
    console.error("Error with ip_endpoint:", error);
  }
}

main();
