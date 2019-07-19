// tslint:disable no-any
import styled from '@emotion/styled';
import { Select, useStream } from '@neo-one/react-common';
import * as React from 'react';
import { combineLatest } from 'rxjs';
import { DeveloperToolsContext } from './DeveloperToolsContext';
import { SettingsLabel } from './SettingsLabel';
import { useAddError } from './ToastsContext';

const { useContext } = React;

const StyledSelect: any = styled(Select)`
  &&& {
    width: 100px;
    height: 40px;
  }
`;

export function NetworkSelector() {
  const addError = useAddError();
  const { client, currentNetwork$, networks$ } = useContext(DeveloperToolsContext);
  const [network, networks] = useStream(() => combineLatest([currentNetwork$, networks$]), [
    currentNetwork$,
    networks$,
  ]);

  return (
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
  );
}
