import * as React from 'react';
import { MdSettings } from 'react-icons/md';
import { Overlay, styled } from 'reakit';
import { SettingsDialog } from './SettingsDialog';
import { ToolbarButton } from './ToolbarButton';

const StyledToolbarButton = styled(ToolbarButton)`
  &&& {
    border-right: 1px solid rgba(0, 0, 0, 0.3);
  }
`;

export function SettingsButton() {
  return (
    <SettingsDialog>
      {(overlay) => (
        <Overlay.Show
          data-test-button="neo-one-settings-button"
          data-test-tooltip="neo-one-settings-tooltip"
          as={StyledToolbarButton}
          help="Open Settings..."
          {...overlay}
        >
          <MdSettings />
        </Overlay.Show>
      )}
    </SettingsDialog>
  );
}
