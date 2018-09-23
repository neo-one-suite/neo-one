import { ABIFunction } from '@neo-one/client-common';

export const hasForward = ({ parameters }: ABIFunction) =>
  parameters !== undefined &&
  parameters.length > 0 &&
  parameters[parameters.length - 1].rest &&
  parameters[parameters.length - 1].type === 'ForwardValue';
