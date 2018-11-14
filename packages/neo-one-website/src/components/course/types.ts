export interface SelectedCourse {
  readonly course: string;
}

export interface SelectedLesson extends SelectedCourse {
  readonly lesson: number;
}

export interface SelectedChapter extends SelectedLesson {
  readonly chapter: number;
}

export interface SelectedFile extends SelectedChapter {
  readonly path: string;
}

export interface Courses {
  readonly [slug: string]: Course;
}

export type CourseImage = 'contract' | 'debugging' | 'client';

export interface Course {
  readonly title: string;
  readonly description: string;
  readonly image: CourseImage;
  readonly lessons: ReadonlyArray<Lesson>;
}

export interface Lesson {
  readonly title: string;
  readonly documentation: string;
  readonly chapters: ReadonlyArray<Chapter>;
}

export interface Chapter {
  readonly title: string;
  readonly documentation: string;
  readonly files: ReadonlyArray<ChapterFile>;
}

export interface ChapterFile {
  readonly path: string;
  readonly initial?: string;
  readonly solution: string;
}
