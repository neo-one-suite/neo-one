import { ContractMethodDescriptorClient } from '@neo-one/client-common';

export const hasForward = ({ parameters }: ContractMethodDescriptorClient) =>
  parameters !== undefined &&
  parameters.length > 0 &&
  parameters[parameters.length - 1].rest &&
  parameters[parameters.length - 1].type === 'ForwardValue';
