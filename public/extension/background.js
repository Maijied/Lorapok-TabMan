/**
 * Lorapok TabMan Background Script
 * Manifest V2 — uses browser.browserAction (not browser.action)
 */

// ⚠️  CONFIGURE BEFORE PUBLISHING ⚠️
// Replace this URL with your actual deployed dashboard URL before submitting to AMO.
// Example: "https://maijied.github.io/Lorapok-TabMan/#/dashboard"
const DASHBOARD_URL = "https://maijied.github.io/Lorapok-TabMan/#/dashboard";

// ---------------------------------------------------------------------------
// Tab Snooze System
// ---------------------------------------------------------------------------

/**
 * Pure function — determines whether a tab should be snoozed.
 * @param {number} lastActive - Unix ms timestamp of last activity
 * @param {number} now        - Current Unix ms timestamp
 * @param {number} thresholdMs - Inactivity threshold in milliseconds
 * @returns {boolean}
 */
function shouldSnooze(lastActive, now, thresholdMs) {
  return (now - lastActive) >= thresholdMs;
}

async function updateLastActive(tabId) {
  const { lastActiveMap = {} } = await browser.storage.local.get('lastActiveMap');
  lastActiveMap[String(tabId)] = Date.now();
  await browser.storage.local.set({ lastActiveMap });
}

async function removeFromLastActiveMap(tabId) {
  const { lastActiveMap = {} } = await browser.storage.local.get('lastActiveMap');
  delete lastActiveMap[String(tabId)];
  await browser.storage.local.set({ lastActiveMap });
}

browser.tabs.onActivated.addListener(({ tabId }) => {
  updateLastActive(tabId);
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    updateLastActive(tabId);
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  removeFromLastActiveMap(tabId);
});

browser.alarms.create('snoozeCheck', { periodInMinutes: 1 });

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'snoozeCheck') return;

  const { snoozeTimeoutMinutes = 30, lastActiveMap = {} } =
    await browser.storage.local.get(['snoozeTimeoutMinutes', 'lastActiveMap']);

  const thresholdMs = snoozeTimeoutMinutes * 60 * 1000;
  const now = Date.now();
  const tabs = await browser.tabs.query({ discarded: false, pinned: false });

  for (const tab of tabs) {
    if (!tab.id) continue;
    const lastActive = lastActiveMap[String(tab.id)] ?? now;
    if (shouldSnooze(lastActive, now, thresholdMs)) {
      await browser.tabs.discard(tab.id);
    }
  }
});

// ---------------------------------------------------------------------------
// Tab Collapse — MV2 uses browser.browserAction (not browser.action)
// ---------------------------------------------------------------------------

browser.browserAction.onClicked.addListener(async () => {
  const tabs = await browser.tabs.query({ currentWindow: true, pinned: false });

  if (tabs.length === 0) return;

  const tabData = tabs.map(t => ({
    id: crypto.randomUUID(),
    title: t.title || "Untitled",
    url: t.url || "",
    favIconUrl: t.favIconUrl,
    timestamp: Date.now()
  }));

  const newGroup = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    tabs: tabData,
    isStarred: false,
    isLocked: false
  };

  const storage = await browser.storage.local.get("groups");
  const groups = storage.groups || [];
  const updatedGroups = [newGroup, ...groups];
  await browser.storage.local.set({ groups: updatedGroups });

  const tabIds = tabs.map(t => t.id).filter(id => id !== undefined);
  await browser.tabs.remove(tabIds);

  const dashTab = await browser.tabs.create({ url: DASHBOARD_URL });

  // Sync groups to localStorage so the dashboard web page can read them.
  // The dashboard reads from localStorage (key: 'lorapok_tabman_groups') for
  // guest sessions. Since it's a web page (not an extension page) it cannot
  // access browser.storage.local directly, so we inject the data via a
  // content script once the tab finishes loading.
  const groupsJson = JSON.stringify(updatedGroups);
  function onTabUpdated(tabId, changeInfo) {
    if (tabId !== dashTab.id || changeInfo.status !== 'complete') return;
    browser.tabs.onUpdated.removeListener(onTabUpdated);
    browser.tabs.executeScript(dashTab.id, {
      code: `localStorage.setItem('lorapok_tabman_groups', ${JSON.stringify(groupsJson)});`
    }).catch(() => {
      // executeScript may fail if the tab navigated away — safe to ignore
    });
  }
  browser.tabs.onUpdated.addListener(onTabUpdated);
});
