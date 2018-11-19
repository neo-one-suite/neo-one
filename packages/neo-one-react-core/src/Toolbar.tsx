import * as React from 'react';
import styled from 'styled-components';
import { theme, withProp } from 'styled-tools';
import { Box } from './Box';
import { numberToPx } from './utils';

export interface ToolbarProps {
  readonly role?: string;
  readonly gutter?: number | string;
  readonly vertical?: boolean;
}

const ToolbarComponent = (props: ToolbarProps & React.ComponentProps<typeof Box>) => (
  <Box aria-orientation={props.vertical ? 'vertical' : 'horizontal'} {...props} />
);

export const Toolbar = styled(ToolbarComponent)`
  position: relative;
  display: grid;
  width: 100%;
  padding: ${withProp('gutter', numberToPx)};
  grid-gap: ${withProp('gutter', numberToPx)};
  grid-template:
    'start center end'
    / 1fr auto 1fr;

  &[aria-orientation='vertical'] {
    width: min-content;
    height: 100%;
    grid-template:
      'start' 1fr
      'center' auto
      'end' 1fr;
  }

  ${theme('Toolbar')};
`;

// tslint:disable-next-line:no-object-mutation
Toolbar.defaultProps = {
  role: 'toolbar',
  gutter: 8,
};
