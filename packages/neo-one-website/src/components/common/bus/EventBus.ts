export type BusMap = Record<string, ReadonlyArray<BusCallback> | undefined>;
// tslint:disable-next-line no-any
export type BusCallback = (...params: ReadonlyArray<any>) => void;

export class EventBus {
  public readonly bus: BusMap;

  public constructor() {
    this.bus = {};
  }

  public on(key: string, callback: BusCallback) {
    // tslint:disable-next-line no-object-mutation
    this.bus[key] = [...(this.bus[key] ?? []), callback];
  }

  public off(key: string, callback: BusCallback) {
    // tslint:disable-next-line no-object-mutation
    this.bus[key] = this.bus[key]?.filter((it: BusCallback) => it !== callback);
  }

  // tslint:disable-next-line no-any
  public emit(key: string, ...params: ReadonlyArray<any>) {
    // tslint:disable-next-line no-loop-statement
    for (const callback of this.bus[key] ?? []) {
      callback(...params);
    }
  }
}
