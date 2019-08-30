import { Attribute, paramTo, TransactionOptions, Transfer } from '@neo-one/client-common';
import { Print } from '../common';
import { Action, MigrationParam } from './types';

// tslint:disable-next-line no-any
const isPromise = (value: any): value is Promise<any> => value !== undefined && value.then !== undefined;
const paramToString = (paramIn: MigrationParam): string => {
  if (isPromise(paramIn)) {
    return '<deferred>';
  }

  return paramTo<string>(paramIn, {
    undefined: () => 'undefined',
    string: (param) => param,
    boolean: (param) => `${param}`,
    array: (param) => `[${param.map(paramToString).join(', ')}]`,
    bigNumber: (param) => param.toString(10),
    map: (param) =>
      `{${[...param.entries()].map(([k, v]) => `${paramToString(k)} => ${paramToString(v)}`).join(', ')}}`,
    forwardValue: (param) => paramToString(param.param),
    object: (param) =>
      `{${Object.entries(param)
        .map(([k, v]) => `${paramToString(k)}: ${paramToString(v)}`)
        .join(',')}}`,
  });
};

const attributeToString = (attribute: Attribute) =>
  `  - Usage: ${attribute.usage}
     Data: ${attribute.data}`;

const transferToString = (transfer: Transfer) => `  Amount: ${transfer.amount.toString(10)}
  Asset: ${transfer.asset}
  To: ${transfer.to}`;

const transactionOptionsToString = (options: TransactionOptions) => {
  let str = '';
  if (options.attributes !== undefined) {
    str += `
Attributes:
${options.attributes.map(attributeToString).join('\n')}`;
  }

  if (options.from !== undefined) {
    str += `
From: ${options.from}`;
  }

  if (options.networkFee !== undefined) {
    str += `
Network Fee: ${options.networkFee.toString(10)}`;
  }

  if (options.systemFee !== undefined) {
    str += `
System Fee: ${options.systemFee.toString(10)}`;
  }

  return str;
};

export const printAction = (action: Action, print: Print) => {
  let rest = '';

  if (
    action.options !== undefined &&
    (action.options.attributes !== undefined ||
      action.options.from !== undefined ||
      action.options.networkFee !== undefined ||
      action.options.systemFee !== undefined)
  ) {
    rest += `
Transaction Options:${transactionOptionsToString(action.options)}`;
  }

  if (action.transfer !== undefined) {
    rest += `
Transfer:
${transferToString(action.transfer)}`;
  }

  if (action.hash !== undefined) {
    rest += `
Hash: ${action.hash}`;
  }

  print(`======
Contract: ${action.contract}
Method: ${action.method}
Params:
${action.params
  .map(paramToString)
  .map((value, idx) => `  ${idx}. ${value}`)
  .join('\n')}${rest}
======`);
};
