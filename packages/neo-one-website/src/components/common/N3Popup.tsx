// tslint:disable no-null-keyword
import styled from '@emotion/styled';
import { Box, Button, Link } from '@neo-one/react-common';
import * as React from 'react';
import Popup from 'reactjs-popup';
import { ifProp, prop } from 'styled-tools';

const Wrapper = styled(Popup)<{ readonly closed: boolean }, {}>`
  &-overlay {
    display: ${ifProp('closed', 'none', 'block')};
  }
  &-content {
    display: ${ifProp('closed', 'none', 'block')};
    width: 80%;
    max-width: 1280px;

    @keyframes anvil {
      0% {
        transform: scale(1) translateY(0px);
        opacity: 0;
        box-shadow: 0 0 0 rgba(241, 241, 241, 0);
      }
      1% {
        transform: scale(0.96) translateY(10px);
        opacity: 0;
        box-shadow: 0 0 0 rgba(241, 241, 241, 0);
      }
      100% {
        transform: scale(1) translateY(0px);
        opacity: 1;
        box-shadow: 0 0 500px rgba(241, 241, 241, 0);
      }
    }
    animation: anvil;
    -webkit-animation: anvil 0.3s cubic-bezier(0.38, 0.1, 0.36, 0.9) forwards;
  }
`;

const Container = styled(Box)<{}, {}>`
  width: 70%;
  max-height: 70vh;
  margin-top: calc(100vh - 85hv - 20px);
  margin-left: auto;
  margin-right: auto;
  height: auto;
  box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.2), 0px 8px 8px 0px rgba(0, 0, 0, 0.14),
    0px 16px 8px -8px rgba(0, 0, 0, 0.12);
  background: ${prop('theme.primary')};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: center;
`;

const Content = styled(Box)<{}, {}>`
  color: black;
  padding: 20px;
  overflow: auto;
`;

const StyledLink = styled(Link)<{}, {}>`
  outline: none;
  &:hover {
    color: ${prop('theme.gray3')};
    text-decoration: none;
  }
`;

const StyledButton = styled(Button)<{}, {}>`
  margin-bottom: 20px;
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

interface Props {
  readonly children: React.ReactNode;
}

export const NEOONEPopup = ({ children }: Props) => {
  const [closed, setClosed] = React.useState(false);

  return (
    <Wrapper closed={closed} closeOnDocumentClick closeOnEscape repositionOnResize defaultOpen position="center center">
      <Container>
        {children}
        <StyledButton onClick={() => setClosed(true)}>Close</StyledButton>
      </Container>
    </Wrapper>
  );
};

export const N3Popup = () => (
  <NEOONEPopup>
    <Content>
      This info is for Neo Legacy (Neo2) only. For information on N3 go to{' '}
      <StyledLink linkColor={'accent'} href="https://n3.neo-one.io">
        n3.neo-one.io
      </StyledLink>
    </Content>
  </NEOONEPopup>
);
