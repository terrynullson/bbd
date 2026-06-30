import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';

    if (!query) {
      return NextResponse.json(
        { error: 'Пустой запрос для анализа' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY не задан в .env.local' },
        { status: 500 }
      );
    }

    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `Ты извлекаешь данные о косметическом продукте из текста пользователя.
Верни ТОЛЬКО валидный JSON в формате:
{"brand":"string","name":"string","paoMonths":number}
Правила:
- brand — бренд или "Неизвестный бренд"
- name — краткое название продукта
- paoMonths — срок после вскрытия в месяцах, если не указан — 12
- Не добавляй markdown, пояснения и лишний текст.`,
          },
          {
            role: 'user',
            content: `Проанализируй запрос: ${query}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error', data);
      return NextResponse.json(
        { error: 'Ошибка ИИ-сервиса' },
        { status: 502 }
      );
    }

    const content = data?.choices?.[0]?.message?.content ?? '';
    let parsed: any = null;

    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = null;
        }
      }
    }

    const brand =
      typeof parsed?.brand === 'string' && parsed.brand.trim()
        ? parsed.brand.trim()
        : 'Неизвестный бренд';

    const name =
      typeof parsed?.name === 'string' && parsed.name.trim()
        ? parsed.name.trim()
        : query;

    const paoMonths = Number.isFinite(Number(parsed?.paoMonths))
      ? Math.max(1, Math.round(Number(parsed.paoMonths)))
      : 12;

    return NextResponse.json({ brand, name, paoMonths });
  } catch (error) {
    console.error('Analyze route failed', error);
    return NextResponse.json(
      { error: 'Не удалось обработать запрос' },
      { status: 500 }
    );
  }
}
