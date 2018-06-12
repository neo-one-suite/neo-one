import {
  Counter,
  Histogram,
  Logger,
  Report,
  MetricOptions,
  BucketedMetricOptions,
} from './types';

import { metrics } from './NoOpMetricsFactory';

export class ReportHandler {
  private counters: { [name: string]: Counter } = {};
  private histograms: { [name: string]: Histogram } = {};

  constructor(private readonly logger: Logger) {}

  public report(report: Report): void {
    report.logs.forEach((log) => {
      const { error } = log;
      let errorObj: Error | undefined;
      if (error != null) {
        errorObj = new Error(error.message);
        if (error.stack != null) {
          errorObj.stack = error.stack;
        }
        if (error.code != null) {
          (errorObj as any).code = error.code;
        }
      }
      this.logger.log({
        name: log.name,
        level: log.level,
        message: log.message,
        labels: log.labels,
        data: log.data,
        error: error == null ? undefined : errorObj,
      });
    });

    Object.values(report.metrics.counters).forEach((counterMetric) => {
      const counter = this.getCounter(counterMetric.metric);
      counterMetric.values.forEach((value) => {
        if (typeof value.countOrLabels === 'number') {
          counter.inc(value.countOrLabels);
        } else if (value.count != null) {
          counter.inc(value.countOrLabels, value.count);
        } else {
          counter.inc(value.countOrLabels);
        }
      });
    });

    Object.values(report.metrics.histograms).forEach((histMetric) => {
      const histogram = this.getHistogram(histMetric.metric);
      histMetric.values.forEach((value) => {
        if (typeof value.countOrLabels === 'number') {
          histogram.observe(value.countOrLabels);
        } else if (value.countOrLabels != null && value.count != null) {
          histogram.observe(value.countOrLabels, value.count);
        }
      });
    });
  }

  private getCounter(options: MetricOptions): Counter {
    if (this.counters[options.name] == null) {
      this.counters[options.name] = metrics.createCounter(options);
    }

    return this.counters[options.name];
  }

  private getHistogram(options: BucketedMetricOptions): Histogram {
    if (this.histograms[options.name] == null) {
      this.histograms[options.name] = metrics.createHistogram(options);
    }

    return this.histograms[options.name];
  }
}
