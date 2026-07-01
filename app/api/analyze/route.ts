import { NextRequest, NextResponse } from 'next/server';

// Новые завуалированные переменные проекта BBD
const BBD_AI_KEY = process.env.BBD_AI_KEY;
const BBD_AI_BASE_URL = process.env.BBD_AI_BASE_URL || 'https://api.deepseek.com/v1';
const BBD_AI_MODEL = process.env.BBD_AI_MODEL || 'deepseek-chat';

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

    if (!BBD_AI_KEY) {
      return NextResponse.json(
        { error: 'Конфигурация BBD_AI_KEY не найдена в системе' },
        { status: 500 }
      );
    }

    // Отправляем запрос на OpenAI-совместимый API DeepSeek
    const response = await fetch(`${BBD_AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BBD_AI_KEY}`,
      },
      body: JSON.stringify({
        model: BBD_AI_MODEL,
        temperature: 0.2, // Чуть подняли для лучшей гибкости понимания сленга
        // DeepSeek строго требует response_format для выдачи чистого JSON
        response_format: { type: 'json_object' }, 
        messages: [
          {
            role: 'system',
            content: `Ты — эксперт-модератор базы данных косметики проекта "Где Мой Крем?".
Твоя задача — извлечь данные о косметическом продукте из текста пользователя, исправить опечатки и нормализовать их.

Верни СТРОГО валидный JSON в формате:
{"brand":"string","name":"string","paoMonths":number}

Правила нормализации:
1. brand — бренд с большой буквы (например, "CeraVe", "Holika Holika") или "Неизвестный бренд".
2. name — краткое, понятное название продукта (например, "Увлажняющий крем для лица"). Без повторения бренда.
3. paoMonths — срок после вскрытия в месяцах. Если пользователь указал (например, "6м" или "12 месяцев"), бери его. Если не указал, используй стандарты: тушь/подводка — 6, кремы/сыворотки/SPF — 12, сухие текстуры (пудры, тени) — 24.

Не добавляй markdown (\`\`\`json), пояснения и лишний текст. Только чистый JSON.`,
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
      console.error('BBD AI Engine Error:', data);
      return NextResponse.json(
        { error: 'Ошибка ИИ-сервиса ядра BBD' },
        { status: 502 }
      );
    }

    const content = data?.choices?.[0]?.message?.content ?? '';
    let parsed: any = null;

    try {
      parsed = JSON.parse(content);
    } catch {
      // Подстраховка на случай, если модель всё-таки обернула в markdown-блоки
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          parsed = null;
        }
      }
    }

    // Формируем финальный чистый ответ
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
      { error: 'Не удалось обработать запрос ядром BBD' },
      { status: 500 }
    );
  }
}
