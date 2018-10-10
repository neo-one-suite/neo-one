import * as React from 'react';
import { Box, styled } from 'reakit';
import { SectionTitleLink } from './SectionTitleLink';

export interface Props {
  readonly subsections: ReadonlyArray<string>;
  readonly onClick?: () => void;
}

const List = styled(Box.as('ul'))`
  list-style-type: none;
  padding-inline-start: 16px;
`;

export const SubsectionList = ({ subsections, onClick }: Props) => (
  <List>
    {subsections.map((subsection) => (
      <SectionTitleLink title={subsection} onClick={onClick} />
    ))}
  </List>
);
