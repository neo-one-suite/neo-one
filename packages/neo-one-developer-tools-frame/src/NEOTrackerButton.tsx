// tslint:disable no-null-keyword
import { LinkBase } from '@neo-one/react-common';
import * as React from 'react';
import { MdOpenInNew } from 'react-icons/md';
import { ToolbarButton } from './ToolbarButton';
import { useNEOTrackerURL } from './useNEOTrackerURL';

export function NEOTrackerButton() {
  const neotrackerURL = useNEOTrackerURL();

  return neotrackerURL === undefined ? null : (
    <ToolbarButton
      data-test-button="neo-one-neotracker-button"
      data-test-tooltip="neo-one-neotracker-tooltip"
      as={LinkBase}
      href={neotrackerURL}
      help="Open NEO Tracker..."
      target="_blank"
    >
      <MdOpenInNew />
    </ToolbarButton>
  );
}
