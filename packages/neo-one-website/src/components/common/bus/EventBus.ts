export type BusMap = Record<string, BusCallback[] | undefined>
export type BusCallback = (...params: any[]) => void

export class EventBus {
  readonly bus: BusMap

  constructor() {
    this.bus = {}
  }

  on(key: string, callback: BusCallback) {
    this.bus[key] = [...(this.bus[key] ?? []), callback]
  }

  off(key: string, callback: BusCallback) {
    this.bus[key] = this.bus[key]?.filter((it: BusCallback) => it !== callback)
  }

  emit(key: string, ...params: any[]) {
    for (const callback of this.bus[key] ?? []) {
      // eslint-disable-next-line standard/no-callback-literal
      callback(...params)
    }
  }
}
