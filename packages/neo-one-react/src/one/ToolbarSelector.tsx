import { ActionMap } from 'constate';
import * as React from 'react';
import Select from 'react-select';
import { Container, styled } from 'reakit';
import { ComponentProps } from '../types';
import { Selector } from './Selector';
import { Tooltip, TooltipArrow } from './Tooltip';

interface Props {
  readonly help: string;
  readonly 'data-test-selector': string;
  readonly 'data-test-container': string;
  readonly 'data-test-tooltip': string;
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
  onMenuOpen: () => () => ({ menuOpen: true, hover: false }),
  onMenuClose: () => () => ({ menuOpen: false, hover: false }),
  onMouseEnter: () => () => ({ hover: true }),
  onMouseLeave: () => () => ({ hover: false }),
};

// tslint:disable-next-line no-any
const StyledSelector: React.ComponentType<{ readonly 'data-test': string } & ComponentProps<Select<any>>> = styled(
  Selector,
)`
  border-right: 0;
  width: 100px;
  height: 40px;
`;

export function ToolbarSelector<OptionType>({
  'data-test-container': dataTestContainer,
  'data-test-selector': dataTestSelector,
  'data-test-tooltip': dataTestTooltip,
  help,
  ...rest
}: Props & ComponentProps<Select<OptionType>>) {
  return (
    <Container initialState={{ menuOpen: false, hover: false }} actions={actions}>
      {({ menuOpen, onMenuOpen, onMenuClose, hover, onMouseEnter, onMouseLeave }) => (
        <div data-test={dataTestContainer} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          <StyledSelector
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
