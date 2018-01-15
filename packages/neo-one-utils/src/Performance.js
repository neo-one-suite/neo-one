/* @flow */
import { now as performanceNow } from './log';

type Stats = { [key: string]: number };

export default class Performance {
  _durations: Stats;
  _counts: { [key: string]: number };

  constructor() {
    this._durations = {};
    this._counts = {};
  }

  start(name: string): () => void {
    const start = performanceNow();
    return () => {
      const duration = performanceNow() - start;
      if (this._durations[name] == null) {
        this._durations[name] = 0;
        this._counts[name] = 0;
      }
      this._durations[name] += duration;
      this._counts[name] += 1;
    };
  }

  getCount(name: string): number {
    return this._counts[name] || 0;
  }

  reset(): void {
    this._durations = {};
    this._counts = {};
  }

  toStats(): { durations: Stats, counts: Stats, normalizedDurations: Stats } {
    const normalizedDurations = {};
    for (const key of Object.keys(this._durations)) {
      normalizedDurations[key] = this._durations[key] / this._counts[key];
    }
    return {
      durations: { ...this._durations },
      counts: { ...this._counts },
      normalizedDurations,
    };
  }
}
