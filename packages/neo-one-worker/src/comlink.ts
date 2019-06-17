// tslint:disable
export interface Endpoint {
  postMessage(message: any, transfer?: any[]): void;
  addEventListener(type: string, listener: (event: MessageEvent) => void, options?: {}): void;
  removeEventListener(type: string, listener: (event: MessageEvent) => void, options?: {}): void;
}
export type Proxy = Function;
type CBProxyCallback = (bpcd: CBProxyCallbackDescriptor) => {}; // eslint-disable-line no-unused-vars
type Transferable = MessagePort | ArrayBuffer; // eslint-disable-line no-unused-vars
export type Exposable = Function | Object; // eslint-disable-line no-unused-vars

interface InvocationResult {
  type: 'RETURN';
  id?: string;
  value: WrappedValue;
}

type WrappedValue = RawWrappedValue | HandledWrappedValue;

interface PropertyIteratorEntry {
  value: {};
  path: string[];
}

interface WrappedChildValue {
  path: string[];
  wrappedValue: HandledWrappedValue;
}

interface RawWrappedValue {
  type: 'RAW';
  value: {};
  wrappedChildren?: WrappedChildValue[];
}

interface HandledWrappedValue {
  type: string;
  value: {};
}

type CBProxyCallbackDescriptor = CBPCDGet | CBPCDApply | CBPCDConstruct | CBPCDSet; // eslint-disable-line no-unused-vars

interface CBPCDGet {
  type: 'GET';
  callPath: PropertyKey[];
}

interface CBPCDApply {
  type: 'APPLY';
  callPath: PropertyKey[];
  argumentsList: {}[];
}

interface CBPCDConstruct {
  type: 'CONSTRUCT';
  callPath: PropertyKey[];
  argumentsList: {}[];
}

interface CBPCDSet {
  type: 'SET';
  callPath: PropertyKey[];
  property: PropertyKey;
  value: {};
}

type InvocationRequest =
  | GetInvocationRequest
  | ApplyInvocationRequest
  | ConstructInvocationRequest
  | SetInvocationRequest;

interface GetInvocationRequest {
  id?: string;
  type: 'GET';
  callPath: PropertyKey[];
}

interface ApplyInvocationRequest {
  id?: string;
  type: 'APPLY';
  callPath: PropertyKey[];
  argumentsList: WrappedValue[];
}

interface ConstructInvocationRequest {
  id?: string;
  type: 'CONSTRUCT';
  callPath: PropertyKey[];
  argumentsList: WrappedValue[];
}

interface SetInvocationRequest {
  id?: string;
  type: 'SET';
  callPath: PropertyKey[];
  property: PropertyKey;
  value: WrappedValue;
}

export interface TransferHandler {
  canHandle: (obj: {}) => Boolean;
  serialize: (obj: {}) => {};
  deserialize: (obj: {}) => {};
}

const TRANSFERABLE_TYPES = [ArrayBuffer, MessagePort];
const uid: number = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

const proxyValueSymbol = Symbol('proxyValue');
const throwSymbol = Symbol('throw');
const proxyTransferHandler: TransferHandler = {
  canHandle: (obj: {}): Boolean => {
    return obj && ((obj as any)[proxyValueSymbol] || obj instanceof Function);
  },
  serialize: (obj: {}): {} => {
    const { port1, port2 } = new MessageChannel();
    expose(obj, port1);
    return port2;
  },
  deserialize: (obj: {}): {} => {
    return proxy(obj as MessagePort);
  },
};

const throwTransferHandler = {
  canHandle: (obj: {}): Boolean => (obj && (obj as any)[throwSymbol]) || obj instanceof Error,
  serialize: (obj: any): {} => {
    const message = obj && obj.message;
    const stack = obj && obj.stack;
    return Object.assign({}, obj, { message, stack });
  },
  deserialize: (obj: {}): {} => {
    throw Object.assign(Error(), obj);
  },
};

