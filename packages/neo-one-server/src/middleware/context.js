/* @flow */
import type { Context } from 'mali';
import type { Monitor } from '@neo-one/monitor';

import compose from 'mali-compose';
import onError from 'mali-onerror';

import { getMonitor } from './common';

export default ({ monitor }: {| monitor: Monitor |}) =>
  compose([
    async (ctx: Context, next: () => Promise<void>) => {
      ctx.state = {};
      monitor
        .withLabels({
          [monitor.labels.RPC_TYPE]: 'grpc',
          [monitor.labels.RPC_METHOD]: ctx.fullName,
        })
        .captureSpanLog(
          async span => {
            ctx.monitor = span;
            await next();
          },
          {
            name: 'grpc_server_request',
            level: { log: 'verbose', span: 'info' },
            trace: true,
          },
        );
    },
    onError((error: Error, ctx: Context) => {
      getMonitor(ctx).logError({
        name: 'grpc_server_request_uncaught_error',
        message: 'Uncaught request error.',
        error,
      });
    }),
  ]);
