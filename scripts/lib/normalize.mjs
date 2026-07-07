export function normalizeSearchText(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isUsefulCatalogValue(value) {
  if (!value) return false;
  const normalized = normalizeSearchText(value);
  return Boolean(normalized && normalized !== 'неизвестный бренд');
}

function collapseSpaces(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function titleCase(value) {
  return collapseSpaces(value).replace(/[\p{L}\p{N}]+/gu, (word) => {
    const [first, ...rest] = Array.from(word.toLowerCase());
    return first ? `${first.toUpperCase()}${rest.join('')}` : word;
  });
}

export function canonicalizeBrand(brand) {
  return titleCase(brand);
}

export function canonicalizeProductName(name) {
  let value = titleCase(name);

  value = value.replace(/^Крем\s+Лиц[ао](.*)$/iu, (_match, rest = '') =>
    collapseSpaces(`Крем для лица${rest}`),
  );
  value = value.replace(/^Крем\s+Тел[ао](.*)$/iu, (_match, rest = '') =>
    collapseSpaces(`Крем для тела${rest}`),
  );

  if (/сыворотк/iu.test(value)) {
    value = value.replace(/сыворотк[аиуойе]?/giu, 'Сыворотка');
  }

  return value;
}
