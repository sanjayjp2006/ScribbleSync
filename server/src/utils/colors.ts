const CURSOR_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#be123c',
  '#4f46e5',
  '#0f766e',
  '#a16207',
  '#c026d3',
  '#65a30d'
] as const;

const getRandomIndex = (length: number): number => Math.floor(Math.random() * length);

export const generateCursorColor = (usedColors: ReadonlySet<string>): string => {
  const availableColors = CURSOR_COLORS.filter((color) => !usedColors.has(color));

  if (availableColors.length > 0) {
    const color = availableColors[getRandomIndex(availableColors.length)];

    if (color !== undefined) {
      return color;
    }
  }

  const fallbackColor = CURSOR_COLORS[getRandomIndex(CURSOR_COLORS.length)];

  if (fallbackColor === undefined) {
    return '#2563eb';
  }

  return fallbackColor;
};
