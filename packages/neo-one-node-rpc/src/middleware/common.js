/* @flow */
import type { Context, Middleware } from 'koa';
import type { Monitor } from '@neo-one/monitor';

export const getMonitor = (ctx: Context): Monitor => {
  const { monitor } = ctx.state;
  if (monitor == null) {
    ctx.throw(500);
    throw new Error('For Flow');
  }
  return monitor;
};

export async function setMonitor<T>(
  ctx: Context,
  monitor: Monitor,
  func: () => T,
): Promise<T> {
  const { monitor: currentMonitor } = ctx.state;
  if (currentMonitor == null) {
    ctx.throw(500);
    throw new Error('For Flow');
  }
  try {
    ctx.state.monitor = monitor;
    const result = await func();
    return result;
  } finally {
    ctx.state.monitor = currentMonitor;
  }
}

export type ServerMiddleware = {|
  name: string,
  middleware: Middleware,
|};

export const simpleMiddleware = (
  name: string,
  middleware: Middleware,
): ServerMiddleware => ({
  name,
  middleware,
});
