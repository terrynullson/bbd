function collapseSpaces(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function titleCase(value: string) {
  return collapseSpaces(value).replace(/[\p{L}\p{N}]+/gu, (word) => {
    const [first, ...rest] = Array.from(word.toLowerCase());
    return first ? `${first.toUpperCase()}${rest.join('')}` : word;
  });
}

function replacePrefix(value: string, pattern: RegExp, replacement: string) {
  return value.replace(pattern, (_match, rest = '') =>
    collapseSpaces(`${replacement}${rest}`),
  );
}

export function canonicalizeBrand(brand: string): string {
  return titleCase(brand);
}

export function canonicalizeProductName(name: string): string {
  let value = titleCase(name);

  value = replacePrefix(value, /^Крем\s+Лиц[ао](.*)$/iu, 'Крем для лица');
  value = replacePrefix(value, /^Крем\s+Тел[ао](.*)$/iu, 'Крем для тела');

  if (/сыворотк/iu.test(value)) {
    value = value.replace(/сыворотк[аиуойе]?/giu, 'Сыворотка');
  }

  return value;
}
