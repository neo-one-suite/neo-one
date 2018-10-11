import * as React from 'react';
import { MdMenu } from 'react-icons/md';
import { Box, Button, Hidden, List, styled } from 'reakit';
import { prop } from 'styled-tools';
import { DocSection } from '../docs';
import { SidebarHeader, TutorialSection } from '../tutorial';
import { SectionData } from './types';

interface Props {
  readonly sections: ReadonlyArray<SectionData>;
  readonly tutorial?: boolean;
}

const StyledList = styled(List)`
  margin-left: 24px;
`;

const MobileStyledHidden = styled(Hidden)`
  background-color: ${prop('theme.gray1')};
  height: 100%;
  width: 100%;
  position: fixed;
`;

const DesktopStyledBox = styled(Box)`
  background-color: ${prop('theme.gray1')};
  height: 100%;
  width: 100%;
  position: fixed;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    display: none;
  }
`;

const MobileNavButton = styled(Button)`
  display: none;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    display: flex;
    justify-content: center;
    background-color: ${prop('theme.primary')};
    position: fixed;
    right: 0;
    bottom: 0;
    margin: 16px;
    border-radius: 50%;
    outline: none;
  }
`;

const NavIcon = styled(MdMenu)`
  color: ${prop('theme.black')};
  width: 32px;
  height: 32px;
  padding: 8px;
`;

export const Sidebar = ({ sections, tutorial, ...props }: Props) => (
  <Box {...props}>
    <DesktopStyledBox>
      <StyledList>
        {tutorial ? <SidebarHeader /> : undefined}
        {sections.map(
          ({ section, subsections }) =>
            tutorial ? (
              <TutorialSection section={section} subsections={subsections} />
            ) : (
              <DocSection section={section} subsections={subsections} />
            ),
        )}
      </StyledList>
    </DesktopStyledBox>
    <Hidden.Container initialState={{ visible: true }} {...props}>
      {(hidden) => (
        <>
          <MobileStyledHidden {...hidden}>
            <StyledList>
              {tutorial ? <SidebarHeader /> : undefined}
              {sections.map(
                ({ section, subsections }) =>
                  tutorial ? (
                    <TutorialSection section={section} subsections={subsections} upstreamHidden={hidden} />
                  ) : (
                    <DocSection section={section} subsections={subsections} upstreamHidden={hidden} />
                  ),
              )}
            </StyledList>
          </MobileStyledHidden>
          <Hidden.Toggle as={MobileNavButton} {...hidden}>
            <NavIcon />
          </Hidden.Toggle>
        </>
      )}
    </Hidden.Container>
  </Box>
);
