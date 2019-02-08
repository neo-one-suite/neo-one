import { Address, constant, createEventNotifier, SmartContract } from '@neo-one/smart-contract';

/**
 * @title Designated Caller
 * @dev This contract can only be called by 1 other address.
 */

export function DesignatedCaller<TBase extends Constructor<SmartContract>>(Base: TBase) {
  abstract class DesignatedCallerClass extends Base {
    protected abstract mutableDesignatedCaller: Address;

    /* tslint:disable-next-line:variable-name */
    private readonly assigned_designated_caller = createEventNotifier<Address, Address>(
      'assigned designated caller',
      'previously',
      'now',
    );

    @constant
    public get designatedCaller(): Address {
      return this.mutableDesignatedCaller;
    }

    public designateCaller(assignee: Address): boolean {
      if (Address.isCaller(this.mutableDesignatedCaller) && assignee !== this.mutableDesignatedCaller) {
        this.assigned_designated_caller(this.mutableDesignatedCaller, assignee);
        this.mutableDesignatedCaller = assignee;

        return true;
      }

      return false;
    }
  }

  return DesignatedCallerClass;
}
