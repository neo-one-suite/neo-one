// tslint:disable no-null-keyword
import * as React from 'react';
import { getFileTypeName } from '../../utils';
import { EditorFile } from '../types';
import { PlainWrapper } from './PlainWrapper';
import { Text } from './Text';

interface Props {
  readonly file?: EditorFile;
}
export const FileType = ({ file, ...props }: Props) =>
  file === undefined ? null : (
    <PlainWrapper>
      <Text {...props}>{getFileTypeName(file)}</Text>
    </PlainWrapper>
  );
