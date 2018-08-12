const directorySeparator = '/';
const backslashRegExp = /\\/g;

export function normalizePath(value: string): string {
  return value.replace(backslashRegExp, directorySeparator);
}
