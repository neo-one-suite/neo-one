import * as React from 'react';
import { Input } from 'reakit';
import { ComponentProps, ReactSyntheticEvent } from '../types';

interface Props {
  readonly value?: string;
  readonly disabled?: boolean;
  readonly onChange?: (value: ReactSyntheticEvent) => void;
  readonly placeholder?: string;
}
export function TextInput({ value, ...props }: Props & ComponentProps<typeof Input>) {
  return <Input value={value === undefined ? '' : value} {...props} />;
}
