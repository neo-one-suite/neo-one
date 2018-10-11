import * as React from 'react';
import { MdArrowDropDown } from 'react-icons/md';
import { Button, Hidden, List, styled } from 'reakit';
import { prop } from 'styled-tools';
import { SectionData } from '../common';
import { SectionList } from './SectionList';

interface Props extends SectionData {}

const SectionButton = styled(Button)`
  border-bottom: 3px solid ${prop('theme.accent')};
  ${prop('theme.fonts.axiformaBold')};
  padding-top: 24px;
  outline: none;
`;

export const DocSection = ({ subsections, section, upstreamHidden, ...props }: Props) => (
  <Hidden.Container {...props}>
    {(hidden) => (
      <List>
        <Hidden.Toggle as={SectionButton} {...hidden}>
          {section}
          <MdArrowDropDown />
        </Hidden.Toggle>
        <Hidden {...hidden}>
          <SectionList subsections={subsections} hidden={upstreamHidden} />
        </Hidden>
      </List>
    )}
  </Hidden.Container>
);
