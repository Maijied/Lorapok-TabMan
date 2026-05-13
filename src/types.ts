/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tab {
  id: string;
  title: string;
  url: string;
  favIconUrl?: string;
  timestamp: number;
  tags?: string[];
  isSnoozed?: boolean;
}

export interface TabGroup {
  id: string;
  name?: string;
  createdAt: number;
  updatedAt?: any;
  tabs: Tab[];
  isStarred: boolean;
  isLocked: boolean;
  isArchived?: boolean;
  tags?: string[];
}

export interface SavedView {
  id: string;
  name: string;
  searchQuery: string;
  sortBy: 'createdAt' | 'updatedAt' | 'name';
  activeView: 'groups' | 'analytics' | 'archive' | 'settings' | 'help';
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  lastSync?: number;
  autoArchiveEnabled?: boolean;
  autoArchiveDays?: number;
  theme?: string;
  accentColor?: string;
  excludedDomains?: string[];
  openOnStartup?: 'auto' | 'manual';
  restoreBehavior?: 'remove' | 'keep' | 'archive';
  toolbarClickBehavior?: 'all' | 'single' | 'popup';
  allowDuplicates?: boolean;
}
