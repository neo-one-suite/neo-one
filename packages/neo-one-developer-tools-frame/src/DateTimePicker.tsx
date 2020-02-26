// tslint:disable no-null-keyword
import styled from '@emotion/styled';
import { Box, TextInput } from '@neo-one/react-common';
import { format, isBefore, parse } from 'date-fns';
import * as React from 'react';
import { prop } from 'styled-tools';

const { useState, useCallback } = React;

const ErrorText = styled(Box)<{}, {}>`
  color: ${prop('theme.error')};
`;

const Wrapper = styled(Box)`
  display: grid;
`;

interface Props {
  readonly initialValue: Date;
  readonly minDate: Date;
  readonly onChange: (date: Date) => void;
  readonly 'data-test-input': string;
  readonly 'data-test-error': string;
}

const FORMAT = 'yyyy/MM/dd hh:mm:ss a';

export function DateTimePicker({
  'data-test-error': dataTestError,
  'data-test-input': dataTestInput,
  initialValue,
  minDate,
  onChange,
  ...props
}: Props) {
  const [text, setText] = useState(format(initialValue, FORMAT));
  const [error, setError] = useState<string | undefined>(undefined);

  let editingTimeout: number | undefined;
  const clearEditingTimeout = () => {
    if (editingTimeout !== undefined) {
      clearTimeout(editingTimeout);
      editingTimeout = undefined;
    }
  };
  const onChangeInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextText = event.currentTarget.value;
      clearEditingTimeout();
      const onError = (nextError: string) => {
        editingTimeout = setTimeout(() => {
          setError(nextError);
          // tslint:disable-next-line no-any no-unnecessary-type-assertion no-useless-cast
        }, 2000) as any;
      };

      setText(nextText);
      setError(undefined);
      const parsedDate = parse(nextText, FORMAT, new Date());
      if (Number.isNaN(parsedDate.valueOf())) {
        onError(`Invalid date. Expected format ${FORMAT}`);
      } else if (isBefore(parsedDate, minDate)) {
        onError('Date must be a future point in time after the current block time.');
      } else {
        onChange(parsedDate);
      }
    },
    [setText, setError, onChange],
  );

  return (
    <Wrapper {...props}>
      <TextInput data-test={dataTestInput} value={text} onChange={onChangeInput} />
      {error === undefined ? null : <ErrorText data-test={dataTestError}>{error}</ErrorText>}
    </Wrapper>
  );
}
