export const pickColorFromString = (value: string, palette: readonly string[]): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash += value.charCodeAt(i);
  return palette[hash % palette.length];
};
