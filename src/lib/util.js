// src/lib/util.js – shared helpers. Every module hangs off the global CDS namespace
// so the same files run in content scripts, the popup and the Node test runner.
var CDS = (typeof globalThis !== 'undefined' ? globalThis : self).CDS || {};
(typeof globalThis !== 'undefined' ? globalThis : self).CDS = CDS;

CDS.util = {
  CURRENT_YEAR: new Date().getFullYear(),

  // "77.950 €" -> 77950, "267000 km" -> 267000
  toInt(str) {
    if (str === null || str === undefined) return null;
    const cleaned = String(str).replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned, 10) : null;
  },

  // "od 6,4 lit. / 100 km" -> 6.4
  toFloat(str) {
    if (!str) return null;
    const m = String(str).match(/(\d+(?:[.,]\d+)?)/);
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  },

  // Uppercase, strip Slovene/European diacritics, collapse whitespace.
  norm(str) {
    if (!str) return '';
    return String(str)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/ /g, ' ')
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .trim();
  },

  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },

  // Piecewise-linear interpolation over sorted [x, y] points.
  interp(x, points) {
    if (x <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) {
      const [x1, y1] = points[i];
      if (x <= x1) {
        const [x0, y0] = points[i - 1];
        return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
      }
    }
    return points[points.length - 1][1];
  },

  median(values) {
    if (!values.length) return null;
    const s = [...values].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  },

  // Slovene grouping ("9.850"); toLocaleString skips the separator for 4-digit numbers.
  num(n) {
    return String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },

  eur(n, { sign = false } = {}) {
    if (n === null || n === undefined || isNaN(n)) return '–';
    const abs = CDS.util.num(n);
    const prefix = n < 0 ? '−' : (sign && n > 0 ? '+' : '');
    return `${prefix}${abs} €`;
  },

  km(n) {
    if (n === null || n === undefined || isNaN(n)) return '–';
    return `${CDS.util.num(n)} km`;
  },

  pct(n, { sign = true } = {}) {
    if (n === null || n === undefined || isNaN(n)) return '–';
    const v = (n * 100).toFixed(Math.abs(n) < 0.1 ? 1 : 0);
    return `${sign && n > 0 ? '+' : ''}${v}%`;
  },

  esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },

  roundTo(n, step) { return Math.round(n / step) * step; },

  timeAgo(ts) {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
    const d = Math.round(h / 24); if (d < 30) return `${d} d ago`;
    return new Date(ts).toLocaleDateString('sl-SI');
  },

  listingIdFromUrl(url) {
    const m = String(url || '').match(/[?&]id=(\d+)/i);
    return m ? m[1] : null;
  }
};
