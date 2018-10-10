// tslint:disable strict-boolean-expressions
import * as React from 'react';
import { MdArrowDropDown } from 'react-icons/md';
import { Box, Button, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { SectionList } from './SectionList';
import { Props as SubsectionProps } from './Subsection';

export interface Props {
  readonly subsections: ReadonlyArray<SubsectionProps>;
  readonly title: string;
  readonly onClick?: () => void;
}

const SectionButton = styled(Button)`
  border-bottom: 3px solid ${prop('theme.accent')};
  ${prop('theme.fonts.axiformaMedium')};
  padding-top: 24px;
`;

export const Section = ({ subsections, title, onClick, ...props }: Props) => (
  <Hidden.Container {...props}>
    {({ visible, toggle }) => (
      <Box as="ul">
        <SectionButton onClick={toggle}>
          {title}
          <MdArrowDropDown />
        </SectionButton>
        {visible && <SectionList subsections={subsections} onClick={onClick} />}
      </Box>
    )}
  </Hidden.Container>
);
