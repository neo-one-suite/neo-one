import * as React from 'react';
import { Box, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Markdown } from '../../elements';

const Wrapper = styled(Box)`
  padding-top: 16px;
  padding-bottom: 16px;

  @media (min-width: ${prop('theme.breakpoints.md')}) {
    padding-top: 64px;
    padding-bottom: 64px;
  }
`;

const StyledMarkdown = styled(Markdown)`
  ${prop('theme.fontStyles.body2')};
  ${prop('theme.fonts.axiformaBook')};
  color: ${prop('theme.black')};

  @media (min-width: ${prop('theme.breakpoints.md')}) {
    ${prop('theme.fontStyles.subheading')};
  }

  & h1 {
    ${prop('theme.fontStyles.display2')};
    margin-top: 16px;
    margin-bottom: 24px;

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.display3')};
    }
  }

  & h2 {
    ${prop('theme.fontStyles.headline')};

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.display1')};
    }
  }

  & h3 {
    ${prop('theme.fontStyles.headline')};

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.headline')};
    }
  }

  & h4 {
    ${prop('theme.fontStyles.body2')};

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.subheading')};
    }
  }

  & h5 {
    ${prop('theme.fontStyles.body1')};

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.body2')};
    }
  }

  & > p {
    max-width: ${prop('theme.constants.content.maxWidth')};
  }

  & > ol {
    max-width: ${prop('theme.constants.content.maxWidth')};
  }

  & > ul {
    max-width: ${prop('theme.constants.content.maxWidth')};
  }

  &&& > p:nth-child(2) {
    ${prop('theme.fonts.axiformaThin')};
    ${prop('theme.fontStyles.subheading')};
    color: ${prop('theme.gray6')};
    margin-bottom: 40px;
    margin-top: 40px;
    max-width: unset;

    @media (min-width: ${prop('theme.breakpoints.md')}) {
      ${prop('theme.fontStyles.headline')};
    }
  }
`;

interface Props {
  readonly content: string;
}

export const MainContent = ({ content, ...props }: Props) => (
  <Wrapper {...props}>
    <StyledMarkdown source={content} linkColor="accent" light />
  </Wrapper>
);
