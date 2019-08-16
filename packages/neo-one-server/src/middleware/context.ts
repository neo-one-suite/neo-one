import compose from '@malijs/compose';
import onError from '@malijs/onerror';
import { SpanKind, tracer } from '@neo-one/client-switch';
import { Logger } from '@neo-one/logger';
import { addAttributesToSpan, Labels } from '@neo-one/utils';
import { Context } from 'mali';

const getLabels = (ctx: Context) => ({
  [Labels.RPC_TYPE]: 'grpc',
  [Labels.RPC_METHOD]: ctx.fullName,
});

export const context = ({ logger }: { readonly logger: Logger }) =>
  compose([
    async (ctx: Context, next) => {
      const spanExtract = tracer.propagation.extract({
        getHeader: (name: string) => {
          try {
            return ctx.get(name);
          } catch {
            return undefined;
          }
        },
      });
      const spanContext = spanExtract !== null ? spanExtract : undefined;
      const labels = getLabels(ctx);
      const childLogger = logger.child({ labels });
      // tslint:disable-next-line: no-object-mutation no-any
      (ctx as any).state = { logger: childLogger };
      await tracer.startRootSpan({ spanContext, name: 'grpc_server_request', kind: SpanKind.SERVER }, async (span) => {
        addAttributesToSpan(span, labels);
        try {
          await next();
          childLogger.debug({ title: 'grpc_server_request' });
        } catch (error) {
          childLogger.error({ title: 'grpc_server_request', error });
          throw error;
        } finally {
          span.end();
        }
      });
    },
    onError((error, ctx) => {
      const labels = getLabels(ctx);
      logger.error({ title: 'grpc_server_request_uncaught_error', error, ...labels }, 'Uncaught request error.');
    }),
  ]);
