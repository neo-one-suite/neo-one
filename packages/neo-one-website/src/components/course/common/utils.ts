export const getLessonName = (title: string, lesson: number) => `Lesson ${lesson + 1}: ${title}`;
export const getLessonTo = (slug: string, lesson: number) => `/course/${slug}/${lesson + 1}`;
export const getChapterName = (title: string, chapter: number) => `Chapter ${chapter + 1}: ${title}`;
export const getChapterTo = (slug: string, lesson: number, chapter: number) =>
  `/course/${slug}/${lesson + 1}/${chapter + 1}`;
