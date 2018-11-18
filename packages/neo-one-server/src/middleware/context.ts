import { Monitor } from '@neo-one/monitor';
import { Context } from 'mali';
import compose from 'mali-compose';
import onError from 'mali-onerror';
import { getMonitor } from './common';

export const context = ({ monitor }: { readonly monitor: Monitor }) =>
  compose([
    async (ctx: Context, next) => {
      // tslint:disable-next-line:no-any no-object-mutation
      (ctx as any).state = {};
      await monitor
        .withLabels({
          [monitor.labels.RPC_TYPE]: 'grpc',
          [monitor.labels.RPC_METHOD]: ctx.fullName,
        })
        .captureSpanLog(
          async (span) => {
            // tslint:disable-next-line:no-any no-object-mutation
            (ctx as any).monitor = span;
            await next();
          },
          {
            name: 'grpc_server_request',
            level: { log: 'verbose', span: 'info' },
            trace: true,
          },
        );
    },
    onError((error, ctx) => {
      getMonitor(ctx).logError({
        name: 'grpc_server_request_uncaught_error',
        message: 'Uncaught request error.',
        error,
      });
    }),
  ]);
