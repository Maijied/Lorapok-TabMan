import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, Search, Filter, Star, Lock, Trash2, 
  ExternalLink, Plus, RefreshCw, LogIn, User as UserIcon,
  Globe, Clock, MoreHorizontal, ChevronRight,
  Monitor, Info, LogOut, Download, Settings, Tag, X,
  BarChart3, PieChart as PieChartIcon, TrendingUp, Zap, Archive, History,
  Cloud, CloudOff, AlertCircle, CheckCircle2,
  Bookmark, BookmarkPlus, Save, BookmarkCheck, Keyboard,
  Share2, Copy, Trash, Linkedin, Twitter, Mail, MessageSquare, UserCheck,
  Github, Instagram, Facebook, ExternalLink as ExternalLinkIcon2, Send, Phone
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { parseOneTabExport, parseJsonExport } from '../services/migrationService';
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from '../lib/firebase';
import { TabGroup, Tab, SavedView } from '../types';
import { getLocalGroups, saveLocalGroups, addGroup, deleteGroup, updateGroup } from '../lib/storage';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { cn } from '../lib/utils';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';

const THEMES = [
  { id: 'default', name: 'Navy & Sky', main: '#030711', card: '#0a0f1a', accent: '#38bdf8' },
  { id: 'emerald', name: 'Deep Emerald', main: '#022c22', card: '#064e3b', accent: '#10b981' },
  { id: 'rose', name: 'Rose Wine', main: '#4c0519', card: '#831843', accent: '#fb7185' },
  { id: 'indigo', name: 'Midnight Violet', main: '#1e1b4b', card: '#312e81', accent: '#818cf8' },
  { id: 'cyber', name: 'Cyberpunk', main: '#000000', card: '#111111', accent: '#facc15' },
  { id: 'slate', name: 'Modern Mono', main: '#0f172a', card: '#1e293b', accent: '#94a3b8' },
];

