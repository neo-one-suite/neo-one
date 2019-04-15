// @ts-ignore
import { ViewportConsumer } from '@render-props/viewport';
import React from 'react';
import slugify from 'slugify';
import { AdjacentInfo, SectionData, SubsectionData } from '../../types';
import { Content, MarkdownContent } from '../content';

const { useState } = React;

export interface TutorialProps {
  readonly title: string;
  readonly content: MarkdownContent;
  readonly link: string;
  readonly sidebar: ReadonlyArray<SectionData>;
  readonly next?: AdjacentInfo;
  readonly previous?: AdjacentInfo;
}

interface SectionScanResult {
  readonly result: SubsectionData;
  readonly currentOffset: number;
  readonly done: boolean;
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

export const Tutorial = (props: TutorialProps) => {
  const subSections = props.sidebar[0].subsections;
  const [current, setCurrent] = useState(subSections[0]);

  const allSections = subSections.reduce<ReadonlyArray<SubsectionData>>((acc, section) => {
    const newSections = section.subsections !== undefined ? [section].concat(section.subsections) : [section];

    return acc.concat(newSections);
  }, []);

  const getElementOffset = (scrollValue: number, sectionTitle: string) =>
    Math.abs(scrollValue - getElementPosition(sectionTitle));

  const findClosestSection = (scrollY: number) =>
    allSections.slice(1).reduce<SectionScanResult>(
      (acc, section) => {
        if (acc.done) {
          return acc;
        }

        const offset = getElementOffset(scrollY, section.title);
        if (offset < acc.currentOffset) {
          return {
            result: section,
            currentOffset: offset,
            done: false,
          };
        }

        return {
          ...acc,
          done: true,
        };
      },
      {
        result: allSections[0],
        currentOffset: getElementOffset(scrollY, allSections[0].title),
        done: false,
      },
    ).result;

  return (
    <ViewportConsumer>
      {({ scrollY }: { readonly scrollY: number }) => {
        // tslint:disable:strict-type-predicates
        if (typeof document !== 'undefined') {
          const newSection = findClosestSection(scrollY);
          if (newSection !== current) {
            setCurrent(newSection);
          }
        }

        return <Content current={current.slug} sidebarAlwaysVisible {...props} />;
      }}
    </ViewportConsumer>
  );
};
