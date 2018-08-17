import ts from 'typescript';

// tslint:disable-next-line no-let
let id = 0;
const getID = (type: ts.Type) => {
  // tslint:disable-next-line no-any
  const typeAny: any = type;
  if (typeAny.id == undefined && typeAny.__id === undefined) {
    id += 1;

    // tslint:disable-next-line no-object-mutation
    typeAny.__id = id;

    return id;
  }

  return typeAny.id || typeAny.__id;
};

// tslint:disable-next-line no-any
export const typeKey = (type: ts.Type) => `${getID(type)}`;
