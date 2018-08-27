import * as React from 'react';
import { Button, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Tooltip, TooltipArrow } from './Tooltip';

const StyledButton = styled(Button)`
  background-color: ${prop('theme.gray0')};
  border-right: 0;
  border-radius: 0;
  color: ${prop('theme.black')};
  font-size: 0.875rem;
  height: 40px;
  line-height: 1em;
  text-align: center;
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
      {children}
      <Tooltip data-test={dataTestTooltip} placement="top" delay={delay}>
        <TooltipArrow />
        {help}
      </Tooltip>
    </StyledButton>
  );
}
