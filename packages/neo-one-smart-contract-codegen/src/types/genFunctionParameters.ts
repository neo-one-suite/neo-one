import { ABIParameter, ContractMethodDescriptorClient } from '@neo-one/client-common';
import _ from 'lodash';
import { toTypeScriptType } from '../utils';

interface ParamAcc {
  readonly hasRequired: boolean;
  readonly acc: ReadonlyArray<string>;
}

interface Options {
  readonly withConfirmedOptions?: boolean;
  readonly migration?: boolean;
}

const getOptions = (abi: ContractMethodDescriptorClient, { withConfirmedOptions = false }: Options = {}) => {
  if (abi.constant) {
    return withConfirmedOptions ? ['options?: GetOptions'] : [];
  }

  const type = withConfirmedOptions ? ' & GetOptions' : '';

  if (abi.receive) {
    return [`options?: InvokeReceiveTransactionOptions${type}`];
  }

  return [`options?: TransactionOptions${type}`];
};

const getRestParameter = (param: ABIParameter, migration = false) =>
  `...${param.name}: ${toTypeScriptType(param, { isParameter: true, includeOptional: false, migration })}[]`;

export const genFunctionParameters = (
  abi: ContractMethodDescriptorClient,
  parameters: ReadonlyArray<ABIParameter> = abi.parameters === undefined ? [] : abi.parameters,
  options: Options = {},
): ReadonlyArray<string> => {
  const [otherParameters, restParameter]: [ReadonlyArray<ABIParameter>, ABIParameter | undefined] =
    parameters.length > 0 && parameters[parameters.length - 1].rest
      ? [parameters.slice(0, -1), parameters[parameters.length - 1]]
      : [parameters.slice(), undefined];
  const paramStrings = _.reverse(
    _.reverse([...otherParameters]).reduce<ParamAcc>(
      (acc, param) => ({
        hasRequired: acc.hasRequired || !param.optional,
        acc: acc.acc.concat(
          `${param.name}${!acc.hasRequired && param.optional ? '?' : ''}: ${toTypeScriptType(param, {
            isParameter: true,
            includeOptional: false,
            migration: options.migration,
          })}`,
        ),
      }),
      { hasRequired: false, acc: [] },
    ).acc,
  );

  const paramOptions = getOptions(abi, options);
  let forwardOptions: ReadonlyArray<string> = [];
  if (restParameter !== undefined && restParameter.type === 'ForwardValue') {
    forwardOptions = [`forwardOptions?: ${abi.constant ? 'ForwardOptions' : 'TForwardOptions'}`];
  }
  const withParamOptions = paramStrings
    .concat(paramOptions)
    .concat(restParameter === undefined ? [] : [getRestParameter(restParameter, options.migration)])
    .join(', ');
  const withForwardOptions = paramStrings
    .concat(forwardOptions)
    .concat(restParameter === undefined ? [] : [getRestParameter(restParameter, options.migration)])
    .join(', ');
  const withParamForwardOptions = paramStrings
    .concat(paramOptions)
    .concat(forwardOptions)
    .concat(restParameter === undefined ? [] : [getRestParameter(restParameter, options.migration)])
    .join(', ');
  const withoutOptions = paramStrings
    .concat(restParameter === undefined ? [] : [getRestParameter(restParameter, options.migration)])
    .join(', ');

  if (restParameter === undefined) {
    return [withParamOptions];
  }

  if (paramOptions.length === 0) {
    return forwardOptions.length === 0 ? [withoutOptions] : [withForwardOptions];
  }

  return forwardOptions.length === 0
    ? [withParamOptions, withoutOptions]
    : [withForwardOptions, withParamForwardOptions];
};
