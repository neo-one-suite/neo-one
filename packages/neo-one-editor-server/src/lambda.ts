import { bodyParser, cors } from '@neo-one/http';
import Application, { Middleware } from 'koa';
import compose from 'koa-compose';
import Router from 'koa-router';

export const lambda = (name: string, middleware: Middleware, type: 'get' | 'post') => {
  // tslint:disable-next-line:no-any
  const app = new Application<any, {}>();
  app.proxy = true;
  app.silent = true;

  // tslint:disable-next-line:no-any
  const router = new Router<any, {}>();

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
