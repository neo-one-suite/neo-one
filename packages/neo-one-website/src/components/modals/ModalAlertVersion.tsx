import styled from '@emotion/styled';
import { Button, Link } from '@neo-one/react-common';
import React, { useEffect } from 'react';
import { prop } from 'styled-tools';
import { Modal, ModalComponent } from '../common';

const StyledLink = styled(Link)<{}, {}>`
  outline: none;
  &:hover {
    color: ${prop('theme.gray3')};
    text-decoration: none;
  }
`;

const StyledDiv = styled.div`
  margin: auto;
  width: 90%;
`;

const StyledButton = styled(Button)<{}, {}>`
  &:hover {
    background-color: ${prop('theme.gray3')};
  }
  &:active {
    background-color: ${prop('theme.gray3')};
    outline: none;
  }
  &:focus {
    background-color: ${prop('theme.gray3')};
    outline: none;
  }
`;

const ButtonContainer = styled.div`
  margin: 12px 0;
  display: flex;
  justify-content: center;
`;

export function ModalAlertVersion() {
  useEffect(() => {
    Modal.open('alertVersion');
  }, []);

  const close = () => {
    Modal.close('alertVersion');
  };

  return (
    <ModalComponent name={'alertVersion'} innerClass={'large'}>
      <StyledDiv>
        <span>This info is for Neo Legacy (Neo2) only. For information on N3 go to </span>
        <StyledLink linkColor={'accent'} href="https://n3.neo-one.io">
          n3.neo-one.io
        </StyledLink>
        <span>.</span>
      </StyledDiv>
      <ButtonContainer>
        <StyledButton onClick={close}>Dismiss</StyledButton>
      </ButtonContainer>
    </ModalComponent>
  );
}
