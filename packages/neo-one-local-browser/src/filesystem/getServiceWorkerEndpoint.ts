interface Result {
  readonly worker: ServiceWorker;
  readonly container: ServiceWorkerContainer;
}

export const getServiceWorkerEndpoint = async (): Promise<Result> => {
  if (navigator.serviceWorker.controller) {
    return { worker: navigator.serviceWorker.controller, container: navigator.serviceWorker };
  }

  return new Promise<Result>((resolve) => {
    function onControllerChange() {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
        resolve({ worker: navigator.serviceWorker.controller, container: navigator.serviceWorker });
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
  });
};
