import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

// In production, configure SMTP in .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'ethereal_user',
    pass: process.env.SMTP_PASS || 'ethereal_pass'
  }
});

export async function sendEmail({ to, subject, html }) {
  try {
    // Log intent to DB
    const emailLog = await prisma.emailLog.create({
      data: { to, subject, status: 'PENDING', attempts: 1 }
    });

    if (!process.env.SMTP_HOST) {
      // Simulation mode
      logger.info('EMAIL_SIMULATED', 'Email sent (simulated)', { to, subject });
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: 'SENT' }
      });
      return true;
    }

    // Real sending
    const info = await transporter.sendMail({
      from: '"PETMED" <noreply@petmed.com>',
      to,
      subject,
      html
    });

    logger.info('EMAIL_SENT', 'Email sent successfully', { messageId: info.messageId, to });
    
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status: 'SENT' }
    });

    return true;
  } catch (error) {
    logger.error('EMAIL_FAILED', error, { to, subject });
    // Retry logic could be implemented via a cron job reading FAILED records
    return false;
  }
}
