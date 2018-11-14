// tslint:disable-next-line:match-default-export-name
import body from 'koa-bodyparser';
import convert from 'koa-convert';

export const bodyParser = () =>
  convert(
    body({
      textLimit: '100mb',
      formLimit: '100mb',
      jsonLimit: '100mb',
    }),
  );
