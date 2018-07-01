import { Monitor } from '@neo-one/monitor';
import * as grpc from 'grpc';
import GRPCError from 'grpc-error';
import { Context } from 'mali';

// tslint:disable-next-line export-name
export const getMonitor = (ctx: Context): Monitor => {
  const { state } = ctx;
  if (state == undefined) {
    throw new GRPCError('Programming error', grpc.status.INTERNAL);
  }
  const { monitor } = state;
  if (monitor == undefined) {
    throw new GRPCError('Programming error', grpc.status.INTERNAL);
  }

  return monitor;
};
