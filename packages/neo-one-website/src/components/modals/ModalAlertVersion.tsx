import React, {useEffect} from 'react';
import {prop} from 'styled-tools'
import styled from '@emotion/styled'
import {Link, Button} from '@neo-one/react-common'
import {Modal, ModalComponent} from '../common/modal'

const StyledLink = styled(Link)<{}, {}>`
  outline: none;
  &:hover {
    color: ${prop('theme.gray3')};
    text-decoration: none;
  }
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

function ModalAlertVersion () {
  useEffect(() => {
    Modal.open('alertVersion')
  }, [])

  const close = () => {
    Modal.close('alertVersion')
  }

  return (
    <ModalComponent
      name={'alertVersion'}
      innerClass={'large'}
    >
      <div>
        <span>
          This info is for Neo Legacy (Neo2) only. For information on N3 go to{' '}
        </span>
        <StyledLink linkColor={'accent'} href="https://n3.neo-one.io">
          n3.neo-one.io
        </StyledLink>
      </div>

      <div style={{marginTop: '30px', display: 'flex', justifyContent: 'center'}}>
        <StyledButton onClick={close}>
          Dismiss
        </StyledButton>
      </div>
    </ModalComponent>
  )
}

export default ModalAlertVersion
