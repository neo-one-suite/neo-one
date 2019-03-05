import { Address, constant, createEventNotifier, SmartContract } from '@neo-one/smart-contract';
import { PauserRole } from '../access/';

/* tslint:disable-next-line:variable-name */
const notify_pause = createEventNotifier<Address>('paused', 'by');
/* tslint:disable-next-line:variable-name */
const notify_unpaused = createEventNotifier<Address>('unpaused', 'by');

export function Pausable<TBase extends Constructor<SmartContract>>(Base: TBase) {
  class PausableClass extends PauserRole<Constructor<SmartContract>>(Base) {
    private mutablePaused = false;

    @constant
    public get isPaused(): boolean {
      return this.mutablePaused;
    }

    @constant
    public whenNotPaused() {
      return !this.mutablePaused;
    }

    @constant
    public whenPaused() {
      return this.mutablePaused;
    }

    public unpause(address: Address): boolean {
      if (this.onlyPausers(address) && this.mutablePaused) {
        this.mutablePaused = false;
        notify_unpaused(address);

        return true;
      }

      return false;
    }

    public pause(requestedBy: Address): boolean {
      if (this.onlyPausers(requestedBy) && !this.mutablePaused) {
        this.mutablePaused = true;
        notify_pause(requestedBy);

        return true;
      }

      return false;
    }
  }

  return PausableClass;
}
