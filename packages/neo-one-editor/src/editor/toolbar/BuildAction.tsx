// tslint:disable no-null-keyword
import * as React from 'react';
import { MdBuild } from 'react-icons/md';
import { connect } from 'react-redux';
import { EditorContext } from '../../EditorContext';
import { openConsole } from '../redux';
import { ActionButtonBase } from './ActionButtonBase';

const { useContext, useCallback, useState } = React;

interface Props {
  readonly openConsoleOutput: () => void;
}

const BuildActionBase = ({ openConsoleOutput, ...props }: Props) => {
  const { engine } = useContext(EditorContext);
  const [loading, setLoading] = useState(false);
  const onClick = useCallback(
    () => {
      openConsoleOutput();
      setLoading(true);

      engine
        .build()
        .then(() => {
          setLoading(false);
        })
        .catch((error) => {
          setLoading(false);
          // tslint:disable-next-line no-console
          console.error(error);
        });
    },
    [setLoading, openConsoleOutput, engine],
  );

  return (
    <ActionButtonBase
      {...props}
      loading={loading}
      onClick={onClick}
      data-test="build"
      icon={<MdBuild />}
      text="Build"
    />
  );
};

export const BuildAction = connect(
  undefined,
  (dispatch) => ({
    openConsoleOutput: () => dispatch(openConsole('output')),
  }),
)(BuildActionBase);
