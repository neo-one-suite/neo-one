export interface TooBusyCheckOptions {
  readonly interval?: number;
  readonly maxLag?: number;
  readonly smoothingFactor?: number;
}
