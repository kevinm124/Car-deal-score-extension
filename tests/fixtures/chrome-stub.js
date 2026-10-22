// tests/fixtures/chrome-stub.js – minimal chrome.* API so the content scripts run in a plain page.
(() => {
  const ROOT = new URL('../../', document.currentScript.src).href;
  const mem = { sync: {}, local: {} };
  const area = name => ({
    get: async keys => {
      const ks = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(mem[name]);
      return Object.fromEntries(ks.filter(k => k in mem[name]).map(k => [k, structuredClone(mem[name][k])]));
    },
    set: async obj => { Object.assign(mem[name], structuredClone(obj)); }
  });
  window.chrome = {
    runtime: { getURL: p => ROOT + p, sendMessage: async () => {}, onMessage: { addListener() {} } },
    storage: { sync: area('sync'), local: area('local'), onChanged: { addListener() {} } },
    extension: { getViews: () => [] }
  };
  window.__dealscoreMem = mem;
})();
