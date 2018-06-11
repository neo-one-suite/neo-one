import { Subscription, interval } from 'rxjs';

import { mergeScan } from 'rxjs/operators';

import { CollectingLogger } from './CollectingLogger';
import { Counter, Report } from './types';

import { collectingMetrics } from './CollectingMetricsFactory';
import { metrics as metricsFactory } from './NoOpMetricsFactory';

const MAX_BACKLOG = 1000;

const EMPTY_BACKREPORT: Report = {
  logs: [],
  metrics: {
    counters: {},
    histograms: {},
  },
};

export interface CollectReportOptions {
  backReport?: Report;
  logger: CollectingLogger;
}

export class Reporter {
  private readonly endpoint: string;
  private readonly subscription: Subscription;
  private readonly requestsTotal: Counter;
  private readonly requestErrorsTotal: Counter;

  constructor({
    logger,
    timer,
    endpoint,
  }: {
    logger: CollectingLogger;
    timer: number;
    endpoint: string;
  }) {
    this.endpoint = endpoint;
    this.requestsTotal = metricsFactory.createCounter({
      name: 'http_report_metrics_requests_total',
    });
    this.requestErrorsTotal = metricsFactory.createCounter({
      name: 'http_report_metrics_failures_total',
    });

    this.subscription = interval(timer)
      .pipe(
        mergeScan(
          async (backReport) =>
            this.collectReport({
              backReport,
              logger,
            }),
          EMPTY_BACKREPORT,
          1,
        ),
      )
      .subscribe();
  }

  public close(): void {
    this.subscription.unsubscribe();
  }

  public async collectReport_forTest(
    options: CollectReportOptions,
  ): Promise<Report> {
    return this.collectReport(options);
  }

  private async report(report: Report): Promise<Response> {
    return fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(report),
    });
  }

  private async collectReport({
    backReport,
    logger,
  }: CollectReportOptions): Promise<Report> {
    const logs = logger.collect();
    const metrics = collectingMetrics.collect();

    const report = this.addBackReport({ logs, metrics }, backReport);

    let response;
    try {
      response = await this.report(report);
    } catch (error) {
      response = { ok: false };
    }

    this.requestsTotal.inc();
    if (!response.ok) {
      this.requestErrorsTotal.inc();
      return this.constructBackReport(report);
    }

    return EMPTY_BACKREPORT;
  }

  private addBackReport(report: Report, backReport?: Report): Report {
    if (backReport == null) {
      return report;
    }

    return {
      logs: backReport.logs.concat(report.logs),
      metrics: {
        counters: Object.entries(backReport.metrics.counters).reduce(
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
        histograms: Object.entries(backReport.metrics.histograms).reduce(
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

  private constructBackReport(report: Report): Report {
    return {
      logs: report.logs.slice(-MAX_BACKLOG),
      metrics: {
        counters: Object.entries(report.metrics.counters).reduce(
          (accMetric, [name, metric]) => ({
            ...accMetric,
            [name]: {
              metric: metric.metric,
              values: metric.values.slice(-MAX_BACKLOG),
            },
          }),
          {},
        ),
        histograms: Object.entries(report.metrics.histograms).reduce(
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
}
