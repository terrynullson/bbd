import { NextRequest, NextResponse } from 'next/server';
import { inferCategoryFromText } from '@/features/cosmetics/lib/categories';
import type { ProductCategory } from '@/features/cosmetics/types';

const BBD_AI_KEY = process.env.BBD_AI_KEY;
const BBD_AI_BASE_URL =
  process.env.BBD_AI_BASE_URL || 'https://api.deepseek.com/v1';
const BBD_AI_MODEL = process.env.BBD_AI_MODEL || 'deepseek-chat';

const UNKNOWN_BRAND = 'Неизвестный бренд';

const VALID_CATEGORIES = new Set<ProductCategory>([
  'cream',
  'serum',
  'toner',
  'cleanser',
  'mask',
  'other',
]);

function parseCategory(value: unknown, fallbackText: string): ProductCategory {
  if (
    typeof value === 'string' &&
    VALID_CATEGORIES.has(value as ProductCategory)
  ) {
    return value as ProductCategory;
  }
  return inferCategoryFromText(fallbackText);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const existingBrand =
      typeof body?.brand === 'string' ? body.brand.trim() : '';
    const existingName = typeof body?.name === 'string' ? body.name.trim() : '';

    if (!query && !existingBrand && !existingName) {
      return NextResponse.json(
        { error: 'Пустой запрос для анализа' },
        { status: 400 },
      );
    }

    if (!BBD_AI_KEY) {
      return NextResponse.json(
        { error: 'Конфигурация BBD_AI_KEY не найдена в системе' },
        { status: 500 },
      );
    }

    const contextParts: string[] = [];
    if (existingBrand) {
      contextParts.push(`Бренд (уже введён пользователем): ${existingBrand}`);
    }
    if (existingName) {
      contextParts.push(`Название (уже введено пользователем): ${existingName}`);
    }
    if (query) contextParts.push(`Запрос для анализа: ${query}`);

    const response = await fetch(`${BBD_AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BBD_AI_KEY}`,
      },
      body: JSON.stringify({
        model: BBD_AI_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Ты — эксперт-модератор базы данных косметики проекта "Где Мой Крем?".
Твоя задача — извлечь данные о косметическом продукте из текста пользователя, исправить опечатки и нормализовать их.

Верни СТРОГО валидный JSON в формате:
{"brand":"string","name":"string","paoMonths":number,"category":"cream|serum|toner|cleanser|mask|other"}

Правила нормализации:
1. brand — бренд с большой буквы (например, "CeraVe", "Gucci") или "${UNKNOWN_BRAND}".
2. Если пользователь УЖЕ ввёл бренд — сохрани его. Не заменяй на "${UNKNOWN_BRAND}".
3. name — краткое название продукта без повторения бренда. Если пользователь ввёл название, уточни его, но не стирай смысл.
4. paoMonths — срок после вскрытия в месяцах. Если пользователь указал ("6м", "12 месяцев") — бери его. Иначе: тушь/подводка — 6, кремы/сыворотки/SPF — 12, сухие текстуры — 24.
5. category — тип продукта по смыслу.

Не добавляй markdown, пояснения и лишний текст. Только чистый JSON.`,
          },
          {
            role: 'user',
            content: contextParts.join('\n'),
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('BBD AI Engine Error:', data);
      return NextResponse.json(
        { error: 'Ошибка ИИ-сервиса ядра BBD' },
        { status: 502 },
      );
    }

    const content = data?.choices?.[0]?.message?.content ?? '';
    let parsed: Record<string, unknown> | null = null;

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

    const aiBrand =
      typeof parsed?.brand === 'string' && parsed.brand.trim()
        ? parsed.brand.trim()
        : UNKNOWN_BRAND;

    const aiName =
      typeof parsed?.name === 'string' && parsed.name.trim()
        ? parsed.name.trim()
        : existingName || query;

    const brand = existingBrand
      ? existingBrand
      : aiBrand === UNKNOWN_BRAND
        ? UNKNOWN_BRAND
        : aiBrand;

    const name = existingName
      ? aiName.length > existingName.length
        ? aiName
        : existingName
      : aiName;

    const paoMonths = Number.isFinite(Number(parsed?.paoMonths))
      ? Math.max(1, Math.round(Number(parsed?.paoMonths)))
      : 12;

    const category = parseCategory(
      parsed?.category,
      `${brand} ${name} ${query}`,
    );

    return NextResponse.json({ brand, name, paoMonths, category });
  } catch (error) {
    console.error('Analyze route failed', error);
    return NextResponse.json(
      { error: 'Не удалось обработать запрос ядром BBD' },
      { status: 500 },
    );
  }
}
