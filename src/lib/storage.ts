import { TabGroup } from '../types';

const LOCAL_STORAGE_KEY = 'lorapok_tabman_groups';

export const getLocalGroups = (): TabGroup[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse local groups', e);
    return [];
  }
};

export const saveLocalGroups = (groups: TabGroup[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(groups));
};

export const addGroup = (groups: TabGroup[], newGroup: TabGroup): TabGroup[] => {
  const updated = [newGroup, ...groups];
  saveLocalGroups(updated);
  return updated;
};

export const deleteGroup = (groups: TabGroup[], groupId: string): TabGroup[] => {
  const updated = groups.filter(g => g.id !== groupId);
  saveLocalGroups(updated);
  return updated;
};

export const updateGroup = (groups: TabGroup[], updatedGroup: TabGroup): TabGroup[] => {
  const updated = groups.map(g => g.id === updatedGroup.id ? updatedGroup : g);
  saveLocalGroups(updated);
  return updated;
};
