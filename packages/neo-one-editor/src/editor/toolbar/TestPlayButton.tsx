import { Tooltip, TooltipArrow } from '@neo-one/react-common';
import * as React from 'react';
import { MdPlayArrow } from 'react-icons/md';
import { Button, styled } from 'reakit';
import { prop } from 'styled-tools';

const PlayButtonWrapper = styled(Button)`
  width: 24px;
  height: 24px;
  color: ${prop('theme.gray3')};
  cursor: pointer;

  &:hover {
    color: ${prop('theme.gray0')};
  }
`;

interface Props {
  readonly text: string;
  readonly onClick: () => void;
}

export const TestPlayButton = ({ text, onClick, ...props }: Props) => (
  <PlayButtonWrapper {...props} onClick={onClick} data-test="test-play-button">
    <MdPlayArrow />
    <Tooltip>
      <TooltipArrow />
      {text}
    </Tooltip>
  </PlayButtonWrapper>
);