export default function Dashboard() {
  const [groups, setGroups] = useState<TabGroup[]>([]);
  const [excludedDomains, setExcludedDomains] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [dismissSyncError, setDismissSyncError] = useState(false);

  // Auth form state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeView, setActiveView] = useState<'groups' | 'analytics' | 'archive' | 'settings' | 'help'>('groups');
  const [autoArchiveEnabled, setAutoArchiveEnabled] = useState(false);
  const [autoArchiveDays, setAutoArchiveDays] = useState(30);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [currentAccent, setCurrentAccent] = useState('#38bdf8');
  const [openOnStartup, setOpenOnStartup] = useState<'auto' | 'manual'>('manual');
  const [restoreBehavior, setRestoreBehavior] = useState<'remove' | 'keep' | 'archive'>('remove');
  const [toolbarClickBehavior, setToolbarClickBehavior] = useState<'all' | 'single' | 'popup'>('all');
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ count: number, groups: number } | null>(null);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'name'>('createdAt');
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTagValue, setBulkTagValue] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [snoozeTimeoutMinutes, setSnoozeTimeoutMinutes] = useState(30);

  const searchRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Saved Views state
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [viewName, setViewName] = useState('');

  // Load snooze timeout from browser.storage.local on mount
  useEffect(() => {
    if (typeof browser !== 'undefined') {
      browser.storage.local.get('snoozeTimeoutMinutes').then((result: Record<string, any>) => {
        if (result.snoozeTimeoutMinutes !== undefined) {
          setSnoozeTimeoutMinutes(result.snoozeTimeoutMinutes);
        }
      }).catch(() => {});
    }
  }, []);

  const handleImport = async (type: 'json' | 'onetab', content: string) => {
    setIsImporting(true);
    try {
      const { groups: importedGroups, totalTabs } = type === 'json' ? parseJsonExport(content) : parseOneTabExport(content);
      
      if (importedGroups.length === 0) {
        setSyncError('No valid data found in import');
        return;
      }

      if (user) {
        // Firebase Batch Import
        const batchSize = 10; // Batch limit per write for safety
        for (let i = 0; i < importedGroups.length; i += batchSize) {
          const batch = writeBatch(db);
          const chunk = importedGroups.slice(i, i + batchSize);
          
          chunk.forEach(group => {
            const groupRef = doc(collection(db, `users/${user.uid}/groups`), group.id);
            batch.set(groupRef, {
              ...group,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          });
          
          await batch.commit();
        }
      } else {
        // Local Only Import
        let currentGroups = getLocalGroups();
        importedGroups.forEach(g => {
          currentGroups = addGroup(currentGroups, g);
        });
        setGroups(currentGroups);
      }

      setImportResult({ count: totalTabs, groups: importedGroups.length });
      setTimeout(() => setImportResult(null), 5000);
    } catch (error) {
      console.error('Import failed', error);
      setSyncError('Import failed: invalid format');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(groups, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lorapok-tabman-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopySuccess('Data exported successfully');
    setTimeout(() => setCopySuccess(null), 3000);
  };

  // Theme Application
  useEffect(() => {
    const root = document.documentElement;
    const theme = THEMES.find(t => t.id === currentTheme) || THEMES[0];
    const accent = currentTheme === 'custom' ? currentAccent : theme.accent;

    root.style.setProperty('--accent-color', accent);
    root.style.setProperty('--background-main', theme.main);
    root.style.setProperty('--background-card', theme.card);
    
    // Calculate soft/border colors
    const r = parseInt(accent.slice(1, 3), 16);
    const g = parseInt(accent.slice(3, 5), 16);
    const b = parseInt(accent.slice(5, 7), 16);
    
    root.style.setProperty('--accent-soft-color', `rgba(${r}, ${g}, ${b}, 0.1)`);
    root.style.setProperty('--accent-border-color', `rgba(${r}, ${g}, ${b}, 0.2)`);
  }, [currentTheme, currentAccent]);

  // Online status listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissSyncError(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setDismissSyncError(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setNewDisplayName(currentUser.displayName || '');
        
        // Fetch profile settings
        const profilePath = `users/${currentUser.uid}`;
        try {
          const profileSnap = await getDoc(doc(db, profilePath));
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            setAutoArchiveEnabled(profileData.autoArchiveEnabled || false);
            setAutoArchiveDays(profileData.autoArchiveDays || 30);
            setExcludedDomains(profileData.excludedDomains || []);
            setCurrentTheme(profileData.theme || 'default');
            setCurrentAccent(profileData.accentColor || '#38bdf8');
            setOpenOnStartup(profileData.openOnStartup || 'manual');
            setRestoreBehavior(profileData.restoreBehavior || 'remove');
            setToolbarClickBehavior(profileData.toolbarClickBehavior || 'all');
            setAllowDuplicates(profileData.allowDuplicates !== undefined ? profileData.allowDuplicates : true);
          }
        } catch (error) {
          console.error("Error fetching profile", error);
        }
      } else {
        setGroups(getLocalGroups());
        setLastSynced(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync Listener
  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);
    const q = query(
      collection(db, `users/${user.uid}/groups`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteGroups = snapshot.docs.map(doc => doc.data() as TabGroup);
      setGroups(remoteGroups);
      saveLocalGroups(remoteGroups);
      setLastSynced(Date.now());
      setIsSyncing(false);
      setSyncError(null);
      
      // Show success briefly
      setShowSyncSuccess(true);
      setTimeout(() => setShowSyncSuccess(false), 3000);
    }, (error) => {
      setSyncError(error.code === 'unavailable' ? 'Connection Failed' : 'Sync Error');
      setDismissSyncError(false);
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/groups`);
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Saved Views Listener
  useEffect(() => {
    if (!user) {
      setSavedViews([]);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/views`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteViews = snapshot.docs.map(doc => doc.data() as SavedView);
      setSavedViews(remoteViews);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/views`);
    });

    return () => unsubscribe();
  }, [user]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      const key = e.key.toLowerCase();

      // View Switching
      if (key === 'g') setActiveView('groups');
      if (key === 'a') setActiveView('analytics');
      if (key === 'r') setActiveView('archive');

      // Search Focus
      if (key === '/' || key === 's') {
        e.preventDefault();
        searchRef.current?.focus();
      }

      // Help Modal
      if (e.key === '?') {
        setShowHelpModal(prev => !prev);
      }

      // Action: Bulk Tag
      if (key === 't' && selectedGroupIds.size > 0) {
        setShowBulkTagModal(true);
      }

      // Action: Delete Selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGroupIds.size > 0) {
        handleDeleteSelected();
      }

      // Deselection / Closing
      if (e.key === 'Escape') {
        if (showSettingsModal) setShowSettingsModal(false);
        if (showAuthModal) setShowAuthModal(false);
        if (showSaveViewModal) setShowSaveViewModal(false);
        if (showBulkTagModal) setShowBulkTagModal(false);
        if (showHelpModal) setShowHelpModal(false);
        if (selectedGroupIds.size > 0) setSelectedGroupIds(new Set());
        if (searchQuery) setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedGroupIds, 
    showSettingsModal, 
    showAuthModal, 
    showSaveViewModal, 
    showBulkTagModal, 
    showHelpModal, 
    searchQuery
  ]);

  // Auto-Archive Logic
  useEffect(() => {
    if (autoArchiveEnabled && groups.length > 0 && user) {
      const now = Date.now();
      const threshold = autoArchiveDays * 24 * 60 * 60 * 1000;
      
      const groupsToArchive = groups.filter(g => {
        if (g.isArchived) return false;
        const lastActivity = g.updatedAt?.toMillis ? g.updatedAt.toMillis() : (typeof g.updatedAt === 'number' ? g.updatedAt : g.createdAt);
        return (now - lastActivity) > threshold;
      });

      if (groupsToArchive.length > 0) {
        console.log(`Auto-archiving ${groupsToArchive.length} groups`);
        groupsToArchive.forEach(async (g) => {
          const path = `users/${user.uid}/groups/${g.id}`;
          try {
            await updateDoc(doc(db, path), { 
              isArchived: true,
              updatedAt: serverTimestamp() 
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.UPDATE, path);
          }
        });
      }
    }
  }, [groups, autoArchiveEnabled, autoArchiveDays, user]);

  const handleLogin = async () => {
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (error) {
      console.error('Login failed', error);
      setAuthError('Google sign-in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create initial profile
        const profilePath = `users/${userCredential.user.uid}`;
        try {
          await setDoc(doc(db, profilePath), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            createdAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, profilePath);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (error: any) {
      console.error('Auth failed', error);
      setAuthError(error.message.replace('Firebase: ', ''));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUpdatingProfile(true);
    setAuthError(null);

    try {
      // Update Auth Profile
      await updateProfile(user, { displayName: newDisplayName });
      
      // Update Firestore Profile
      const path = `users/${user.uid}`;
      try {
        await updateDoc(doc(db, path), {
          displayName: newDisplayName,
          autoArchiveEnabled,
          autoArchiveDays,
          excludedDomains,
          theme: currentTheme,
          accentColor: currentAccent,
          openOnStartup,
          restoreBehavior,
          toolbarClickBehavior,
          allowDuplicates,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      
      setShowSettingsModal(false);
      // Force user state update locally (auth object is updated but we might need to refresh view)
      setUser({ ...user, displayName: newDisplayName } as User);

      // Persist snooze timeout to browser.storage.local
      if (typeof browser !== 'undefined') {
        browser.storage.local.set({ snoozeTimeoutMinutes }).catch(() => {});
      }
    } catch (error: any) {
      console.error('Update profile failed', error);
      setAuthError(error.message.replace('Firebase: ', ''));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const handleSimulateCollapse = async () => {
    const tabPool: Tab[] = [
      { id: crypto.randomUUID(), title: 'Google AI Studio', url: 'https://aistudio.google.com', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'React Documentation', url: 'https://react.dev', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'Tailwind CSS Tips', url: 'https://tailwindcss.com', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'GitHub - Lorapok/TabMan', url: 'https://github.com/lorapok/tabman', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'MDN Web Docs', url: 'https://developer.mozilla.org', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'Vite Documentation', url: 'https://vitejs.dev', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'Firebase Console', url: 'https://console.firebase.google.com', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'Stack Overflow', url: 'https://stackoverflow.com', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'Framer Motion Docs', url: 'https://www.framer.com/motion', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'Lucide Icons', url: 'https://lucide.dev', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'Can I Use', url: 'https://caniuse.com', timestamp: Date.now() },
    ];

    const tagSets = [
      ['productivity', 'work'],
      ['research', 'dev'],
      ['design', 'ui'],
      ['docs', 'reference'],
      ['tools', 'dev'],
    ];

    const groupNames = [
      'Dev Session',
      'Research Tabs',
      'Design Sprint',
      'Quick Reference',
      'Work Tabs',
    ];

    // Pick a random subset of 3–6 tabs
    const shuffled = tabPool.sort(() => Math.random() - 0.5);
    const count = 3 + Math.floor(Math.random() * 4); // 3 to 6
    const dummyTabs = shuffled.slice(0, count).map(t => ({ ...t, id: crypto.randomUUID() }));

    const randomIndex = Math.floor(Math.random() * groupNames.length);

    const newGroup: TabGroup = {
      id: crypto.randomUUID(),
      name: `${groupNames[randomIndex]} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      createdAt: Date.now(),
      tabs: dummyTabs,
      isStarred: false,
      isLocked: false,
      tags: tagSets[randomIndex],
    };

    if (user) {
      setIsSyncing(true);
      const path = `users/${user.uid}/groups/${newGroup.id}`;
      try {
        await setDoc(doc(db, path), newGroup);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      } finally {
        setIsSyncing(false);
      }
    } else {
      const updated = addGroup(groups, newGroup);
      setGroups(updated);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (user) {
      setIsSyncing(true);
      const path = `users/${user.uid}/groups/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      } finally {
        setIsSyncing(false);
      }
    } else {
      const updated = deleteGroup(groups, id);
      setGroups(updated);
    }
  };

  const toggleStar = async (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      if (user) {
        setIsSyncing(true);
        const path = `users/${user.uid}/groups/${id}`;
        try {
          await updateDoc(doc(db, path), { 
            isStarred: !group.isStarred,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        } finally {
          setIsSyncing(false);
        }
      } else {
        const updated = updateGroup(groups, { ...group, isStarred: !group.isStarred });
        setGroups(updated);
      }
    }
  };

  const toggleArchive = async (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      if (user) {
        setIsSyncing(true);
        const path = `users/${user.uid}/groups/${id}`;
        try {
          await updateDoc(doc(db, path), { 
            isArchived: !group.isArchived,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        } finally {
          setIsSyncing(false);
        }
      } else {
        const updated = updateGroup(groups, { ...group, isArchived: !group.isArchived });
        setGroups(updated);
      }
    }
  };

  const toggleLock = async (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      if (user) {
        setIsSyncing(true);
        const path = `users/${user.uid}/groups/${id}`;
        try {
          await updateDoc(doc(db, path), { 
            isLocked: !group.isLocked,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        } finally {
          setIsSyncing(false);
        }
      } else {
        const updated = updateGroup(groups, { ...group, isLocked: !group.isLocked });
        setGroups(updated);
      }
    }
  };

  const handleUpdateName = async (id: string, name: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      if (user) {
        setIsSyncing(true);
        const path = `users/${user.uid}/groups/${id}`;
        try {
          await updateDoc(doc(db, path), { 
            name,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        } finally {
          setIsSyncing(false);
        }
      } else {
        const updated = updateGroup(groups, { ...group, name });
        setGroups(updated);
      }
    }
  };

  const handleDeleteTab = async (groupId: string, tabId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    if (group.isLocked) {
      alert("This group is locked. Unlock it to delete tabs.");
      return;
    }

    const updatedTabs = group.tabs.filter(t => t.id !== tabId);
    
    if (updatedTabs.length === 0) {
      handleDeleteGroup(groupId);
      return;
    }

    if (user) {
      setIsSyncing(true);
      const path = `users/${user.uid}/groups/${groupId}`;
      try {
        await updateDoc(doc(db, path), { 
          tabs: updatedTabs,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setIsSyncing(false);
      }
    } else {
      const updated = updateGroup(groups, { ...group, tabs: updatedTabs });
      setGroups(updated);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedGroupIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGroupIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedGroupIds.size === filteredGroups.length) {
      setSelectedGroupIds(new Set());
    } else {
      setSelectedGroupIds(new Set(filteredGroups.map(g => g.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedGroupIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedGroupIds.size} groups?`)) return;

    const idsToDelete = Array.from(selectedGroupIds);
    const lockedGroups = groups.filter(g => idsToDelete.includes(g.id) && g.isLocked);
    
    if (lockedGroups.length > 0) {
      alert(`${lockedGroups.length} groups are locked and won't be deleted.`);
    }

    const finalIds = idsToDelete.filter(id => !groups.find(g => g.id === id)?.isLocked);

    if (user) {
      setIsSyncing(true);
      try {
        for (const id of finalIds) {
          const path = `users/${user.uid}/groups/${id}`;
          await deleteDoc(doc(db, path));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, "batch");
      } finally {
        setIsSyncing(false);
      }
    } else {
      let updated = [...groups];
      for (const id of finalIds) {
        updated = deleteGroup(updated, id);
      }
      setGroups(updated);
    }
    setSelectedGroupIds(new Set());
  };

  const handleRestoreSelected = () => {
    if (selectedGroupIds.size === 0) return;
    const ids = Array.from(selectedGroupIds);
    const groupsToRestore = groups.filter(g => ids.includes(g.id));
    
    groupsToRestore.forEach(g => {
      g.tabs.forEach(t => {
        window.open(t.url, '_blank');
      });
    });
    
    alert(`Attempted to open all tabs from ${groupsToRestore.length} groups. (Browser may block popups)`);
  };

  const handleRestoreGroup = async (groupId: string, mode: 'all-and-delete' | 'all-and-keep' | 'one-by-one') => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    if (mode === 'one-by-one') {
      group.tabs.forEach((t, i) => {
        setTimeout(() => window.open(t.url, '_blank'), i * 300);
      });
    } else {
      group.tabs.forEach(t => window.open(t.url, '_blank'));
    }

    if (mode === 'all-and-delete' && !group.isLocked) {
      handleDeleteGroup(groupId);
    }
  };

  const handleShareGroup = (group: TabGroup) => {
    const markdown = `# ${group.name || 'Tab Group'}\n\n` + 
      group.tabs.map(t => `- [${t.title}](${t.url})`).join('\n');
    
    navigator.clipboard.writeText(markdown).then(() => {
      setCopySuccess(`Exported ${group.name || 'Group'} to Markdown!`);
      setTimeout(() => setCopySuccess(null), 3000);
    });
  };

  const handleDeduplicateGroup = async (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const uniqueTabs = [];
    const urls = new Set();
    
    for (const tab of group.tabs) {
      if (!urls.has(tab.url)) {
        urls.add(tab.url);
        uniqueTabs.push(tab);
      }
    }

    if (uniqueTabs.length === group.tabs.length) {
      setCopySuccess("No duplicates found in this group.");
      setTimeout(() => setCopySuccess(null), 2000);
      return;
    }

    if (user) {
      const path = `users/${user.uid}/groups/${groupId}`;
      await updateDoc(doc(db, path), { tabs: uniqueTabs, updatedAt: serverTimestamp() });
    } else {
      setGroups(groups.map(g => g.id === groupId ? { ...g, tabs: uniqueTabs } : g));
    }
    
    setCopySuccess(`Removed ${group.tabs.length - uniqueTabs.length} duplicate tabs!`);
    setTimeout(() => setCopySuccess(null), 3000);
  };

  const handleExportGroups = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(groups, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `lorapok_tabman_export_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportGroups = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as TabGroup[];
        if (!Array.isArray(imported)) throw new Error("Invalid format");

        if (user) {
          setIsSyncing(true);
          try {
            for (const group of imported) {
              const path = `users/${user.uid}/groups/${group.id}`;
              await setDoc(doc(db, path), group);
            }
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, "import");
          } finally {
            setIsSyncing(false);
          }
        } else {
          let updated = [...groups];
          for (const group of imported) {
            if (!updated.some(g => g.id === group.id)) {
              updated = addGroup(updated, group);
            }
          }
          setGroups(updated);
        }
        alert("Import successful!");
      } catch (err) {
        console.error("Failed to import", err);
        alert("Failed to import. Please ensure the file is a valid Lorapok TabMan export.");
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleAddTag = async (groupId: string, tag: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const currentTags = group.tags || [];
    if (currentTags.includes(tag)) return;

    const updatedTags = [...currentTags, tag];

    if (user) {
      setIsSyncing(true);
      const path = `users/${user.uid}/groups/${groupId}`;
      try {
        await updateDoc(doc(db, path), { 
          tags: updatedTags,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setIsSyncing(false);
      }
    } else {
      const updated = updateGroup(groups, { ...group, tags: updatedTags });
      setGroups(updated);
    }
  };

  const handleRemoveTag = async (groupId: string, tag: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const currentTags = group.tags || [];
    const updatedTags = currentTags.filter(t => t !== tag);

    if (user) {
      setIsSyncing(true);
      const path = `users/${user.uid}/groups/${groupId}`;
      try {
        await updateDoc(doc(db, path), { 
          tags: updatedTags,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setIsSyncing(false);
      }
    } else {
      const updated = updateGroup(groups, { ...group, tags: updatedTags });
      setGroups(updated);
    }
  };

  const handleAddTabTag = async (groupId: string, tabId: string, tag: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const updatedTabs = group.tabs.map(t => {
      if (t.id === tabId) {
        const currentTags = t.tags || [];
        if (currentTags.includes(tag)) return t;
        return { ...t, tags: [...currentTags, tag.toLowerCase()] };
      }
      return t;
    });

    if (user) {
      setIsSyncing(true);
      const path = `users/${user.uid}/groups/${groupId}`;
      try {
        await updateDoc(doc(db, path), { 
          tabs: updatedTabs,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setIsSyncing(false);
      }
    } else {
      const updated = updateGroup(groups, { ...group, tabs: updatedTabs });
      setGroups(updated);
    }
  };

  const handleRemoveTabTag = async (groupId: string, tabId: string, tag: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const updatedTabs = group.tabs.map(t => {
      if (t.id === tabId) {
        const currentTags = t.tags || [];
        return { ...t, tags: currentTags.filter(tg => tg !== tag) };
      }
      return t;
    });

    if (user) {
      setIsSyncing(true);
      const path = `users/${user.uid}/groups/${groupId}`;
      try {
        await updateDoc(doc(db, path), { 
          tabs: updatedTabs,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setIsSyncing(false);
      }
    } else {
      const updated = updateGroup(groups, { ...group, tabs: updatedTabs });
      setGroups(updated);
    }
  };

  const handleUpdateTabTag = async (groupId: string, tabId: string, oldTag: string, newTag: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const updatedTabs = group.tabs.map(t => {
      if (t.id === tabId) {
        const currentTags = t.tags || [];
        return { 
          ...t, 
          tags: currentTags.map(tg => tg === oldTag ? newTag.toLowerCase() : tg) 
        };
      }
      return t;
    });

    if (user) {
      setIsSyncing(true);
      const path = `users/${user.uid}/groups/${groupId}`;
      try {
        await updateDoc(doc(db, path), { 
          tabs: updatedTabs,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setIsSyncing(false);
      }
    } else {
      const updated = updateGroup(groups, { ...group, tabs: updatedTabs });
      setGroups(updated);
    }
  };

  const handleBulkAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroupIds.size === 0 || !bulkTagValue.trim()) return;

    const tag = bulkTagValue.trim().toLowerCase();
    const ids = Array.from(selectedGroupIds);

    if (user) {
      setIsSyncing(true);
      try {
        for (const id of ids) {
          const group = groups.find(g => g.id === id);
          if (!group) continue;
          const currentTags = group.tags || [];
          if (currentTags.includes(tag)) continue;
          
          const path = `users/${user.uid}/groups/${id}`;
          await updateDoc(doc(db, path), { 
            tags: [...currentTags, tag],
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, "bulk-tag");
      } finally {
        setIsSyncing(false);
      }
    } else {
      let updated = [...groups];
      for (const id of ids) {
        const group = updated.find(g => g.id === id);
        if (!group) continue;
        const currentTags = group.tags || [];
        if (currentTags.includes(tag)) continue;
        updated = updateGroup(updated, { ...group, tags: [...currentTags, tag] });
      }
      setGroups(updated);
    }
    setBulkTagValue('');
    setShowBulkTagModal(false);
    setSelectedGroupIds(new Set());
  };

  const handleBulkRemoveTag = async (tag: string) => {
    if (selectedGroupIds.size === 0) return;
    const ids = Array.from(selectedGroupIds);

    if (user) {
      setIsSyncing(true);
      try {
        for (const id of ids) {
          const group = groups.find(g => g.id === id);
          if (!group) continue;
          const currentTags = group.tags || [];
          if (!currentTags.includes(tag)) continue;
          
          const path = `users/${user.uid}/groups/${id}`;
          await updateDoc(doc(db, path), { 
            tags: currentTags.filter(t => t !== tag),
            updatedAt: serverTimestamp()
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, "bulk-tag-remove");
      } finally {
        setIsSyncing(false);
      }
    } else {
      let updated = [...groups];
      for (const id of ids) {
        const group = updated.find(g => g.id === id);
        if (!group) continue;
        const currentTags = group.tags || [];
        if (!currentTags.includes(tag)) continue;
        updated = updateGroup(updated, { ...group, tags: currentTags.filter(t => t !== tag) });
      }
      setGroups(updated);
    }
    setSelectedGroupIds(new Set());
  };

  const handleSaveView = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !viewName.trim()) return;

    const newView: SavedView = {
      id: crypto.randomUUID(),
      name: viewName.trim(),
      searchQuery,
      sortBy,
      activeView,
      createdAt: Date.now()
    };

    const path = `users/${user.uid}/views/${newView.id}`;
    try {
      await setDoc(doc(db, path), newView);
      setShowSaveViewModal(false);
      setViewName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDeleteSavedView = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/views/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const applySavedView = (view: SavedView) => {
    setSearchQuery(view.searchQuery);
    setSortBy(view.sortBy);
    setActiveView(view.activeView);
  };

  const sortedGroups = [...groups].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.name || 'Untitled').localeCompare(b.name || 'Untitled');
    }
    if (sortBy === 'updatedAt') {
      // Handle potential Firestore Timestamps or numbers
      const getTime = (val: any) => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (val.toMillis) return val.toMillis();
        if (val.seconds) return val.seconds * 1000;
        return 0;
      };
      const timeA = getTime(a.updatedAt) || a.createdAt;
      const timeB = getTime(b.updatedAt) || b.createdAt;
      return timeB - timeA;
    }
    // Default: createdAt desc
    return b.createdAt - a.createdAt;
  });

  const filteredGroups = sortedGroups.filter(g => {
    // Filter by active view
    if (activeView === 'groups' && g.isArchived) return false;
    if (activeView === 'archive' && !g.isArchived) return false;

    if (!searchQuery.trim()) return true;

    const terms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    
    return terms.every(term => {
      // Specialized hashtag search
      if (term.startsWith('#')) {
        const tagQuery = term.slice(1);
        if (!tagQuery) return true;
        const groupMatch = g.tags?.some(tag => tag.toLowerCase().includes(tagQuery));
        const tabMatch = g.tabs.some(t => t.tags?.some(tag => tag.toLowerCase().includes(tagQuery)));
        return groupMatch || tabMatch;
      }

      // General search across tabs, names, and tags
      const matchesTabs = g.tabs.some(t => 
        t.title.toLowerCase().includes(term) || 
        t.url.toLowerCase().includes(term) ||
        t.tags?.some(tag => tag.toLowerCase().includes(term))
      );
      const matchesName = g.name?.toLowerCase().includes(term);
      const matchesTags = g.tags?.some(tag => tag.toLowerCase().includes(term));

      return matchesTabs || matchesName || matchesTags;
    });
  });

  return (
    <div className="min-h-screen bg-background-main pt-16">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex flex-col gap-6">
          <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500/30 overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon className="w-5 h-5 text-sky-400" />
                )}
              </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold text-white truncate">
                    {user ? (user.displayName || user.email) : 'Guest Mode'}
                  </span>
                  <div className="h-4 flex items-center">
                    <AnimatePresence mode="wait">
                      {!isOnline ? (
                        <motion.span 
                          key="offline"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-[10px] uppercase tracking-widest flex items-center gap-1.5 text-slate-500 font-bold"
                        >
                          <CloudOff className="w-2.5 h-2.5" /> Offline
                        </motion.span>
                      ) : syncError ? (
                        <motion.span 
                          key="error"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-[10px] uppercase tracking-widest flex items-center gap-1.5 text-red-400 font-bold"
                        >
                          <AlertCircle className="w-2.5 h-2.5" /> Sync Error
                        </motion.span>
                      ) : isSyncing ? (
                        <motion.span 
                          key="syncing"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-[10px] uppercase tracking-widest flex items-center gap-1.5 text-sky-400 font-bold"
                        >
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing
                        </motion.span>
                      ) : showSyncSuccess ? (
                        <motion.span 
                          key="success"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-[10px] uppercase tracking-widest flex items-center gap-1.5 text-emerald-400 font-bold"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" /> Synced
                        </motion.span>
                      ) : lastSynced ? (
                        <motion.span 
                          key="idly-synced"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[9px] text-slate-500 font-medium flex items-center gap-1.5"
                        >
                          <Cloud className="w-2.5 h-2.5 opacity-50" />
                          Up to date
                        </motion.span>
                      ) : (
                        <motion.span 
                          key="local"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-[9px] text-slate-600 font-medium italic"
                        >
                          Local Session
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              {user && (
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors shrink-0"
                  title="Profile Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {!user ? (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/10"
              >
                <LogIn className="w-4 h-4" /> Sign In to Sync
              </button>
            ) : (
              <button 
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-sm font-bold flex items-center justify-center gap-2 transition-all border border-white/5"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            )}

            <div className="mt-8 space-y-4">
              <button 
                onClick={() => setActiveView('groups')}
                className={cn(
                  "w-full p-3 rounded-xl flex items-center gap-3 transition-colors text-sm font-bold",
                  activeView === 'groups' ? "bg-accent-soft text-accent border border-accent-border" : "text-slate-400 hover:bg-white/5 border border-transparent"
                )}
              >
                <Layout className="w-4 h-4" /> My Groups
              </button>
              <button 
                onClick={() => setActiveView('analytics')}
                className={cn(
                  "w-full p-3 rounded-xl flex items-center gap-3 transition-colors text-sm font-bold",
                  activeView === 'analytics' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:bg-white/5 border border-transparent"
                )}
              >
                <BarChart3 className="w-4 h-4" /> Analytics
              </button>
              <button 
                onClick={() => setActiveView('archive')}
                className={cn(
                  "w-full p-3 rounded-xl flex items-center justify-between gap-3 transition-colors text-sm font-bold",
                  activeView === 'archive' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <Archive className="w-4 h-4" /> Archive
                </div>
                {groups.filter(g => g.isArchived).length > 0 && (
                  <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-md">
                    {groups.filter(g => g.isArchived).length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveView('settings')}
                className={cn(
                  "w-full p-3 rounded-xl flex items-center gap-3 transition-colors text-sm font-bold",
                  activeView === 'settings' ? "bg-accent-soft text-accent border border-accent-border" : "text-slate-400 hover:bg-white/5 border border-transparent"
                )}
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button 
                onClick={() => setActiveView('help')}
                className={cn(
                  "w-full p-3 rounded-xl flex items-center gap-3 transition-colors text-sm font-bold",
                  activeView === 'help' ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:bg-white/5 border border-transparent"
                )}
              >
                <Info className="w-4 h-4" /> Help & How-To
              </button>
            </div>

            {user && savedViews.length > 0 && (
              <div className="mt-8 pt-8 border-t border-white/5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                  Saved Views
                  <Bookmark className="w-3 h-3 text-sky-400" />
                </h3>
                <div className="space-y-1.5">
                  {savedViews.map((view) => (
                    <div 
                      key={view.id}
                      className="group/savedview flex items-center gap-2"
                    >
                      <button 
                        onClick={() => applySavedView(view)}
                        className={cn(
                          "flex-1 p-2 text-left rounded-xl hover:bg-white/5 transition-all text-sm truncate",
                          searchQuery === view.searchQuery && sortBy === view.sortBy && activeView === view.activeView
                            ? "text-sky-400 font-bold"
                            : "text-slate-400 font-medium"
                        )}
                      >
                        {view.name}
                      </button>
                      <button 
                        onClick={() => handleDeleteSavedView(view.id)}
                        className="opacity-0 group-hover/savedview:opacity-100 p-2 text-slate-600 hover:text-red-400 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setShowHelpModal(true)}
                className="w-full p-3 rounded-xl hover:bg-white/5 text-sm text-slate-300 flex items-center gap-3 transition-colors"
                title="View keyboard shortcuts"
              >
                <Keyboard className="w-4 h-4 text-slate-500" /> Keyboard Shortcuts
                <span className="ml-auto text-[10px] text-slate-600 font-bold border border-white/5 px-1 rounded">?</span>
              </button>
              <button 
                onClick={() => setShowDeveloperModal(true)}
                className="w-full p-3 rounded-xl hover:bg-white/5 text-sm text-slate-300 flex items-center gap-3 transition-colors"
                title="About the developer"
              >
                <UserCheck className="w-4 h-4 text-indigo-400" /> Developer Details
              </button>
              <button 
                onClick={handleSimulateCollapse}
                className="w-full p-3 rounded-xl hover:bg-white/5 text-sm text-slate-300 flex items-center gap-3 transition-colors"
                title="Create a dummy group for testing"
              >
                <Plus className="w-4 h-4 text-sky-400" /> Simulate Collapse
              </button>
              <button 
                onClick={handleExportGroups}
                className="w-full p-3 rounded-xl hover:bg-white/5 text-sm text-slate-300 flex items-center gap-3 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" /> Export All
              </button>
              <label className="w-full p-3 rounded-xl hover:bg-white/5 text-sm text-slate-300 flex items-center gap-3 transition-colors cursor-pointer">
                <Info className="w-4 h-4 text-amber-400" /> 
                Import JSON
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportGroups} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col gap-6 relative">
          <AnimatePresence>
            {(!isOnline || syncError) && !dismissSyncError && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="overflow-hidden mb-6"
              >
                <div className={cn(
                  "p-4 rounded-2xl border flex items-start gap-4 shadow-xl",
                  !isOnline 
                    ? "bg-slate-900/80 border-slate-700/50 backdrop-blur-md" 
                    : "bg-red-500/10 border-red-500/20 backdrop-blur-md"
                )}>
                  <div className={cn(
                    "p-2 rounded-xl shrink-0",
                    !isOnline ? "bg-slate-800 text-slate-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {!isOnline ? <CloudOff className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "text-sm font-bold mb-1",
                      !isOnline ? "text-slate-200" : "text-red-400"
                    )}>
                      {!isOnline ? "You are currently offline" : "Synchronization Issue"}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                      {!isOnline 
                        ? "Your changes are being saved locally. We'll automatically sync your data once your connection is restored." 
                        : `We encountered an issue while syncing with the cloud: ${syncError}. This might be due to temporary network instability.`}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <button 
                        onClick={() => window.location.reload()}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                          !isOnline 
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700" 
                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        )}
                      >
                        <RefreshCw className="w-3 h-3" /> Retry Sync
                      </button>
                      <button 
                        onClick={() => setDismissSyncError(true)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-400 transition-colors uppercase tracking-widest"
                      >
                        Dismiss for now
                      </button>
                    </div>
                  </div>
                  
                  <div className="shrink-0">
                    <div className={cn(
                      "flex flex-col items-end gap-1 px-3 py-1.5 rounded-lg bg-black/20 border border-white/5",
                    )}>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Last Sync</span>
                      <span className="text-[10px] font-mono text-slate-300">
                        {lastSynced ? new Date(lastSynced).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top Quick Access & Social Row */}
          <div className="flex items-center justify-between gap-4 mb-4 bg-white/[0.02] border border-white/5 p-4 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveView('settings')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all",
                  activeView === 'settings' ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20" : "bg-white/5 text-slate-400 hover:bg-white/10"
                )}
              >
                <Settings className="w-3.5 h-3.5" /> Local Settings Updater
              </button>
              <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
              <div className="hidden lg:flex items-center gap-1.5">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mr-1">Cloud Sync Status:</span>
                {user ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Authenticated
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Guest Session
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Groups</span>
                <span className="text-[11px] text-sky-400 font-black ml-1.5">{groups.length}</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Tabs</span>
                <span className="text-[11px] text-sky-400 font-black ml-1.5">{groups.reduce((acc, g) => acc + g.tabs.length, 0)}</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Saved</span>
                <span className="text-[11px] text-emerald-400 font-black ml-1.5">~{groups.reduce((acc, g) => acc + g.tabs.length, 0) * 50}MB</span>
              </div>
            </div>
          </div>

          {activeView === 'groups' || activeView === 'archive' ? (
            <>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                  <Search className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                    searchQuery.includes('#') ? "text-sky-400" : "text-slate-500 group-focus-within:text-sky-400"
                  )} />
                  <input 
                    ref={searchRef}
                    type="text" 
                    placeholder={activeView === 'archive' ? "Search archive..." : "Search tabs or #tags..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-accent-soft focus:border-accent-border transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {user && (searchQuery || sortBy !== 'createdAt' || activeView !== 'groups') && (
                    <button 
                      onClick={() => setShowSaveViewModal(true)}
                      className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all flex items-center gap-2"
                      title="Save Current View"
                    >
                      <BookmarkPlus className="w-4 h-4" />
                      <span className="text-xs font-bold hidden lg:inline">Save View</span>
                    </button>
                  )}

                  {activeView === 'archive' && groups.some(g => g.isArchived) && (
                    <div className="flex items-center gap-2 mr-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <History className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Archived Groups</span>
                    </div>
                  )}

                  <button 
                    onClick={toggleSelectAll}
                    className={cn(
                      "px-4 py-3 rounded-2xl text-xs font-bold transition-all border shrink-0",
                      selectedGroupIds.size > 0 && selectedGroupIds.size === filteredGroups.length
                        ? "bg-sky-500/20 border-sky-500/50 text-sky-400"
                        : "bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/5"
                    )}
                  >
                    {selectedGroupIds.size === filteredGroups.length ? 'Deselect All' : 'Select All'}
                  </button>

                  <div className="relative group/sort">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="appearance-none px-10 py-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all cursor-pointer"
                    >
                      <option value="createdAt">Creation Date</option>
                      <option value="updatedAt">Last Update</option>
                      <option value="name">Name</option>
                    </select>
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 rotate-90 pointer-events-none" />
                  </div>

                  {selectedGroupIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowBulkTagModal(true)}
                        className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 text-sky-400 transition-all flex items-center gap-2"
                        title="Add Tag to Selected"
                      >
                        <Tag className="w-4 h-4" />
                        <span className="text-xs font-bold hidden lg:inline">Bulk Tag</span>
                      </button>
                      <button 
                        onClick={handleDeleteSelected}
                        className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={handleRestoreSelected}
                        className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-sky-500/10"
                      >
                        Restore {selectedGroupIds.size} Selected
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {filteredGroups.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-20 text-center"
                    >
                      <div className="w-16 h-16 rounded-3xl bg-white/[0.02] flex items-center justify-center mx-auto mb-6">
                        <Monitor className="w-8 h-8 text-slate-700" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-400 mb-2">No tab groups found</h3>
                      <p className="text-slate-600 max-w-xs mx-auto">Start by using the Firefox extension to collapse your open tabs.</p>
                    </motion.div>
                  ) : (
                    filteredGroups.map((group) => (
                      <TabGroupItem 
                        key={group.id} 
                        group={group} 
                        isSelected={selectedGroupIds.has(group.id)}
                        onToggleSelect={() => toggleSelection(group.id)}
                        onDelete={handleDeleteGroup}
                        onToggleStar={toggleStar}
                        onToggleArchive={toggleArchive}
                        onToggleLock={toggleLock}
                        onUpdateName={handleUpdateName}
                        onDeleteTab={handleDeleteTab}
                        onAddTag={handleAddTag}
                        onRemoveTag={handleRemoveTag}
                        onAddTabTag={handleAddTabTag}
                        onRemoveTabTag={handleRemoveTabTag}
                        onUpdateTabTag={handleUpdateTabTag}
                        searchQuery={searchQuery}
                        onRestore={handleRestoreGroup}
                        onShare={handleShareGroup}
                        onDeduplicate={handleDeduplicateGroup}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : activeView === 'analytics' ? (
            <MemoryAnalytics groups={groups} />
          ) : activeView === 'settings' ? (
            <SettingsView 
              user={user}
              newDisplayName={newDisplayName}
              setNewDisplayName={setNewDisplayName}
              autoArchiveEnabled={autoArchiveEnabled}
              setAutoArchiveEnabled={setAutoArchiveEnabled}
              autoArchiveDays={autoArchiveDays}
              setAutoArchiveDays={setAutoArchiveDays}
              excludedDomains={excludedDomains}
              setExcludedDomains={setExcludedDomains}
              currentTheme={currentTheme}
              setCurrentTheme={setCurrentTheme}
              currentAccent={currentAccent}
              setCurrentAccent={setCurrentAccent}
              openOnStartup={openOnStartup}
              setOpenOnStartup={setOpenOnStartup}
              restoreBehavior={restoreBehavior}
              setRestoreBehavior={setRestoreBehavior}
              toolbarClickBehavior={toolbarClickBehavior}
              setToolbarClickBehavior={setToolbarClickBehavior}
              allowDuplicates={allowDuplicates}
              setAllowDuplicates={setAllowDuplicates}
              handleImport={handleImport}
              handleExport={handleExport}
              isImporting={isImporting}
              importResult={importResult}
              importFileRef={importFileRef}
              handleUpdateProfile={handleUpdateProfile}
              isUpdatingProfile={isUpdatingProfile}
              authError={authError}
              snoozeTimeoutMinutes={snoozeTimeoutMinutes}
              setSnoozeTimeoutMinutes={setSnoozeTimeoutMinutes}
            />
          ) : (
            <HelpView setShowDeveloperModal={setShowDeveloperModal} />
          )}

          {/* Footer — branding + social links */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-3 shrink-0">
                <Logo size={24} />
                <div>
                  <span className="text-sm font-bold text-slate-300 block">Lorapok Labs &middot; Bangladesh</span>
                  <span className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Lorapok Labs. All rights reserved.</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <FooterConnectLink href="https://github.com/lorapok" icon={<Github className="w-5 h-5" />} label="GitHub" />
                <FooterConnectLink href="https://x.com/lorapoklabs" icon={<Twitter className="w-5 h-5" />} label="X / Twitter" />
                <FooterConnectLink href="mailto:lorapokdev@gmail.com" icon={<Mail className="w-5 h-5" />} label="Email" />
                <FooterConnectLink href="https://www.linkedin.com/showcase/lorapok/" icon={<Linkedin className="w-5 h-5" />} label="LinkedIn" />
                <FooterConnectLink href="https://www.reddit.com/r/LorapokLabs/" icon={<MessageSquare className="w-5 h-5" />} label="Reddit" />
                <FooterConnectLink href="https://gravatar.com/lorapok" icon={<UserCheck className="w-5 h-5" />} label="Gravatar" />
                <FooterConnectLink href="https://www.instagram.com/lorapoklabs/" icon={<Instagram className="w-5 h-5" />} label="Instagram" />
                <FooterConnectLink href="https://www.facebook.com/lorapoklabs" icon={<Facebook className="w-5 h-5" />} label="Facebook" />
                <FooterConnectLink href="https://lorapok.com/contact" icon={<ExternalLinkIcon2 className="w-5 h-5" />} label="Contact" />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0f1a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/10 blur-[80px] rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full" />

              <div className="text-center mb-8">
                <div className="flex justify-center mb-6">
                  <Logo size={60} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isRegistering ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-slate-400 text-sm">
                  {isRegistering ? 'Start syncing your tabs across devices' : 'Sign in to access your saved tab groups'}
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 py-2 px-3 rounded-lg text-center">
                    {authError}
                  </p>
                )}

                <button 
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all shadow-xl shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isRegistering ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className="px-4 bg-[#0a0f1a] text-slate-500">Or continue with</span>
                </div>
              </div>

              <button 
                onClick={handleLogin}
                disabled={authLoading}
                className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 font-bold text-sm transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Google
              </button>

              <p className="mt-8 text-center text-xs text-slate-500">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-sky-400 font-bold hover:underline"
                >
                  {isRegistering ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0f1a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/10 blur-[80px] rounded-full" />
              
              <div className="flex justify-between items-start mb-8 text-left">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Profile Settings</h2>
                  <p className="text-slate-400 text-sm">Manage your account and sync preferences</p>
                </div>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6 text-left">
                <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-12 h-12 rounded-full bg-sky-500/20 flex items-center justify-center border border-sky-500/30 overflow-hidden shrink-0">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-6 h-6 text-sky-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-bold text-sm truncate">{user?.email}</h4>
                    <p className="text-slate-500 text-[9px] uppercase tracking-widest mt-1">UID: {user?.uid.slice(0, 12)}...</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Display Name</label>
                  <input 
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-white placeholder:text-slate-600"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 py-2 px-3 rounded-lg text-center font-medium">
                    {authError}
                  </p>
                )}

                <div className="pt-2 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-sm transition-all border border-white/5"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all shadow-xl shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isUpdatingProfile ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Account Actions</h3>
                <button 
                  onClick={handleLogout}
                  className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save View Modal */}
      <AnimatePresence>
        {showSaveViewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveViewModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#0a0f1a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Save Current View</h2>
                <p className="text-slate-400 text-sm">Give this search and filter combination a name for quick access.</p>
              </div>

              <form onSubmit={handleSaveView} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">View Name</label>
                  <input 
                    autoFocus
                    type="text"
                    required
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    placeholder="e.g. Work Tags, Recent Items"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-white"
                  />
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Query:</span>
                    <span className="text-sky-400 font-bold truncate ml-4">{searchQuery || 'None'}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Sort:</span>
                    <span className="text-sky-400 font-bold uppercase">{sortBy}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">View:</span>
                    <span className="text-sky-400 font-bold uppercase">{activeView}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowSaveViewModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-sm transition-all border border-white/5"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save View
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Bulk Tag Modal */}
      <AnimatePresence>
        {showBulkTagModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBulkTagModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#0a0f1a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Bulk Tagging</h2>
                <p className="text-slate-400 text-sm">Apply a new tag to the {selectedGroupIds.size} selected groups.</p>
              </div>

              {/* Get common tags for removal */}
              {(() => {
                const selectedGroups = groups.filter(g => selectedGroupIds.has(g.id));
                const allTags = selectedGroups.flatMap(g => g.tags || []);
                const commonTags = Array.from(new Set(allTags)).filter(tag => 
                  selectedGroups.every(g => (g.tags || []).includes(tag))
                );

                return commonTags.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Remove Common Tags</label>
                    <div className="flex flex-wrap gap-2">
                       {commonTags.map(tag => (
                         <button 
                           key={tag}
                           onClick={() => handleBulkRemoveTag(tag)}
                           className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
                         >
                           {tag} <X className="w-3 h-3" />
                         </button>
                       ))}
                    </div>
                  </div>
                );
              })()}

              <form onSubmit={handleBulkAddTag} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">New Tag Name</label>
                  <input 
                    autoFocus
                    type="text"
                    required
                    value={bulkTagValue}
                    onChange={(e) => setBulkTagValue(e.target.value)}
                    placeholder="e.g. Work, Research, Dev"
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all text-white"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowBulkTagModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-sm transition-all border border-white/5"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm transition-all shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Apply Tag
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelpModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0f1a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                  <Keyboard className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                  <p className="text-slate-500 text-sm">Boost your productivity with Lorapok TabMan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600 mb-4 ml-1">Navigation</h3>
                  <div className="space-y-3">
                    <ShortcutRow keys={['G']} label="Switch to Groups View" />
                    <ShortcutRow keys={['A']} label="Switch to Analytics" />
                    <ShortcutRow keys={['R']} label="Switch to Archive" />
                    <ShortcutRow keys={['S', '/']} label="Focus Search" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-600 mb-4 ml-1">Actions</h3>
                  <div className="space-y-3">
                    <ShortcutRow keys={['Esc']} label="Clear Search / Selection" />
                    <ShortcutRow keys={['Delete']} label="Delete Selected Groups" />
                    <ShortcutRow keys={['T']} label="Open Bulk Tagging" />
                    <ShortcutRow keys={['?']} label="Toggle Help Menu" />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowHelpModal(false)}
                className="w-full mt-10 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-sm transition-all border border-white/5"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Developer Details Modal */}
      <AnimatePresence>
        {showDeveloperModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeveloperModal(false)}
              className="absolute inset-0 bg-[#030711]/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0f1a] border border-white/10 rounded-[3rem] p-8 sm:p-12 shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent-soft blur-[100px] rounded-full pointer-events-none" />
              
              <div className="relative text-center mb-8">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {/* Animated glow rings */}
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-[2.5rem] bg-sky-500/20 blur-xl"
                    />
                    <motion.div
                      animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      className="absolute -inset-2 rounded-[3rem] bg-purple-500/10 blur-2xl"
                    />
                    <motion.img
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      src="https://maijied.github.io/Maijied/avatar.jpg"
                      alt="Maizied Hasan"
                      className="w-32 h-32 rounded-[2.5rem] border-2 border-white/20 shadow-2xl relative z-10 object-cover"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Mohammad Maizied Hasan Majumder</h2>
                <p className="text-sky-400 font-bold text-sm uppercase tracking-[0.2em]">Founder of Lorapok Labs</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-8">
                {[
                  { icon: <Globe className="w-4 h-4" />,        label: 'Website',   href: 'https://maijied.github.io/Maijied/' },
                  { icon: <Mail className="w-4 h-4" />,         label: 'Email',     href: 'mailto:mdshuvo40@gmail.com' },
                  { icon: <Github className="w-4 h-4" />,       label: 'GitHub',    href: 'https://github.com/Maijied' },
                  { icon: <Linkedin className="w-4 h-4" />,     label: 'LinkedIn',  href: 'https://www.linkedin.com/in/maizied/' },
                  { icon: <Twitter className="w-4 h-4" />,      label: 'X / Twitter', href: 'https://x.com/MAIJIED61' },
                  { icon: <Send className="w-4 h-4" />,         label: 'Telegram',  href: 'https://t.me/maizied' },
                  { icon: <Phone className="w-4 h-4" />,        label: 'WhatsApp',  href: 'https://wa.me/message/J7YTFGC7RTOGC1' },
                  { icon: <MessageSquare className="w-4 h-4" />,label: 'Reddit',    href: 'https://www.reddit.com/user/maijied/' },
                  { icon: <UserCheck className="w-4 h-4" />,    label: 'Gravatar',  href: 'https://gravatar.com/lorapok' },
                ].map(({ icon, label, href }) => (
                  <DeveloperLink key={label} icon={icon} label={label} href={href} />
                ))}
              </div>

              <button 
                onClick={() => setShowDeveloperModal(false)}
                className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-white/5"
              >
                Close Profile
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {copySuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl bg-accent text-white font-bold text-sm shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-xl"
          >
            <CheckCircle2 className="w-4 h-4" />
            {copySuccess}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommitButton({ isUpdatingProfile }: { isUpdatingProfile: boolean }) {
  return (
    <button type="submit" disabled={isUpdatingProfile}
      className="w-full py-4 rounded-3xl bg-accent hover:opacity-90 text-white font-black text-sm transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em]">
      {isUpdatingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Commit Preferences</>}
    </button>
  );
}

function SettingsView({ 
  user, 
  newDisplayName, 
  setNewDisplayName, 
  autoArchiveEnabled, 
  setAutoArchiveEnabled, 
  autoArchiveDays, 
  setAutoArchiveDays,
  excludedDomains,
  setExcludedDomains,
  currentTheme,
  setCurrentTheme,
  currentAccent,
  setCurrentAccent,
  openOnStartup,
  setOpenOnStartup,
  restoreBehavior,
  setRestoreBehavior,
  toolbarClickBehavior,
  setToolbarClickBehavior,
  allowDuplicates,
  setAllowDuplicates,
  handleImport,
  handleExport,
  isImporting,
  importResult,
  importFileRef,
  handleUpdateProfile,
  isUpdatingProfile,
  authError,
  snoozeTimeoutMinutes,
  setSnoozeTimeoutMinutes
}: any) {
  const [settingsTab, setSettingsTab] = useState<'appearance' | 'behavior' | 'automation' | 'data'>('appearance');

  if (!user) {
    return (
      <div className="py-20 text-center bg-white/[0.02] rounded-[3rem] border border-white/5">
        <Lock className="w-12 h-12 text-slate-700 mx-auto mb-6" />
        <h3 className="text-xl font-bold text-slate-400 mb-2">Settings Locked</h3>
        <p className="text-slate-600 max-w-xs mx-auto">Please sign in to access your profile settings and sync preferences.</p>
      </div>
    );
  }

  const SETTINGS_TABS = [
    { id: 'appearance' as const, label: 'Appearance', icon: <PieChartIcon className="w-3.5 h-3.5" /> },
    { id: 'behavior' as const,   label: 'Behavior',   icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'automation' as const, label: 'Automation', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'data' as const,       label: 'Data',       icon: <Download className="w-3.5 h-3.5" /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full pb-20"
    >
      {/* Profile header */}
      <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Settings className="w-20 h-20 text-sky-400" />
        </div>
        <div className="w-14 h-14 rounded-full bg-accent-soft flex items-center justify-center border border-accent-border overflow-hidden shrink-0">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="w-7 h-7 text-accent" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black text-white truncate">{user.displayName || 'Friend'}</h2>
          <p className="text-slate-500 text-xs">{user.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-[10px] font-bold text-sky-400 uppercase tracking-widest">Pro Member</span>
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Joined {new Date(user.metadata.creationTime || '').toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/5 mb-6 overflow-x-auto">
        {SETTINGS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSettingsTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center",
              settingsTab === tab.id
                ? "bg-accent text-white shadow-lg"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <form onSubmit={handleUpdateProfile}>
        <AnimatePresence mode="wait">
          {settingsTab === 'appearance' && (
            <motion.div key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="space-y-4">
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-5">
                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Color Theme</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {THEMES.map((theme) => (
                    <button key={theme.id} type="button" onClick={() => setCurrentTheme(theme.id)}
                      className={cn("relative p-4 rounded-2xl border text-left transition-all group overflow-hidden",
                        currentTheme === theme.id ? "border-accent bg-accent-soft" : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]")}>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.main }} />
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.card }} />
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                        </div>
                        <span className={cn("text-[11px] font-bold tracking-tight transition-colors", currentTheme === theme.id ? "text-accent" : "text-slate-400 group-hover:text-slate-200")}>
                          {theme.name}
                        </span>
                      </div>
                      {currentTheme === theme.id && <div className="absolute top-2 right-2"><CheckCircle2 className="w-3 h-3 text-accent" /></div>}
                    </button>
                  ))}
                  <button type="button" onClick={() => setCurrentTheme('custom')}
                    className={cn("relative p-4 rounded-2xl border text-left transition-all group overflow-hidden",
                      currentTheme === 'custom' ? "border-accent bg-accent-soft" : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03]")}>
                    <div className="flex flex-col gap-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-red-500 via-green-500 to-blue-500" />
                      <span className={cn("text-[11px] font-bold tracking-tight", currentTheme === 'custom' ? "text-accent" : "text-slate-400 group-hover:text-slate-200")}>Custom Accent</span>
                    </div>
                  </button>
                </div>
                {currentTheme === 'custom' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-4 border-t border-white/5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Accent Hex Color</label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <input type="text" value={currentAccent} onChange={(e) => setCurrentAccent(e.target.value)} placeholder="#38bdf8"
                          className="w-full bg-[#0a0f1a] border border-white/5 rounded-2xl py-3 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 text-white font-mono uppercase" />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg border border-white/10" style={{ backgroundColor: currentAccent }} />
                      </div>
                      <input type="color" value={currentAccent} onChange={(e) => setCurrentAccent(e.target.value)}
                        className="w-12 h-12 rounded-2xl bg-[#0a0f1a] border border-white/10 p-1 cursor-pointer" />
                    </div>
                  </motion.div>
                )}
              </div>
              <CommitButton isUpdatingProfile={isUpdatingProfile} />
            </motion.div>
          )}

          {settingsTab === 'behavior' && (
            <motion.div key="behavior" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Startup */}
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4">At Browser Startup</h3>
                  <SettingsOption active={openOnStartup === 'auto'} onClick={() => setOpenOnStartup('auto')} label="Open TabMan automatically" desc="Dashboard launches when Firefox starts." />
                  <SettingsOption active={openOnStartup === 'manual'} onClick={() => setOpenOnStartup('manual')} label="Do not open automatically" desc="Open manually or via shortcut." />
                </div>
                {/* Toolbar */}
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4">Toolbar Action</h3>
                  <SettingsOption active={toolbarClickBehavior === 'all'} onClick={() => setToolbarClickBehavior('all')} label="Send all tabs in window" desc="Capture your entire session." />
                  <SettingsOption active={toolbarClickBehavior === 'single'} onClick={() => setToolbarClickBehavior('single')} label="Send only current tab" desc="Precision capture." />
                  <SettingsOption active={toolbarClickBehavior === 'popup'} onClick={() => setToolbarClickBehavior('popup')} label="Show action popup" desc="Choose which tabs to send." />
                </div>
                {/* Restoration */}
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4">Upon Tab Restoration</h3>
                  <SettingsOption active={restoreBehavior === 'remove'} onClick={() => setRestoreBehavior('remove')} label="Remove tabs from list" desc="Clean up groups after restoring." />
                  <SettingsOption active={restoreBehavior === 'keep'} onClick={() => setRestoreBehavior('keep')} label="Keep in list" desc="Restored tabs stay in groups." />
                  <SettingsOption active={restoreBehavior === 'archive'} onClick={() => setRestoreBehavior('archive')} label="Mark as archived" desc="Visual indicator you've read these tabs." />
                </div>
                {/* Integrity */}
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-3">
                  <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-4">Integrity Policy</h3>
                  <SettingsOption active={allowDuplicates === true} onClick={() => setAllowDuplicates(true)} label="Allow duplicates" desc="Keep groups exactly as captured." />
                  <SettingsOption active={allowDuplicates === false} onClick={() => setAllowDuplicates(false)} label="Block duplicate URLs" desc="Skip tabs already in active groups." />
                </div>
              </div>
              <CommitButton isUpdatingProfile={isUpdatingProfile} />
            </motion.div>
          )}

          {settingsTab === 'automation' && (
            <motion.div key="automation" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="space-y-4">
              <div className="overflow-hidden rounded-[2rem] border border-white/5">
                <div className="p-6 bg-white/[0.02] flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Archive className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">Auto-Archive Engine</h4>
                      <p className="text-slate-500 text-xs mt-0.5">Move inactive tab groups to archive automatically</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setAutoArchiveEnabled(!autoArchiveEnabled)}
                    className={cn("w-14 h-7 rounded-full transition-all relative border-2 shrink-0", autoArchiveEnabled ? "bg-accent border-accent-border" : "bg-white/5 border-white/10")}>
                    <div className={cn("absolute top-1 w-4 h-4 rounded-full transition-all shadow-sm", autoArchiveEnabled ? "right-1 bg-white scale-110" : "left-1 bg-slate-600")} />
                  </button>
                </div>
                <AnimatePresence>
                  {autoArchiveEnabled && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-white/[0.01] border-t border-white/5">
                      <div className="p-6">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Inactivity Threshold</label>
                        <div className="flex items-center gap-5">
                          <input type="range" min="1" max="90" value={autoArchiveDays} onChange={(e) => setAutoArchiveDays(parseInt(e.target.value))}
                            className="flex-1 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                          <div className="w-16 px-2 py-2 rounded-xl bg-[#0a0f1a] border border-white/10 text-center">
                            <span className="text-sky-400 font-bold text-sm">{autoArchiveDays}</span>
                            <span className="text-[10px] text-slate-600 block font-bold">DAYS</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 shrink-0">
                    <Clock className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm">Tab Snooze Timeout</h4>
                    <p className="text-slate-500 text-xs mt-0.5 mb-4">Tabs inactive for this long are unloaded from memory to save RAM.</p>
                    <div className="flex items-center gap-3">
                      <input type="number" min={1} max={10080} value={snoozeTimeoutMinutes}
                        onChange={(e) => setSnoozeTimeoutMinutes(Math.max(1, Math.min(10080, Number(e.target.value))))}
                        className="w-24 bg-background-card border border-white/5 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-soft transition-all" />
                      <span className="text-slate-400 text-sm font-medium">minutes</span>
                      <span className="text-slate-600 text-[10px]">max 10080 (7 days)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
                <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Excluded Domains</h3>
                <textarea 
                  value={excludedDomains.join('\n')}
                  onChange={(e) => setExcludedDomains(e.target.value.split('\n').filter((d: string) => d.trim()))}
                  placeholder={"news.google.com\ninternal.company.com"}
                  className="w-full bg-[#0a0f1a] border border-white/5 rounded-2xl py-3 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-white placeholder:text-slate-700 font-medium min-h-[100px] resize-none"
                />
                <p className="text-[10px] text-slate-600 italic">Tabs from these domains will be ignored during sync.</p>
              </div>
              <CommitButton isUpdatingProfile={isUpdatingProfile} />
            </motion.div>
          )}

          {settingsTab === 'data' && (
            <motion.div key="data" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }} className="space-y-4">
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 shrink-0">
                    <Download className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Export All Groups</h4>
                    <p className="text-slate-500 text-xs mt-0.5">Download a JSON backup of your entire session history.</p>
                  </div>
                </div>
                <button type="button" onClick={handleExport}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/10 active:scale-95 shrink-0">
                  Download .json
                </button>
              </div>
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Import from External Sources</h3>
                  {importResult && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      <CheckCircle2 className="w-3 h-3" /> {importResult.count} tabs imported
                    </motion.div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4 hover:border-accent/30 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center border border-accent-border">
                      <BookmarkPlus className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">Lorapok / JSON</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">Restore from a previous Lorapok TabMan export.</p>
                    </div>
                    <input type="file" ref={importFileRef} className="hidden" accept=".json"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => handleImport('json', ev.target?.result as string); reader.readAsText(file); } }} />
                    <button type="button" disabled={isImporting} onClick={() => importFileRef.current?.click()}
                      className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-bold transition-all border border-white/5 flex items-center justify-center gap-2 disabled:opacity-50">
                      {isImporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Choose File
                    </button>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4 hover:border-amber-500/30 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <History className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">OneTab Migration</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">Paste your OneTab export data to migrate instantly.</p>
                    </div>
                    <div className="relative">
                      <textarea placeholder="Paste OneTab text here..."
                        className="w-full bg-[#030711] border border-white/5 rounded-xl p-3 text-[10px] text-slate-400 focus:outline-none focus:border-amber-500/50 min-h-[72px] font-mono resize-none transition-all"
                        onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) { handleImport('onetab', (e.target as HTMLTextAreaElement).value); (e.target as HTMLTextAreaElement).value = ''; } }} />
                      <button type="button" disabled={isImporting}
                        onClick={(e) => { const ta = e.currentTarget.previousSibling as HTMLTextAreaElement; if (ta.value) { handleImport('onetab', ta.value); ta.value = ''; } }}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50">
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 italic text-center">Native JSON and OneTab supported. AI-powered auto-migration coming soon.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}


function HelpView({ setShowDeveloperModal }: { setShowDeveloperModal: (val: boolean) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12 pb-20"
    >
      <div className="text-center py-10">
        <h2 className="text-3xl font-black text-white mb-4">Command Center</h2>
        <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
          Master the art of tab management with Lorapok TabMan. Learn the workflows that professional power users use to reclaim their system resources.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6 md:col-span-2">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft flex items-center justify-center border border-accent-border">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-xl font-bold text-white">Getting Started</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <StepItem number="01" title="Extension Install" desc="Make sure you have the Lorapok Firefox extension running in your browser toggled on." />
             <StepItem number="02" title="The Collapse" desc="Click the TabMan icon or use Alt+Shift+C to collapse all open tabs in your current window." />
             <StepItem number="03" title="Dashboard Sync" desc="Open this dashboard. Your groups will appear instantly if you are signed in." />
             <StepItem number="04" title="Smart Search" desc="Use #tags to filter your groups by topic instantly from the search bar." />
          </ul>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-[#0a0f1a] border border-white/10 group hover:border-sky-500/30 transition-all cursor-pointer overflow-hidden relative" onClick={() => setShowDeveloperModal(true)}>
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/10 blur-2xl rounded-full" />
          <div className="relative z-10 space-y-4">
            <div className="relative w-16 h-16">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-2xl bg-sky-500/20 blur-lg"
              />
              <img
                src="https://maijied.github.io/Maijied/avatar.jpg"
                alt="Maizied Hasan"
                className="w-16 h-16 rounded-2xl border border-white/20 object-cover relative z-10 group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Maizied Hasan</h3>
              <p className="text-sky-400 text-[10px] font-bold uppercase tracking-widest mb-2">Founder · Lorapok Labs</p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Crafted with passion in Bangladesh to solve the world's tab clutter crisis.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sky-400 font-bold text-[10px] uppercase tracking-widest">
              View Profile <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6 md:col-span-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Keyboard className="w-6 h-6 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Keyboard Power</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
             <ShortcutRow keys={['G']} label="Groups View" />
             <ShortcutRow keys={['A']} label="Analytics Engine" />
             <ShortcutRow keys={['R']} label="The Archive" />
             <ShortcutRow keys={['S', '/']} label="Omni-Search focus" />
             <ShortcutRow keys={['T']} label="Open Bulk Tagging" />
             <ShortcutRow keys={['Esc']} label="Clear Context" />
             <ShortcutRow keys={['Delete']} label="Vaporize Selected" />
             <ShortcutRow keys={['?']} label="Toggle Help Menu" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <FeatureCard 
          icon={<Zap className="w-5 h-5 text-sky-400" />}
          title="Smart Restore"
          desc="Restore groups instantly or open tabs one-by-one to manage system load."
        />
        <FeatureCard 
          icon={<Copy className="w-5 h-5 text-indigo-400" />}
          title="De-duplication"
          desc="Clean up your groups by removing duplicate URLs with a single click."
        />
        <FeatureCard 
          icon={<Share2 className="w-5 h-5 text-emerald-400" />}
          title="Markdown Export"
          desc="Share your sessions as formatted markdown for documentation or teams."
        />
        <FeatureCard 
          icon={<Lock className="w-5 h-5 text-amber-400" />}
          title="Session Guard"
          desc="Lock groups to prevent accidental deletion during high-pressure work."
        />
      </div>

      <div className="p-10 rounded-[3rem] bg-gradient-to-br from-sky-500/10 to-transparent border border-white/5 text-center">
        <h3 className="text-xl font-bold text-white mb-4">Still need help?</h3>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">Check out our community forums or reach out to the Lorapok Labs team for technical support.</p>
        <a
          href="mailto:lorapokdev@gmail.com"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-white text-black font-black text-sm hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-sky-500/40"
        >
          Contact Support
        </a>
      </div>
    </motion.div>
  );
}

function StepItem({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <li className="flex gap-4 group">
      <span className="text-[10px] font-black text-sky-500 font-mono mt-1 opacity-50 group-hover:opacity-100 transition-opacity tracking-tighter">{number}</span>
      <div>
        <h4 className="text-sm font-bold text-slate-200">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </li>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-[2rem] bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all group">
      <div className="mb-4 p-3 rounded-xl bg-white/[0.03] w-fit group-hover:scale-110 transition-all">{icon}</div>
      <h4 className="text-white font-bold text-sm mb-2">{title}</h4>
      <p className="text-slate-600 text-[11px] leading-relaxed">{desc}</p>
    </div>
  );
}

function MemoryAnalytics({ groups }: { groups: TabGroup[] }) {
  const totalTabs = groups.reduce((acc, g) => acc + g.tabs.length, 0);
  const totalMemory = totalTabs * 50;
  const avgTabsPerGroup = groups.length > 0 ? (totalTabs / groups.length).toFixed(1) : '0';
  const COLORS = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb7185'];

  const memoryData = groups.reduce((acc: any[], group) => {
    const date = new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === date);
    const memorySaved = group.tabs.length * 50;
    if (existing) { existing.memory += memorySaved; existing.tabs += group.tabs.length; existing.groups += 1; }
    else { acc.push({ date, memory: memorySaved, tabs: group.tabs.length, groups: 1 }); }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);

  const domainDataMap = groups.reduce((acc: Record<string, { domain: string, memory: number, count: number }>, group) => {
    group.tabs.forEach((tab: any) => {
      try {
        const url = new URL(tab.url.startsWith('http') ? tab.url : `https://${tab.url}`);
        const domain = url.hostname.replace('www.', '');
        if (acc[domain]) { acc[domain].memory += 50; acc[domain].count += 1; }
        else { acc[domain] = { domain, memory: 50, count: 1 }; }
      } catch { if (acc['other']) { acc['other'].memory += 50; acc['other'].count += 1; } else { acc['other'] = { domain: 'other', memory: 50, count: 1 }; } }
    });
    return acc;
  }, {});
  const topDomains = Object.values(domainDataMap).sort((a, b) => b.memory - a.memory).slice(0, 5);

  const EmptyChart = ({ label }: { label: string }) => (
    <div className="h-[220px] flex flex-col items-center justify-center gap-3 text-center">
      <BarChart3 className="w-8 h-8 text-slate-700" />
      <p className="text-xs text-slate-600 font-medium">{label}</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: <Zap className="w-5 h-5 text-sky-400" />, label: 'Memory Reclaimed', value: totalMemory >= 1024 ? `${(totalMemory/1024).toFixed(2)} GB` : `${totalMemory} MB`, sub: '~50MB per inactive tab', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
          { icon: <Layout className="w-5 h-5 text-purple-400" />, label: 'Tabs Offloaded', value: String(totalTabs), sub: `Across ${groups.length} groups`, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
          { icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, label: 'Efficiency Rating', value: String(avgTabsPerGroup), sub: 'Avg tabs per save', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((kpi) => (
          <div key={kpi.label} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-5">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border shrink-0', kpi.bg)}>
              {kpi.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className={cn('text-2xl font-black', kpi.color)}>{kpi.value}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" /> Memory Recovery Trend (Last 7 Days)
          </h3>
          {memoryData.length === 0 ? <EmptyChart label="Save tab groups to see your memory recovery trend" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={memoryData}>
                <defs>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}MB`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '11px' }} itemStyle={{ color: '#38bdf8' }} />
                <Area type="monotone" dataKey="memory" stroke="#38bdf8" fillOpacity={1} fill="url(#colorMem)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-purple-400" /> Tab Distribution
          </h3>
          {memoryData.length === 0 ? <EmptyChart label="Save tab groups to see tab distribution" /> : (
            <div className="flex items-center gap-4 h-[220px]">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={memoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="tabs">
                    {memoryData.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2.5 flex-1 overflow-hidden">
                {memoryData.map((entry: any, index: number) => (
                  <div key={entry.date} className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] text-slate-400 font-bold truncate flex-1">{entry.date}</span>
                    <span className="text-[10px] text-white font-black shrink-0">{entry.tabs}t</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Domain + Achievement row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" /> Memory Usage by Domain
          </h3>
          {topDomains.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <Globe className="w-8 h-8 text-slate-700" />
              <p className="text-xs text-slate-600 font-medium">Save tab groups to see domain breakdown</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topDomains.map((item, index) => (
                <div key={item.domain} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-600 font-mono font-bold shrink-0">0{index + 1}</span>
                      <span className="text-slate-300 font-bold truncate">{item.domain}</span>
                      <span className="text-slate-600 shrink-0">{item.count} tabs</span>
                    </div>
                    <span className="text-sky-400 font-black shrink-0 ml-3">
                      {item.memory >= 1024 ? `${(item.memory/1024).toFixed(1)}GB` : `${item.memory}MB`}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(item.memory / topDomains[0].memory) * 100}%` }}
                      transition={{ duration: 0.8, delay: index * 0.08 }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}, ${COLORS[(index + 1) % COLORS.length]})` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-sky-500/10 via-purple-500/5 to-transparent border border-white/5 flex flex-col justify-between gap-6">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-2">Sustainable Browsing</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              By using Lorapok TabMan you've prevented your browser from consuming significant system resources — speeding up your machine and reducing energy from CPU-heavy background tabs.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/5 w-fit px-3 py-1.5 rounded-lg border border-emerald-500/10">
            <CheckCircle2 className="w-3 h-3" /> System Optimized
          </div>
        </div>
      </div>

    </motion.div>
  );
}

function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  // Split highlight into tokens and filter out hashtags for highlighting in text
  const terms = highlight.toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 0 && !t.startsWith('#'))
    .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${terms.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => (
        regex.test(part) ? (
          <mark key={i} className="bg-sky-500/30 text-white rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      ))}
    </span>
  );
}

function FooterConnectLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30 transition-all"
      title={label}
    >
      {icon}
    </a>
  );
}

interface TabGroupItemProps {
  group: TabGroup;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onToggleLock: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onDeleteTab: (groupId: string, tabId: string) => void;
  onAddTag: (groupId: string, tag: string) => void;
  onRemoveTag: (groupId: string, tag: string) => void;
  onAddTabTag: (groupId: string, tabId: string, tag: string) => void;
  onRemoveTabTag: (groupId: string, tabId: string, tag: string) => void;
  onUpdateTabTag: (groupId: string, tabId: string, oldTag: string, newTag: string) => void;
  searchQuery: string;
}

interface TabGroupItemProps {
  group: TabGroup;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onToggleLock: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onDeleteTab: (groupId: string, tabId: string) => void;
  onAddTag: (groupId: string, tag: string) => void;
  onRemoveTag: (groupId: string, tag: string) => void;
  onAddTabTag: (groupId: string, tabId: string, tag: string) => void;
  onRemoveTabTag: (groupId: string, tabId: string, tag: string) => void;
  onUpdateTabTag: (groupId: string, tabId: string, oldTag: string, newTag: string) => void;
  searchQuery: string;
  onRestore: (groupId: string, mode: 'all-and-delete' | 'all-and-keep' | 'one-by-one') => void;
  onShare: (group: TabGroup) => void;
  onDeduplicate: (groupId: string) => void;
}

function TabGroupItem({ 
  group, 
  isSelected,
  onToggleSelect,
  onDelete, 
  onToggleStar, 
  onToggleArchive,
  onToggleLock,
  onUpdateName,
  onDeleteTab,
  onAddTag,
  onRemoveTag,
  onAddTabTag,
  onRemoveTabTag,
  onUpdateTabTag,
  searchQuery,
  onRestore,
  onShare,
  onDeduplicate
}: TabGroupItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localName, setLocalName] = useState(group.name || '');
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [tabTagInput, setTabTagInput] = useState<{tabId: string, value: string} | null>(null);
  const [editingTabTag, setEditingTabTag] = useState<{tabId: string, oldTag: string, value: string} | null>(null);

  useEffect(() => {
    setLocalName(group.name || '');
  }, [group.name]);

  const handleNameBlur = () => {
    if (localName !== (group.name || '')) {
      onUpdateName(group.id, localName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(group.id, newTag.trim().toLowerCase());
      setNewTag('');
      setShowTagInput(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative rounded-[2rem] border transition-all overflow-hidden",
        group.isStarred ? "bg-amber-500/[0.03] border-amber-500/20" : "bg-white/[0.02] border-white/5",
        "hover:border-white/10"
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="w-4 h-4 rounded-md bg-white/5 border-white/10 text-sky-500 focus:ring-sky-500 focus:ring-offset-0 transition-all cursor-pointer"
              />
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
              >
                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </motion.div>
              </button>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={handleKeyDown}
                  placeholder={`Tab Group (${group.tabs.length})`}
                  className="bg-transparent border-none p-0 font-bold text-slate-200 focus:outline-none focus:ring-0 placeholder:text-slate-500 w-full truncate"
                />
                {group.isLocked && <Lock className="w-3 h-3 text-amber-400 shrink-0" />}
                {group.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2 mr-2">
                  <Clock className="w-3 h-3" /> 
                  {new Date(group.createdAt).toLocaleDateString()} at {new Date(group.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {/* Tags List */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(group.tags || []).map((tag) => (
                    <span 
                      key={tag} 
                      className="px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[9px] text-sky-400 font-bold flex items-center gap-1 group/tag"
                    >
                      <Tag className="w-2 h-2" />
                      {tag}
                      <button 
                        onClick={() => onRemoveTag(group.id, tag)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </span>
                  ))}
                  
                  {showTagInput ? (
                    <form onSubmit={handleTagSubmit} className="inline-block">
                      <input 
                        autoFocus
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onBlur={() => !newTag && setShowTagInput(false)}
                        placeholder="new tag..."
                        className="bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-[9px] text-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500/50 w-20"
                      />
                    </form>
                  ) : (
                    <button 
                      onClick={() => setShowTagInput(true)}
                      className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-slate-500 hover:text-sky-400 hover:border-sky-500/30 transition-all font-bold flex items-center gap-1"
                    >
                      <Plus className="w-2 h-2" /> Add Tag
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => onShare(group)}
              className="p-2 rounded-xl border border-white/5 bg-white/5 text-slate-500 hover:text-sky-400 transition-colors"
              title="Export to Markdown"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDeduplicate(group.id)}
              className="p-2 rounded-xl border border-white/5 bg-white/5 text-slate-500 hover:text-sky-400 transition-colors"
              title="Remove Duplicate Tabs"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onToggleArchive(group.id)}
              className={cn("p-2 rounded-xl border border-white/5 transition-colors", group.isArchived ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-500 hover:text-amber-400")}
              title={group.isArchived ? "Unarchive Group" : "Archive Group"}
            >
              <Archive className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onToggleStar(group.id)}
              className={cn("p-2 rounded-xl border border-white/5 transition-colors", group.isStarred ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-slate-500 hover:text-amber-400")}
            >
              <Star className={cn("w-4 h-4", group.isStarred && "fill-amber-400")} />
            </button>
            <button 
              onClick={() => onToggleLock(group.id)}
              className={cn("p-2 rounded-xl border border-white/5 transition-colors", group.isLocked ? "bg-sky-500/20 text-sky-400" : "bg-white/5 text-slate-500 hover:text-sky-400")}
            >
              {group.isLocked ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => !group.isLocked && onDelete(group.id)}
              className={cn("p-2 rounded-xl border border-white/5 bg-white/5 text-slate-500 hover:text-red-400 transition-colors", group.isLocked && "opacity-20 cursor-not-allowed")}
              disabled={group.isLocked}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="relative group/restore">
              <button 
                onClick={() => onRestore(group.id, 'all-and-delete')}
                className="px-4 py-2 bg-accent hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-accent/20"
              >
                Restore All
              </button>
              <div className="absolute right-0 top-full mt-2 w-44 bg-[#0d1421] border border-white/10 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover/restore:opacity-100 group-hover/restore:visible transition-all z-10 p-1.5 space-y-1">
                 <button 
                   onClick={() => onRestore(group.id, 'all-and-keep')}
                   className="w-full p-2.5 rounded-xl hover:bg-white/5 text-left text-[11px] font-bold text-slate-300 flex items-center gap-3 transition-colors"
                 >
                   <History className="w-4 h-4 text-slate-500" /> Restore and Keep
                 </button>
                 <button 
                   onClick={() => onRestore(group.id, 'one-by-one')}
                   className="w-full p-2.5 rounded-xl hover:bg-white/5 text-left text-[11px] font-bold text-slate-300 flex items-center gap-3 transition-colors"
                 >
                   <Layout className="w-4 h-4 text-slate-500" /> Open One-by-One
                 </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                opacity: { duration: 0.25, delay: 0.1 }
              }}
              className="overflow-hidden"
            >
              {/* Local Group Filter */}
              <div className="px-6 pb-2">
                <div className="relative group/groupsearch">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600 group-focus-within/groupsearch:text-sky-400 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Filter tabs in this group..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-1.5 pl-9 pr-4 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500/30 focus:border-sky-500/30 transition-all text-slate-400 placeholder:text-slate-600"
                  />
                  {groupSearch && (
                    <button 
                      onClick={() => setGroupSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 px-6 pb-6">
                {group.tabs
                  .filter(tab => {
                    const globalTerms = searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
                    const matchesGlobal = globalTerms.length === 0 || globalTerms.every(term => {
                      if (term.startsWith('#')) {
                        const tagQuery = term.slice(1).toLowerCase();
                        if (!tagQuery) return true;
                        const groupHasTag = group.tags?.some(tag => tag.toLowerCase().includes(tagQuery));
                        const tabHasTag = tab.tags?.some(tag => tag.toLowerCase().includes(tagQuery));
                        return groupHasTag || tabHasTag;
                      }
                      return (
                        tab.title.toLowerCase().includes(term) || 
                        tab.url.toLowerCase().includes(term) ||
                        tab.tags?.some(tag => tag.toLowerCase().includes(term))
                      );
                    });
                    
                    const localTerms = groupSearch.toLowerCase().split(/\s+/).filter(t => t.length > 0);
                    const matchesLocal = localTerms.length === 0 || localTerms.every(term => {
                      return (
                        tab.title.toLowerCase().includes(term) || 
                        tab.url.toLowerCase().includes(term) ||
                        tab.tags?.some(tag => tag.toLowerCase().includes(term))
                      );
                    });
                    
                    return matchesGlobal && matchesLocal;
                  })
                  .map((tab) => (
                  <div key={tab.id} className="relative">
                    <div
                      className={cn(
                        "flex flex-col gap-1 p-2.5 rounded-xl hover:bg-white/5 group/tab transition-colors",
                        tab.isSnoozed && "blur-[2px] opacity-50 pointer-events-none select-none"
                      )}
                    >
                    <div className="flex items-center gap-3 cursor-pointer">
                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        {tab.favIconUrl ? (
                           <img src={tab.favIconUrl} alt="" className="w-4 h-4 rounded-sm" referrerPolicy="no-referrer" />
                        ) : (
                          <Globe className="w-3 h-3 text-slate-600" />
                        )}
                      </div>
                      <span className="text-sm text-slate-400 group-hover/tab:text-sky-400 transition-colors truncate flex-1">
                        <HighlightedText text={tab.title} highlight={searchQuery} />
                      </span>
                      <div className="opacity-0 group-hover/tab:opacity-100 flex items-center gap-2 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(tab.url);
                          }}
                          className="p-1.5 hover:text-sky-400 text-slate-600 transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a 
                          href={tab.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1.5 hover:text-sky-400 text-slate-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTab(group.id, tab.id);
                          }}
                          className="p-1.5 hover:text-red-400 text-slate-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Hover Detail: Full URL */}
                    <div className="overflow-hidden h-0 group-hover/tab:h-auto opacity-0 group-hover/tab:opacity-100 transition-all duration-300">
                      <div className="ml-9 pt-1 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[400px]">
                          {tab.url}
                        </span>
                      </div>
                    </div>

                    {/* Tab Tags Row */}
                    <div className="flex flex-wrap items-center gap-1.5 ml-9">
                      {(tab.tags || []).map((tag) => (
                        <div key={tag} className="flex items-center">
                          {editingTabTag?.tabId === tab.id && editingTabTag?.oldTag === tag ? (
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (editingTabTag.value.trim()) {
                                  onUpdateTabTag(group.id, tab.id, tag, editingTabTag.value.trim());
                                }
                                setEditingTabTag(null);
                              }}
                              className="inline-block"
                            >
                              <input 
                                autoFocus
                                type="text"
                                value={editingTabTag.value}
                                onChange={(e) => setEditingTabTag({ ...editingTabTag, value: e.target.value })}
                                onBlur={() => setEditingTabTag(null)}
                                onKeyDown={(e) => e.key === 'Escape' && setEditingTabTag(null)}
                                className="bg-sky-500/10 border border-sky-500/30 rounded-full px-2 py-0.5 text-[8px] text-sky-400 focus:outline-none w-16"
                              />
                            </form>
                          ) : (
                            <span 
                              className="px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] text-slate-500 font-bold flex items-center gap-1 group/tabtag"
                            >
                              <button 
                                onClick={() => setEditingTabTag({ tabId: tab.id, oldTag: tag, value: tag })}
                                className="hover:text-sky-400 transition-colors"
                              >
                                {tag}
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveTabTag(group.id, tab.id, tag);
                                }}
                                className="opacity-0 group-hover/tabtag:opacity-100 hover:text-red-400 transition-all"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </span>
                          )}
                        </div>
                      ))}

                      {tabTagInput?.tabId === tab.id ? (
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (tabTagInput.value.trim()) {
                              onAddTabTag(group.id, tab.id, tabTagInput.value.trim());
                            }
                            setTabTagInput(null);
                          }}
                          className="inline-block"
                        >
                          <input 
                            autoFocus
                            type="text"
                            value={tabTagInput.value}
                            onChange={(e) => setTabTagInput({ ...tabTagInput, value: e.target.value })}
                            onBlur={() => setTabTagInput(null)}
                            onKeyDown={(e) => e.key === 'Escape' && setTabTagInput(null)}
                            placeholder="tag..."
                            className="bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-[8px] text-sky-400 focus:outline-none w-16"
                          />
                        </form>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setTabTagInput({ tabId: tab.id, value: '' });
                          }}
                          className="px-1.5 py-0.5 rounded-full bg-white/[0.02] border border-dashed border-white/10 text-[8px] text-slate-600 hover:text-sky-400 hover:border-sky-500/30 transition-all font-bold flex items-center gap-1"
                        >
                          <Plus className="w-2 h-2" />
                        </button>
                      )}
                    </div>
                  </div>
                  {tab.isSnoozed && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 backdrop-blur-sm z-10">
                      <img
                        src="/logo.png"
                        alt="Tab snoozed � Lorapok TabMan"
                        className="w-8 h-8 opacity-80"
                      />
                    </div>
                  )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ShortcutRow({ keys, label }: { keys: string[], label: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <div className="flex items-center gap-1.5">
        {keys.map((k, i) => (
          <div key={k} className="flex items-center gap-1.5">
            <kbd className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-sky-400 min-w-[24px] text-center shadow-sm">
              {k}
            </kbd>
            {i < keys.length - 1 && <span className="text-slate-700 text-[10px]">/</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DeveloperLink({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-accent-border transition-all flex items-center gap-3 group/link"
    >
      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover/link:text-accent group-hover/link:bg-accent-soft transition-colors">
        {icon}
      </div>
      <span className="text-[11px] font-bold text-slate-400 group-hover/link:text-slate-200 transition-colors">
        {label}
      </span>
    </a>
  );
}

function SettingsOption({ active, onClick, label, desc }: { active: boolean, onClick: () => void, label: string, desc: string }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl text-left transition-all border flex items-start gap-4 group",
        active ? "bg-accent-soft border-accent-border" : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03]"
      )}
    >
      <div className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all text-white",
        active ? "border-accent bg-accent" : "border-slate-800 bg-transparent group-hover:border-slate-700"
      )}>
        {active && <CheckCircle2 className="w-3 h-3" />}
      </div>
      <div>
        <p className={cn(
          "text-[13px] font-bold transition-colors",
          active ? "text-accent" : "text-slate-300 group-hover:text-white"
        )}>{label}</p>
        <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">{desc}</p>
      </div>
    </button>
  );
}
