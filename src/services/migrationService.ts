import { Tab, TabGroup } from '../types';

export interface MigrationResult {
  groups: TabGroup[];
  totalTabs: number;
}

export const parseOneTabExport = (text: string): MigrationResult => {
  const groups: TabGroup[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  if (lines.length === 0) return { groups: [], totalTabs: 0 };

  // OneTab usually exports flat lists of tabs. We'll group them into one "Imported Group"
  // unless there are clear separators (which OneTab sometimes uses as double newlines).
  // For simplicity, we'll split by double newlines or just take the whole thing if it's flat.
  
  const blocks = text.split(/\n\s*\n/).filter(b => b.trim().length > 0);
  let totalTabs = 0;

  blocks.forEach((block, index) => {
    const blockLines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const tabs: Tab[] = blockLines.map(line => {
      // OneTab format: "URL | Title" or just "URL"
      const parts = line.split(' | ');
      const url = parts[0];
      const title = parts[1] || url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      
      return {
        id: Math.random().toString(36).substring(2, 11),
        url,
        title,
        timestamp: Date.now()
      };
    });

    if (tabs.length > 0) {
      groups.push({
        id: `migrated-${Date.now()}-${index}`,
        name: `Imported group ${index + 1}`,
        createdAt: Date.now(),
        tabs,
        isStarred: false,
        isLocked: false,
        tags: ['imported', 'onetab']
      });
      totalTabs += tabs.length;
    }
  });

  return { groups, totalTabs };
};

export const parseJsonExport = (jsonString: string): MigrationResult => {
  try {
    const data = JSON.parse(jsonString);
    let groups: TabGroup[] = [];

    if (Array.isArray(data)) {
      // Check if it's our format or similar
      groups = data.filter(g => g.tabs && Array.isArray(g.tabs));
    } else if (data.groups && Array.isArray(data.groups)) {
      groups = data.groups;
    }

    // Refresh IDs and timestamps to avoid collisions
    const processedGroups = groups.map((g, i) => ({
      ...g,
      id: `json-migrated-${Date.now()}-${i}`,
      createdAt: g.createdAt || Date.now(),
      tabs: g.tabs.map((t: any) => ({
        ...t,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: t.timestamp || Date.now()
      }))
    }));

    return { 
      groups: processedGroups, 
      totalTabs: processedGroups.reduce((acc, g) => acc + g.tabs.length, 0) 
    };
  } catch (e) {
    console.error('JSON parse error during migration', e);
    return { groups: [], totalTabs: 0 };
  }
};
