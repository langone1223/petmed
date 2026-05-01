import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      email, password, role, name, surname, dni, phone, address, 
      licenseNumber, specialty, yearsOfExperience, university, termsAccepted 
    } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role,
        name,
        surname,
        dni,
        phone,
        address,
        licenseNumber,
        specialty,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
        university,
        termsAccepted: termsAccepted ? true : false,
        isVerified: false // Vets start unverified in terms of actual verification
      }
    });

    return NextResponse.json({ message: 'User created successfully', user: { id: user.id, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
