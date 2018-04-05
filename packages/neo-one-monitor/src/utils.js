/* @flow */
import type { Labels } from './types';

const dotRegex = /\./g;
export const convertMetricLabel = (dotLabel: string): string =>
  dotLabel.replace(dotRegex, '_');

export const convertMetricLabels = (labelsIn?: Labels): Labels => {
  if (labelsIn == null) {
    return {};
  }

  const labels = {};
  for (const key of Object.keys(labelsIn)) {
    labels[convertMetricLabel(key)] = labelsIn[key];
  }
  return labels;
};

export const convertTagLabel = (dotLabel: string): string => dotLabel;

export const convertTagLabels = (labelsIn?: Labels): Labels => {
  if (labelsIn == null) {
    return {};
  }

  const labels = {};
  for (const key of Object.keys(labelsIn)) {
    labels[convertTagLabel(key)] = labelsIn[key];
  }
  return labels;
};
