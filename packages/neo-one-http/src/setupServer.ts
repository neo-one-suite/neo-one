import * as http from 'http';
import * as https from 'https';
import Application from 'koa';

export async function setupServer(
  app: Application,
  server: http.Server | https.Server,
  host: string,
  port: number,
  keepAliveTimeout = 60000,
) {
  server.on('request', app.callback());
  // tslint:disable-next-line no-object-mutation
  server.keepAliveTimeout = keepAliveTimeout;
  await new Promise<void>((resolve) => server.listen(port, host, 511, resolve));

  return async () => {
    await new Promise((resolve, reject) =>
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(err);
        }
      }),
    );
  };
}
