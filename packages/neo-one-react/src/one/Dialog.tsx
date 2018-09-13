// tslint:disable no-any
import * as React from 'react';
import { MdClose } from 'react-icons/md';
import { Backdrop, Button, Card, Flex, Heading, Overlay, Portal, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Shadow } from './Shadow';
// tslint:disable-next-line no-any
export type OverlayProps = any;

const StyledHeader = styled(Flex)`
  background-color: ${prop('theme.primary')};
  align-items: center;
  justify-content: space-between;
  margin: 0;
  padding: 16px;
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
            <Card.Fit as={StyledHeader as any}>
              <Heading data-test={dataTestHeading} as="h3" margin="0">
                {title}
              </Heading>
              <Button
                data-test={dataTestCloseButton}
                fontSize={20}
                onClick={overlay.hide}
                border="none"
                backgroundColor="transparent"
                borderRadius={50}
              >
                <MdClose />
              </Button>
            </Card.Fit>
            {renderDialog(overlay)}
          </Overlay>
        </>
      )}
    </Overlay.Container>
  );
}
