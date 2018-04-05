/* @flow */
import { interval } from 'rxjs/observable/interval';
import { mergeScan } from 'rxjs/operators';
import type { Subscription } from 'rxjs/Subscription';

import { utils } from '@neo-one/utils';

import type CollectingLogger from './CollectingLogger';
import type { Counter, Report } from './types';

import collectingMetrics from './CollectingMetricsFactory';
import metricsFactory from './NoOpMetricsFactory';

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
  _requestsTotal: Counter;
  _requestErrorsTotal: Counter;

  constructor({
    logger,
    timer,
    endpoint,
  }: {|
    logger: CollectingLogger,
    timer: number,
    endpoint: string,
  |}) {
    this._endpoint = endpoint;
    this._requestsTotal = metricsFactory.createCounter({
      name: 'http_report_metrics_requests_total',
    });
    this._requestErrorsTotal = metricsFactory.createCounter({
      name: 'http_report_metrics_failures_total',
    });

    this._subscription = interval(timer)
      .pipe(
        mergeScan(
          async backReport =>
            this._collectReport({
              backReport,
              logger,
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
  }: {|
    backReport?: Report,
    logger: CollectingLogger,
  |}): Promise<Report> {
    const logs = logger.collect();
    const metrics = collectingMetrics.collect();

    const report = this._addBackReport({ logs, metrics }, backReport);

    let response;
    try {
      response = await this._report(report);
    } catch (error) {
      response = { ok: false };
    }

    this._requestsTotal.inc();
    if (!response.ok) {
      this._requestErrorsTotal.inc();
      return this._constructBackReport(report);
    }

    return EMPTY_BACKREPORT;
  }

  _addBackReport(report: Report, backReport?: Report): Report {
    if (backReport == null) {
      return report;
    }

    return {
      logs: backReport.logs.concat(report.logs),
      metrics: {
        counters: utils.entries(backReport.metrics.counters).reduce(
          (accMetric, [name, metric]) => ({
            ...accMetric,
            [name]: {
              metric: metric.metric,
              values:
                accMetric[name] == null
                  ? metric.values
                  : metric.values.concat(accMetric[name].values),
            },
          }),
          report.metrics.counters,
        ),
        histograms: utils.entries(backReport.metrics.histograms).reduce(
          (accMetric, [name, metric]) => ({
            ...accMetric,
            [name]: {
              metric: metric.metric,
              values:
                accMetric[name] == null
                  ? metric.values
                  : metric.values.concat(accMetric[name].values),
            },
          }),
          report.metrics.histograms,
        ),
      },
    };
  }

  _constructBackReport(report: Report): Report {
    return {
      logs: report.logs.slice(-MAX_BACKLOG),
      metrics: {
        counters: utils.entries(report.metrics.counters).reduce(
          (accMetric, [name, metric]) => ({
            ...accMetric,
            [name]: {
              metric: metric.metric,
              values: metric.values.slice(-MAX_BACKLOG),
            },
          }),
          {},
        ),
        histograms: utils.entries(report.metrics.histograms).reduce(
          (accMetric, [name, metric]) => ({
            ...accMetric,
            [name]: {
              metric: metric.metric,
              values: metric.values.slice(-MAX_BACKLOG),
            },
          }),
          {},
        ),
      },
    };
  }

  close(): void {
    this._subscription.unsubscribe();
  }
}
