import { Monogram } from '@neo-one/react-common';
import * as React from 'react';
import { Image } from 'reakit';
import reactts from '../../static/img/icons/reactts.svg';
import testts from '../../static/img/icons/testts.svg';
import typescript from '../../static/img/icons/typescript.svg';
import { EditorFile } from './types';

const icons = {
  reactts,
  testts,
  typescript,
};

const getFileType = (file: EditorFile): keyof typeof icons => {
  if (file.path.endsWith('.test.ts')) {
    return 'testts';
  }

  if (file.path.endsWith('.tsx')) {
    return 'reactts';
  }

  return 'typescript';
};

interface Props {
  readonly file: EditorFile;
}

export const EditorFileIcon = ({ file, ...props }: Props) => {
  if (file.type === 'contract') {
    return <Monogram {...props} />;
  }
  const type = getFileType(file);
  const source = icons[type];

  return <Image src={source} alt={type} {...props} />;
};
