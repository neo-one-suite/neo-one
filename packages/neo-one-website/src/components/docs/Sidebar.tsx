// tslint:disable strict-boolean-expressions
import * as React from 'react';
import { MdMenu } from 'react-icons/md';
import { Box, Button, Hidden, styled } from 'reakit';
import { prop } from 'styled-tools';
import { Props as SectionProps, Section } from './Section';

export interface Props {
  readonly sectionProps: ReadonlyArray<SectionProps>;
}

const MobileStyledBox = styled(Box)`
  display: none;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    display: block;
    background-color: ${prop('theme.gray1')};
    height: 100%;
    width: 100%;
    position: fixed;
  }
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
    width: 48px;
    height: 48px;
  }
`;

const NavIcon = styled(MdMenu)`
  color: ${prop('theme.black')};
  width: 32px;
  height: 32px;
`;

export const Sidebar = ({ sectionProps, ...props }: Props) => (
  <Hidden.Container initialState={{ visible: true }} {...props}>
    {({ visible, toggle, hide }) => (
      <Box>
        {visible && (
          <Box>
            <MobileStyledBox>
              <ul>
                {sectionProps.map((section) => (
                  <Section subsections={section.subsections} title={section.title} onClick={hide} />
                ))}
              </ul>
            </MobileStyledBox>
            <DesktopStyledBox>
              <ul>
                {sectionProps.map((section) => (
                  <Section subsections={section.subsections} title={section.title} />
                ))}
              </ul>
            </DesktopStyledBox>
          </Box>
        )}
        <MobileNavButton onClick={toggle}>
          <NavIcon />
        </MobileNavButton>
      </Box>
    )}
  </Hidden.Container>
);
