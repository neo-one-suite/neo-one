/// <reference path="./global.d.ts" />
import { SerializableValue, SmartContractValue, Contract } from './index';

export function getArgument<T extends SmartContractValue>(idx: number): T;
export function doReturn(): void;
export function doReturn(value: SmartContractValue): void;
export function destroy(): void;
export function create(
  script: Buffer,
  parameterList: Buffer,
  returnType: number,
  properties: number,
  contractName: string,
  codeVersion: string,
  author: string,
  email: string,
  description: string,
): Contract;
export function migrate(
  script: Buffer,
  parameterList: Buffer,
  returnType: number,
  properties: number,
  contractName: string,
  codeVersion: string,
  author: string,
  email: string,
  description: string,
): Contract;
export function putStorage(key: SerializableValue, value: SerializableValue): void;
export function getStorage<T extends SerializableValue>(key: SerializableValue): T;
export const trigger: number;
