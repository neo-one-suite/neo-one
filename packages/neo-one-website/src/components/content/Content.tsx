// tslint:disable-next-line no-import-side-effect
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Grid, styled } from 'reakit';
import { AdjacentInfo, SectionData } from '../../types';
import { LayoutWrapper } from '../common';
import { DocFooter } from './DocFooter';
import { MainContent } from './MainContent';
import { Sidebar } from './Sidebar';
import { Author } from './types';

const StyledGrid = styled(Grid)`
  grid-gap: 0;
  justify-items: center;
`;

interface Props {
  readonly current: string;
  readonly sidebarAlwaysVisible: boolean;
  readonly title: string;
  readonly content: string;
  readonly sidebar: ReadonlyArray<SectionData>;
  readonly date?: string;
  readonly author?: Author;
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

export const Content = ({
  title,
  current,
  sidebarAlwaysVisible,
  content,
  next,
  previous,
  sidebar,
  date,
  author,
  ...props
}: Props) => (
  <StyledGrid {...props}>
    <Helmet>
      <title>{`${title} - NEO•ONE`}</title>
    </Helmet>
    <LayoutWrapper omitSpacer>
      <MainContent content={content} title={title} date={date} author={author} />
      <Sidebar current={current} sections={sidebar} alwaysVisible={sidebarAlwaysVisible} />
    </LayoutWrapper>
    <DocFooter next={next} previous={previous} />
  </StyledGrid>
);
