/* @flow */
/* @jest-environment jsdom */
import prom from 'prom-client';

import CollectingLogger from '../CollectingLogger';
import NodeMonitor from '../NodeMonitor';
import Reporter from '../Reporter';

import collectingMetrics from '../CollectingMetricsFactory';
import metrics from '../NoOpMetricsFactory';

describe('BrowserMonitor', () => {
  const options1 = {
    name: 'log1',
    level: 'info',
    message: 'test1',
    labels: { label1: 10 },
    data: { data1: '20' },
  };
  const error = new Error('testError');
  (error: $FlowFixMe).code = 'red';
  const options2 = {
    name: 'log2',
    level: 'silly',
    message: 'test2',
    labels: { label2: 30 },
    data: { data1: '40' },
    error,
  };

  const options2Result = {
    ...options2,
    error: {
      message: error.message,
      stack: error.stack,
      code: (error: $FlowFixMe).code,
    },
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
      labelNames: [...counterOptions1.labelNames],
    },
    values: [{ countOrLabels: 5 }, { countOrLabels: 4 }],
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
      labelNames: [...histogramOptions1.labelNames],
    },
    values: [{ countOrLabels: { histLabel1: 14 }, count: 3 }],
  };

  const emptyMetrics = {
    counters: {
      [counterResult1.metric.name]: {
        metric: counterResult1.metric,
        values: [],
      },
    },
    histograms: {
      [histResult1.metric.name]: {
        metric: histResult1.metric,
        values: [],
      },
    },
  };

  const requestCounter = {
    name: 'http_report_metrics_requests_total',
  };

  const failuresCounter = {
    name: 'http_report_metrics_failures_total',
  };

  const emptyBackReport = {
    logs: [],
    metrics: {
      counters: {},
      histograms: {},
    },
  };

  let logger = new CollectingLogger();
  let reporter;
  beforeEach(() => {
    logger = new CollectingLogger();
    reporter = null;
    metrics.setFactory(collectingMetrics);
  });

  afterEach(() => {
    collectingMetrics.reset();
    prom.register.clear();
    if (reporter != null) {
      reporter.close();
    }
  });

  test('CollectingLogger', () => {
    expect(logger.collect()).toEqual([]);

    logger.log(options1);
    const firstResult = logger.collect();
    expect(firstResult).toEqual([options1]);

    logger.log(options2);
    const secondResult = logger.collect();
    expect(secondResult).toEqual([options2Result]);

    expect(logger.collect()).toEqual([]);

    const closeFunc = jest.fn();

    logger.close(closeFunc);

    expect(closeFunc).toHaveBeenCalledTimes(1);
  });

  test('BrowserMetricsFactory', () => {
    const counter = metrics.createCounter(counterOptions1);
    counter.inc(5);
    counter.inc(4);

    const histogram = metrics.createHistogram(histogramOptions1);
    histogram.observe({ histLabel1: 14 }, 3);

    const result = collectingMetrics.collect();
    expect(result).toEqual({
      counters: { [counterResult1.metric.name]: counterResult1 },
      histograms: { [histResult1.metric.name]: histResult1 },
    });

    expect(collectingMetrics.collect()).toEqual(emptyMetrics);

    counter.inc(3);
    expect(collectingMetrics.collect()).toEqual({
      ...emptyMetrics,
      counters: {
        [counterResult1.metric.name]: {
          metric: counterResult1.metric,
          values: [{ countOrLabels: 3, count: undefined }],
        },
      },
    });
  });

  test('Reporter - POST success', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }));

    reporter = new Reporter({
      logger,
      timer: 2000,
      endpoint: 'fakeEnd',
    });

    logger.log(options1);

    const counter = metrics.createCounter(counterOptions1);
    counter.inc(5);
    counter.inc(4);

    const firstResult = await reporter._collectReport({
      backReport: emptyBackReport,
      logger,
    });

    expect(firstResult).toEqual(emptyBackReport);

    const histogram = metrics.createHistogram(histogramOptions1);
    histogram.observe({ histLabel1: 14 }, 3);

    const secondResult = await reporter._collectReport({
      backReport: emptyBackReport,
      logger,
    });

    expect(secondResult).toEqual(emptyBackReport);

    expect(fetch.mock.calls).toMatchSnapshot();

    await new Promise(resolve => setTimeout(() => resolve(), 2000));
    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  test('Reporter - POST failure', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false }));

    reporter = new Reporter({
      logger,
      timer: 2000,
      endpoint: 'fakeEnd',
    });

    logger.log(options1);

    const counter = metrics.createCounter(counterOptions1);
    counter.inc(5);
    counter.inc(4);

    const firstBackReport = {
      logs: [options1],
      metrics: {
        counters: {
          [requestCounter.name]: {
            metric: requestCounter,
            values: [{ countOrLabels: 0 }],
          },
          [failuresCounter.name]: {
            metric: failuresCounter,
            values: [{ countOrLabels: 0 }],
          },
          [counterResult1.metric.name]: counterResult1,
        },
        histograms: {},
      },
    };

    const firstResult = await reporter._collectReport({
      backReport: emptyBackReport,
      logger,
    });

    expect(firstResult).toEqual(firstBackReport);

    const histogram = metrics.createHistogram(histogramOptions1);
    histogram.observe({ histLabel1: 14 }, 3);

    const secondBackReport = {
      logs: [],
      metrics: {
        counters: {
          [requestCounter.name]: {
            metric: requestCounter,
            values: [{ countOrLabels: undefined, count: undefined }],
          },
          [failuresCounter.name]: {
            metric: failuresCounter,
            values: [{ countOrLabels: undefined, count: undefined }],
          },
          [counterResult1.metric.name]: {
            metric: counterResult1.metric,
            values: [],
          },
        },
        histograms: { [histResult1.metric.name]: histResult1 },
      },
    };

    const secondResult = await reporter._collectReport({
      backReport: emptyBackReport,
      logger,
    });

    expect(secondResult).toEqual(secondBackReport);

    expect(fetch.mock.calls).toMatchSnapshot();

    await new Promise(resolve => setTimeout(() => resolve(), 2000));
    expect(fetch.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  describe('report to Node', () => {
    test('Counter.inc called with same args', () => {
      const counter = metrics.createCounter(counterOptions1);
      const clientCounterInc = jest.spyOn(counter, 'inc');
      counter.inc(5);
      counter.inc(4);
      counter.inc({ label1: 7 });
      counter.inc({ label2: 12 }, 36);

      const testReport = JSON.stringify({
        logs: logger.collect(),
        metrics: collectingMetrics.collect(),
      });

      const nodeMonitor = NodeMonitor.create({
        service: 'test',
      });
      const nodeCounter = {
        inc: jest.fn(),
      };
      const createCounterSpy = jest
        .spyOn(metrics, 'createCounter')
        .mockImplementationOnce(() => nodeCounter);
      nodeMonitor.report(JSON.parse(testReport));
      createCounterSpy.mockRestore();

      expect(clientCounterInc.mock.calls).toEqual(nodeCounter.inc.mock.calls);
    });

    test('Histogram.observe called with same args', () => {
      const histogram = metrics.createHistogram(histogramOptions1);
      const clientHistogramObserve = jest.spyOn(histogram, 'observe');
      histogram.observe({ histLabel1: 14 }, 3);
      histogram.observe(7);

      const testReport = JSON.stringify({
        logs: logger.collect(),
        metrics: collectingMetrics.collect(),
      });

      const nodeMonitor = NodeMonitor.create({
        service: 'test',
      });
      const nodeHistogram = {
        observe: jest.fn(),
      };
      const createHistogramSpy = jest
        .spyOn(metrics, 'createHistogram')
        .mockImplementationOnce(() => nodeHistogram);
      nodeMonitor.report(JSON.parse(testReport));
      createHistogramSpy.mockRestore();

      expect(clientHistogramObserve.mock.calls).toEqual(
        nodeHistogram.observe.mock.calls,
      );
    });

    test('logging', () => {
      logger.log(options1);
      logger.log(options2);

      const testReport = JSON.stringify({
        logs: logger.collect(),
        metrics: collectingMetrics.collect(),
      });
      const nodeMonitor = NodeMonitor.create({
        service: 'test',
      });
      const logSpy = jest.spyOn(nodeMonitor._logger, 'log');
      nodeMonitor.report(JSON.parse(testReport));

      expect([[options1], [options2]]).toEqual(logSpy.mock.calls);
    });
  });
});