export const transferHandlers: Map<string, TransferHandler> = new Map([
  ['PROXY', proxyTransferHandler] as const,
  ['THROW', throwTransferHandler] as const,
]);

let pingPongMessageCounter: number = 0;

export function proxy(endpoint: Endpoint | Window, target?: any): Proxy {
  if (isWindow(endpoint)) endpoint = windowEndpoint(endpoint);
  if (!isEndpoint(endpoint))
    throw Error('endpoint does not have all of addEventListener, removeEventListener and postMessage defined');

  activateEndpoint(endpoint);
  return cbProxy(
    async (irequest) => {
      let args: WrappedValue[] = [];
      if (irequest.type === 'APPLY' || irequest.type === 'CONSTRUCT') args = irequest.argumentsList.map(wrapValue);
      const response = await pingPongMessage(
        endpoint as Endpoint,
        Object.assign({}, irequest, { argumentsList: args }),
        transferableProperties(args),
      );
      const result = response.data as InvocationResult;
      return unwrapValue(result.value);
    },
    [],
    target,
  );
}

export function proxyValue<T>(obj: T): T {
  if (obj instanceof MessagePort) {
    return obj;
  }

  (obj as any)[proxyValueSymbol] = true;
  return obj;
}

export function expose(rootObj: Exposable, endpoint: Endpoint | Window): void {
  if (isWindow(endpoint)) endpoint = windowEndpoint(endpoint);
  if (!isEndpoint(endpoint))
    throw Error('endpoint does not have all of addEventListener, removeEventListener and postMessage defined');

  activateEndpoint(endpoint);
  attachMessageHandler(endpoint, async function(event: MessageEvent) {
    if (!event.data.id || !event.data.callPath) return;
    let iresult;
    const irequest = event.data as InvocationRequest;
    try {
      const that = await irequest.callPath.slice(0, -1).reduce((obj, propName) => obj[propName], rootObj as any);
      let args: Array<{}> = [];

      if (irequest.type === 'APPLY' || irequest.type === 'CONSTRUCT') {
        args = irequest.argumentsList.map(unwrapValue);
      }
      if (irequest.type === 'APPLY') {
        if (irequest.callPath.length > 0) {
          iresult = await that[irequest.callPath[irequest.callPath.length - 1]](...args);
        } else {
          iresult = await that(...args);
        }
      }
      if (irequest.type === 'CONSTRUCT') {
        if (irequest.callPath.length > 0) {
          iresult = await new that[irequest.callPath[irequest.callPath.length - 1]](...args);
        } else {
          iresult = await new that(...args);
        }
        iresult = proxyValue(iresult);
      }
      if (irequest.type === 'SET' || irequest.type === 'GET') {
        const obj = irequest.callPath.length > 0 ? await that[irequest.callPath[irequest.callPath.length - 1]] : that;
        if (irequest.type === 'SET') {
          obj[irequest.property] = irequest.value;
          // FIXME: ES6 Proxy Handler `set` methods are supposed to return a
          // boolean. To show good will, we return true asynchronously ¯\_(ツ)_/¯
          iresult = true;
        } else {
          iresult = obj;
        }
      }
    } catch (e) {
      iresult = e;
      iresult[throwSymbol] = true;
    }

    iresult = makeInvocationResult(irequest, iresult);
    return (endpoint as Endpoint).postMessage(iresult, transferableProperties([iresult]));
  });
}

function wrapValue(arg: {}): WrappedValue {
  // Is arg itself handled by a TransferHandler?
  for (const [key, transferHandler] of transferHandlers) {
    if (transferHandler.canHandle(arg)) {
      return {
        type: key,

        value: transferHandler.serialize(arg),
      };
    }
  }

  // If not, traverse the entire object and find handled values.
  let wrappedChildren: WrappedChildValue[] = [];
  iterateUnhandledProperties(arg, (value, path) => {
    for (const [key, transferHandler] of transferHandlers) {
      if (transferHandler.canHandle(value)) {
        wrappedChildren.push({
          path,
          wrappedValue: {
            type: key,
            value: transferHandler.serialize(value),
          },
        });

        return true;
      }
    }

    return false;
  });

  for (const wrappedChild of wrappedChildren) {
    const container = wrappedChild.path.slice(0, -1).reduce((obj, key) => obj[key], arg as any);
    container[wrappedChild.path[wrappedChild.path.length - 1]] = null;
  }
  return {
    type: 'RAW',
    value: arg,
    wrappedChildren,
  };
}

