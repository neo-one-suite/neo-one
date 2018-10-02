// tslint:disable no-null-keyword
import { EffectMap } from 'constate';
import * as React from 'react';
import { MdPlayArrow } from 'react-icons/md';
import { Engine } from '../../engine';
import { EditorFile } from '../types';
import { ActionButton } from './ActionButton';

interface State {
  readonly loading: boolean;
}

interface Effects {
  readonly onClick: () => void;
}

const makeEffects = (engine: Engine): EffectMap<State, Effects> => ({
  onClick: () => ({ setState }) => {
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
  readonly file?: EditorFile;
}

export const BuildAction = ({ file }: Props) => (
  <ActionButton file={file} icon={<MdPlayArrow />} text="Build" makeEffects={makeEffects} />
);
