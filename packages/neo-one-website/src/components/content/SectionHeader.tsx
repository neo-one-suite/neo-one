import styled from '@emotion/styled';
import { ButtonBase } from '@neo-one/react-common';
import * as React from 'react';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';
import { prop } from 'styled-tools';

interface Props {
  readonly title: string;
  readonly visible: boolean;
  readonly toggle?: () => void;
}

const SectionButton = styled(ButtonBase)`
  ${prop('theme.fonts.axiformaBold')};
  ${prop('theme.fontStyles.subheading')};
  line-height: 3;
  outline: none;
  cursor: pointer;
`;

export const SectionHeader = ({ title, visible, toggle, ...props }: Props) => (
  <SectionButton {...props} onClick={toggle}>
    {title.toUpperCase()}
    {visible ? <MdExpandLess /> : <MdExpandMore />}
  </SectionButton>
);
