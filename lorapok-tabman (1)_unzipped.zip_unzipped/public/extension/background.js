/**
 * Lorapok Tabman Background Script
 */

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

  // Open the manager page
  // In a real extension, this would be a relative URL like "manager.html"
  // Here we assume the user can visit the Lorapok Tabman website
  browser.tabs.create({ url: "https://your-github-io-url/dashboard" });
});
