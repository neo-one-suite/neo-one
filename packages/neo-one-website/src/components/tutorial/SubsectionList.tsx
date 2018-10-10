import * as React from 'react';
import { List, styled } from 'reakit';
import { SectionTitleLink } from './SectionTitleLink';

export interface Props {
  readonly subsections: ReadonlyArray<string>;
  readonly onClick?: () => void;
}

const SectionList = styled(List)`
  list-style-type: none;
  padding-inline-start: 16px;
`;

export const SubsectionList = ({ subsections, onClick, ...props }: Props) => (
  <SectionList {...props}>
    {subsections.map((subsection) => (
      <SectionTitleLink title={subsection} onClick={onClick} />
    ))}
  </SectionList>
);
