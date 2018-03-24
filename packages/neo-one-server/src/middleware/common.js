/* @flow */
import type { Context } from 'mali';
import GRPCError from 'grpc-error';
import type { Monitor } from '@neo-one/monitor';

import grpc from 'grpc';

// eslint-disable-next-line
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
