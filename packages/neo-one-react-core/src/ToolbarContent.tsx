import { prop, theme } from 'styled-tools';
import { Box } from './Box';
import { styledOmitProps } from './utils';

export interface ToolbarContentProps {
  readonly align?: 'start' | 'center' | 'end';
}

const toolbarContentTheme = theme('ToolbarContent');

export const ToolbarContent = styledOmitProps<ToolbarContentProps>(Box, ['align'], toolbarContentTheme)`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: min-content;
  grid-gap: inherit;
  grid-area: ${prop('align')};
  justify-content: ${prop('align')};
  align-items: center;
  [aria-orientation='vertical'] > & {
    grid-auto-flow: row;
    grid-auto-rows: min-content;
    justify-content: initial;
    align-content: ${prop('align')};
  }
  ${toolbarContentTheme};
`;

// tslint:disable-next-line:no-object-mutation
ToolbarContent.defaultProps = {
  align: 'start',
};
