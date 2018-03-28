/* @flow */
import { interval } from 'rxjs/observable/interval';
import { mergeScan } from 'rxjs/operators';
import type { Subscription } from 'rxjs/Subscription';

import type BrowserLogger from './BrowserLogger';
import BrowserMetricsFactory, {
  type BaseMetric,
} from './BrowserMetricsFactory';

import type { LoggerLogOptions, Report } from './types';

const MAX_BACKLOG = 1000;

type BackReport = {|
  logs: Array<LoggerLogOptions>,
  metrics: {|
    counters: { [name: string]: BaseMetric },
    histograms: { [name: string]: BaseMetric },
  |},
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
      name: 'browserRequestCounter',
      help: 'Counts fetch requests from Browser Reporter to endpoint',
      labelNames: ['success', 'failure'],
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
            let report = { logs, metrics };

            if (backReport != null) {
              report = this._checkBackReport({ logs, metrics }, backReport);
            }
            let response;
            try {
              response = await this._report(report);
            } catch (error) {
              throw new Error(error);
            }
            if (!response.ok) {
              requestCounter.inc({ failure: 1 });
              return this._constructBackReport(report);
            }
            requestCounter.inc({ success: 1 });
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

  _checkBackReport(report: Report, backReport: BackReport): Report {
    const logs = report.logs.concat(backReport.logs);
    const { metrics } = report;

    for (const metricType of Object.keys(metrics)) {
      for (const metric of metrics[metricType]) {
        if (metric != null) {
          const { name } = metric.metric;
          if (name in backReport.metrics[metricType]) {
            metric.values = metric.values.concat(
              backReport.metrics[metricType][name].values,
            );
          } else {
            metrics[metricType].push(backReport.metrics[metricType][name]);
          }
        }
      }
    }

    return {
      logs,
      metrics,
    };
  }

  _constructBackReport(report: Report): BackReport {
    const backLogs = report.logs.slice(0, MAX_BACKLOG);
    const backMetrics = {
      counters: {},
      histograms: {},
    };

    for (const metricType of Object.keys(report.metrics)) {
      for (const metric of report.metrics[metricType]) {
        if (metric != null) {
          backMetrics[metricType][metric.metric.name] = metric;
        }
      }
    }

    return {
      logs: backLogs,
      metrics: backMetrics,
    };
  }

  close(): void {
    this._subscription.unsubscribe();
  }
}
