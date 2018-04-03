/* @flow */
import { interval } from 'rxjs/observable/interval';
import { mergeScan } from 'rxjs/operators';
import type { Subscription } from 'rxjs/Subscription';

import { utils } from '@neo-one/utils';

import BrowserLogger, {
  type CollectingLoggerLogOptions,
} from './BrowserLogger';
import BrowserMetricsFactory, {
  type MetricCollection,
} from './BrowserMetricsFactory';
import { KNOWN_LABELS } from './MonitorBase';

const MAX_BACKLOG = 1000;

export type Report = {|
  logs: Array<CollectingLoggerLogOptions>,
  metrics: MetricCollection,
|};

export default class Reporter {
  _endpoint: string;
  _subscription: Subscription;

  constructor({
    logger,
    metricsFactory,
    timer,
    endpoint,
  }: {|
    logger: BrowserLogger,
    metricsFactory: BrowserMetricsFactory,
    timer: number,
    endpoint: string,
  |}) {
    this._endpoint = endpoint;
    const requestCounter = metricsFactory.createCounter({
      name: 'browser_request_counter',
      help: 'Counts fetch requests from Browser Reporter to endpoint',
      labelNames: [KNOWN_LABELS.ERROR],
    });
    const emptyBackReport = {
      logs: [],
      metrics: {
        counters: {},
        histograms: {},
      },
    };

    this._subscription = interval(timer)
      .pipe(
        mergeScan(
          async backReport => {
            const logs = logger.collect();
            const metrics = metricsFactory.collect();

            const report = this._addBackReport({ logs, metrics }, backReport);

            const response = await this._report(report);

            if (!response.ok) {
              requestCounter.inc({ [KNOWN_LABELS.ERROR]: true });
              return this._constructBackReport(report);
            }
            requestCounter.inc({ [KNOWN_LABELS.ERROR]: false });
            return emptyBackReport;
          },
          emptyBackReport,
          1,
        ),
      )
      .subscribe();
  }

  async _report(report: Report): Promise<Response> {
    return fetch(this._endpoint, {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  _addBackReport(report: Report, backReport?: Report): Report {
    if (backReport == null) {
      return report;
    }
    const logs = backReport.logs.concat(report.logs);
    const { metrics } = report;

    const newMetrics = utils
      .keys(backReport.metrics)
      .reduce((accMetricType, metricType) => {
        const resultMetricType = { ...accMetricType };
        resultMetricType[metricType] = utils
          .keys(backReport.metrics[metricType])
          .reduce(
            (accMetric, name) => {
              const resultMetric = { ...accMetric };
              if (metrics[metricType][name] != null) {
                const resultValues = backReport.metrics[metricType][
                  name
                ].values.concat(metrics[metricType][name].values);
                resultMetric[name].values = resultValues;
              } else {
                resultMetric[name] = backReport.metrics[metricType][name];
              }
              return resultMetric;
            },
            { ...metrics[metricType] },
          );
        return resultMetricType;
      }, {});

    return {
      logs,
      metrics: {
        counters: newMetrics.counters,
        histograms: newMetrics.histograms,
      },
    };
  }

  _constructBackReport(report: Report): Report {
    const backLogs = report.logs.slice(-MAX_BACKLOG);

    const backMetrics = utils
      .keys(report.metrics)
      .reduce((accMetricType, metricType) => {
        const resultMetricType = { ...accMetricType };
        resultMetricType[metricType] = utils
          .keys(report.metrics[metricType])
          .reduce((accMetric, name) => {
            const result = { ...accMetric };
            result[name] = report.metrics[metricType][name];
            return result;
          }, {});
        return resultMetricType;
      }, {});

    return {
      logs: backLogs,
      metrics: {
        counters: backMetrics.counters,
        histograms: backMetrics.histograms,
      },
    };
  }

  close(): void {
    this._subscription.unsubscribe();
  }
}
