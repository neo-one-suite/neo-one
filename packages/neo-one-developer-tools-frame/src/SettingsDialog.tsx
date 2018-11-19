import { UseHiddenProps } from '@neo-one/react-common';
import * as React from 'react';
import { AddToken } from './AddToken';
import { AutoConsensusOption } from './AutoConsensusOption';
import { AutoSystemFeeOption } from './AutoSystemFeeOption';
import { Dialog } from './Dialog';
import { NetworkSelector } from './NetworkSelector';
import { ResetLocalStateButton } from './ResetLocalStateButton';
import { SecondsPerBlockInput } from './SecondsPerBlockInput';

interface Props {
  readonly children: (props: UseHiddenProps) => React.ReactNode;
}

export function SettingsDialog({ children }: Props) {
  return (
    <Dialog
      data-test-heading="neo-one-settings-dialog-heading"
      data-test-close-button="neo-one-settings-dialog-close-button"
      title="Settings"
      renderDialog={() => (
        <>
          <AddToken />
          <AutoConsensusOption />
          <AutoSystemFeeOption />
          <SecondsPerBlockInput />
          <NetworkSelector />
          <ResetLocalStateButton />
        </>
      )}
    >
      {children}
    </Dialog>
  );
}
