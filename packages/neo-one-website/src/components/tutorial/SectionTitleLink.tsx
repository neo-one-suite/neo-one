import * as React from 'react';
import { Link as RouterLink } from 'react-static';
import { styled } from 'reakit';
import { prop } from 'styled-tools';

export interface Props {
  readonly title: string;
  readonly onClick?: () => void;
}

const slugify = (title: string) => title.toLowerCase().replace(' ', '-');

const NavigationLink = styled(RouterLink)`
  display: flex;
  align-items: center;
  ${prop('theme.fonts.axiformaRegular')};
  font-size: 16px;
  height: 100%;
  width: 100%;
  padding-top: 8px;
  color: ${prop('theme.black')};
  text-decoration: none;

  &:hover {
    color: ${prop('theme.accent')};
  }

  &:active {
    ${prop('theme.fonts.axiformaBold')};
  }

  &:focus {
    ${prop('theme.fonts.axiformaBold')};
  }
`;

export const SectionTitleLink = ({ title, onClick }: Props) => {
  const dataTest = `tutorial-${slugify(title)}-sidebar`;
  const path = `#${slugify(title)}`;

  return (
    <li data-test={dataTest}>
      <NavigationLink to={path} onClick={onClick}>
        {title}
      </NavigationLink>
    </li>
  );
};
