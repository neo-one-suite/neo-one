// tslint:disable no-any
import * as comlink from './comlink';

export type EndpointLike = comlink.Endpoint | Window | Worker | WorkerEndpoint;
export interface WorkerEndpoint extends comlink.Endpoint {
  readonly start: () => void;
  readonly close: () => void;
}

function isWorkerEndpoint(endpoint: EndpointLike): endpoint is WorkerEndpoint {
  return ['postMessage', 'addEventListener', 'removeEventListener', 'start', 'close'].every((prop) => prop in endpoint);
}

function isWindow(endpoint: EndpointLike): endpoint is Window {
  return ['window', 'length', 'location', 'parent', 'opener'].every((prop) => prop in endpoint);
}

function isWorker(endpoint: EndpointLike): endpoint is Worker {
  return ['onmessage', 'postMessage', 'terminate', 'addEventListener', 'removeEventListener'].every(
    (prop) => prop in endpoint,
  );
}

function windowEndpoint(w: Window): WorkerEndpoint {
  if (self.constructor.name !== 'Window') {
    throw Error('self is not a window');
  }

  return {
    addEventListener: self.addEventListener.bind(self) as any,
    removeEventListener: self.removeEventListener.bind(self) as any,
    postMessage: (msg, transfer) => w.postMessage(msg, '*', transfer),
    start: () => {
      // do nothing
    },
    close: () => {
      // do nothing
    },
  };
}

function workerEndpoint(worker: Worker): WorkerEndpoint {
  return {
    addEventListener: worker.addEventListener.bind(worker) as any,
    removeEventListener: worker.removeEventListener.bind(worker) as any,
    postMessage: worker.postMessage.bind(worker),
    start: () => {
      // do nothing
    },
    close: worker.terminate.bind(worker),
  };
}

function endpointEndpoint(endpoint: comlink.Endpoint): WorkerEndpoint {
  return {
    addEventListener: endpoint.addEventListener.bind(endpoint),
    removeEventListener: endpoint.removeEventListener.bind(endpoint),
    postMessage: endpoint.postMessage.bind(endpoint),
    start: () => {
      activate(endpoint);
    },
    close: () => {
      if ((endpoint as any).close) {
        (endpoint as any).close();
      }
    },
  };
}

export function getEndpoint(endpointIn: EndpointLike): WorkerEndpoint {
  return isWorkerEndpoint(endpointIn)
    ? endpointIn
    : isWindow(endpointIn)
      ? windowEndpoint(endpointIn)
      : isWorker(endpointIn)
        ? workerEndpoint(endpointIn)
        : endpointEndpoint(endpointIn);
}

export function activate(endpoint: any): void {
  if (endpoint.start) {
    endpoint.start();
  }
}
