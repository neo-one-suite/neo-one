/* @flow */
import type { Context } from 'mali';
import GRPCError from 'grpc-error';
import type { Monitor } from '@neo-one/monitor';

import grpc from 'grpc';

export const getMonitor = (ctx: Context): Monitor => {
  const { state } = ctx;
  if (state == null) {
    throw new GRPCError('Programming error', grpc.status.INTERNAL);
  }
  const { monitor } = state;
  if (monitor == null) {
    throw new GRPCError('Programming error', grpc.status.INTERNAL);
  }
  return monitor;
};

export async function setMonitor<T>(
  ctx: Context,
  monitor: Monitor,
  func: () => T,
): Promise<T> {
  const { state } = ctx;
  if (state == null) {
    throw new GRPCError('Programming error', grpc.status.INTERNAL);
  }
  const { monitor: currentMonitor } = state;
  if (currentMonitor == null) {
    throw new GRPCError('Programming error', grpc.status.INTERNAL);
  }
  try {
    ctx.state.monitor = monitor;
    const result = await func();
    return result;
  } finally {
    ctx.state.monitor = currentMonitor;
  }
}
