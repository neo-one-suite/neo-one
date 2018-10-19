import * as React from 'react';
import { Box, Grid, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Footer } from '../Footer';

interface Props {
  readonly message: string;
}

const Wrapper = styled(Box)`
  height: 100%;
  width: 100%;
`;

const BoxWrapper = styled(Grid)`
  background-color: ${prop('theme.gray6')};
  padding-top: 64px;
  padding-bottom: 128px;
  width: 100%;
  place-items: center;
  place-content: center;
`;

const InnerWrapper = styled(Grid)`
  background-color: ${prop('theme.black')};
  max-width: 480px;
  margin: 16px;
  padding: 16px;
  box-shadow: 0 6px 4px 4px rgba(0, 0, 0, 0.2);
`;

const Text = styled(Box)`
  color: ${prop('theme.gray0')};
  ${prop('theme.fontStyles.subheading')};
`;

export const CourseRequirementError = ({ message, ...props }: Props) => (
  <Wrapper {...props}>
    <BoxWrapper>
      <InnerWrapper>
        <Text>
          {message} Try switching to another browser - the courses are known to work best on the latest version of
          Chrome.
        </Text>
      </InnerWrapper>
    </BoxWrapper>
    <Footer />
  </Wrapper>
);
