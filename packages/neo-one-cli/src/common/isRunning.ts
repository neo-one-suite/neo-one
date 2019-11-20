import net from 'net';

export async function isRunning(port: number) {
  let resolve: (running: boolean) => void;
  let reject: (err: Error) => void;
  // tslint:disable-next-line promise-must-complete
  const promise = new Promise<boolean>((resolver, rejector) => {
    resolve = resolver;
    reject = rejector;
  });

  const cleanup = () => {
    client.removeAllListeners('connect');
    client.removeAllListeners('error');
    client.end();
    client.destroy();
    client.unref();
  };

  const onConnect = () => {
    resolve(true);
    cleanup();
  };

  const onError = (error: Error) => {
    // tslint:disable-next-line no-any
    if ((error as any).code !== 'ECONNREFUSED') {
      reject(error);
    } else {
      resolve(false);
    }
    cleanup();
  };

  const client = new net.Socket();
  client.once('connect', onConnect);
  client.once('error', onError);
  client.connect({ port, host: '127.0.0.1' });

  return promise;
}
