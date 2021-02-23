import styled from '@emotion/styled';
import { Box, Link } from '@neo-one/react-common';
import * as React from 'react';
import { prop } from 'styled-tools';
import { LayoutWrapper } from './common';
import { StyledRouterLink } from './StyledRouterLink';

const LinkSectionTitle = styled(Box)<{}, {}>`
  ${prop('theme.fonts.axiformaBold')};
  ${prop('theme.fontStyles.body1')};
  color: ${prop('theme.gray2')};
`;

const NavLink = Link.withComponent(StyledRouterLink);

const ExternalLink = Link;

const LinkSectionWrapper = styled(Box)`
  display: grid;
  grid-gap: 8px;
  align-content: start;
`;

const LinkSection = ({
  title,
  links,
}: {
  readonly title: string;
  readonly links: { readonly [name: string]: string };
}) => (
  <LinkSectionWrapper>
    <LinkSectionTitle>{title}</LinkSectionTitle>
    {Object.entries(links).map(([name, to]) =>
      to.startsWith('/') ? (
        <NavLink key={to} linkColor="light" to={to}>
          {name}
        </NavLink>
      ) : (
        <ExternalLink key={to} linkColor="light" href={to}>
          {name}
        </ExternalLink>
      ),
    )}
  </LinkSectionWrapper>
);

const FooterWrapper = styled(Box)<{}, {}>`
  display: grid;
  justify-content: center;
  grid-gap: 64px;
  padding: 64px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 32px;
    padding: 32px;
  }
`;

const Copyright = styled(Box)<{}, {}>`
  ${prop('theme.fonts.axiformaRegular')};
  ${prop('theme.fontStyles.caption')};
  color: ${prop('theme.gray3')};
  text-align: center;
`;

const LinksGrid = styled(Box)<{}, {}>`
  display: grid;
  grid-auto-flow: column;
  grid-gap: 64px;

  @media (max-width: ${prop('theme.breakpoints.md')}) {
    grid-gap: 32px;
  }
`;

const Wrapper = styled(Box)<{}, {}>`
  display: grid;
  background-color: ${prop('theme.black')};
  box-shadow: inset 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  height: 240px;
  width: 100%;
  justify-items: center;
`;

interface Props {
  readonly content?: boolean;
}

export const Footer = ({ content = false, ...props }: Props) => {
  const currentYear = new Date().getFullYear();

  let footer = (
    <FooterWrapper>
      <LinksGrid>
        <LinkSection
          title="DOCS"
          links={{
            Installation: '/docs/getting-started',
            'Main Concepts': '/docs/hello-world',
            'Advanced Guides': '/docs/native-assets',
            'API Reference': '/reference/@neo-one/client',
            Contributing: '/docs/how-to-contribute',
          }}
        />
        <LinkSection
          title="CHANNELS"
          links={{
            GitHub: 'https://github.com/neo-one-suite/neo-one',
            'Stack Overflow': 'https://stackoverflow.com/questions/tagged/neo-one',
            'Discord Chat': 'https://discord.gg/S86PqDE',
            Twitter: 'https://twitter.com/neo_one_suite',
            YouTube: 'https://www.youtube.com/channel/UCya5J1Tt2h-kX-I3a7LOvtw',
          }}
        />
        <LinkSection
          title="MORE"
          links={{
            Courses: '/course',
            Tutorial: '/tutorial',
            Blog: '/blog',
          }}
        />
      </LinksGrid>
      <Copyright>COPYRIGHT &copy; {currentYear} NEO•ONE</Copyright>
    </FooterWrapper>
  );
  if (content) {
    footer = <LayoutWrapper>{footer}</LayoutWrapper>;
  }

  return <Wrapper {...props}>{footer}</Wrapper>;
};
