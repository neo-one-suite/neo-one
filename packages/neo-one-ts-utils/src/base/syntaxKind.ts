import ts from 'typescript';

// tslint:disable-next-line export-name
export function getSyntaxKindName(kind: ts.SyntaxKind): string {
  return getKindCache()[kind];
}

// tslint:disable-next-line no-let readonly-keyword
let mutableKindCache: { [kind: number]: string } | undefined;

function getKindCache() {
  if (mutableKindCache !== undefined) {
    return mutableKindCache;
  }
  mutableKindCache = {};

  // some SyntaxKinds are repeated, so only use the first one
  // tslint:disable-next-line no-loop-statement
  for (const name of Object.keys(ts.SyntaxKind).filter((k) => isNaN(parseInt(k, 10)))) {
    // tslint:disable-next-line no-any
    const value = (ts.SyntaxKind as any)[name] as number;
    if ((mutableKindCache[value] as string | undefined) === undefined) {
      mutableKindCache[value] = name;
    }
  }

  return mutableKindCache;
}
