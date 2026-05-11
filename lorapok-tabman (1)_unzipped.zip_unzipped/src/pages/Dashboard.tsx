import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, Search, Filter, Star, Lock, Trash2, 
  ExternalLink, Plus, RefreshCw, LogIn, User as UserIcon,
  Globe, Clock, MoreHorizontal, ChevronRight,
  Monitor, Info, LogOut, Download, Settings
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy,
  serverTimestamp 
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
import { TabGroup, Tab } from '../types';
import { getLocalGroups, saveLocalGroups, addGroup, deleteGroup, updateGroup } from '../lib/storage';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { cn } from '../lib/utils';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';

export default function Dashboard() {
  const [groups, setGroups] = useState<TabGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Auth form state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Settings state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'name'>('createdAt');
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());

  // Online status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setNewDisplayName(currentUser.displayName || '');
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
    }, (error) => {
      setSyncError(error.code === 'unavailable' ? 'Connection Failed' : 'Sync Error');
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/groups`);
      setIsSyncing(false);
    });

    return () => unsubscribe();
  }, [user]);

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
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      
      setShowSettingsModal(false);
      // Force user state update locally (auth object is updated but we might need to refresh view)
      setUser({ ...user, displayName: newDisplayName } as User);
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
    const dummyTabs: Tab[] = [
      { id: crypto.randomUUID(), title: 'Google AI Studio', url: 'https://aistudio.google.com', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'React Documentation', url: 'https://react.dev', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'Tailwind CSS Tips', url: 'https://tailwindcss.com', timestamp: Date.now() },
      { id: crypto.randomUUID(), title: 'GitHub - Lorapok/Tabman', url: 'https://github.com/lorapok/tabman', timestamp: Date.now() },
    ];

    const newGroup: TabGroup = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      tabs: dummyTabs,
      isStarred: false,
      isLocked: false
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
        alert("Failed to import. Please ensure the file is a valid Lorapok Tabman export.");
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
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

  const filteredGroups = sortedGroups.filter(g => 
    g.tabs.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.url.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (g.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#030711] pt-16">
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
                <span className={cn(
                  "text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-colors duration-300",
                  !isOnline || syncError ? "text-red-400" : isSyncing ? "text-sky-400" : "text-slate-500"
                )}>
                  {!isOnline ? (
                    <>
                      <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                      Offline
                    </>
                  ) : syncError ? (
                    <>
                      <div className="w-1 h-1 rounded-full bg-red-500" />
                      {syncError}
                    </>
                  ) : isSyncing ? (
                    <>
                      <div className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
                      Syncing...
                    </>
                  ) : lastSynced ? (
                    <>
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      Synced {new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </>
                  ) : (
                    <>
                      <div className="w-1 h-1 rounded-full bg-slate-700" />
                      Local Only
                    </>
                  )}
                </span>
                {syncError && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="text-[9px] text-sky-400 underline hover:text-sky-300 transition-colors mt-0.5 text-left"
                  >
                    Retry Connection
                  </button>
                )}
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
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Total Groups</span>
                <span className="text-sky-400 font-bold">{groups.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Total Tabs</span>
                <span className="text-sky-400 font-bold">{groups.reduce((acc, g) => acc + g.tabs.length, 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Memory Saved</span>
                <span className="text-emerald-400 font-bold">~{groups.reduce((acc, g) => acc + g.tabs.length, 0) * 50}MB</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h3>
            <div className="space-y-2">
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
        <main className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Search saved tabs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
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
                    onToggleLock={toggleLock}
                    onUpdateName={handleUpdateName}
                    onDeleteTab={handleDeleteTab}
                    searchQuery={searchQuery}
                  />
                ))
              )}
            </AnimatePresence>
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
    </div>
  );
}

function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
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

interface TabGroupItemProps {
  group: TabGroup;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleLock: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
  onDeleteTab: (groupId: string, tabId: string) => void;
  searchQuery: string;
}

function TabGroupItem({ 
  group, 
  isSelected,
  onToggleSelect,
  onDelete, 
  onToggleStar, 
  onToggleLock,
  onUpdateName,
  onDeleteTab,
  searchQuery
}: TabGroupItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localName, setLocalName] = useState(group.name || '');

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
              <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3" /> 
                {new Date(group.createdAt).toLocaleDateString()} at {new Date(group.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <button 
              onClick={() => {
                group.tabs.forEach(t => window.open(t.url, '_blank'));
                alert("Restoring group... (Browser may block popups)");
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 rounded-xl text-sm font-bold transition-colors"
            >
              Restore Group
            </button>
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
              <div className="space-y-1.5 pt-2">
                {group.tabs.map((tab) => (
                  <div 
                    key={tab.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 group/tab transition-colors cursor-pointer"
                  >
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
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
