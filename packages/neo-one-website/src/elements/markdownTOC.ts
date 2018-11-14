// tslint:disable

const slugify = (s: any) =>
  encodeURIComponent(
    String(s)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-'),
  );
const defaults = {
  includeLevel: [1, 2],
  containerClass: 'table-of-contents',
  slugify,
  markerPattern: /^\[\[toc\]\]/im,
  listType: 'ul',
  format: undefined,
  forceFullToc: false,
  subTOC: false,
  containerHeaderHtml: undefined,
  containerFooterHtml: undefined,
  name: 'toc',
};

export const markdownTOC = (md: any, o: any) => {
  const options = Object.assign({}, defaults, o);
  const name = options.name;
  const tocRegexp = options.markerPattern;
  let gstate: any;
  let seen = 0;

  const open = `${name}_open`;
  const body = `${name}_body`;
  const close = `${name}_close`;

  function toc(state: any, silent: any) {
    var token;
    var match;

    // Reject if the token does not start with [
    if (state.src.charCodeAt(state.pos) !== 0x5b /* [ */) {
      return false;
    }
    // Don't run any pairs in validation mode
    if (silent) {
      return false;
    }

    // Detect TOC markdown
    match = tocRegexp.exec(state.src.substr(state.pos));
    match = !match
      ? []
      : match.filter(function(m: any) {
          return m;
        });
    if (match.length < 1) {
      return false;
    }

    gstate = undefined;
    seen = 0;

    // Build content
    token = state.push(open, 'toc', 1);
    token.markup = '[[toc]]';
    token = state.push(body, '', 0);
    token = state.push(close, 'toc', -1);

    // Update pos so the parser can continue
    var newline = state.src.indexOf('\n', state.pos);
    if (newline !== -1) {
      state.pos = newline;
    } else {
      state.pos = state.pos + state.posMax + 1;
    }

    return true;
  }

  md.renderer.rules[open] = function() {
    var tocOpenHtml = `<div class="${options.containerClass}">`;

    if (options.containerHeaderHtml) {
      tocOpenHtml += options.containerHeaderHtml;
    }

    return tocOpenHtml;
  };

  md.renderer.rules[close] = function() {
    var tocFooterHtml = '';

    if (options.containerFooterHtml) {
      tocFooterHtml = options.containerFooterHtml;
    }

    return tocFooterHtml + `</div>`;
  };

  md.renderer.rules[body] = function() {
    if (options.forceFullToc) {
      /*

      Renders full TOC even if the hierarchy of headers contains
      a header greater than the first appearing header

      ## heading 2
      ### heading 3
      # heading 1

      Result TOC:
      - heading 2
         - heading 3
      - heading 1

      */
      var tocBody = '';
      var pos = 0;
      var tokenLength = gstate && gstate.tokens && gstate.tokens.length;

      while (pos < tokenLength) {
        var tocHierarchy = renderChildsTokens(pos, gstate.tokens);
        pos = tocHierarchy[0];
        tocBody += tocHierarchy[1];
      }

      return tocBody;
    } else {
      const result = renderChildsTokens(seen, gstate.tokens);
      seen = result[0] + 1;
      return result[1];
    }
  };

  function renderChildsTokens(pos: any, tokens: any) {
    var headings = [],
      buffer = '',
      currentLevel,
      subHeadings,
      size = tokens.length,
      i = pos;
    while (i < size) {
      var token = tokens[i];
      var heading = tokens[i - 1];
      var level = token.tag && parseInt(token.tag.substr(1, 1));
      if (
        token.type === 'heading_close' &&
        options.includeLevel.indexOf(level) == -1 &&
        currentLevel !== undefined &&
        options.subTOC
      ) {
        break;
      }
      if (token.type !== 'heading_close' || options.includeLevel.indexOf(level) == -1 || heading.type !== 'inline') {
        i++;
        continue; // Skip if not matching criteria
      }
      if (!currentLevel) {
        currentLevel = level; // We init with the first found level
      } else {
        if (level > currentLevel) {
          subHeadings = renderChildsTokens(i, tokens);
          buffer += subHeadings[1];
          i = subHeadings[0];
          continue;
        }
        if (level < currentLevel) {
          // Finishing the sub headings
          buffer += `</li>`;
          headings.push(buffer);
          return [i, `<${options.listType}>${headings.join('')}</${options.listType}>`];
        }
        if (level == currentLevel) {
          // Finishing the sub headings
          buffer += `</li>`;
          headings.push(buffer);
        }
      }
      buffer = `<li><a href="#${options.slugify(heading.content)}">`;
      buffer += typeof options.format === 'function' ? options.format(heading.content) : heading.content;
      buffer += `</a>`;
      i++;
    }
    buffer += buffer === '' ? '' : `</li>`;
    headings.push(buffer);
    return [i, `<${options.listType}>${headings.join('')}</${options.listType}>`];
  }

  // Catch all the tokens for iteration later
  md.core.ruler.push('grab_state', function(state: any) {
    if (gstate === undefined) {
      gstate = state;
    }
  });

  // Insert TOC
  md.inline.ruler.after('emphasis', 'toc', toc);
};
