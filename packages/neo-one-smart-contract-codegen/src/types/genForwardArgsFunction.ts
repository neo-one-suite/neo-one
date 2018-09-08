import { ABIFunction, ABIParameter } from '@neo-one/client';
import { genFunctionParameters } from './genFunctionParameters';

export const genForwardArgsFunction = (abi: ABIFunction, parameters: ReadonlyArray<ABIParameter>): string =>
  `(${genFunctionParameters({ ...abi, constant: true }, parameters)[0]}) => [${parameters
    .map(() => 'ForwardValue')
    .join(', ')}]`;
