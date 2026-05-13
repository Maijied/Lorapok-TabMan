/**
 * Lorapok TabMan Background Script
 */

// ⚠️  CONFIGURE BEFORE PUBLISHING ⚠️
// Replace this URL with your actual deployed dashboard URL before submitting to AMO.
// Example: "https://yourusername.github.io/lorapok-tabman/dashboard"
const DASHBOARD_URL = "https://your-github-io-url/dashboard";

// ---------------------------------------------------------------------------
// Tab Snooze System
// ---------------------------------------------------------------------------

/**
 * Pure function — determines whether a tab should be snoozed.
 * Exported for unit testing.
 * @param {number} lastActive - Unix ms timestamp of last activity
 * @param {number} now        - Current Unix ms timestamp
 * @param {number} thresholdMs - Inactivity threshold in milliseconds
 * @returns {boolean}
 */
function shouldSnooze(lastActive, now, thresholdMs) {
  return (now - lastActive) >= thresholdMs;
}

/**
 * Records the current time as the last-active timestamp for a tab.
 * @param {number} tabId
 */
async function updateLastActive(tabId) {
  const { lastActiveMap = {} } = await browser.storage.local.get('lastActiveMap');
  lastActiveMap[String(tabId)] = Date.now();
  await browser.storage.local.set({ lastActiveMap });
}

/**
 * Removes a tab from the last-active map (called when a tab is closed).
 * @param {number} tabId
 */
async function removeFromLastActiveMap(tabId) {
  const { lastActiveMap = {} } = await browser.storage.local.get('lastActiveMap');
  delete lastActiveMap[String(tabId)];
  await browser.storage.local.set({ lastActiveMap });
}

// Reset inactivity timer when the user switches to a tab
browser.tabs.onActivated.addListener(({ tabId }) => {
  updateLastActive(tabId);
});

// Reset inactivity timer when a tab finishes loading (navigation)
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    updateLastActive(tabId);
  }
});

// Clean up map entry when a tab is closed
browser.tabs.onRemoved.addListener((tabId) => {
  removeFromLastActiveMap(tabId);
});

// Create a repeating alarm that fires every minute to check for inactive tabs
browser.alarms.create('snoozeCheck', { periodInMinutes: 1 });

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'snoozeCheck') return;

  const { snoozeTimeoutMinutes = 30, lastActiveMap = {} } =
    await browser.storage.local.get(['snoozeTimeoutMinutes', 'lastActiveMap']);

  const thresholdMs = snoozeTimeoutMinutes * 60 * 1000;
  const now = Date.now();

  // Only consider tabs that are not already discarded and not pinned
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
// Tab Collapse (existing functionality)
// ---------------------------------------------------------------------------

browser.action.onClicked.addListener(async (tab) => {
  // Query all tabs in the current window except pinned ones
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

  // Save to local storage
  const storage = await browser.storage.local.get("groups");
  const groups = storage.groups || [];
  await browser.storage.local.set({ groups: [newGroup, ...groups] });

  // Close the tabs
  const tabIds = tabs.map(t => t.id).filter(id => id !== undefined);
  await browser.tabs.remove(tabIds);

  // Open the TabMan dashboard
  browser.tabs.create({ url: DASHBOARD_URL });
});
