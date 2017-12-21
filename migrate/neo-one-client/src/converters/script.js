/* @flow */
import { InvalidArgumentError } from '../errors';
import type { ScriptLike } from '../types';

export default (scriptLike: ScriptLike): Buffer => {
  if (typeof scriptLike === 'string') {
    return Buffer.from(scriptLike, 'hex');
  } else if (scriptLike instanceof Buffer) {
    return scriptLike;
  }

  throw new InvalidArgumentError('script', scriptLike);
};
