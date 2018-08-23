import * as React from 'react';
import { MdClose } from 'react-icons/md';
import { Base, Box, Button, Flex, Hidden, Shadow, styled } from 'reakit';
import { prop } from 'styled-tools';

// tslint:disable-next-line no-any
type HiddenProps = any;

const StyledBox = styled(Box)`
  background-color: ${prop('theme.gray0')};
  margin-top: 8px;
  width: 320px;
`;

const ErrorWrapper = styled(Base)`
  margin: 8px;
`;

const ErrorHeading = styled(Flex)`
  align-items: center;
  justify-content: space-between;
  margin: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  padding-bottom: 8px;
`;

const ErrorText = styled(Base)`
  color: ${prop('theme.error')};
`;

interface Props {
  readonly error: string;
  readonly removeError: (error: string) => void;
}
export function ErrorToast({ error, removeError }: Props) {
  let once = false;

  return (
    <Hidden.Container>
      {(hidden: HiddenProps) => {
        if (!hidden.visible && !once) {
          once = true;
          setTimeout(hidden.show, 500);
        }

        return (
          <Hidden fade {...hidden}>
            <StyledBox>
              <Shadow />
              <ErrorHeading>
                <span>
                  <ErrorText as="span">Error.&nbsp;</ErrorText>
                  <span>See console for more info.</span>
                </span>
                <Button
                  fontSize={14}
                  onClick={() => {
                    hidden.hide();
                    setTimeout(() => removeError(error), 250);
                  }}
                  border="none"
                  backgroundColor="transparent"
                  borderRadius={35}
                  marginRight={-4}
                  marginTop={-4}
                >
                  <MdClose />
                </Button>
              </ErrorHeading>
              <ErrorWrapper>{error}</ErrorWrapper>
            </StyledBox>
          </Hidden>
        );
      }}
    </Hidden.Container>
  );
}
