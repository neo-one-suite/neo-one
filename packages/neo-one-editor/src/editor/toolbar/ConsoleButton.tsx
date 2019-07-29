import styled from '@emotion/styled';
import { Box, ButtonBase, Tooltip, TooltipArrow } from '@neo-one/react-common';
import * as React from 'react';
import { prop } from 'styled-tools';

const Wrapper = styled(Box)`
  display: grid;
  place-items: center;
`;

const IconWrapper = styled(ButtonBase)`
  color: ${prop('theme.gray0')};
  cursor: pointer;
  outline: none;
  display: grid;
  place-items: center;
  padding: 8px;
`;

interface Props {
  readonly onClick: () => void;
  readonly icon: React.ReactNode;
  readonly tooltip: React.ReactNode;
}

export const ConsoleButton = ({ onClick, icon, tooltip, ...props }: Props) => (
  <Wrapper {...props}>
    <IconWrapper data-test="console-button" onClick={onClick}>
      {icon}
    </IconWrapper>
    <Tooltip>
      <TooltipArrow />
      {tooltip}
    </Tooltip>
  </Wrapper>
);
