/* @flow */
// flowlint unclear-type:off
import BigNumber from 'bignumber.js';
import type { Param } from '@neo-one/core';

import type ClientBase from './ClientBase';
import { InvalidParamError } from './errors';
import type { ParamLike } from './types';

import converters from './converters';

const checkType = ({
  param,
  types,
  classes: classesIn,
}: {|
  param: ParamLike,
  types: Array<string>,
  classes?: Array<Class<any>>,
|}): any => {
  const classes = classesIn || [];
  for (const type of types) {
    // eslint-disable-next-line
    if (typeof param === type) {
      return param;
    }
  }

  for (const clazz of classes) {
    if (param instanceof clazz) {
      return param;
    }
  }

  const expected = types.concat(classes.map(clazz => clazz.name));
  throw new InvalidParamError(
    `Expected one of ${JSON.stringify(expected)}: ${String(param)})`,
  );
};

export default {
  String: (client: ClientBase, param: ParamLike): Param =>
    checkType({ param, types: ['string'] }),
  Hash160: (client: ClientBase, param: ParamLike): Param =>
    converters.hash160(
      client,
      checkType({ param, types: ['string'], classes: [Buffer] }),
    ),
  Hash256: (client: ClientBase, param: ParamLike): Param =>
    converters.hash256(
      checkType({ param, types: ['string'], classes: [Buffer] }),
    ),
  PublicKey: (client: ClientBase, param: ParamLike): Param =>
    converters.publicKey(
      checkType({ param, types: ['string'], classes: [Buffer] }),
    ),
  Integer: (client: ClientBase, param: ParamLike, decimals?: number): Param =>
    converters.param(
      client,
      converters.number(
        checkType({ param, types: ['string', 'number'], classes: [BigNumber] }),
        decimals || 0,
      ),
    ),
  Boolean: (client: ClientBase, param: ParamLike): Param =>
    checkType({ param, types: ['boolean'] }),
  ByteArray: (client: ClientBase, param: ParamLike): Param =>
    converters.script(
      checkType({ param, types: ['string'], classes: [Buffer] }),
    ),
  Signature: (client: ClientBase, param: ParamLike): Param =>
    converters.script(
      checkType({ param, types: ['string'], classes: [Buffer] }),
    ),
  Array: (client: ClientBase, param: ParamLike): Param => {
    if (!Array.isArray(param)) {
      throw new InvalidParamError(`Expected Array: ${String(param)}`);
    }

    return param.map(value => converters.param(client, value));
  },
  // eslint-disable-next-line
  InteropInterface: (client: ClientBase, param: ParamLike): Param => {
    throw new InvalidParamError('InteropInterface is not a valid parameter');
  },
  Void: (client: ClientBase, param: ParamLike): Param => {
    checkType({ param, types: ['undefined'] });
    return Buffer.alloc(0, 0);
  },
};
