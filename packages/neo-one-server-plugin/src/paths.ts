import envPaths from 'env-paths';
import { name } from './name';

export const paths = envPaths(name.cli, { suffix: '' });
