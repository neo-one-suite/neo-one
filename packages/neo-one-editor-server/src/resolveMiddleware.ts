import { Context } from 'koa';
import { resolveDependencies } from './resolveDependencies';

export const resolveMiddleware = async (ctx: Context): Promise<void> => {
  if (!ctx.is('application/json')) {
    ctx.throw(415);

    return;
  }

  // tslint:disable-next-line no-any
  const { body } = ctx.request as any;
  const result = await resolveDependencies(body);

  ctx.body = result;
  ctx.status = 200;
};
