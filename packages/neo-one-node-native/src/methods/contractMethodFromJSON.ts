import {
  ContractEventDescriptorJSON,
  ContractParameterTypeJSON,
  toContractParameterType,
} from '@neo-one/client-common';
import { ContractEventDescriptor, ContractMethodDescriptor, ContractParameterDefinition } from '@neo-one/node-core';

interface ParamJSON {
  readonly name: string;
  readonly type: ContractParameterTypeJSON;
}

export interface ContractMethodJSON {
  readonly name: string;
  readonly parameters: readonly ParamJSON[];
  readonly returntype: ContractParameterTypeJSON;
  readonly offset?: number;
  readonly safe?: boolean;
}

const contractParamFromJSON = ({ name, type }: ParamJSON) =>
  new ContractParameterDefinition({
    name,
    type: toContractParameterType(type),
  });

export const contractMethodFromJSON = ({
  name,
  parameters,
  returntype,
  offset = 0,
  safe = false,
}: ContractMethodJSON) =>
  new ContractMethodDescriptor({
    name,
    parameters: parameters.map(contractParamFromJSON),
    returnType: toContractParameterType(returntype),
    offset,
    safe,
  });

export const contractEventDescriptorFromJSON = ({ parameters, name }: ContractEventDescriptorJSON) =>
  new ContractEventDescriptor({ name, parameters: parameters.map(contractParamFromJSON) });
