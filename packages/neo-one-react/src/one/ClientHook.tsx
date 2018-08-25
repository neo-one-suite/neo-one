import { Client, DeveloperClient } from '@neo-one/client';
import * as React from 'react';
import { Link, styled } from 'reakit';
import { prop } from 'styled-tools';
import { WithAutoConsensus, WithNetworkClient } from './DeveloperToolsContext';
import { AddToast, WithAddToast } from './ToastsContainer';
import { WithNEOTrackerURL } from './WithNEOTrackerURL';

const mutableHookers = new Map<Client, Hooker>();

export const StyledLink = styled(Link)`
  color: ${prop('theme.accent')};
  opacity: 0.9;
  ${prop('theme.fonts.axiformaRegular')};
  font-size: 14px;

  &:hover {
    opacity: 1;
    text-decoration: none;
  }
`;

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
  private mutableDeveloperClient: DeveloperClient | undefined;
  private mutableAddToast: AddToast | undefined;
  private mutableNEOTrackerURL: string | undefined;

  private constructor(client: Client) {
    client.hooks.beforeConfirmed.tapPromise('AutoConsensus', async () => {
      if (this.mutableAutoConsensus && this.mutableDeveloperClient !== undefined) {
        await this.mutableDeveloperClient.runConsensusNow();
      }
    });
    client.hooks.afterConfirmed.tap('TransactionToast', (transaction) => {
      if (this.mutableAddToast !== undefined && this.mutableNEOTrackerURL !== undefined) {
        this.mutableAddToast({
          id: transaction.hash,
          title: 'Transaction Confirmed',
          message: (
            <>
              View on&nbsp;
              <StyledLink href={`${this.mutableNEOTrackerURL}/tx/${transaction.hash.slice(2)}`} target="_blank">
                NEO Tracker
              </StyledLink>
            </>
          ),
          autoHide: 5000,
        });
      }
    });
  }

  public set autoConsensus(value: boolean) {
    this.mutableAutoConsensus = value;
  }

  public set developerClient(value: DeveloperClient | undefined) {
    this.mutableDeveloperClient = value;
  }

  public set addToast(value: AddToast) {
    this.mutableAddToast = value;
  }

  public set neotrackerURL(value: string | undefined) {
    this.mutableNEOTrackerURL = value;
  }
}

export function ClientHook() {
  return (
    <WithAddToast>
      {(addToast) => (
        <WithNetworkClient>
          {({ client, developerClient }) => (
            <WithNEOTrackerURL>
              {(neotrackerURL) => (
                <WithAutoConsensus>
                  {({ autoConsensus }) => {
                    const mutableHooker = Hooker.get(client);
                    mutableHooker.autoConsensus = autoConsensus;
                    mutableHooker.developerClient = developerClient;
                    mutableHooker.addToast = addToast;
                    mutableHooker.neotrackerURL = neotrackerURL;

                    // tslint:disable-next-line no-null-keyword
                    return null;
                  }}
                </WithAutoConsensus>
              )}
            </WithNEOTrackerURL>
          )}
        </WithNetworkClient>
      )}
    </WithAddToast>
  );
}
