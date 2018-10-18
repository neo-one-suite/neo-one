// tslint:disable no-any
import { IconButton, Shadow } from '@neo-one/react-common';
import * as React from 'react';
import { MdClose } from 'react-icons/md';
import { Backdrop, Card, Grid, Heading, Overlay, Portal, styled } from 'reakit';
import { prop } from 'styled-tools';
// tslint:disable-next-line no-any
export type OverlayProps = any;

const StyledHeader = styled(Grid)`
  grid-auto-flow: column;
  background-color: ${prop('theme.primary')};
  align-items: center;
  justify-content: space-between;
  margin: 0;
  padding: 16px;
`;

const StyledHeading = styled(Heading)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.headline')};
`;

const StyledBody = styled(Grid)`
  gap: 8px;
  background-color: ${prop('theme.gray0')};
  padding: 16px;
`;

const StyledIconButton = styled(IconButton)`
  font-size: 20px;
  border-radius: 50;
`;

const StyledCardFit = styled(Card.Fit)`
  display: grid;
`;

interface Props {
  readonly title: string;
  readonly renderDialog: (overlay: OverlayProps) => React.ReactNode;
  readonly children: (overlay: OverlayProps) => React.ReactNode;
  readonly 'data-test-heading': string;
  readonly 'data-test-close-button': string;
}

export function Dialog({
  'data-test-heading': dataTestHeading,
  'data-test-close-button': dataTestCloseButton,
  children,
  renderDialog,
  title,
}: Props) {
  return (
    <Overlay.Container>
      {(overlay: OverlayProps) => (
        <>
          {children(overlay)}
          <Backdrop as={[Portal, Overlay.Hide]} {...overlay} />
          <Overlay unmount as={[Portal, Card]} slide fade gutter={16} {...overlay}>
            <Shadow />
            <StyledCardFit>
              <StyledHeader>
                <StyledHeading data-test={dataTestHeading} as="h3" margin="0">
                  {title}
                </StyledHeading>
                <StyledIconButton data-test={dataTestCloseButton} onClick={overlay.hide}>
                  <MdClose />
                </StyledIconButton>
              </StyledHeader>
              <StyledBody>{renderDialog(overlay)}</StyledBody>
            </StyledCardFit>
          </Overlay>
        </>
      )}
    </Overlay.Container>
  );
}
