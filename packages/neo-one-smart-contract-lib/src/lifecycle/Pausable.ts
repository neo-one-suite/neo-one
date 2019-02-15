import { Address, constant, createEventNotifier, SmartContract } from '@neo-one/smart-contract';
/* tslint:disable-next-line: no-implicit-dependencies */
import { PauserRole } from '@neo-one/smart-contract-lib';

export function Pausable<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class PausableClass extends PauserRole<Constructor<SmartContract>>(Base) {
    private readonly notify_pause = createEventNotifier<Address>('paused', 'by');
    private readonly notify_unpaused = createEventNotifier<Address>('paused', 'by');

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
        this.notify_unpaused(address);

        return true;
      }

      return false;
    }

    public pause(address: Address): boolean {
      if (this.onlyPausers(address) && !this.mutablePaused) {
        this.mutablePaused = true;
        this.notify_pause(address);

        return true;
      }

      return false;
    }
  }

  return PausableClass;
}
