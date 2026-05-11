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
}

export interface TabGroup {
  id: string;
  name?: string;
  createdAt: number;
  updatedAt?: any;
  tabs: Tab[];
  isStarred: boolean;
  isLocked: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  lastSync?: number;
}
