import { endpoint } from '@neo-one/worker';

export const TestRunnerWorker = async (): Promise<endpoint.EndpointLike> => {
  const iframe = document.createElement('iframe');
  // tslint:disable-next-line no-object-mutation
  iframe.src =
    process.env.NEO_ONE_TEST_RUNNER_URL === undefined ? 'http://localhost:8081' : process.env.NEO_ONE_TEST_RUNNER_URL;
  document.body.append(iframe);

  // tslint:disable-next-line:promise-must-complete
  return new Promise<endpoint.WorkerEndpoint>((resolve) => {
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
  });
};
