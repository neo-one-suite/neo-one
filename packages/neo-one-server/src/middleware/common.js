/* @flow */
import type { Context } from 'mali';
import GRPCError from 'grpc-error';
import type { Log } from '@neo-one/utils';

import grpc from 'grpc';

// eslint-disable-next-line
export const getLog = (ctx: Context): Log => {
  const { state } = ctx;
  if (state == null) {
    throw new GRPCError('Programming error', grpc.status.INTERNAL);
  }
  const { log } = state;
  if (log == null) {
    throw new GRPCError('Programming error', grpc.status.INTERNAL);
  }
  return log;
};