function unwrapValue(arg: WrappedValue): {} {
  if (transferHandlers.has(arg.type)) {
    const transferHandler = transferHandlers.get(arg.type)!;
    return transferHandler.deserialize(arg.value);
  } else if (isRawWrappedValue(arg)) {
    for (const wrappedChildValue of arg.wrappedChildren || []) {
      if (!transferHandlers.has(wrappedChildValue.wrappedValue.type))
        throw Error(`Unknown value type "${arg.type}" at ${wrappedChildValue.path.join('.')}`);
      const transferHandler = transferHandlers.get(wrappedChildValue.wrappedValue.type)!;
      const newValue = transferHandler.deserialize(wrappedChildValue.wrappedValue.value);
      replaceValueInObjectAtPath(arg.value, wrappedChildValue.path, newValue);
    }
    return arg.value;
  } else {
    throw Error(`Unknown value type "${arg.type}"`);
  }
}

function replaceValueInObjectAtPath(obj: {}, path: string[], newVal: {}) {
  const lastKey = path.slice(-1)[0];
  const lastObj = path.slice(0, -1).reduce((obj: any, key: string) => obj[key], obj);
  lastObj[lastKey] = newVal;
}

function isRawWrappedValue(arg: WrappedValue): arg is RawWrappedValue {
  return arg.type === 'RAW';
}

function windowEndpoint(w: Window): Endpoint {
  if (self.constructor.name !== 'Window') throw Error('self is not a window');
  return {
    addEventListener: self.addEventListener.bind(self) as any,
    removeEventListener: self.removeEventListener.bind(self) as any,
    postMessage: (msg, transfer) => w.postMessage(msg, '*', transfer),
  };
}

export function isEndpoint(endpoint: any): endpoint is Endpoint {
  return 'addEventListener' in endpoint && 'removeEventListener' in endpoint && 'postMessage' in endpoint;
}

function activateEndpoint(endpoint: Endpoint): void {
  if (isMessagePort(endpoint)) endpoint.start();
}

function attachMessageHandler(endpoint: Endpoint, f: (e: MessageEvent) => void): void {
  // Checking all possible types of `endpoint` manually satisfies TypeScript’s
  // type checker. Not sure why the inference is failing here. Since it’s
  // unnecessary code I’m going to resort to `any` for now.
  // if(isWorker(endpoint))
  //   endpoint.addEventListener('message', f);
  // if(isMessagePort(endpoint))
  //   endpoint.addEventListener('message', f);
  // if(isOtherWindow(endpoint))
  //   endpoint.addEventListener('message', f);
  (endpoint as any).addEventListener('message', f);
}

function detachMessageHandler(endpoint: Endpoint, f: (e: MessageEvent) => void): void {
  // Same as above.
  (<any>endpoint).removeEventListener('message', f);
}

function isMessagePort(endpoint: Endpoint): endpoint is MessagePort {
  return endpoint.constructor.name === 'MessagePort';
}

function isWindow(endpoint: Endpoint | Window): endpoint is Window {
  // TODO: This doesn’t work on cross-origin iframes.
  // return endpoint.constructor.name === 'Window';
  return ['window', 'length', 'location', 'parent', 'opener'].every((prop) => prop in endpoint);
}

/**
 * `pingPongMessage` sends a `postMessage` and waits for a reply. Replies are
 * identified by a unique id that is attached to the payload.
 */
