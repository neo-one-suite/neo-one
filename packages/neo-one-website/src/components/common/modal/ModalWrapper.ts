import { EventBus } from '../bus';

export class ModalWrapper {
  public readonly event = new EventBus();

  // tslint:disable-next-line no-any
  public open(name?: string, payload?: any) {
    this.event.emit('open', name, payload);
  }

  public close(name?: string) {
    this.event.emit('close', name);
  }

  // tslint:disable-next-line no-any
  public toggle(name?: string, payload?: any) {
    this.event.emit('toggle', name, payload);
  }

  public closeAll() {
    this.event.emit('closeAll');
  }
}
