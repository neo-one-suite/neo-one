import { Tooltip, TooltipArrow } from '@neo-one/react-common';
import * as React from 'react';
import { Button, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';

const StyledButton = styled(Button)`
  background-color: ${prop('theme.gray0')};
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-right: 0;
  color: ${prop('theme.black')};
  font-size: 0.875rem;
  height: 40px;
  padding: 4px;
  line-height: 1em;
  text-align: center;
  cursor: pointer;
  outline: none;
`;

const Wrapper = styled(Grid)`
  grid-auto-flow: column;
  place-items: center;
  justify-items: center;
`;

interface Props {
  readonly help: string;
  // tslint:disable-next-line no-any
  readonly as?: any;
  readonly delay?: string;
  readonly onClick?: () => void;
  readonly children?: React.ReactNode;
  readonly href?: string;
  readonly target?: string;
  readonly disabled?: boolean;
  readonly 'data-test-button': string;
  readonly 'data-test-tooltip': string;
}
export function ToolbarButton({
  'data-test-button': dataTestButton,
  'data-test-tooltip': dataTestTooltip,
  children,
  help,
  delay,
  ...props
}: Props) {
  return (
    <StyledButton data-test={dataTestButton} {...props}>
      <Wrapper>{children}</Wrapper>
      <Tooltip data-test={dataTestTooltip} placement="top" delay={delay} flip={false}>
        <TooltipArrow />
        {help}
      </Tooltip>
    </StyledButton>
  );
}
