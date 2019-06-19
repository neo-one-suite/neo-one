import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';

export interface SerializedObject {
  readonly [key: string]: SerializedValueToken;
}

export type SerializedArray = readonly SerializedValueToken[];

export type SerializedMap = readonly SerializedArrayToken[];

export interface SerializedStringToken {
  readonly type: 'String';
  readonly value: string;
}

export interface SerializedNumberToken {
  readonly type: 'Number';
  readonly value: number;
}

export interface SerializedBooleanToken {
  readonly type: 'Boolean';
  readonly value: boolean;
}

export interface SerializedBigNumberToken {
  readonly type: 'BigNumber';
  readonly value: string;
}

export interface SerializedBNToken {
  readonly type: 'BN';
  readonly value: string;
}

export interface SerializedBufferToken {
  readonly type: 'Buffer';
  readonly value: string;
}

export interface SerializedUndefinedToken {
  readonly type: 'Undefined';
}

export interface SerializedNullToken {
  readonly type: 'Null';
}

export interface SerializedObjectToken {
  readonly type: 'Object';
  readonly value: SerializedObject;
}

export interface SerializedArrayToken {
  readonly type: 'Array';
  readonly value: SerializedArray;
}

export interface SerializedMapToken {
  readonly type: 'Map';
  readonly value: SerializedMap;
}

export interface SerializedSourceMapToken {
  readonly type: 'SourceMap';
  readonly value: SerializedObject;
}

export interface SerializedErrorToken {
  readonly type: 'Error';
  readonly message: string;
  readonly stack: string | undefined;
}

export type SerializedValueToken =
  | SerializedStringToken
  | SerializedNumberToken
  | SerializedBooleanToken
  | SerializedBigNumberToken
  | SerializedBNToken
  | SerializedBufferToken
  | SerializedObjectToken
  | SerializedArrayToken
  | SerializedMapToken
  | SerializedSourceMapToken
  | SerializedUndefinedToken
  | SerializedNullToken
  | SerializedErrorToken;

export type DeserializedValue =
  | string
  | number
  | boolean
  | BigNumber
  | BN
  | Buffer
  | DeserializedObject
  | Promise<DeserializedObject>
  | DeserializedArray
  | DeserializedMap
  | undefined
  | null
  | Error;

export interface DeserializedObject {
  readonly [key: string]: DeserializedValue;
}
// tslint:disable-next-line no-any
export type DeserializedArray = readonly any[];

// tslint:disable-next-line no-any
export type DeserializedMap = Map<any, any>;

export const serializeObject = (object: DeserializedObject): SerializedObject =>
  Object.entries(object).reduce<SerializedObject>(
    (acc, [key, value]) => ({
      ...acc,
      [key]: serialize(value),
    }),
    {},
  );

export const serializeObjectToken = (object: DeserializedObject): SerializedObjectToken => ({
  type: 'Object',
  value: serializeObject(object),
});

export const serializeArray = (array: DeserializedArray): SerializedArrayToken => ({
  type: 'Array',
  value: array.map(serialize),
});

export const serializeMap = (map: DeserializedMap): SerializedMapToken => {
  // tslint:disable-next-line no-any
  const result: any[] = [];
  // tslint:disable-next-line no-array-mutation
  map.forEach((value, key) => result.push(serialize([key, value])));

  return {
    type: 'Map',
    value: result,
  };
};

// tslint:disable-next-line no-any
export const serialize = (value: any): SerializedValueToken => {
  if (value === null) {
    return {
      type: 'Null',
    };
  }
  if (value === undefined) {
    return {
      type: 'Undefined',
    };
  }
  if (typeof value === 'boolean') {
    return {
      type: 'Boolean',
      value,
    };
  }
  if (typeof value === 'number') {
    return {
      type: 'Number',
      value,
    };
  }
  if (typeof value === 'string') {
    return {
      type: 'String',
      value,
    };
  }
  if (value instanceof Buffer) {
    return {
      type: 'Buffer',
      value: value.toString('hex'),
    };
  }
  if (value instanceof Map) {
    return serializeMap(value);
  }
  if (BN.isBN(value)) {
    return {
      type: 'BN',
      value: value.toString(),
    };
  }
  if (BigNumber.isBigNumber(value)) {
    return {
      type: 'BigNumber',
      value: value.toString(),
    };
  }
  if (Array.isArray(value)) {
    return serializeArray(value);
  }
  if (value instanceof Error) {
    return {
      type: 'Error',
      message: value.message,
      stack: value.stack,
    };
  }
  if (value.type === 'SourceMap') {
    return {
      type: 'SourceMap',
      value: serializeObject(value.value),
    };
  }
  if (typeof value === 'object') {
    return serializeObjectToken(value);
  }

  throw new Error(`Attempted to serialize invalid value: ${JSON.stringify(value)}`);
};

export const deserializeObject = (serializedObject: SerializedObject): DeserializedObject =>
  Object.entries(serializedObject).reduce<DeserializedObject>(
    (acc, [key, value]) => ({
      ...acc,
      [key]: deserialize(value),
    }),
    {},
  );

export const deserializeArray = (serializedArray: SerializedArray): DeserializedArray =>
  serializedArray.map(deserialize);

export const deserialize = (serializedValue: SerializedValueToken) => {
  switch (serializedValue.type) {
    case 'Undefined':
      return undefined;
    case 'Null':
      // tslint:disable-next-line no-null-keyword
      return null;
    case 'String':
      return serializedValue.value;
    case 'Number':
      return serializedValue.value;
    case 'Boolean':
      return serializedValue.value;
    case 'BigNumber':
      return new BigNumber(serializedValue.value);
    case 'BN':
      return new BN(serializedValue.value);
    case 'Buffer':
      return Buffer.from(serializedValue.value, 'hex');
    case 'Object':
      return deserializeObject(serializedValue.value);
    case 'Array':
      return deserializeArray(serializedValue.value);
    case 'Map':
      return deserializeArray(serializedValue.value);
    case 'SourceMap':
      return Promise.resolve(deserializeObject(serializedValue.value));
    case 'Error':
      const err = new Error(serializedValue.message);
      // tslint:disable-next-line no-object-mutation
      err.stack = serializedValue.stack;
      throw err;
    default:
      /* istanbul ignore next */
      utils.assertNever(serializedValue);
      /* istanbul ignore next */
      throw new Error('For TS');
  }
};
