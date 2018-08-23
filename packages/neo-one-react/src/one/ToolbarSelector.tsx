import { ActionMap } from 'constate';
import * as React from 'react';
import Select from 'react-select';
import { Container, styled } from 'reakit';
import { ComponentProps } from '../types';
import { Selector } from './Selector';
import { ToolbarTooltip, ToolbarTooltipArrow } from './ToolbarTooltip';

interface Props {
  readonly help: string;
}
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
  onMenuOpen: () => ({ menuOpen: true, hover: false }),
  onMenuClose: () => ({ menuOpen: false, hover: false }),
  onMouseEnter: () => ({ hover: true }),
  onMouseLeave: () => ({ hover: false }),
};

// tslint:disable-next-line no-any
const StyledSelector: React.ComponentType<ComponentProps<Select<any>>> = styled(Selector)`
  border-right: 0;
  width: 100px;
  height: 40px;
`;

export function ToolbarSelector<OptionType>({ help, ...rest }: Props & ComponentProps<Select<OptionType>>) {
  return (
    <Container initialState={{ menuOpen: false, hover: false }} actions={actions}>
      {({ menuOpen, onMenuOpen, onMenuClose, hover, onMouseEnter, onMouseLeave }) => (
        <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          <StyledSelector menuPlacement="top" {...rest} onMenuOpen={onMenuOpen} onMenuClose={onMenuClose} />
          <ToolbarTooltip visible={menuOpen ? false : hover} placement="top">
            <ToolbarTooltipArrow />
            {help}
          </ToolbarTooltip>
        </div>
      )}
    </Container>
  );
}
