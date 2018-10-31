import { ABIFunction, ABIParameter } from '@neo-one/client-common';
import { genFunctionParameters } from './genFunctionParameters';
import { getEventName } from './getEventName';

export const genForwardArgsFunction = (
  name: string,
  abi: ABIFunction,
  parameters: ReadonlyArray<ABIParameter>,
): string =>
  `(${genFunctionParameters({ ...abi, constant: true }, parameters)[0]}) => [ForwardOptions<${getEventName(
    name,
  )}>, ${parameters.map(() => 'ForwardValue').join(', ')}]`;
