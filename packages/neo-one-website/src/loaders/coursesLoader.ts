// tslint:disable no-array-mutation promise-function-async
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import webpack from 'webpack';
import { Chapter, ChapterFile, Course, Lesson } from '../components/course/types';

const COURSES_SOURCE = path.resolve(__dirname, '..', '..', 'courses');
const CONFIG = 'config.json';
const LESSON = 'lesson.md';
const CHAPTER = 'chapter.md';

// tslint:disable-next-line export-name
export function coursesLoader(this: webpack.loader.LoaderContext) {
  try {
    compile(this);
  } catch (e) {
    // tslint:disable-next-line no-console
    console.error(e, e.stack);
    throw e;
  }
}

const compile = (loader: webpack.loader.LoaderContext): void => {
  loader.addContextDependency(COURSES_SOURCE);
  const callback = loader.async();
  if (callback) {
    getSource()
      .then((result) => callback(undefined, result))
      .catch(callback);
  }
};

const getSource = async (): Promise<string> => {
  const courses = await getCourses();

  return `module.exports = ${JSON.stringify(courses)};`;
};

export const getCourses = async () => {
  const courseDirs = await getDirectories(COURSES_SOURCE);
  const coursePairs = await Promise.all(
    courseDirs.map(async (dir) => {
      const course = await getCourse(dir);

      // pure laziness
      return [dir.slice(COURSES_SOURCE.length + 3), course];
    }),
  );

  return _.fromPairs(coursePairs);
};

const getCourse = async (courseDir: string): Promise<Course> => {
  const coursePath = path.resolve(COURSES_SOURCE, courseDir);
  const [config, lessonDirs] = await Promise.all([
    fs.readFile(path.resolve(coursePath, CONFIG), 'utf8'),
    getDirectories(coursePath),
  ]);
  const lessons = await Promise.all(lessonDirs.map(async (dir) => getLesson(courseDir, dir)));

  const configParsed = JSON.parse(config);

  return {
    title: configParsed.title,
    description: configParsed.description,
    image: configParsed.image,
    lessons,
  };
};

const getLesson = async (courseDir: string, lesson: string): Promise<Lesson> => {
  const lessonPath = path.resolve(COURSES_SOURCE, courseDir, lesson);
  const [config, documentation, chapterDirs] = await Promise.all([
    fs.readFile(path.resolve(lessonPath, CONFIG), 'utf8'),
    fs.readFile(path.resolve(lessonPath, LESSON), 'utf8'),
    getDirectories(lessonPath),
  ]);
  const chapters = await Promise.all(chapterDirs.map(async (dir) => getChapter(courseDir, lesson, dir)));

  return {
    title: JSON.parse(config).title,
    documentation,
    chapters,
  };
};

const getChapter = async (courseDir: string, lesson: string, chapter: string): Promise<Chapter> => {
  const chapterPath = path.resolve(COURSES_SOURCE, courseDir, lesson, chapter);
  const [config, documentation] = await Promise.all([
    fs.readFile(path.resolve(chapterPath, CONFIG), 'utf8'),
    fs.readFile(path.resolve(chapterPath, CHAPTER), 'utf8'),
  ]);
  const configParsed = JSON.parse(config);
  const files = await getChapterFiles(chapterPath, configParsed.files);

  return {
    title: configParsed.title,
    documentation,
    files,
  };
};

const getChapterFiles = async (
  dir: string,
  files: ReadonlyArray<{ readonly initial?: string; readonly solution: string }>,
) => Promise.all(files.map(async ({ initial, solution }) => getChapterFile(dir, initial, solution)));

const getChapterFile = async (dir: string, initial: string | undefined, solution: string): Promise<ChapterFile> => {
  const readFile = async (filePath: string) => {
    const content = await fs.readFile(path.resolve(dir, filePath), 'utf8');
    const lines = content.split('\n');

    return lines
      .filter(
        (line, idx) =>
          !(
            line.includes('{/*') &&
            (lines[idx + 1] as string | undefined) !== undefined &&
            lines[idx + 1].includes('@ts-ignore')
          ) &&
          !line.includes('@ts-ignore') &&
          !line.includes('tslint:disable'),
      )
      .join('\n');
  };

  const [initialContent, solutionContent] = await Promise.all([
    initial === undefined ? Promise.resolve(undefined) : readFile(initial),
    readFile(solution),
  ]);

  return {
    path: initial === undefined ? solution : initial,
    initial: initialContent,
    solution: solutionContent,
  };
};

const getDirectories = async (filePath: string): Promise<ReadonlyArray<string>> => {
  const paths = await fs.readdir(filePath);
  const pathAndDir = await Promise.all(
    paths.map(async (fileName) => {
      const file = path.resolve(filePath, fileName);
      const stat = await fs.stat(file);

      return { isDir: stat.isDirectory(), file };
    }),
  );

  return pathAndDir.filter(({ isDir }) => isDir).map(({ file }) => file);
};
