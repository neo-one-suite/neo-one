import { Box } from '@neo-one/react-common';
import * as React from 'react';
import styled from 'styled-components';
import { prop } from 'styled-tools';
import { ContentWrapperBase } from './ContentWrapperBase';

interface Props {
  readonly title: string;
  readonly asset: React.ReactNode;
  readonly children: React.ReactNode;
}

const StyledHeading = styled.h2`
  ${prop('theme.fonts.axiformaMedium')};
  ${prop('theme.fontStyles.headline')};
  /* stylelint-disable-next-line */
  color: ${prop('theme.black')};
  margin: 0;
`;

const Content = styled(Box)`
  display: grid;
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
  color: ${prop('theme.black')};
  display: grid;
  margin: 0;
  gap: 16;
`;

const AssetItem = styled(Box)`
  grid-area: asset;
  display: grid;
  grid-area: asset;
  min-width: 0;
  min-height: 0;
`;

const ContentItem = styled(Box)`
  grid-area: content;
  display: grid;
  gap: 16;
`;

const Wrapper = styled(Box)`
  display: grid;
  grid-template:
    'content asset' auto
    / 4fr 3fr;
  grid-gap: 16px;
  justify-items: center;
  align-items: center;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-template:
      'content' auto
      'asset' auto
      / 1fr;
  }
`;

export const AssetSectionGrid = ({ title, children, asset, ...props }: Props) => (
  <ContentWrapperBase {...props}>
    <Wrapper>
      <AssetItem>{asset}</AssetItem>
      <ContentItem>
        <StyledHeading>{title}</StyledHeading>
        <Content>{children}</Content>
      </ContentItem>
    </Wrapper>
  </ContentWrapperBase>
);
