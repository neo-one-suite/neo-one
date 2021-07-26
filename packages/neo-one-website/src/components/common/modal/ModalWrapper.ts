import {EventBus} from '../bus'

export class ModalWrapper {
  readonly event = new EventBus()

  open(name?: string, payload?: any) {
    this.event.emit('open', name, payload)
  }

  close(name?: string) {
    this.event.emit('close', name)
  }

  toggle(name?: string, payload?: any) {
    this.event.emit('toggle', name, payload)
  }

  closeAll() {
    this.event.emit('closeAll')
  }
}
