/* @flow */
import type BN from 'bn.js';
import {
  type Attribute,
  type Input,
  type Output,
  type Witness,
  InvocationTransaction,
  utils,
} from '@neo-one/client-core';

// eslint-disable-next-line
export const createInvocation = ({
  script,
  gas,
  attributes,
  inputs,
  outputs,
  scripts,
}: {|
  script: Buffer,
  gas?: BN,
  attributes?: Array<Attribute>,
  inputs?: Array<Input>,
  outputs?: Array<Output>,
  scripts?: Array<Witness>,
|}) =>
  new InvocationTransaction({
    script,
    gas: gas || utils.ZERO,
    attributes,
    inputs,
    outputs,
    scripts,
  });
