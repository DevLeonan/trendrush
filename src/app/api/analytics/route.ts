import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, productId, device, source, region } = body;

    const event = await prisma.analyticsEvent.create({
      data: {
        eventType,
        productId,
        device: device || 'DESKTOP',
        source: source || 'DIRECT',
        region: region || 'BR',
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}