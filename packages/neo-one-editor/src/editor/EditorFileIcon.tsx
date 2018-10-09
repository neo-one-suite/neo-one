import { Monogram } from '@neo-one/react-common';
import * as React from 'react';
import { Image } from 'reakit';
import reactts from '../../static/img/icons/reactts.svg';
import testts from '../../static/img/icons/testts.svg';
import typescript from '../../static/img/icons/typescript.svg';

const icons = {
  reactts,
  testts,
  typescript,
};

const getFileType = (path: string): keyof typeof icons => {
  if (path.endsWith('.test.ts')) {
    return 'testts';
  }

  if (path.endsWith('.tsx')) {
    return 'reactts';
  }

  return 'typescript';
};

interface Props {
  readonly path: string;
}

export const EditorFileIcon = ({ path, ...props }: Props) => {
  if (path.endsWith('.one.ts')) {
    return <Monogram {...props} />;
  }
  const type = getFileType(path);
  const source = icons[type];

  return <Image src={source} alt={type} {...props} />;
};
