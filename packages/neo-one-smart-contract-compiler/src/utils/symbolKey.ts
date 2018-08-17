import ts from 'typescript';

// tslint:disable-next-line no-let
let id = 0;
const getID = (symbol: ts.Symbol) => {
  // tslint:disable-next-line no-any
  const symbolAny: any = symbol;
  if (symbolAny.id == undefined && symbolAny.__id === undefined) {
    id += 1;

    // tslint:disable-next-line no-object-mutation
    symbolAny.__id = id;

    return id;
  }

  return symbolAny.id || symbolAny.__id;
};

// tslint:disable-next-line no-any
export const symbolKey = (symbol: ts.Symbol) => `${getID(symbol)}`;
