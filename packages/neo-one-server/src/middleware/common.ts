import { Logger } from '@neo-one/logger';
import * as grpc from 'grpc';
import GRPCError from 'grpc-error';
import { Context } from 'mali';

// tslint:disable-next-line export-name
export const getLogger = (ctx: Context): Logger => {
  // tslint:disable-next-line:no-any
  const { state } = ctx as any;
  if (state == undefined) {
    throw new GRPCError('Programming error', grpc.status.INTERNAL);
  }
  const { logger } = state;
  if (logger == undefined) {
    throw new GRPCError('Programming error', grpc.status.INTERNAL);
  }

  return logger;
};
