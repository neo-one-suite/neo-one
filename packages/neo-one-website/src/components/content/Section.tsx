import * as React from 'react';
import { Box, Hidden } from 'reakit';
import { SectionData } from '../../types';
import { SectionHeader } from './SectionHeader';
import { SectionList } from './SectionList';

interface Props {
  readonly current: string;
  readonly section: SectionData;
  readonly visible: boolean;
  readonly onClickLink?: () => void;
  readonly toggle?: () => void;
}

export const Section = ({ current, section, visible, toggle, onClickLink, ...props }: Props) => (
  <Box {...props}>
    <SectionHeader title={section.title} visible={visible} toggle={toggle} />
    <Hidden visible={visible}>
      <SectionList
        numbered={section.numbered}
        current={current}
        subsections={section.subsections}
        onClickLink={onClickLink}
      />
    </Hidden>
  </Box>
);
