const KEYWORDS = new Set(['public', 'private', 'protected', 'throw', 'const', 'let', 'function', 'readonly', 'new']);

// tslint:disable-next-line export-name
export const getChunk = (line: string) => {
  const mutableChunks: string[] = [];
  let current = '';

  // tslint:disable-next-line no-loop-statement
  for (const char of line) {
    if (char === ' ') {
      if (KEYWORDS.has(current)) {
        mutableChunks.push(current);
        current = '';
      } else if (mutableChunks.length > 0) {
        break;
      }
    } else if (char === '(') {
      break;
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    mutableChunks.push(current);
  }

  return mutableChunks.join(' ');
};
