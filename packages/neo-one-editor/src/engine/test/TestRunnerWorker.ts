// tslint:disable no-object-mutation
import { endpoint } from '@neo-one/worker';

export const TestRunnerWorker = async (): Promise<endpoint.EndpointLike> =>
  // tslint:disable-next-line:promise-must-complete
  new Promise<endpoint.WorkerEndpoint>((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.src =
      process.env.NEO_ONE_TEST_RUNNER_URL === undefined ? 'http://localhost:8081' : process.env.NEO_ONE_TEST_RUNNER_URL;
    // @ts-ignore
    iframe.style = 'width: 0; height: 0; position: absolute; top: 0; left: 0; border: 0;';

    const handler = (event: MessageEvent) => {
      if (
        event.data != undefined &&
        typeof event.data === 'object' &&
        event.data.type === 'initialize' &&
        iframe.contentWindow !== null
      ) {
        window.removeEventListener('message', handler);
        const contentWindow = iframe.contentWindow;
        resolve({
          // tslint:disable-next-line no-any
          addEventListener: window.addEventListener.bind(window) as any,
          // tslint:disable-next-line no-any
          removeEventListener: window.removeEventListener.bind(window) as any,
          postMessage: (msg, transfer) => contentWindow.postMessage(msg, '*', transfer),
          start: () => {
            // do nothing
          },
          close: () => {
            document.body.removeChild(iframe);
          },
        });
      }
    };
    window.addEventListener('message', handler);

    document.body.append(iframe);
  });
