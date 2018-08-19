// tslint:disable prefer-switch

// tslint:disable-next-line export-name
export const getChunk = (line: string) => {
  let out = '';
  let parenCount = 0;

  // tslint:disable-next-line no-loop-statement
  for (const char of line) {
    if (char === ';' || char === '\n') {
      break;
    }

    out += char;
    if (char === ')') {
      parenCount -= 1;
      if (parenCount <= 0) {
        break;
      }
    }

    if (char === '(') {
      parenCount += 1;
    }
  }

  return out;
};
