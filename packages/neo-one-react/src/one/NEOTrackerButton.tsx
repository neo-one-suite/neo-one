// tslint:disable no-null-keyword
import * as React from 'react';
import { MdOpenInNew } from 'react-icons/md';
import { Base, Link } from 'reakit';
import { ToolbarButton } from './ToolbarButton';
import { WithNEOTrackerURL } from './WithNEOTrackerURL';

export function NEOTrackerButton() {
  return (
    <WithNEOTrackerURL>
      {(neotrackerURL) => (
        <ToolbarButton as={Link} href={neotrackerURL} help="Open NEO Tracker..." target="_blank">
          <Base>
            <MdOpenInNew />
          </Base>
        </ToolbarButton>
      )}
    </WithNEOTrackerURL>
  );
}
