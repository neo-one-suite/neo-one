/* @flow */
import type { Context } from 'mali';
import type { Monitor } from '@neo-one/monitor';

export default ({ monitor }: {| monitor: Monitor |}) => async (
  ctx: Context,
  next: () => Promise<void>,
) => {
  ctx.state = {};
  ctx.state.monitor = monitor.withLabels({
    [monitor.labels.RPC_TYPE]: 'grpc',
    [monitor.labels.RPC_METHOD]: ctx.fullName,
  });

  await next();
};
