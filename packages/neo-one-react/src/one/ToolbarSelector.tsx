// tslint:disable no-any
import { Select, Tooltip, TooltipArrow } from '@neo-one/react-common';
import { ActionMap } from 'constate';
import * as React from 'react';
import { Container, styled } from 'reakit';

interface State {
  readonly menuOpen: boolean;
  readonly hover: boolean;
}

interface Actions {
  readonly onMenuOpen: () => void;
  readonly onMenuClose: () => void;
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
}

const actions: ActionMap<State, Actions> = {
  onMenuOpen: () => () => ({ menuOpen: true, hover: false }),
  onMenuClose: () => () => ({ menuOpen: false, hover: false }),
  onMouseEnter: () => () => ({ hover: true }),
  onMouseLeave: () => () => ({ hover: false }),
};

// tslint:disable-next-line no-any
const StyledSelect: any = styled(Select)`
  &&& {
    border-right: 0;
    width: 100px;
    height: 40px;
  }
`;

export function ToolbarSelector({
  'data-test-container': dataTestContainer,
  'data-test-selector': dataTestSelector,
  'data-test-tooltip': dataTestTooltip,
  help,
  ...rest
}: any) {
  return (
    <Container initialState={{ menuOpen: false, hover: false }} actions={actions}>
      {({ menuOpen, onMenuOpen, onMenuClose, hover, onMouseEnter, onMouseLeave }) => (
        <div data-test={dataTestContainer} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          <StyledSelect
            data-test={dataTestSelector}
            menuPlacement="top"
            {...rest}
            onMenuOpen={onMenuOpen}
            onMenuClose={onMenuClose}
          />
          <Tooltip data-test={dataTestTooltip} visible={menuOpen ? false : hover} placement="top">
            <TooltipArrow />
            {help}
          </Tooltip>
        </div>
      )}
    </Container>
  );
}
