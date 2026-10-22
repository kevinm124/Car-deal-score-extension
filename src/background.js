// src/background.js – toolbar badge per tab, keyboard command and opening settings.
const TONE_COLORS = { great: '#16a34a', good: '#65a30d', fair: '#ca8a04', caution: '#ea580c', risky: '#dc2626' };

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === 'score' && sender.tab?.id !== undefined) {
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: String(msg.score) });
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: TONE_COLORS[msg.tone] || '#6c8cff' });
  }
  if (msg?.type === 'openOptions') chrome.runtime.openOptionsPage();
});

chrome.commands.onCommand.addListener(async command => {
  if (command !== 'toggle-panel') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'togglePanel' }).catch(() => {});
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('src/popup/popup.html?page=welcome') });
});
