// tslint:disable no-null-keyword
import { EffectMap } from 'constate';
import { format, isBefore, parse } from 'date-fns';
import * as React from 'react';
import { Base, Container, Flex, Input, styled } from 'reakit';
import { prop } from 'styled-tools';
import { ReactSyntheticEvent } from '../types';

const ErrorText = styled(Base)`
  color: ${prop('theme.error')};
`;

interface Props {
  readonly initialValue: Date;
  readonly minDate: Date;
  readonly onChange: (date: Date) => void;
  readonly 'data-test-input': string;
  readonly 'data-test-error': string;
}

interface State {
  readonly text: string;
  readonly error: string | undefined;
}

interface Effects {
  readonly onChange: (event: ReactSyntheticEvent) => void;
}

const FORMAT = 'yyyy/MM/dd hh:mm:ss a';

export function DateTimePicker({
  'data-test-error': dataTestError,
  'data-test-input': dataTestInput,
  initialValue,
  minDate,
  onChange,
}: Props) {
  let editingTimeout: NodeJS.Timer | undefined;
  const clearEditingTimeout = () => {
    if (editingTimeout !== undefined) {
      clearTimeout(editingTimeout);
      editingTimeout = undefined;
    }
  };

  const effects: EffectMap<State, Effects> = {
    onChange: (event) => {
      const text = event.currentTarget.value;
      clearEditingTimeout();

      return ({ setState }) => {
        const onError = (error: string) => {
          editingTimeout = setTimeout(() => {
            setState({ error });
          }, 2000);
        };

        setState({ text, error: undefined });
        const parsedDate = parse(text, FORMAT, new Date());
        if (Number.isNaN(parsedDate.valueOf())) {
          onError(`Invalid date. Expected format ${FORMAT}`);
        } else if (isBefore(parsedDate, minDate)) {
          onError('Date must be a future point in time after the current block time.');
        } else {
          onChange(parsedDate);
        }
      };
    },
  };

  return (
    <Flex column>
      <Container initialState={{ text: format(initialValue, FORMAT), error: undefined }} effects={effects}>
        {({ text, error, onChange: onChangeInput }) => (
          <>
            <Input data-test={dataTestInput} value={text} onChange={onChangeInput} />
            {error === undefined ? null : <ErrorText data-test={dataTestError}>{error}</ErrorText>}
          </>
        )}
      </Container>
    </Flex>
  );
}
