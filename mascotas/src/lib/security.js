import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rate limiting config
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = {
  '/api/vet/link-patient': 5,
  '/api/pets/generate-token': 10,
  'default': 20
};

export async function checkRateLimit(ip, endpoint) {
  if (!ip) return true; // Falta IP en dev a veces
  
  const limit = MAX_ATTEMPTS[endpoint] || MAX_ATTEMPTS['default'];
  
  const record = await prisma.rateLimit.findUnique({
    where: { ip_endpoint: { ip, endpoint } }
  });

  if (!record) {
    await prisma.rateLimit.create({
      data: { ip, endpoint, attempts: 1 }
    });
    return true;
  }

  const now = new Date();

  if (record.blockedUntil && record.blockedUntil > now) {
    return false; // Bloqueado
  }

  // Reset if window passed
  if (now.getTime() - record.updatedAt.getTime() > RATE_LIMIT_WINDOW) {
    await prisma.rateLimit.update({
      where: { id: record.id },
      data: { attempts: 1, blockedUntil: null }
    });
    return true;
  }

  if (record.attempts >= limit) {
    // Bloquear por 15 minutos
    await prisma.rateLimit.update({
      where: { id: record.id },
      data: { 
        attempts: record.attempts + 1,
        blockedUntil: new Date(now.getTime() + RATE_LIMIT_WINDOW)
      }
    });
    return false;
  }

  await prisma.rateLimit.update({
    where: { id: record.id },
    data: { attempts: record.attempts + 1 }
  });

  return true;
}

export function sanitizeInput(str) {
  if (!str) return str;
  if (typeof str !== 'string') return str;
  // Basic XSS prevention (escaping tags)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export function generateSecurePIN() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}
