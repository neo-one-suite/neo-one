import * as React from 'react';
import { Base } from 'reakit';
import { AddToken } from './AddToken';
import { Dialog, OverlayProps } from './Dialog';
import { ResetLocalStateButton } from './ResetLocalStateButton';

interface Props {
  readonly children: (props: OverlayProps) => React.ReactNode;
}

export function SettingsDialog({ children }: Props) {
  return (
    <Dialog
      title="Settings"
      renderDialog={() => (
        <Base>
          <AddToken />
          <ResetLocalStateButton />
        </Base>
      )}
    >
      {children}
    </Dialog>
  );
}
