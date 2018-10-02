// tslint:disable no-any
import * as comlink from './comlink';

// tslint:disable-next-line no-let
let isSetup = false;
export const setup = () => {
  if (!isSetup) {
    isSetup = true;

    comlink.transferHandlers.set('ANY_FUNCTION_PROXY', {
      canHandle(obj: any): boolean {
        return obj instanceof Proxy;
      },
      serialize(obj: any): any {
        const { port1, port2 } = new MessageChannel();
        comlink.expose(obj, port1);

        return port2;
      },
      deserialize(obj: any): any {
        return comlink.proxy(obj as comlink.Endpoint);
      },
    });
  }
};
