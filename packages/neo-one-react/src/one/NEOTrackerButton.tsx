// tslint:disable no-null-keyword
import * as React from 'react';
import { MdOpenInNew } from 'react-icons/md';
import { Box, Link } from 'reakit';
import { ToolbarButton } from './ToolbarButton';
import { WithNEOTrackerURL } from './WithNEOTrackerURL';

export function NEOTrackerButton() {
  return (
    <WithNEOTrackerURL>
      {(neotrackerURL) =>
        neotrackerURL === undefined ? null : (
          <ToolbarButton
            data-test-button="neo-one-neotracker-button"
            data-test-tooltip="neo-one-neotracker-tooltip"
            as={Link}
            href={neotrackerURL}
            help="Open NEO Tracker..."
            target="_blank"
          >
            <Box>
              <MdOpenInNew />
            </Box>
          </ToolbarButton>
        )
      }
    </WithNEOTrackerURL>
  );
}
