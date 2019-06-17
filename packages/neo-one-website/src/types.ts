export interface SubsectionData {
  readonly slug: string;
  readonly title: string;
  readonly subsections?: readonly SubsectionData[];
}

export interface SectionData {
  readonly title: string;
  readonly numbered?: boolean;
  readonly subsections: readonly SubsectionData[];
}

export interface AdjacentInfo {
  readonly slug: string;
  readonly title: string;
}
