import * as React from 'react';
import { List, styled } from 'reakit';
import { SectionData, SidebarLink } from '../common';

interface Props extends SectionData {
  readonly numSections: number;
}

const Wrapper = styled(List)`
  list-style-type: none;
`;

export const BlogSection = ({ subsections, upstreamHidden, numSections, ...props }: Props) => (
  <Wrapper {...props}>
    {subsections.slice(0, numSections).map((subsection) => {
      const path = `/blog/${subsection.slug}`;

      return <SidebarLink path={path} title={subsection.title} hidden={upstreamHidden} />;
    })}
    <SidebarLink path="/blog/all" title="All Posts..." hidden={upstreamHidden} />
  </Wrapper>
);
