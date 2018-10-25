import * as React from 'react';
import { MdMenu } from 'react-icons/md';
import { Box, Button, Hidden, List, styled } from 'reakit';
import { prop } from 'styled-tools';
import { HiddenAPI, SectionData } from './types';

interface Props {
  readonly sections: ReadonlyArray<SectionData>;
  readonly renderSection?: (sectionProps: SectionData) => JSX.Element;
  readonly renderSections?: (hidden?: HiddenAPI) => JSX.Element;
  readonly renderSidebarHeader?: () => JSX.Element;
  readonly initialVisibleMobile?: boolean;
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

export const Sidebar = ({
  sections,
  renderSidebarHeader,
  renderSection = (_sectionProps: SectionData) => <></>,
  renderSections,
  initialVisibleMobile,
  ...props
}: Props) => (
  <Box {...props}>
    <DesktopStyledBox>
      <StyledList>
        {renderSidebarHeader ? renderSidebarHeader() : undefined}
        {renderSections === undefined ? sections.map(renderSection) : renderSections()}
      </StyledList>
    </DesktopStyledBox>
    <Hidden.Container initialState={{ visible: initialVisibleMobile }} {...props}>
      {(hidden) => (
        <>
          <MobileStyledHidden {...hidden}>
            <StyledList>
              {renderSidebarHeader ? renderSidebarHeader() : undefined}
              {renderSections === undefined
                ? sections.map((sectionProps) => renderSection({ ...sectionProps, upstreamHidden: hidden }))
                : renderSections(hidden)}
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
