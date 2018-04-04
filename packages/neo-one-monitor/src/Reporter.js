/* @flow */
import { interval } from 'rxjs/observable/interval';
import { mergeScan } from 'rxjs/operators';
import type { Subscription } from 'rxjs/Subscription';

import { utils } from '@neo-one/utils';

import BrowserLogger from './BrowserLogger';
import BrowserMetricsFactory from './BrowserMetricsFactory';
import type { Report } from './types';

import { KNOWN_LABELS, type CounterMetric } from './MonitorBase';

const MAX_BACKLOG = 1000;

const EMPTY_BACKREPORT = {
  logs: [],
  metrics: {
    counters: {},
    histograms: {},
  },
};

export default class Reporter {
  _endpoint: string;
  _subscription: Subscription;
  _requestCounter: CounterMetric;

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
    this._requestCounter = metricsFactory.createCounter({
      name: 'browser_request_counter',
      help: 'Counts fetch requests from Browser Reporter to endpoint',
      labelNames: [KNOWN_LABELS.ERROR],
    });

    this._subscription = interval(timer)
      .pipe(
        mergeScan(
          async backReport =>
            this._collectReport({
              backReport,
              logger,
              metricsFactory,
            }),
          EMPTY_BACKREPORT,
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

  async _collectReport({
    backReport,
    logger,
    metricsFactory,
  }: {|
    backReport?: Report,
    logger: BrowserLogger,
    metricsFactory: BrowserMetricsFactory,
  |}): Promise<Report> {
    const logs = logger.collect();
    const metrics = metricsFactory.collect();

    const report = this._addBackReport({ logs, metrics }, backReport);

    let response;
    try {
      response = await this._report(report);
    } catch (error) {
      response = { ok: false };
    }

    if (!response.ok) {
      this._requestCounter.inc({ [KNOWN_LABELS.ERROR]: true });
      return this._constructBackReport(report);
    }
    this._requestCounter.inc({ [KNOWN_LABELS.ERROR]: false });
    return EMPTY_BACKREPORT;
  }

  _addBackReport(report: Report, backReport?: Report): Report {
    if (backReport == null) {
      return report;
    }
    const logs = backReport.logs.concat(report.logs);
    const currentMetrics = report.metrics;

    const newMetrics = utils.entries(backReport.metrics).reduce(
      (accMetricType, [metricType, metrics]) => ({
        ...accMetricType,
        [metricType]: utils.entries(metrics).reduce(
          (accMetric, [name, metric]) => ({
            ...accMetric,
            [name]: {
              metric: metric.metric,
              values:
                currentMetrics[metricType][name] == null
                  ? metric.values
                  : metric.values.concat(
                      currentMetrics[metricType][name].values,
                    ),
            },
          }),
          accMetricType[metricType] || {},
        ),
      }),
      currentMetrics,
    );

    return {
      logs,
      metrics: newMetrics,
    };
  }

  _constructBackReport(report: Report): Report {
    const backLogs = report.logs.slice(-MAX_BACKLOG);

    const backMetrics = utils.entries(report.metrics).reduce(
      (accMetricType, [metricType, metrics]) => ({
        ...accMetricType,
        [metricType]: utils.entries(metrics).reduce(
          (accMetric, [name, metric]) => ({
            ...accMetric,
            [name]: {
              metric: metric.metric,
              values: metric.values.slice(-MAX_BACKLOG),
            },
          }),
          {},
        ),
      }),
      { counters: {}, histograms: {} },
    );

    return {
      logs: backLogs,
      metrics: backMetrics,
    };
  }

  close(): void {
    this._subscription.unsubscribe();
  }
}
