/* @flow */
import BrowserMonitor, { BrowserLogger, Reporter } from '../BrowserMonitor';
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
    metricLabels: { countMetric1: 7 },
  };

  const counterResult1 = {
    metric: {
      name: 'namespace1_counter1',
      help: counterOptions1.help,
      labelNames: counterOptions1.labelNames,
      labels: {},
      metricLabels: counterOptions1.metricLabels,
    },
    values: [{ countOrLabels: 5 }, { countOrLabels: 4 }],
  };

  const histogramOptions1 = {
    name: 'histogram1',
    help: 'helpHist',
    labelNames: ['histLabel1', 'histLabel2'],
    metricLabels: { histMetric1: 8 },
  };

  const histResult1 = {
    metric: {
      name: 'namespace1_histogram1',
      help: histogramOptions1.help,
      labelNames: histogramOptions1.labelNames,
      labels: {},
      metricLabels: histogramOptions1.metricLabels,
    },
    values: [{ countOrLabels: { histLabel1: 14 }, count: 3 }],
  };

  const startMetrics = {
    counters: [],
    gauges: [],
    histograms: [],
    summaries: [],
  };

  const emptyMetrics = {
    counters: [
      {
        metric: counterResult1.metric,
        values: [],
      },
    ],
    gauges: [],
    histograms: [
      {
        metric: histResult1.metric,
        values: [],
      },
    ],
    summaries: [],
  };

  let logger = new BrowserLogger();
  let monitor = BrowserMonitor.create({
    service: 'namespace1',
    logger,
  });
  beforeEach(() => {
    logger = new BrowserLogger();
    monitor = BrowserMonitor.create({
      service: 'namespace1',
      logger,
    });
  });

  afterEach(() => {
    reset();
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

    const result = monitor.collect();
    expect(JSON.stringify(result)).toEqual(
      JSON.stringify({
        ...emptyMetrics,
        counters: [counterResult1],
        histograms: [histResult1],
      }),
    );

    expect(monitor.collect()).toEqual(emptyMetrics);

    counter.inc(3);
    expect(monitor.collect()).toEqual({
      ...emptyMetrics,
      counters: [
        {
          metric: counterResult1.metric,
          values: [{ countOrLabels: 3 }],
        },
      ],
    });
  });

  test('Reporter - POST success', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

    const reporter = new Reporter({
      logger,
      monitor,
      timer: 1000,
      endpoint: 'fakeEnd',
    });

    logger.log(options1);

    const counter = monitor.getCounter(counterOptions1);
    counter.inc(5);
    counter.inc(4);

    await new Promise(resolve => setTimeout(() => resolve(), 1000));
    expect(logger.collect()).toEqual([]);
    expect(monitor.collect()).toEqual({ ...emptyMetrics, histograms: [] });
    expect(reporter._backLogs).toEqual([]);
    expect(reporter._backMetrics).toEqual(startMetrics);

    logger.log(options2);

    const histogram = monitor.getHistogram(histogramOptions1);
    histogram.observe({ histLabel1: 14 }, 3);

    await new Promise(resolve => setTimeout(() => resolve(), 500));
    expect(logger.collect()).toEqual([options2]);

    expect(JSON.stringify(monitor.collect())).toEqual(
      JSON.stringify({
        ...emptyMetrics,
        histograms: [histResult1],
      }),
    );
    expect(reporter._backLogs).toEqual([]);
    expect(reporter._backMetrics).toEqual(startMetrics);

    expect(fetch.mock.calls).toMatchSnapshot();

    const spy = jest.spyOn(reporter, '_shutdownFunc');
    reporter.close();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('Reporter - POST failure', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false }));

    const reporter = new Reporter({
      logger,
      monitor,
      timer: 1000,
      endpoint: 'fakeEnd',
    });

    logger.log(options1);

    const counter = monitor.getCounter(counterOptions1);
    counter.inc(5);
    counter.inc(4);

    await new Promise(resolve => setTimeout(() => resolve(), 1500));
    expect(reporter._backLogs).toEqual([options1]);
    expect(JSON.stringify(reporter._backMetrics)).toEqual(
      JSON.stringify({
        ...startMetrics,
        counters: [counterResult1],
      }),
    );

    logger.log(options2);

    const histogram = monitor.getHistogram(histogramOptions1);
    histogram.observe({ histLabel1: 14 }, 3);

    await new Promise(resolve => setTimeout(() => resolve(), 1000));
    expect(reporter._backLogs).toEqual([options2, options1]);
    expect(JSON.stringify(reporter._backMetrics)).toEqual(
      JSON.stringify({
        ...emptyMetrics,
        counters: [counterResult1],
        histograms: [histResult1],
      }),
    );

    expect(fetch.mock.calls).toMatchSnapshot();

    const spy = jest.spyOn(reporter, '_shutdownFunc');
    reporter.close();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test('receive', () => {
    monitor.receive({
      logs: [options1, options2],
      metrics: {
        ...emptyMetrics,
        counters: [counterResult1],
        histograms: [histResult1],
      },
    });

    const logResult = logger.collect();
    expect(logResult).toEqual([options1, options2]);

    const metricsResult = monitor.collect();
    expect(JSON.stringify(metricsResult)).toEqual(
      JSON.stringify({
        ...emptyMetrics,
        counters: [counterResult1],
        histograms: [histResult1],
      }),
    );
  });
});