function pingPongMessage(endpoint: Endpoint, msg: Object, transferables: Transferable[]): Promise<MessageEvent> {
  const id = `${uid}-${pingPongMessageCounter++}`;

  return new Promise((resolve) => {
    attachMessageHandler(endpoint, function handler(event: MessageEvent) {
      if (event.data.id !== id || event.data.type !== 'RETURN') return;
      detachMessageHandler(endpoint, handler);
      resolve(event);
    });

    // Copy msg and add `id` property
    msg = Object.assign({}, msg, { id });
    endpoint.postMessage(msg, transferables);
  });
}

function cbProxy(cb: CBProxyCallback, callPath: PropertyKey[] = [], target = function() {}): Proxy {
  return new Proxy(target, {
    construct(_target, argumentsList, proxy) {
      return cb({
        type: 'CONSTRUCT',
        callPath,
        argumentsList,
      });
    },
    apply(_target, _thisArg, argumentsList) {
      // We use `bind` as an indicator to have a remote function bound locally.
      // The actual target for `bind()` is currently ignored.
      if (callPath[callPath.length - 1] === 'bind') return cbProxy(cb, callPath.slice(0, -1));
      return cb({
        type: 'APPLY',
        callPath: callPath[callPath.length - 1] === 'apply' ? callPath.slice(0, -1) : callPath,
        argumentsList: callPath[callPath.length - 1] === 'apply' ? argumentsList[1] : argumentsList,
      });
    },
    get(_target, property, proxy) {
      if (property === proxyValueSymbol) {
        return true;
      }

      if (property === 'then' && callPath.length === 0) {
        return { then: () => proxy };
      } else if (property === 'then') {
        const r = cb({
          type: 'GET',
          callPath,
        });
        return Promise.resolve(r).then.bind(r);
      } else {
        return cbProxy(cb, callPath.concat(property), (<any>_target)[property]);
      }
    },
    set(_target, property, value, _proxy): boolean {
      if (property === proxyValueSymbol) {
        return true;
      }

      return cb({
        type: 'SET',
        callPath,
        property,
        value,
      }) as boolean;
    },
  });
}

export function isTransferable(thing: {}): thing is Transferable {
  return TRANSFERABLE_TYPES.some((type) => thing instanceof type);
}

function iterateUnhandledProperties(
  value: {} | undefined,
  handleProperty: (value: any, path: string[]) => boolean,
  path: string[] = [],
  visited: WeakSet<{}> | null = null,
): void {
  if (!value) return;
  if (!visited) visited = new WeakSet<{}>();
  if (visited.has(value)) return;
  if (typeof value === 'string') return;
  if (typeof value === 'object') visited.add(value);
  if (ArrayBuffer.isView(value)) return;
  if (handleProperty(value, path)) return;

  const keys = Object.keys(value);
  for (const key of keys) iterateUnhandledProperties((value as any)[key], handleProperty, [...path, key], visited);
}

function* iterateAllProperties(
  value: {} | undefined,
  path: string[] = [],
  visited: WeakSet<{}> | null = null,
): Iterable<PropertyIteratorEntry> {
  if (!value) return;
  if (!visited) visited = new WeakSet<{}>();
  if (visited.has(value)) return;
  if (typeof value === 'string') return;
  if (typeof value === 'object') visited.add(value);
  if (ArrayBuffer.isView(value)) return;
  yield { value, path };

  const keys = Object.keys(value);
  for (const key of keys) yield* iterateAllProperties((value as any)[key], [...path, key], visited);
}

export function transferableProperties(obj: {}[] | undefined): Transferable[] {
  const r: Transferable[] = [];
  for (const prop of iterateAllProperties(obj)) {
    if (isTransferable(prop.value)) r.push(prop.value);
  }
  return r;
}

function makeInvocationResult(irequest: InvocationRequest, obj: {}): InvocationResult {
  return {
    type: 'RETURN',
    id: irequest.id,
    value: wrapValue(obj),
  };
}
