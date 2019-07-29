import styled from '@emotion/styled';
import { Box, useStream } from '@neo-one/react-common';
import * as React from 'react';
import { MdAccountBalance } from 'react-icons/md';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DeveloperToolsContext } from './DeveloperToolsContext';
import { useAddError } from './ToastsContext';
import { ToolbarButton } from './ToolbarButton';
import { WalletDialog } from './WalletDialog';

const { useContext } = React;

const Text = styled(Box)`
  padding-right: 4px;
`;

export function WalletButton() {
  const addError = useAddError();
  const { accountState$ } = useContext(DeveloperToolsContext);
  const value = useStream(
    () =>
      accountState$.pipe(
        catchError((error) => {
          addError(error);

          return of(undefined);
        }),
      ),
    [accountState$],
  );

  return (
    <WalletDialog>
      {(overlay) => (
        <ToolbarButton
          data-test-button="neo-one-wallet-button"
          data-test-tooltip="neo-one-wallet-tooltip"
          help="Open Wallet..."
          onClick={overlay.show}
        >
          <Text data-test="neo-one-wallet-value">
            {value === undefined ? 'Select Wallet' : value.currentUserAccount.name}
          </Text>
          <MdAccountBalance />
        </ToolbarButton>
      )}
    </WalletDialog>
  );
}
