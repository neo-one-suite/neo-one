import { bodyParser, context, cors, onError as appOnError } from '@neo-one/http';
import { editorLogger } from '@neo-one/logger';
import Application, { Middleware } from 'koa';
import compose from 'koa-compose';
import Router from 'koa-router';

export const lambda = (name: string, middleware: Middleware, type: 'get' | 'post') => {
  const level = process.env.NODE_ENV === 'production' ? 'silent' : editorLogger.level;
  const logger = editorLogger.child({ service: name, level });

  // tslint:disable-next-line:no-any
  const app = new Application<any, {}>();
  app.proxy = true;
  app.silent = true;

  app.on('error', appOnError(logger));
  // tslint:disable-next-line:no-any
  const router = new Router<any, {}>();

  router.use(context(logger));
  if (type === 'post') {
    router.post(name, `/${name}`, compose([cors, bodyParser(), middleware]));
  } else {
    router.get(name, `/${name}`, compose([cors, middleware]));
  }

  app.use(router.routes());
  app.use(cors);
  app.use(router.allowedMethods());

  return app.callback();
};
