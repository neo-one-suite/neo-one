/* @flow */
import { utils } from '@neo-one/utils';

import type { Logger } from './MonitorBase';
import type {
  Counter,
  Histogram,
  Report,
  MetricOptions,
  BucketedMetricOptions,
} from './types';

import metrics from './NoOpMetricsFactory';

export default class ReportHandler {
  _logger: Logger;
  _counters: { [name: string]: Counter } = {};
  _histograms: { [name: string]: Histogram } = {};

  constructor(logger: Logger) {
    this._logger = logger;
  }

  report(report: Report): void {
    report.logs.forEach(log => {
      const { error } = log;
      let errorObj;
      if (error != null) {
        errorObj = new Error(error.message);
        if (error.stack != null) {
          errorObj.stack = error.stack;
        }
        if (error.code != null) {
          (errorObj: $FlowFixMe).code = error.code;
        }
      }
      this._logger.log({
        name: log.name,
        level: log.level,
        message: log.message,
        labels: log.labels,
        data: log.data,
        error: error == null ? undefined : errorObj,
      });
    });

    utils.values(report.metrics.counters).forEach(counterMetric => {
      const counter = this._getCounter(counterMetric.metric);
      counterMetric.values.forEach(value => {
        if (typeof value.countOrLabels === 'number') {
          counter.inc(value.countOrLabels);
        } else if (value.count != null) {
          counter.inc(value.countOrLabels, value.count);
        } else {
          counter.inc(value.countOrLabels);
        }
      });
    });

    utils.values(report.metrics.histograms).forEach(histMetric => {
      const histogram = this._getHistogram(histMetric.metric);
      histMetric.values.forEach(value => {
        if (typeof value.countOrLabels === 'number') {
          histogram.observe(value.countOrLabels);
        } else if (value.countOrLabels != null && value.count != null) {
          histogram.observe(value.countOrLabels, value.count);
        }
      });
    });
  }

  _getCounter(options: MetricOptions): Counter {
    if (this._counters[options.name] == null) {
      this._counters[options.name] = metrics.createCounter(options);
    }

    return this._counters[options.name];
  }

  _getHistogram(options: BucketedMetricOptions): Histogram {
    if (this._histograms[options.name] == null) {
      this._histograms[options.name] = metrics.createHistogram(options);
    }

    return this._histograms[options.name];
  }
}
