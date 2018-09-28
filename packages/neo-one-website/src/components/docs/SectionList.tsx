import * as React from 'react';
import { Box, styled } from 'reakit';
import { Props as SubsectionProps, Subsection } from './Subsection';

export interface Props {
  readonly subsections: ReadonlyArray<SubsectionProps>;
  readonly onClick?: () => void;
}

const List = styled(Box.as('ul'))`
  list-style-type: none;
`;

export const SectionList = ({ subsections, onClick }: Props) => (
  <List>
    {subsections.map((props) => (
      <Subsection slug={props.slug} title={props.title} onClick={onClick} />
    ))}
  </List>
);
