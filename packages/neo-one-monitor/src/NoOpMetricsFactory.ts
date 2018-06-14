import { MetricsFactoryProxy } from './MetricsFactoryProxy';
import { MetricsFactory } from './types';

class NoOpMetricsFactory extends MetricsFactoryProxy {}

// tslint:disable-next-line export-name
export const metrics: MetricsFactory = new NoOpMetricsFactory();
