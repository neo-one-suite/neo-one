import * as React from 'react';
import { Grid, styled } from 'reakit';
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

const Content = styled(Grid)`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.subheading')};
  color: ${prop('theme.black')};
  display: grid;
  margin: 0;
`;

const AssetItem = styled(Grid.Item)`
  display: grid;
  grid-area: asset;
  min-width: 0;
  min-height: 0;
`;

const Wrapper = styled(Grid)`
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
      <AssetItem area="asset">{asset}</AssetItem>
      <Grid.Item area="content">
        <Grid gap={16}>
          <StyledHeading>{title}</StyledHeading>
          <Content gap={16}>{children}</Content>
        </Grid>
      </Grid.Item>
    </Wrapper>
  </ContentWrapperBase>
);
