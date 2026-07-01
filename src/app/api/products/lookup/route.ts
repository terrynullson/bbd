import { NextRequest, NextResponse } from 'next/server';
import { lookupBarcodeWithProviders } from '@/features/cosmetics/server/barcode-providers';
import { checkRateLimit, getRequestUserId } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const barcode = request.nextUrl.searchParams.get('barcode')?.trim() ?? '';

  if (!/^\d{6,14}$/.test(barcode)) {
    return NextResponse.json(
      { found: false, error: 'Некорректный штрих-код' },
      { status: 400 },
    );
  }

  const userId = await getRequestUserId(request);
  const limit = await checkRateLimit({
    request,
    userId,
    scope: userId ? 'lookup:user:day' : 'lookup:anon:hour',
    limit: userId ? 100 : 20,
    windowSeconds: userId ? 60 * 60 * 24 : 60 * 60,
  });

  if (!limit.allowed) {
    return NextResponse.json(
      { found: false, error: 'Лимит сканирования исчерпан. Попробуйте позже.' },
      { status: 429 },
    );
  }

  try {
    return NextResponse.json(await lookupBarcodeWithProviders(barcode));
  } catch (error) {
    console.error('Product lookup failed', error);
    return NextResponse.json({ found: false, barcode }, { status: 500 });
  }
}
