export interface HiddenAPI {
  readonly visible: boolean;
  readonly show: () => void;
  readonly hide: () => void;
  readonly toggle: () => void;
}

export interface SubsectionData {
  readonly slug: string;
  readonly title: string;
}

export interface SectionData {
  readonly subsections: ReadonlyArray<SubsectionData>;
  readonly section: string;
  readonly upstreamHidden?: HiddenAPI;
}
