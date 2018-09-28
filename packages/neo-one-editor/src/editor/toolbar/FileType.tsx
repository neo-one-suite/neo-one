import * as React from 'react';
import { EditorFile } from '../types';
import { PlainWrapper } from './PlainWrapper';
import { Text } from './Text';

const getFileType = (file: EditorFile) =>
  file.type === 'contract' ? 'TypeScript Contract' : file.path.endsWith('tsx') ? 'TypeScript React' : 'TypeScript';

interface Props {
  readonly file: EditorFile;
}
export const FileType = ({ file, ...props }: Props) => (
  <PlainWrapper>
    <Text {...props}>{getFileType(file)}</Text>
  </PlainWrapper>
);
