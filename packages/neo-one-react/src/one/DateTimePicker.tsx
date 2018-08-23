// tslint:disable no-null-keyword
import { format, isBefore, parse } from 'date-fns';
import * as React from 'react';
import { Base, Container, Flex, Input, styled } from 'reakit';
import { prop } from 'styled-tools';
import { EffectsProps, ReactSyntheticEvent } from '../types';

const ErrorText = styled(Base)`
  color: ${prop('theme.error')};
`;

interface Props {
  readonly initialValue: Date;
  readonly minDate: Date;
  readonly onChange: (date: Date) => void;
}

interface State {
  readonly text: string;
  readonly error: string | undefined;
}

const FORMAT = 'yyyy/MM/dd hh:mm:ss a';

export function DateTimePicker({ initialValue, minDate, onChange }: Props) {
  let editingTimeout: NodeJS.Timer | undefined;
  const clearEditingTimeout = () => {
    if (editingTimeout !== undefined) {
      clearTimeout(editingTimeout);
      editingTimeout = undefined;
    }
  };

  const onError = (error: string, setState: EffectsProps<State>['setState']) => {
    editingTimeout = setTimeout(() => {
      setState({ error });
    }, 2000);
  };

  const effects = {
    onChange: (event: ReactSyntheticEvent) => {
      const text = event.currentTarget.value;
      clearEditingTimeout();

      return ({ setState }: EffectsProps<State>) => {
        setState({ text, error: undefined });
        const parsedDate = parse(text, FORMAT, new Date());
        if (Number.isNaN(parsedDate.valueOf())) {
          onError(`Invalid date. Expected format ${FORMAT}`, setState);
        } else if (isBefore(parsedDate, minDate)) {
          onError('Date must be a future point in time after the current block time.', setState);
        } else {
          onChange(parsedDate);
        }
      };
    },
  };

  return (
    <Flex column>
      <Container initialState={{ text: format(initialValue, FORMAT), error: undefined }} effects={effects}>
        {({ text, error, onChange: onChangeInput }: State & typeof effects) => (
          <>
            <Input value={text} onChange={onChangeInput} />
            {error === undefined ? null : <ErrorText>{error}</ErrorText>}
          </>
        )}
      </Container>
    </Flex>
  );
}
