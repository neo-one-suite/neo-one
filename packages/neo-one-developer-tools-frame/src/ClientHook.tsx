import { Client, DeveloperClient } from '@neo-one/client-core';
import { FromStream } from '@neo-one/react';
import { Link } from '@neo-one/react-common';
import BigNumber from 'bignumber.js';
import * as React from 'react';
import { combineLatest } from 'rxjs';
import { WithAutoConsensus, WithAutoSystemFee, WithNetworkClient } from './DeveloperToolsContext';
import { AddToast, WithAddToast } from './ToastsContainer';
import { AddError, WithAddError } from './WithAddError';
import { WithNEOTrackerURL } from './WithNEOTrackerURL';

const mutableHookers = new Map<Client, Hooker>();

class Hooker {
  public static get(client: Client): Hooker {
    let hooker = mutableHookers.get(client);
    if (hooker === undefined) {
      hooker = new Hooker(client);
      mutableHookers.set(client, hooker);
    }

    return hooker;
  }

  private mutableAutoConsensus = false;
  private mutableAutoSystemFee = false;
  private mutableDeveloperClient: DeveloperClient | undefined;
  private mutableAddToast: AddToast | undefined;
  private mutableAddError: AddError | undefined;
  private mutableNEOTrackerURL: string | undefined;

  private constructor(client: Client) {
    client.hooks.beforeRelay.tapPromise('AutoSystemFee', async (options) => {
      if (this.mutableAutoSystemFee && this.mutableDeveloperClient !== undefined) {
        // tslint:disable-next-line no-object-mutation
        options.systemFee = new BigNumber(-1);
      }
    });
    client.hooks.beforeConfirmed.tapPromise('AutoConsensus', async () => {
      if (this.mutableAutoConsensus && this.mutableDeveloperClient !== undefined) {
        await this.mutableDeveloperClient.runConsensusNow();
      }
    });
    client.hooks.relayError.tap('RelayErrorToast', (error) => {
      if (this.mutableAddError !== undefined) {
        this.mutableAddError(error);
      }
    });
    client.hooks.confirmedError.tap('ConfirmedErrorToast', (_transaction, error) => {
      if (this.mutableAddError !== undefined) {
        this.mutableAddError(error);
      }
    });
    client.hooks.callError.tap('CallErrorToast', (error) => {
      if (this.mutableAddError !== undefined) {
        this.mutableAddError(error);
      }
    });
    client.hooks.afterConfirmed.tap('TransactionToast', (transaction) => {
      if (this.mutableAddToast !== undefined) {
        this.mutableAddToast({
          id: transaction.hash,
          title: <span data-test="neo-one-transaction-toast-title">Transaction Confirmed</span>,
          message:
            this.mutableNEOTrackerURL === undefined ? (
              undefined
            ) : (
              <span data-test="neo-one-transaction-toast-message">
                View on&nbsp;
                <Link
                  data-test="neo-one-transaction-toast-link"
                  href={`${this.mutableNEOTrackerURL}/tx/${transaction.hash.slice(2)}`}
                  target="_blank"
                  linkColor="primary"
                >
                  NEO Tracker
                </Link>
              </span>
            ),
          autoHide: 5000,
        });
      }
    });
  }

  public set autoConsensus(value: boolean) {
    this.mutableAutoConsensus = value;
  }

  public set autoSystemFee(value: boolean) {
    this.mutableAutoSystemFee = value;
  }

  public set developerClient(value: DeveloperClient | undefined) {
    this.mutableDeveloperClient = value;
  }

  public set addToast(value: AddToast) {
    this.mutableAddToast = value;
  }

  public set addError(value: AddError) {
    this.mutableAddError = value;
  }

  public set neotrackerURL(value: string | undefined) {
    this.mutableNEOTrackerURL = value;
  }
}

export function ClientHook() {
  return (
    <WithAddToast>
      {(addToast) => (
        <WithAddError>
          {(addError) => (
            <WithNetworkClient>
              {({ client, developerClient }) => (
                <WithNEOTrackerURL>
                  {(neotrackerURL) => (
                    <WithAutoConsensus>
                      {({ autoConsensus$ }) => (
                        <WithAutoSystemFee>
                          {({ autoSystemFee$ }) => (
                            <FromStream
                              props={[autoConsensus$, autoSystemFee$]}
                              createStream={() => combineLatest(autoConsensus$, autoSystemFee$)}
                            >
                              {([autoConsensus, autoSystemFee]: [boolean, boolean]) => {
                                const mutableHooker = Hooker.get(client);
                                mutableHooker.autoConsensus = autoConsensus;
                                mutableHooker.autoSystemFee = autoSystemFee;
                                mutableHooker.developerClient = developerClient;
                                mutableHooker.addToast = addToast;
                                mutableHooker.neotrackerURL = neotrackerURL;
                                mutableHooker.addError = addError;

                                // tslint:disable-next-line no-null-keyword
                                return null;
                              }}
                            </FromStream>
                          )}
                        </WithAutoSystemFee>
                      )}
                    </WithAutoConsensus>
                  )}
                </WithNEOTrackerURL>
              )}
            </WithNetworkClient>
          )}
        </WithAddError>
      )}
    </WithAddToast>
  );
}
