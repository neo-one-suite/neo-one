const doNothing = () => {
  // do nothing
};
// tslint:disable-next-line no-let no-any
const FakeTrackJS: any = {
  install: doNothing,
  addMetadata: doNothing,
  track: doNothing,
};

// tslint:disable-next-line:no-var-requires no-require-imports strict-type-predicates
export const TrackJS = typeof window === 'undefined' ? FakeTrackJS : require('trackjs').TrackJS;
