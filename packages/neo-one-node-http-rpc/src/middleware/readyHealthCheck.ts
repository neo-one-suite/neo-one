import { getLogger } from '@neo-one/http-context';
import { Blockchain } from '@neo-one/node-core';
import { Context } from 'koa';
import { checkReady, Options as CheckReadyOptions } from './checkReady';

export type Options = CheckReadyOptions;

export const readyHealthCheck = ({
  blockchain,
  options,
}: {
  readonly blockchain: Blockchain;
  readonly options: Options;
}) => ({
  name: 'readyHealthCheck',
  path: '/ready_health_check',
  middleware: async (ctx: Context) => {
    const logger = getLogger(ctx);
    const ready = await checkReady({ logger, blockchain, options });
    ctx.status = ready ? 200 : 500;
  },
});
