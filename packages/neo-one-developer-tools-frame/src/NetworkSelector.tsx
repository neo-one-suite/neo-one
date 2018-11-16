// tslint:disable no-any
import { FromStream } from '@neo-one/react';
import { Select } from '@neo-one/react-common';
import * as React from 'react';
import { styled } from 'reakit';
import { combineLatest } from 'rxjs';
import { DeveloperToolsContext, DeveloperToolsContextType } from './DeveloperToolsContext';
import { SettingsLabel } from './SettingsLabel';
import { WithAddError } from './WithAddError';

const StyledSelect: any = styled(Select)`
  &&& {
    width: 100px;
    height: 40px;
  }
`;

export function NetworkSelector() {
  return (
    <WithAddError>
      {(addError) => (
        <DeveloperToolsContext.Consumer>
          {({ client, currentNetwork$, networks$ }: DeveloperToolsContextType) => (
            <FromStream
              props={[currentNetwork$, networks$]}
              createStream={() => combineLatest(currentNetwork$, networks$)}
            >
              {([network, networks]: [string, ReadonlyArray<string>]) => (
                <SettingsLabel>
                  Network
                  <StyledSelect
                    data-test="neo-one-network-selector"
                    value={{ label: network, value: network }}
                    options={networks.map((net) => ({ label: net, value: net }))}
                    onChange={(option: any) => {
                      if (option != undefined && !Array.isArray(option)) {
                        client.selectNetwork(option.value).catch(addError);
                      }
                    }}
                  />
                </SettingsLabel>
              )}
            </FromStream>
          )}
        </DeveloperToolsContext.Consumer>
      )}
    </WithAddError>
  );
}
