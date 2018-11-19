import * as React from 'react';
import { MdSettings } from 'react-icons/md';
import styled from 'styled-components';
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
        <StyledToolbarButton
          data-test-button="neo-one-settings-button"
          data-test-tooltip="neo-one-settings-tooltip"
          help="Open Settings..."
          onClick={overlay.show}
        >
          <MdSettings />
        </StyledToolbarButton>
      )}
    </SettingsDialog>
  );
}
