/*! modernizr 3.6.0 (Custom Build) | MIT *
 * https://modernizr.com/download/?-MessageChannel-cssgrid_cssgridlegacy-indexeddb-postmessage-serviceworker-webworkers !*/
if (typeof window === 'undefined') {
  global.Modernizr = {};
} else {
  !(function(e, n, t) {
    function r(e, n) {
      return typeof e === n;
    }
    function o() {
      var e, n, t, o, i, s, a;
      for (var l in w)
        if (w.hasOwnProperty(l)) {
          if (
            ((e = []),
            (n = w[l]),
            n.name && (e.push(n.name.toLowerCase()), n.options && n.options.aliases && n.options.aliases.length))
          )
            for (t = 0; t < n.options.aliases.length; t++) e.push(n.options.aliases[t].toLowerCase());
          for (o = r(n.fn, 'function') ? n.fn() : n.fn, i = 0; i < e.length; i++)
            (s = e[i]),
              (a = s.split('.')),
              1 === a.length
                ? (Modernizr[a[0]] = o)
                : (!Modernizr[a[0]] ||
                    Modernizr[a[0]] instanceof Boolean ||
                    (Modernizr[a[0]] = new Boolean(Modernizr[a[0]])),
                  (Modernizr[a[0]][a[1]] = o)),
              S.push((o ? '' : 'no-') + a.join('-'));
        }
    }
    function i(e) {
      return e
        .replace(/([a-z])-([a-z])/g, function(e, n, t) {
          return n + t.toUpperCase();
        })
        .replace(/^-/, '');
    }
    function s(e) {
      var n = T.className,
        t = Modernizr._config.classPrefix || '';
      if ((P && (n = n.baseVal), Modernizr._config.enableJSClass)) {
        var r = new RegExp('(^|\\s)' + t + 'no-js(\\s|$)');
        n = n.replace(r, '$1' + t + 'js$2');
      }
      Modernizr._config.enableClasses &&
        ((n += ' ' + t + e.join(' ' + t)), P ? (T.className.baseVal = n) : (T.className = n));
    }
    function a(e, n) {
      if ('object' == typeof e) for (var t in e) b(e, t) && a(t, e[t]);
      else {
        e = e.toLowerCase();
        var r = e.split('.'),
          o = Modernizr[r[0]];
        if ((2 == r.length && (o = o[r[1]]), 'undefined' != typeof o)) return Modernizr;
        (n = 'function' == typeof n ? n() : n),
          1 == r.length
            ? (Modernizr[r[0]] = n)
            : (!Modernizr[r[0]] ||
                Modernizr[r[0]] instanceof Boolean ||
                (Modernizr[r[0]] = new Boolean(Modernizr[r[0]])),
              (Modernizr[r[0]][r[1]] = n)),
          s([(n && 0 != n ? '' : 'no-') + r.join('-')]),
          Modernizr._trigger(e, n);
      }
      return Modernizr;
    }
    function l(e, n) {
      return !!~('' + e).indexOf(n);
    }
    function f() {
      return 'function' != typeof n.createElement
        ? n.createElement(arguments[0])
        : P
          ? n.createElementNS.call(n, 'http://www.w3.org/2000/svg', arguments[0])
          : n.createElement.apply(n, arguments);
    }
    function u(e, n) {
      return function() {
        return e.apply(n, arguments);
      };
    }
    function d(e, n, t) {
      var o;
      for (var i in e) if (e[i] in n) return t === !1 ? e[i] : ((o = n[e[i]]), r(o, 'function') ? u(o, t || n) : o);
      return !1;
    }
    function c(e) {
      return e
        .replace(/([A-Z])/g, function(e, n) {
          return '-' + n.toLowerCase();
        })
        .replace(/^ms-/, '-ms-');
    }
    function p(n, t, r) {
      var o;
      if ('getComputedStyle' in e) {
        o = getComputedStyle.call(e, n, t);
        var i = e.console;
        if (null !== o) r && (o = o.getPropertyValue(r));
        else if (i) {
          var s = i.error ? 'error' : 'log';
          i[s].call(i, 'getComputedStyle returning null, its possible modernizr test results are inaccurate');
        }
      } else o = !t && n.currentStyle && n.currentStyle[r];
      return o;
    }
    function g() {
      var e = n.body;
      return e || ((e = f(P ? 'svg' : 'body')), (e.fake = !0)), e;
    }
    function m(e, t, r, o) {
      var i,
        s,
        a,
        l,
        u = 'modernizr',
        d = f('div'),
        c = g();
      if (parseInt(r, 10)) for (; r--; ) (a = f('div')), (a.id = o ? o[r] : u + (r + 1)), d.appendChild(a);
      return (
        (i = f('style')),
        (i.type = 'text/css'),
        (i.id = 's' + u),
        (c.fake ? c : d).appendChild(i),
        c.appendChild(d),
        i.styleSheet ? (i.styleSheet.cssText = e) : i.appendChild(n.createTextNode(e)),
        (d.id = u),
        c.fake &&
          ((c.style.background = ''),
          (c.style.overflow = 'hidden'),
          (l = T.style.overflow),
          (T.style.overflow = 'hidden'),
          T.appendChild(c)),
        (s = t(d, e)),
        c.fake ? (c.parentNode.removeChild(c), (T.style.overflow = l), T.offsetHeight) : d.parentNode.removeChild(d),
        !!s
      );
    }
    function v(n, r) {
      var o = n.length;
      if ('CSS' in e && 'supports' in e.CSS) {
        for (; o--; ) if (e.CSS.supports(c(n[o]), r)) return !0;
        return !1;
      }
      if ('CSSSupportsRule' in e) {
        for (var i = []; o--; ) i.push('(' + c(n[o]) + ':' + r + ')');
        return (
          (i = i.join(' or ')),
          m('@supports (' + i + ') { #modernizr { position: absolute; } }', function(e) {
            return 'absolute' == p(e, null, 'position');
          })
        );
      }
      return t;
    }
    function h(e, n, o, s) {
      function a() {
        d && (delete L.style, delete L.modElem);
      }
      if (((s = r(s, 'undefined') ? !1 : s), !r(o, 'undefined'))) {
        var u = v(e, o);
        if (!r(u, 'undefined')) return u;
      }
      for (var d, c, p, g, m, h = ['modernizr', 'tspan', 'samp']; !L.style && h.length; )
        (d = !0), (L.modElem = f(h.shift())), (L.style = L.modElem.style);
      for (p = e.length, c = 0; p > c; c++)
        if (((g = e[c]), (m = L.style[g]), l(g, '-') && (g = i(g)), L.style[g] !== t)) {
          if (s || r(o, 'undefined')) return a(), 'pfx' == n ? g : !0;
          try {
            L.style[g] = o;
          } catch (y) {}
          if (L.style[g] != m) return a(), 'pfx' == n ? g : !0;
        }
      return a(), !1;
    }
    function y(e, n, t, o, i) {
      var s = e.charAt(0).toUpperCase() + e.slice(1),
        a = (e + ' ' + z.join(s + ' ') + s).split(' ');
      return r(n, 'string') || r(n, 'undefined')
        ? h(a, n, o, i)
        : ((a = (e + ' ' + j.join(s + ' ') + s).split(' ')), d(a, n, t));
    }
    function _(e, n) {
      var t = e.deleteDatabase(n);
      (t.onsuccess = function() {
        a('indexeddb.deletedatabase', !0);
      }),
        (t.onerror = function() {
          a('indexeddb.deletedatabase', !1);
        });
    }
    function C(e, n, r) {
      return y(e, t, t, n, r);
    }
    var w = [],
      x = {
        _version: '3.6.0',
        _config: { classPrefix: '', enableClasses: !0, enableJSClass: !0, usePrefixes: !0 },
        _q: [],
        on: function(e, n) {
          var t = this;
          setTimeout(function() {
            n(t[e]);
          }, 0);
        },
        addTest: function(e, n, t) {
          w.push({ name: e, fn: n, options: t });
        },
        addAsyncTest: function(e) {
          w.push({ name: null, fn: e });
        },
      },
      Modernizr = function() {};
    (Modernizr.prototype = x),
      (Modernizr = new Modernizr()),
      Modernizr.addTest('messagechannel', 'MessageChannel' in e),
      Modernizr.addTest('postmessage', 'postMessage' in e),
      Modernizr.addTest('serviceworker', 'serviceWorker' in navigator),
      Modernizr.addTest('webworkers', 'Worker' in e);
    var b,
      S = [];
    !(function() {
      var e = {}.hasOwnProperty;
      b =
        r(e, 'undefined') || r(e.call, 'undefined')
          ? function(e, n) {
              return n in e && r(e.constructor.prototype[n], 'undefined');
            }
          : function(n, t) {
              return e.call(n, t);
            };
    })();
    var T = n.documentElement,
      P = 'svg' === T.nodeName.toLowerCase();
    (x._l = {}),
      (x.on = function(e, n) {
        this._l[e] || (this._l[e] = []),
          this._l[e].push(n),
          Modernizr.hasOwnProperty(e) &&
            setTimeout(function() {
              Modernizr._trigger(e, Modernizr[e]);
            }, 0);
      }),
      (x._trigger = function(e, n) {
        if (this._l[e]) {
          var t = this._l[e];
          setTimeout(function() {
            var e, r;
            for (e = 0; e < t.length; e++) (r = t[e])(n);
          }, 0),
            delete this._l[e];
        }
      }),
      Modernizr._q.push(function() {
        x.addTest = a;
      });
    var E = 'Moz O ms Webkit',
      z = x._config.usePrefixes ? E.split(' ') : [];
    x._cssomPrefixes = z;
    var k = function(n) {
      var r,
        o = prefixes.length,
        i = e.CSSRule;
      if ('undefined' == typeof i) return t;
      if (!n) return !1;
      if (((n = n.replace(/^@/, '')), (r = n.replace(/-/g, '_').toUpperCase() + '_RULE'), r in i)) return '@' + n;
      for (var s = 0; o > s; s++) {
        var a = prefixes[s],
          l = a.toUpperCase() + '_' + r;
        if (l in i) return '@-' + a.toLowerCase() + '-' + n;
      }
      return !1;
    };
    x.atRule = k;
    var j = x._config.usePrefixes ? E.toLowerCase().split(' ') : [];
    x._domPrefixes = j;
    var N = { elem: f('modernizr') };
    Modernizr._q.push(function() {
      delete N.elem;
    });
    var L = { style: N.elem.style };
    Modernizr._q.unshift(function() {
      delete L.style;
    }),
      (x.testAllProps = y);
    var O = (x.prefixed = function(e, n, t) {
      return 0 === e.indexOf('@') ? k(e) : (-1 != e.indexOf('-') && (e = i(e)), n ? y(e, n, t) : y(e, 'pfx'));
    });
    Modernizr.addAsyncTest(function() {
      var n;
      try {
        n = O('indexedDB', e);
      } catch (t) {}
      if (n) {
        var r = 'modernizr-' + Math.random(),
          o = n.open(r);
        (o.onerror = function() {
          o.error && 'InvalidStateError' === o.error.name ? a('indexeddb', !1) : (a('indexeddb', !0), _(n, r));
        }),
          (o.onsuccess = function() {
            a('indexeddb', !0), _(n, r);
          });
      } else a('indexeddb', !1);
    }),
      (x.testAllProps = C),
      Modernizr.addTest('cssgridlegacy', C('grid-columns', '10px', !0)),
      Modernizr.addTest('cssgrid', C('grid-template-rows', 'none', !0)),
      o(),
      delete x.addTest,
      delete x.addAsyncTest;
    for (var A = 0; A < Modernizr._q.length; A++) Modernizr._q[A]();
    e.Modernizr = Modernizr;
  })(window, document);
}
