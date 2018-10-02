// tslint:disable no-null-keyword
import { Container, EffectMap } from 'constate';
import * as React from 'react';
import { MdLoop } from 'react-icons/md';
import { as, Grid, keyframes, styled } from 'reakit';
import { EditorContext } from '../../EditorContext';
import { Engine } from '../../engine';
import { EditorFile } from '../types';
import { Text } from './Text';
import { Wrapper } from './Wrapper';

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(180deg);
  }

  100% {
    transform: rotate(360deg);
  }
`;

const Loop = styled(MdLoop)`
  animation: ${rotate} 1.5s linear infinite;
`;

const GridWrapper = styled(as(Text)(Grid))`
  gap: 2px;
  grid-auto-flow: column;
`;

interface State {
  readonly loading: boolean;
}

interface Effects {
  readonly onClick: () => void;
}

interface Props {
  readonly file?: EditorFile;
  readonly text: string;
  readonly icon: React.ReactNode;
  readonly makeEffects: (engine: Engine) => EffectMap<State, Effects>;
}

export const ActionButton = ({ file, text, makeEffects, icon }: Props) => {
  if (file === undefined) {
    return null;
  }

  return (
    <EditorContext.Consumer>
      {({ engine }) => (
        <Container initialState={{ loading: false }} effects={makeEffects(engine)}>
          {({ onClick, loading }) => (
            <Wrapper disabled={loading} onClick={onClick}>
              <GridWrapper>
                {loading ? <Loop /> : icon}
                {text}
              </GridWrapper>
            </Wrapper>
          )}
        </Container>
      )}
    </EditorContext.Consumer>
  );
};
