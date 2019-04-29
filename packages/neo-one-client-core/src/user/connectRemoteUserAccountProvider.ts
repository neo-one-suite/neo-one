// tslint:disable only-arrow-functions
import { Block, GetOptions, RawAction, TransactionReceipt, UserAccountProvider } from '@neo-one/client-common';
import { Endpoint, Message } from './messageTypes';
import { deserialize, serialize } from './serializeUtils';

export interface ConnectRemoteUserAccountProviderOptions {
  readonly endpoint: Endpoint;
  readonly userAccountProvider: UserAccountProvider;
}

export const connectRemoteUserAccountProvider = ({
  endpoint,
  userAccountProvider: userAccountProviderIn,
}: ConnectRemoteUserAccountProviderOptions) => {
  // tslint:disable-next-line no-any
  const userAccountProvider: any = userAccountProviderIn;
  const asyncIterableInstanceMap: { [id: string]: AsyncIterator<Block | RawAction> } = {};
  const confirmationCallbackMap: { [id: string]: (options?: GetOptions) => Promise<TransactionReceipt> } = {};

  endpoint.addEventListener((event: Message) => {
    if (event.type === 'METHOD') {
      try {
        if (userAccountProvider[event.method] === undefined) {
          throw new Error(`Method ${event.method} is not implemented by the requested Provider.`);
        }

        // tslint:disable-next-line no-any
        userAccountProvider[event.method](...event.args.map(deserialize)).then((value: any) => {
          let returnValue = value;
          if (event.confirm) {
            // tslint:disable-next-line no-object-mutation
            confirmationCallbackMap[event.id] = value.confirmed;
            returnValue = {
              ...value,
              confirmed: undefined,
            };
          }

          endpoint.postMessage({ type: 'RETURN', value: serialize(returnValue), id: event.id });
        });
      } catch (error) {
        endpoint.postMessage({ type: 'ERROR', value: serialize(error), id: event.id });
      }
    }
  });

  const handleConfirm = async (event: Message) => {
    if (event.type === 'CONFIRMATION') {
      if (
        (confirmationCallbackMap[event.id] as ((options?: GetOptions) => Promise<TransactionReceipt>) | undefined) ===
        undefined
      ) {
        endpoint.postMessage({
          type: 'ERROR',
          value: serialize(new Error(`No confirmation callback registered for id: ${event.id}`)),
          id: event.id,
        });
      }
      confirmationCallbackMap[event.id](deserialize(event.args[0]) as GetOptions | undefined)
        .then((value) => {
          endpoint.postMessage({
            type: 'RETURN',
            value: serialize(value),
            id: event.id,
          });
        })
        .catch((error) => {
          endpoint.postMessage({ type: 'ERROR', value: serialize(error), id: event.id });
        });
    }
  };

  endpoint.addEventListener((event: Message) => {
    handleConfirm(event).catch((error) => {
      endpoint.postMessage({ type: 'ERROR', value: serialize(error), id: event.id });
    });
  });

  const handleRegisterAsyncIterable = async (event: Message) => {
    if (event.type === 'ASYNCITERABLE') {
      // tslint:disable-next-line no-object-mutation
      asyncIterableInstanceMap[event.id] = userAccountProvider[event.method](...event.args.map(deserialize))[
        Symbol.asyncIterator
      ]();
    }
  };

  endpoint.addEventListener((event: Message) => {
    handleRegisterAsyncIterable(event).catch((error) => {
      endpoint.postMessage({ type: 'ERROR', value: serialize(error), id: event.id });
    });
  });

  const handleNext = async (event: Message) => {
    if (event.type === 'NEXT') {
      if ((asyncIterableInstanceMap[event.id] as AsyncIterator<Block | RawAction> | undefined) === undefined) {
        endpoint.postMessage({
          type: 'ERROR',
          value: serialize(new Error(`No async iterable registered for id: ${event.id}`)),
          id: event.id,
        });
      }
      asyncIterableInstanceMap[event.id]
        .next()
        .then((value) => {
          endpoint.postMessage({
            type: 'RETURN',
            value: serialize(value),
            id: event.id,
          });
        })
        .catch((error) => {
          endpoint.postMessage({ type: 'ERROR', value: serialize(error), id: event.id });
        });
    }
  };

  endpoint.addEventListener((event: Message) => {
    handleNext(event).catch((error) => {
      endpoint.postMessage({ type: 'ERROR', value: serialize(error), id: event.id });
    });
  });

  const currentUserAccountSubscription = userAccountProviderIn.currentUserAccount$.subscribe({
    next: (value) => {
      endpoint.postMessage({ type: 'OBSERVABLE', id: 'currentUserAccount$', value: serialize(value) });
    },
    error: (error) => {
      endpoint.postMessage({ type: 'ERROR', value: serialize(error), id: 'currentUserAccount$' });
    },
    complete: () => {
      endpoint.postMessage({ type: 'RETURN', id: 'currentUserAccount$', value: serialize('Complete') });
    },
  });
  const userAccountsSubscription = userAccountProviderIn.userAccounts$.subscribe({
    next: (value) => {
      endpoint.postMessage({ type: 'OBSERVABLE', id: 'userAccounts$', value: serialize(value) });
    },
    error: (error) => {
      endpoint.postMessage({ type: 'ERROR', value: serialize(error), id: 'userAccounts$' });
    },
    complete: () => {
      endpoint.postMessage({ type: 'RETURN', id: 'userAccounts$', value: serialize('Complete') });
    },
  });
  const networksSubscription = userAccountProviderIn.networks$.subscribe({
    next: (value) => {
      endpoint.postMessage({ type: 'OBSERVABLE', id: 'networks$', value: serialize(value) });
    },
    error: (error) => {
      endpoint.postMessage({ type: 'ERROR', value: serialize(error), id: 'networks$' });
    },
    complete: () => {
      endpoint.postMessage({ type: 'RETURN', id: 'networks$', value: serialize('Complete') });
    },
  });

  return () => {
    currentUserAccountSubscription.unsubscribe();
    userAccountsSubscription.unsubscribe();
    networksSubscription.unsubscribe();
  };
};
