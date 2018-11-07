import * as React from 'react';
import { Box, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { SectionData } from '../../types';
import { Section } from './Section';

const Wrapper = styled(Box)`
  background-color: ${prop('theme.gray1')};
  padding-top: 16px;
  padding-bottom: 16px;
  padding-left: 16px;
  padding-right: 16px;
  height: 100%;

  @media (min-width: ${prop('theme.breakpoints.md')}) {
    padding-top: 64px;
    padding-bottom: 64px;
    padding-left: 40px;
    padding-right: 40px;
  }
`;

interface Props {
  readonly current: string;
  readonly sections: ReadonlyArray<SectionData>;
  readonly alwaysVisible: boolean;
  readonly onClickLink?: () => void;
}

export const SidebarList = ({ sections, current, alwaysVisible, onClickLink, ...props }: Props) => (
  <Wrapper {...props}>
    {sections.map((section) =>
      alwaysVisible ? (
        <Section key={section.title} current={current} section={section} visible onClickLink={onClickLink} />
      ) : (
        <Hidden.Container
          key={section.title}
          initialState={{ visible: section.subsections.some((subsection) => current === subsection.slug) }}
        >
          {({ toggle, visible }) => (
            <Section current={current} section={section} visible={visible} toggle={toggle} onClickLink={onClickLink} />
          )}
        </Hidden.Container>
      ),
    )}
  </Wrapper>
);
