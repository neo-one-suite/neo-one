/* @flow */
/* @jest-environment jsdom */
import BrowserMonitor from '../BrowserMonitor';
import BrowserLogger from '../BrowserLogger';
import BrowserMetricsFactory, { resetMetrics } from '../BrowserMetricsFactory';
import Reporter from '../Reporter';
import { reset } from '../MonitorBase';

describe('BrowserMonitor', () => {
  const options1 = {
    name: 'log1',
    level: 'info',
    message: 'test1',
    labels: { label1: 10 },
    data: { data1: '20' },
  };
  const options2 = {
    name: 'log2',
    level: 'silly',
    message: 'test2',
    labels: { label2: 30 },
    data: { data1: '40' },
    error: new Error('testError'),
  };

  const counterOptions1 = {
    name: 'counter1',
    help: 'helpCount',
    labelNames: ['label1', 'label2'],
  };

  const counterResult1 = {
    metric: {
      name: counterOptions1.name,
      help: counterOptions1.help,
      labelNames: [...counterOptions1.labelNames, 'service', 'component'],
    },
    values: [{ count: 5, countOrLabels: {} }, { count: 4, countOrLabels: {} }],
  };

  const histogramOptions1 = {
    name: 'histogram1',
    help: 'helpHist',
    labelNames: ['histLabel1', 'histLabel2'],
  };

  const histResult1 = {
    metric: {
      name: histogramOptions1.name,
      help: histogramOptions1.help,
      labelNames: [...histogramOptions1.labelNames, 'service', 'component'],
    },
    values: [{ countOrLabels: { histLabel1: 14 }, count: 3 }],
  };

  const emptyMetrics = {
    counters: [
      {
        metric: counterResult1.metric,
        values: [],
      },
    ],
    histograms: [
      {
        metric: histResult1.metric,
        values: [],
      },
    ],
  };

  const requestCounter = {
    name: 'browserRequestCounter',
    help: 'Counts fetch requests from Browser Reporter to endpoint',
    labelNames: ['success', 'failure'],
  };

  let logger = new BrowserLogger();
  let metricsFactory = new BrowserMetricsFactory();
  let monitor = BrowserMonitor.create({
    service: 'namespace1',
    logger,
    metricsFactory,
  });
  beforeEach(() => {
    logger = new BrowserLogger();
    metricsFactory = new BrowserMetricsFactory();
    monitor = BrowserMonitor.create({
      service: 'namespace1',
      logger,
      metricsFactory,
    });
  });

  afterEach(() => {
    reset();
    resetMetrics();
  });

  test('BrowserLogger', () => {
    expect(logger.collect()).toEqual([]);

    logger.log(options1);
    const firstResult = logger.collect();
    expect(firstResult).toEqual([options1]);

    logger.log(options2);
    const secondResult = logger.collect();
    expect(secondResult).toEqual([options2]);

    expect(logger.collect()).toEqual([]);

    const closeFunc = jest.fn();

    logger.close(closeFunc);

    expect(closeFunc).toHaveBeenCalledTimes(1);
  });

  test('BrowserMetricsFactory', () => {
    const counter = monitor.getCounter(counterOptions1);
    counter.inc(5);
    counter.inc(4);

    const histogram = monitor.getHistogram(histogramOptions1);
    histogram.observe({ histLabel1: 14 }, 3);

    const result = metricsFactory.collect();
    expect(result).toEqual({
      ...emptyMetrics,
      counters: [counterResult1],
      histograms: [histResult1],
    });

    expect(metricsFactory.collect()).toEqual(emptyMetrics);

    counter.inc(3);
    expect(metricsFactory.collect()).toEqual({
      ...emptyMetrics,
      counters: [
        {
          metric: counterResult1.metric,
          values: [{ count: 3, countOrLabels: {} }],
        },
      ],
    });
  });

  test('Reporter - POST success', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

    const reporter = new Reporter({
      logger,
      metricsFactory,
      timer: 1000,
      endpoint: 'fakeEnd',
    });

    logger.log(options1);

    const counter = monitor.getCounter(counterOptions1);
    counter.inc(5);
    counter.inc(4);

    await new Promise(resolve => setTimeout(() => resolve(), 1000));
    expect(logger.collect()).toEqual([]);
    expect(metricsFactory.collect()).toEqual({
      counters: [
        {
          metric: requestCounter,
          values: [],
        },
        {
          metric: counterResult1.metric,
          values: [],
        },
      ],
      histograms: [],
    });

    logger.log(options2);

    const histogram = monitor.getHistogram(histogramOptions1);
    histogram.observe({ histLabel1: 14 }, 3);

    await new Promise(resolve => setTimeout(() => resolve(), 500));
    expect(logger.collect()).toEqual([options2]);

    expect(metricsFactory.collect()).toEqual({
      counters: [
        {
          metric: requestCounter,
          values: [{ countOrLabels: { success: 1 } }],
        },
        {
          metric: counterResult1.metric,
          values: [],
        },
      ],
      histograms: [histResult1],
    });

    expect(fetch.mock.calls).toMatchSnapshot();

    const spy = jest.spyOn(reporter._subscription, 'unsubscribe');
    reporter.close();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('Reporter - POST failure', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false }));

    const reporter = new Reporter({
      logger,
      metricsFactory,
      timer: 1000,
      endpoint: 'fakeEnd',
    });

    logger.log(options1);

    const counter = monitor.getCounter(counterOptions1);
    counter.inc(5);
    counter.inc(4);

    await new Promise(resolve => setTimeout(() => resolve(), 1500));

    logger.log(options2);

    const histogram = monitor.getHistogram(histogramOptions1);
    histogram.observe({ histLabel1: 14 }, 3);

    await new Promise(resolve => setTimeout(() => resolve(), 1000));

    expect(fetch.mock.calls).toMatchSnapshot();

    const spy = jest.spyOn(reporter._subscription, 'unsubscribe');
    reporter.close();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('report', () => {
    monitor.report({
      logs: [options1, options2],
      metrics: {
        ...emptyMetrics,
        counters: [counterResult1],
        histograms: [histResult1],
      },
    });

    const logResult = logger.collect();
    expect(logResult).toEqual([options1, options2]);

    const metricsResult = metricsFactory.collect();
    expect(metricsResult).toEqual({
      counters: [counterResult1],
      histograms: [histResult1],
    });
  });
});
