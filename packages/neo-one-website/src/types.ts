export interface SubsectionData {
  readonly slug: string;
  readonly title: string;
  readonly subsections?: ReadonlyArray<SubsectionData>;
}

export interface SectionData {
  readonly title: string;
  readonly numbered?: boolean;
  readonly subsections: ReadonlyArray<SubsectionData>;
}

export interface AdjacentInfo {
  readonly slug: string;
  readonly title: string;
}
