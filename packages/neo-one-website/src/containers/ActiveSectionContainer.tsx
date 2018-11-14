import { ContainerProps, EffectMap } from 'constate';
import * as React from 'react';
import { Container } from 'reakit';

interface State {
  readonly activeSection: string | undefined;
}

interface Effects {
  readonly setActiveSection: (section: string) => void;
}

const effects: EffectMap<State, Effects> = {
  setActiveSection: (section: string) => ({ setState }: { setState: (state: Partial<State>) => void }) => {
    setState({ activeSection: section });
  },
};

export const ActiveSectionContainer = (props: ContainerProps<State, {}, {}, Effects>) => (
  <Container {...props} effects={effects} />
);
