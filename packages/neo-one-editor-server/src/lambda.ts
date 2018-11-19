import { bodyParser, context, cors, onError as appOnError } from '@neo-one/http';
import { DefaultMonitor } from '@neo-one/monitor';
import Application, { Middleware } from 'koa';
import compose from 'koa-compose';
import Router from 'koa-router';

export const lambda = (name: string, middleware: Middleware, type: 'get' | 'post') => {
  const monitor = DefaultMonitor.create({
    service: `editor-server-${name}`,
    logger: {
      log: (options) => {
        if (
          process.env.NODE_ENV !== 'production' ||
          options.level === 'error' ||
          options.level === 'warn' ||
          options.level === 'info'
        ) {
          if (options.level === 'error') {
            const { error, ...otherOptions } = options;
            // tslint:disable-next-line no-console
            console.error(error);
            // tslint:disable-next-line no-console
            console.log(otherOptions);
          } else {
            // tslint:disable-next-line no-console
            console.log(options);
          }
        }
      },
      close: () => {
        // do nothing
      },
    },
  });

  const app = new Application();
  app.proxy = true;
  // $FlowFixMe
  app.silent = true;

  app.on('error', appOnError({ monitor }));
  const router = new Router();

  router.use(context({ monitor }));
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
