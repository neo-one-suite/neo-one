import { Box, Link } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { ToolbarPopover } from './ToolbarPopover';

const Wrapper = styled(Box)`
  display: grid;
  grid-auto-flow: row;
  grid-auto-rows: auto;
`;

const Text = styled(Box)`
  color: ${prop('theme.gray0')};
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
`;

export const Help = (props: {}) => (
  <ToolbarPopover
    {...props}
    title="Get help."
    button="Help"
    content={
      <Wrapper>
        <Text>
          Chat with us on the{' '}
          <Link linkColor="primary" href="https://discord.gg/S86PqDE" target="_blank">
            #support
          </Link>{' '}
          Discord channel.
        </Text>
        <Text>
          Browse the{' '}
          <Link linkColor="primary" href="/" target="_blank">
            Docs
          </Link>
          .
        </Text>
        <Text>
          Ask questions tagged with{' '}
          <Link linkColor="primary" href="https://stackoverflow.com/questions/tagged/neo-one" target="_blank">
            neo-one
          </Link>{' '}
          on{' '}
          <Link linkColor="primary" href="https://stackoverflow.com/questions/ask" target="_blank">
            Stack Overflow
          </Link>
        </Text>
        <Text>
          Post issues on{' '}
          <Link linkColor="primary" href="https://github.com/neo-one-suite/neo-one/issues/new" target="_blank">
            Github
          </Link>
        </Text>
      </Wrapper>
    }
  />
);
