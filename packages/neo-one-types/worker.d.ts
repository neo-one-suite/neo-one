/// <reference lib="webworker" />
/// <reference types="@types/sharedworker" />

declare var WebpackWorker: {
  prototype: Worker;
  new (): Worker;
};

declare var WebpackSharedWorker: {
  prototype: SharedWorker.SharedWorker;
  new (): SharedWorker.SharedWorker;
};
