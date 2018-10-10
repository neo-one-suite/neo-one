// tslint:disable no-null-keyword
import { EffectMap } from 'constate';
import * as React from 'react';
import { MdBuild } from 'react-icons/md';
import { connect } from 'react-redux';
import { Engine } from '../../engine';
import { openConsole } from '../redux';
import { ActionButton } from './ActionButton';

interface State {
  readonly loading: boolean;
}

interface Effects {
  readonly onClick: () => void;
}

const createMakeEffects = (openConsoleOutput: () => void) => (engine: Engine): EffectMap<State, Effects> => ({
  onClick: () => ({ setState }) => {
    openConsoleOutput();
    setState({ loading: true });

    engine
      .build()
      .then(() => {
        setState({ loading: false });
      })
      .catch((error) => {
        setState({ loading: false });
        // tslint:disable-next-line no-console
        console.error(error);
      });
  },
});

interface Props {
  readonly openConsoleOutput: () => void;
}

const BuildActionBase = ({ openConsoleOutput, ...props }: Props) => (
  <ActionButton
    {...props}
    data-test="build"
    icon={<MdBuild />}
    text="Build"
    makeEffects={createMakeEffects(openConsoleOutput)}
  />
);

export const BuildAction = connect(
  undefined,
  (dispatch) => ({
    openConsoleOutput: () => dispatch(openConsole('output')),
  }),
)(BuildActionBase);
