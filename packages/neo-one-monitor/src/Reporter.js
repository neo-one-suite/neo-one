/* @flow */
import { interval } from 'rxjs/observable/interval';
import { mergeScan } from 'rxjs/operators';
import type { Subscription } from 'rxjs/Subscription';

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
      name: 'browserRequestCounter',
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
            let report = { logs, metrics };

            if (backReport != null) {
              report = this._addBackReport({ logs, metrics }, backReport);
            }

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

  _addBackReport(report: Report, backReport: Report): Report {
    const logs = backReport.logs.concat(report.logs);
    const { metrics } = report;

    for (const metricType of Object.keys(backReport.metrics)) {
      for (const name of Object.keys(backReport.metrics[metricType])) {
        if (metrics[metricType][name] != null) {
          const newValues = backReport.metrics[metricType][name].values.concat(
            metrics[metricType][name].values,
          );
          metrics[metricType][name].values = newValues;
        } else {
          metrics[metricType][name] = backReport.metrics[metricType][name];
        }
      }
    }

    return {
      logs,
      metrics,
    };
  }

  _constructBackReport(report: Report): Report {
    const backLogs = report.logs.slice(-MAX_BACKLOG);
    const backMetrics = {
      counters: {},
      histograms: {},
    };

    for (const metricType of Object.keys(report.metrics)) {
      for (const name of Object.keys(report.metrics[metricType])) {
        backMetrics[metricType][name] = report.metrics[metricType][name];
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
