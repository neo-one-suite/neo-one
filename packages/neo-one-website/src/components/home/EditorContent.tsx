import { Box, H2 } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { StyledRouterLink } from '../StyledRouterLink';
import { ContentWrapperBase } from './ContentWrapperBase';
import { UniversalHomeEditor } from './UniversalHomeEditor';

const EditorWrapper = styled(Box)`
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const InnerEditorWrapper = styled(ContentWrapperBase)`
  flex: 1 1 auto;
  justify-content: stretch;
`;

const TextWrapper = styled(ContentWrapperBase)`
  grid-gap: 24px;
  border-bottom: 1px solid ${prop('theme.gray2')};
  padding-bottom: 32px;
  margin-bottom: 32px;
`;

const InnerTextWrapper = styled(Box)`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 24px;
`;

const StyledHeading = styled(H2)`
  ${prop('theme.fontStyles.headline')};
  ${prop('theme.fonts.axiformaBold')};
  color: ${prop('theme.gray1')};
`;

const Text = styled(Box)`
  ${prop('theme.fontStyles.subheading')};
  ${prop('theme.fonts.axiformaRegular')};
  color: ${prop('theme.gray1')};
`;

const Wrapper = styled(Box)`
  display: grid;
  padding-top: 64px;
  background-color: ${prop('theme.black')};
  width: 100%;
  justify-content: center;
  padding-bottom: 64px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    display: none;
  }
`;

const StyledLink = StyledRouterLink;

export const EditorContent = () => (
  <Wrapper>
    <TextWrapper>
      <StyledHeading>Try Now</StyledHeading>
      <InnerTextWrapper>
        <Text>
          Take NEO•ONE for a spin, right in your browser, no setup required! The example below implements a full token
          and ICO smart contract. Click "Run Tests" and you'll notice there's a failure. Try to fix it!
        </Text>
        <Text>
          Learn everything from the fundamentals to advanced topics of NEO•ONE development with{' '}
          <StyledLink linkColor="primary" to="/course">
            NEO•ONE Courses
          </StyledLink>
          . We'll walk through building the contract below and more using the NEO•ONE Editor.
        </Text>
      </InnerTextWrapper>
    </TextWrapper>
    <EditorWrapper>
      <InnerEditorWrapper>
        <UniversalHomeEditor />
      </InnerEditorWrapper>
    </EditorWrapper>
  </Wrapper>
);
