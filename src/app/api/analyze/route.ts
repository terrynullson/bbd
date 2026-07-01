import { NextRequest, NextResponse } from 'next/server';
import {
  buildAnalyzeContext,
  isUnknownBrand,
  UNKNOWN_BRAND,
} from '@/features/cosmetics/lib/analyze-context';
import { inferCategoryFromText } from '@/features/cosmetics/lib/categories';
import type { ProductCategory } from '@/features/cosmetics/types';

const BBD_AI_KEY = process.env.BBD_AI_KEY;
const BBD_AI_BASE_URL =
  process.env.BBD_AI_BASE_URL || 'https://api.deepseek.com/v1';
const BBD_AI_MODEL = process.env.BBD_AI_MODEL || 'deepseek-chat';

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

function finalizeResult(input: {
  userBrand: string;
  userName: string;
  aiBrand: string;
  aiName: string;
  paoMonths: number;
  category: ProductCategory;
}) {
  const brand = !isUnknownBrand(input.aiBrand)
    ? input.aiBrand
    : input.userBrand || UNKNOWN_BRAND;

  const name = input.aiName || input.userName;

  return {
    brand,
    name,
    paoMonths: input.paoMonths,
    category: input.category,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userBrand =
      typeof body?.brand === 'string' ? body.brand.trim() : '';
    const userName = typeof body?.name === 'string' ? body.name.trim() : '';
    const userBarcode =
      typeof body?.barcode === 'string' ? body.barcode.trim() : '';

    if (!userBrand && !userName && !userBarcode) {
      return NextResponse.json(
        { error: 'Введите бренд, название или штрих-код для анализа' },
        { status: 400 },
      );
    }

    if (!BBD_AI_KEY) {
      return NextResponse.json(
        { error: 'Конфигурация BBD_AI_KEY не найдена в системе' },
        { status: 500 },
      );
    }

    const analyzeInput = {
      brand: userBrand || undefined,
      name: userName || undefined,
      barcode: userBarcode || undefined,
    };

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
            content: `Ты — эксперт по косметике в проекте "Где Мой Крем?".
Пользователь добавляет продукт вручную. Поля формы — его черновик: опечатки, транслит, сленг и неполные названия допустимы.

Твоя задача — НОРМАЛИЗОВАТЬ и ДОПОЛНИТЬ данные. Не копируй ввод дословно, если его можно улучшить.

Верни СТРОГО валидный JSON:
{"brand":"string","name":"string","paoMonths":number,"category":"cream|serum|toner|cleanser|mask|other"}

Правила:
1. brand — каноническое написание бренда (примеры: "Гучи"→"Gucci", "цераве"→"CeraVe", "manyo"→"Manyo").
2. "${UNKNOWN_BRAND}" — только если бренд невозможно определить ни из одного поля. Если пользователь указал бренд, даже с ошибкой, распознай и нормализуй его.
3. name — краткое название продукта без бренда. Короткие названия расширяй по смыслу ("Крем"→"Увлажняющий крем для лица"), если тип понятен из контекста.
4. paoMonths — срок после вскрытия в месяцах из текста или по стандарту: тушь/подводка 6, кремы/сыворотки/SPF 12, пудры/тени 24.
5. category — тип продукта по смыслу.

Не добавляй markdown и пояснения. Только JSON.`,
          },
          {
            role: 'user',
            content: buildAnalyzeContext(analyzeInput),
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
        : '';

    const paoMonths = Number.isFinite(Number(parsed?.paoMonths))
      ? Math.max(1, Math.round(Number(parsed?.paoMonths)))
      : 12;

    const category = parseCategory(
      parsed?.category,
      `${aiBrand} ${aiName} ${userBrand} ${userName}`,
    );

    const result = finalizeResult({
      userBrand,
      userName,
      aiBrand,
      aiName,
      paoMonths,
      category,
    });

    if (!result.name) {
      return NextResponse.json(
        { error: 'Не удалось определить название продукта' },
        { status: 422 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analyze route failed', error);
    return NextResponse.json(
      { error: 'Не удалось обработать запрос ядром BBD' },
      { status: 500 },
    );
  }
}
