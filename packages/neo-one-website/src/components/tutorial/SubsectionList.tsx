import * as React from 'react';
import { List, styled } from 'reakit';
import { HiddenAPI, SidebarLink, SubsectionData } from '../common';

export interface Props {
  readonly subsections: ReadonlyArray<SubsectionData>;
  readonly hidden?: HiddenAPI;
}

const Wrapper = styled(List)`
  list-style-type: none;
  padding-inline-start: 16px;
`;

export const SubsectionList = ({ subsections, hidden, ...props }: Props) => (
  <Wrapper {...props}>
    {subsections.map((subsection) => {
      const path = `#${subsection.slug}`;

      return <SidebarLink title={subsection.title} path={path} hidden={hidden} />;
    })}
  </Wrapper>
);
