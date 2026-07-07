import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      field = '';
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    if (char === '\r') continue;

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function resolveProductsCsvPath() {
  if (process.env.SEED_PRODUCTS_PATH) {
    return resolve(process.env.SEED_PRODUCTS_PATH);
  }

  const candidates = [
    resolve(process.cwd(), 'data/seed/products.csv'),
    resolve(process.cwd(), '../parser_brands/datasheet.csv'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

export function loadCsvBrandNames(path) {
  const csvRows = parseCsv(readFileSync(path, 'utf8'));
  if (csvRows.length < 2) return [];

  const header = csvRows[0].map((cell) => cell.trim());
  const brandIdx = header.indexOf('brand');
  if (brandIdx < 0) return [];

  const brands = new Set();
  for (const row of csvRows.slice(1)) {
    const brand = row[brandIdx]?.trim();
    if (brand) brands.add(brand);
  }

  return [...brands];
}
