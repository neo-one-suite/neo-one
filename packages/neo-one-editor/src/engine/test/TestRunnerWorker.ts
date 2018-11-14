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

    const handler = () => {
      iframe.removeEventListener('load', handler);
      const contentWindow = iframe.contentWindow;
      if (contentWindow !== null) {
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
    iframe.addEventListener('load', handler);

    document.body.append(iframe);
  });
