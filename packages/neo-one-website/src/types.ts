import * as React from 'react';

// tslint:disable-next-line no-any
export type ComponentProps<C extends React.ComponentType<any>> = C extends React.ComponentType<infer P> ? P : never;

export interface SubsectionData {
  readonly slug: string;
  readonly title: string;
  readonly subsections?: ReadonlyArray<SubsectionData>;
}

export interface SectionData {
  readonly title: string;
  readonly subsections: ReadonlyArray<SubsectionData>;
}

export interface AdjacentInfo {
  readonly slug: string;
  readonly title: string;
}
