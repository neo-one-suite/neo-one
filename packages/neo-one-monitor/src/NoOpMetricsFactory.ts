import { MetricsFactoryProxy } from './MetricsFactoryProxy';
import { MetricsFactory } from './types';

class NoOpMetricsFactory extends MetricsFactoryProxy {}

export const metrics: MetricsFactory = new NoOpMetricsFactory();
