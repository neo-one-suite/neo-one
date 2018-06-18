import body from 'koa-better-body';
import convert from 'koa-convert';

export const bodyParser = () =>
  convert(
    body({
      textLimit: '100mb',
      formLimit: '100mb',
      jsonLimit: '100mb',
      bufferLimit: '100mb',
    }),
  );
