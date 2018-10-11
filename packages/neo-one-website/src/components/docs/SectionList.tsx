import * as React from 'react';
import { List, styled } from 'reakit';
import { HiddenAPI, SidebarLink, SubsectionData } from '../common';

export interface Props {
  readonly subsections: ReadonlyArray<SubsectionData>;
  readonly hidden?: HiddenAPI;
}

const Wrapper = styled(List)`
  list-style-type: none;
`;

export const SectionList = ({ subsections, hidden, ...props }: Props) => (
  <Wrapper {...props}>
    {subsections.map((subsection) => {
      const path = `/docs/${subsection.slug}`;

      return <SidebarLink path={path} title={subsection.title} hidden={hidden} />;
    })}
  </Wrapper>
);
