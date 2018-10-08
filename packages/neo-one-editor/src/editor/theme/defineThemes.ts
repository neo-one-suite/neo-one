// tslint:disable no-any
import Color from 'color';
import dark from './dark.json';

const sanitizeColor = (color: string) => {
  if (!color) {
    return color;
  }

  if (/#......$/.test(color) || /#........$/.test(color)) {
    return color;
  }

  try {
    return new Color(color).hex();
  } catch {
    return '#FF0000';
  }
};

const colorsAllowed = ({ foreground, background }: { readonly foreground: string; readonly background: string }) => {
  if (foreground === 'inherit' || background === 'inherit') {
    return false;
  }

  return true;
};

const getTheme = (theme: any) => {
  const { tokenColors = [], colors = {} } = theme;
  const rules = tokenColors
    .filter((t: any) => t.settings && t.scope && colorsAllowed(t.settings))
    .reduce((acc: any, token: any) => {
      const settings = {
        foreground: sanitizeColor(token.settings.foreground),
        background: sanitizeColor(token.settings.background),
        fontStyle: token.settings.fontStyle,
      };

      const scope = typeof token.scope === 'string' ? token.scope.split(',').map((a: any) => a.trim()) : token.scope;

      return [
        ...acc,
        ...scope.map((s: any) => ({
          token: s,
          ...settings,
        })),
      ];
    }, []);

  const newColors = colors;
  Object.keys(colors).forEach((c) => {
    if (newColors[c]) {
      return c;
    }

    // tslint:disable-next-line no-object-mutation no-dynamic-delete
    delete newColors[c];

    return c;
  });

  return {
    colors: newColors,
    rules,
    type: theme.type,
  };
};

// tslint:disable-next-line no-any
const defineTheme = (theme: any, base: monaco.editor.BuiltinTheme) => {
  const transformedTheme = getTheme(theme);

  monaco.editor.defineTheme('dark', {
    base,
    inherit: true,
    colors: transformedTheme.colors,
    rules: transformedTheme.rules,
  });

  monaco.editor.setTheme('dark');
};

export const defineThemes = () => {
  defineTheme(dark, 'vs-dark');
};
