import { ABIParameter, ContractMethodDescriptorClient } from '@neo-one/client-common';
import { genFunctionParameters } from './genFunctionParameters';
import { getEventName } from './getEventName';

export interface GenForwardArgsFunctionOptions {
  readonly migration?: boolean;
}

export const genForwardArgsFunction = (
  name: string,
  abi: ContractMethodDescriptorClient,
  parameters: ReadonlyArray<ABIParameter>,
  options: GenForwardArgsFunctionOptions,
): string =>
  `(${genFunctionParameters({ ...abi, constant: true }, parameters, options)[0]}) => [ForwardOptions<${getEventName(
    name,
  )}>, ${parameters.map(() => 'ForwardValue').join(', ')}]`;
