import { Labels } from './types';

const dotRegex = /\./g;
export const convertMetricLabel = (dotLabel: string): string => dotLabel.replace(dotRegex, '_');

export const convertMetricLabels = (labelsIn: Labels = {}): Labels =>
  Object.entries(labelsIn).reduce<Labels>(
    (acc, [key, value]) => ({
      ...acc,
      [convertMetricLabel(key)]: value,
    }),
    {},
  );

export const convertTagLabel = (dotLabel: string): string => dotLabel;

export const convertTagLabels = (labelsIn: Labels = {}): Labels =>
  Object.entries(labelsIn).reduce<Labels>(
    (acc, [key, value]) => ({
      ...acc,
      [convertTagLabel(key)]: value,
    }),
    {},
  );
