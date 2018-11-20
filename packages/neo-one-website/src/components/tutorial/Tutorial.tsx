// tslint:disable no-any
// @ts-ignore
import { ViewportConsumer } from '@render-props/viewport';
import * as React from 'react';
import slugify from 'slugify';
import { AdjacentInfo, SectionData } from '../../types';
import { Content, MarkdownContent } from '../content';

export interface TutorialProps {
  readonly title: string;
  readonly content: MarkdownContent;
  readonly sidebar: ReadonlyArray<SectionData>;
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

const NULL_OFFSET_RETURN = 10000000;

const getElementPosition = (title: string): number => {
  const element = document.getElementById(slugify(title));
  if (element !== null && element.offsetParent !== null) {
    const parentElement = document.getElementById(element.offsetParent.id);

    return parentElement === null ? element.offsetTop : parentElement.offsetTop + element.offsetTop;
  }

  return NULL_OFFSET_RETURN;
};

export const Tutorial = (props: TutorialProps) => (
  <ViewportConsumer>
    {({ scrollY }: any) => {
      let current = props.sidebar[0].subsections[0].slug;
      // tslint:disable-next-line strict-type-predicates
      if (typeof document !== 'undefined') {
        let minOffset = Math.abs(getElementPosition(props.sidebar[0].subsections[0].title) - scrollY);
        // tslint:disable-next-line no-loop-statement
        for (const subsection of props.sidebar[0].subsections) {
          const subsectionOffset = Math.abs(getElementPosition(subsection.title) - scrollY);
          if (subsectionOffset < minOffset) {
            minOffset = subsectionOffset;
            current = subsection.slug;
          }

          if (subsection.subsections !== undefined) {
            // tslint:disable-next-line no-loop-statement
            for (const subSubsection of subsection.subsections) {
              const subSubsectionOffset = Math.abs(getElementPosition(subSubsection.title) - scrollY);
              if (subSubsectionOffset < minOffset) {
                minOffset = subSubsectionOffset;
                current = subSubsection.slug;
              }
            }
          }
        }
      }

      return <Content current={current} sidebarAlwaysVisible {...props} />;
    }}
  </ViewportConsumer>
);
