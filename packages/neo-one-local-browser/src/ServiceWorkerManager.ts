import { comlink } from '@neo-one/worker';

export class ServiceWorkerManager {
  public constructor(private readonly endpoint: ServiceWorker) {}

  public getEndpoint(): comlink.Endpoint {
    const { port1, port2 } = new MessageChannel();
    const instanceIDs = new Set<string>();
    const workerListener = (event: MessageEvent) => {
      if (event.data && event.data.id && instanceIDs.has(event.data.id)) {
        port1.postMessage(event.data);
      }
    };
    port1.addEventListener('message', (event) => {
      if (event.data && event.data.id) {
        instanceIDs.add(event.data.id);
      }
      const channel = new MessageChannel();
      // tslint:disable-next-line no-object-mutation
      channel.port1.onmessage = workerListener;
      this.endpoint.postMessage(event.data, [channel.port2]);
    });
    port1.start();

    return port2;
  }
}
