import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, name, lastName, phone, newsletter } = parsed.data;
    const emailLower = email.toLowerCase().trim();

    const existingByEmail = await prisma.customer.findUnique({
      where: { email: emailLower },
    });
    if (existingByEmail?.password) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Sign in or use forgot password.' },
        { status: 409 }
      );
    }

    const existingByPhone = await prisma.customer.findUnique({
      where: { phone },
    });
    if (existingByPhone) {
      return NextResponse.json(
        { error: 'This phone number is already registered.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    if (existingByEmail) {
      await prisma.customer.update({
        where: { id: existingByEmail.id },
        data: {
          password: hashedPassword,
          name: name || existingByEmail.name,
          lastName: lastName ?? existingByEmail.lastName,
          phone,
          newsletter: newsletter ?? existingByEmail.newsletter,
        },
      });
      return NextResponse.json({ success: true, message: 'Account updated. You can sign in now.' });
    }

    await prisma.customer.create({
      data: {
        email: emailLower,
        password: hashedPassword,
        name,
        lastName: lastName ?? null,
        phone,
        newsletter: newsletter ?? false,
      },
    });

    return NextResponse.json({ success: true, message: 'Account created. You can sign in now.' });
  } catch (e) {
    console.error('[Register]', e);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
