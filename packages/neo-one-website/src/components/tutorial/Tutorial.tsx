// tslint:disable no-any
// @ts-ignore
import { ViewportConsumer } from '@render-props/viewport';
import * as React from 'react';
import { AdjacentInfo, SectionData } from '../../types';
import { Content } from '../content';

export interface TutorialProps {
  readonly title: string;
  readonly content: string;
  readonly sidebar: ReadonlyArray<SectionData>;
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

const slugify = (title: string) => title.toLowerCase().replace(' ', '-');

export const Tutorial = (props: TutorialProps) => (
  <ViewportConsumer>
    {({ inViewY }: any) => {
      let current = props.sidebar[0].subsections[0].slug;
      // tslint:disable-next-line strict-type-predicates
      if (typeof document !== 'undefined') {
        // tslint:disable-next-line no-loop-statement
        for (const subsection of props.sidebar[0].subsections) {
          if (inViewY(document.getElementById(slugify(subsection.title)))) {
            current = subsection.slug;
            break;
          }

          if (subsection.subsections !== undefined) {
            let shouldBreak = false;
            // tslint:disable-next-line no-loop-statement
            for (const subSubsection of subsection.subsections) {
              if (inViewY(document.getElementById(slugify(subSubsection.title)))) {
                current = subSubsection.slug;
                shouldBreak = true;
                break;
              }
            }

            if (shouldBreak) {
              break;
            }
          }
        }
      }

      return <Content current={current} sidebarAlwaysVisible {...props} />;
    }}
  </ViewportConsumer>
);
