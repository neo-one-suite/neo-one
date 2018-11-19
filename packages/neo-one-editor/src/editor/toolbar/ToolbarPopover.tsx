import { Box, ButtonBase, Popover, useHidden } from '@neo-one/react-common';
import * as React from 'react';
import { MdClose } from 'react-icons/md';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { Wrapper } from './Wrapper';

const HeaderWrapper = styled(Box)`
  display: grid;
  color: ${prop('theme.gray0')};
  grid-auto-flow: column;
  grid-auto-columns: auto;
  justify-content: space-between;
  padding-left: 8px;
`;

const BodyWrapper = styled(Box)`
  padding-bottom: 8px;
  padding-left: 8px;
  padding-right: 8px;
`;

const TitleText = styled(Box)`
  padding-top: 8px;
  padding-bottom: 8px;
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.headline')};
`;

const ToggleWrapper = styled(Wrapper)`
  display: grid;
  color: ${prop('theme.gray0')};
  ${prop('theme.fonts.axiformaBook')};
  ${prop('theme.fontStyles.caption')};
`;

const PopoverWrapper = styled(Box)`
  display: grid;
  grid-auto-flow: row;
  grid-auto-rows: auto;
  grid-gap: 8px;
  background-color: ${prop('theme.black')};
  box-shadow: 0 6px 4px 4px rgba(0, 0, 0, 0.2);
  width: 480px;
`;

const StyledButton = styled(ButtonBase)`
  font-size: 20;
  outline: none;
  cursor: pointer;
`;

const ButtonWrapper = styled(Box)`
  display: grid;
  place-items: center;
  place-content: center;
`;

const OuterWrapper = styled(Box)`
  display: grid;
  position: relative;
`;

interface Props {
  readonly title: string;
  readonly button: React.ReactNode;
  readonly content: React.ReactNode;
}

export const ToolbarPopover = ({ title, button, content, ...props }: Props) => {
  // tslint:disable-next-line:no-unused
  const [visible, show, hide, toggle] = useHidden(false);

  return (
    <OuterWrapper>
      <ToggleWrapper onClick={toggle} {...props}>
        {button}
      </ToggleWrapper>
      <Popover fade slide placement="top" visible={visible}>
        <PopoverWrapper>
          <HeaderWrapper>
            <TitleText>{title}</TitleText>
            <StyledButton onClick={hide}>
              <ButtonWrapper>
                <MdClose />
              </ButtonWrapper>
            </StyledButton>
          </HeaderWrapper>
          <BodyWrapper>{content}</BodyWrapper>
        </PopoverWrapper>
      </Popover>
    </OuterWrapper>
  );
};
