/**
 * Global State Management & Cloudflare D1 Sync for SIET Smart Canteen
 * Works seamlessly in both Cloudflare D1 (Online) and LocalStorage (Offline / Local)
 */

const STORAGE_KEYS = {
  PROFILE: 'siet_canteen_profile_v1',
  STALLS: 'siet_canteen_stalls_v1',
  DIARY: 'siet_canteen_diary_v1',
  SETTINGS: 'siet_canteen_settings_v1',
  CANTEEN_INFO: 'siet_canteen_info_v1'
};

window.SIETState = {
  profile: null,
  stalls: [],
  diary: [], // entries for current date
  settings: {
    geminiApiKey: '',
    antiMonotonyCount: 2, // avoid repeating menus in last 2 meals
    soundEnabled: true
  },
  canteenInfo: {
    name: "โรงอาหารกลาง (Main Canteen)"
  },
  
  // Cloudflare D1 connection state
  cloudStatus: 'checking', // 'connected' | 'offline' | 'checking' | 'error'
  isCloudflare: false,

  // Randomizer current filters
  randomizerFilter: {
    stallId: 'all', // 'all' or specific stall id
    maxPrice: 0, // 0 = unlimited, or 40, 50, 60, etc.
    strictCalories: true, // filter only items <= remaining calories
    antiMonotony: true, // avoid recent eaten meals
  },

  listeners: [],

  init() {
    this.loadLocalState();
    this.initCloudSync();
  },

  subscribe(listener) {
    this.listeners.push(listener);
  },

  notify() {
    this.listeners.forEach(fn => {
      try { fn(this); } catch(e) { console.error("Listener error:", e); }
    });
  },

  loadLocalState() {
    // 1. Profile
    const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (savedProfile) {
      try { this.profile = JSON.parse(savedProfile); } catch(e) { this.profile = { ...window.SIETPresets.defaultProfile }; }
    } else {
      this.profile = { ...window.SIETPresets.defaultProfile };
    }

    // 2. Stalls
    const savedStalls = localStorage.getItem(STORAGE_KEYS.STALLS);
    if (savedStalls) {
      try { this.stalls = JSON.parse(savedStalls); } catch(e) { this.stalls = JSON.parse(JSON.stringify(window.SIETPresets.stalls)); }
    } else {
      this.stalls = JSON.parse(JSON.stringify(window.SIETPresets.stalls));
    }

    // 3. Settings
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      try { this.settings = { ...this.settings, ...JSON.parse(savedSettings) }; } catch(e) {}
    }

    // 4. Canteen Info
    const savedCanteen = localStorage.getItem(STORAGE_KEYS.CANTEEN_INFO);
    if (savedCanteen) {
      try { this.canteenInfo = JSON.parse(savedCanteen); } catch(e) {}
    }

    // 5. Diary
    const savedDiary = localStorage.getItem(STORAGE_KEYS.DIARY);
    if (savedDiary) {
      try { this.diary = JSON.parse(savedDiary); } catch(e) { this.diary = []; }
    } else {
      this.diary = [];
    }
  },

  saveLocalState() {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(this.profile));
    localStorage.setItem(STORAGE_KEYS.STALLS, JSON.stringify(this.stalls));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    localStorage.setItem(STORAGE_KEYS.CANTEEN_INFO, JSON.stringify(this.canteenInfo));
    localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(this.diary));
    this.notify();
  },

  saveState() {
    this.saveLocalState();
  },

  // -------------------------------------------------------------
  // Cloudflare D1 Synchronization
  // -------------------------------------------------------------
  async initCloudSync() {
    // Check if running on http/https and if /api/canteen responds
    if (window.location.protocol !== 'http:' && window.location.protocol !== 'https:') {
      this.cloudStatus = 'offline';
      this.isCloudflare = false;
      this.notify();
      return;
    }

    try {
      this.cloudStatus = 'checking';
      this.notify();

      // Test connection to Cloudflare D1
      const res = await fetch('/api/canteen', { method: 'GET' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        this.isCloudflare = true;
        this.cloudStatus = 'connected';

        // Auto-seed if D1 has no stalls
        if (!data.stalls || data.stalls.length === 0) {
          await fetch('/api/init-db', { method: 'POST' }).catch(() => {});
          const retryRes = await fetch('/api/canteen');
          const retryData = await retryRes.json();
          if (retryData.success && retryData.stalls?.length > 0) {
            this.stalls = retryData.stalls;
            if (retryData.canteenName) this.canteenInfo.name = retryData.canteenName;
          }
        } else {
          this.stalls = data.stalls;
          if (data.canteenName) this.canteenInfo.name = data.canteenName;
        }

        // Fetch Cloud Profile
        const profileRes = await fetch('/api/profile').catch(() => null);
        if (profileRes && profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.success && profileData.profile) {
            this.profile = { ...this.profile, ...profileData.profile };
          }
        }

        // Fetch Today's Diary from Cloud
        const todayStr = new Date().toISOString().split('T')[0];
        const diaryRes = await fetch(`/api/diary?date=${todayStr}`).catch(() => null);
        if (diaryRes && diaryRes.ok) {
          const diaryData = await diaryRes.json();
          if (diaryData.success && Array.isArray(diaryData.entries)) {
            this.diary = diaryData.entries;
          }
        }

        // Save fresh cloud data to local cache
        this.saveLocalState();
      } else {
        this.cloudStatus = 'offline';
        this.isCloudflare = false;
      }
    } catch(e) {
      console.log("Cloudflare API not active (running locally/offline):", e.message);
      this.cloudStatus = 'offline';
      this.isCloudflare = false;
    }

    this.notify();
  },

  // Asynchronously sync state changes to Cloudflare D1
  async syncToCloud(type, payload) {
    if (!this.isCloudflare) return;

    try {
      if (type === 'canteen_name') {
        await fetch('/api/canteen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_canteen_name', canteenName: payload })
        });
      } else if (type === 'full_canteen_sync') {
        await fetch('/api/canteen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stalls: this.stalls, canteenName: this.canteenInfo.name })
        });
      } else if (type === 'save_stall') {
        await fetch('/api/canteen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_stall', stall: payload })
        });
      } else if (type === 'delete_stall') {
        await fetch('/api/canteen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_stall', stallId: payload })
        });
      } else if (type === 'save_menu') {
        await fetch('/api/canteen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_menu', stallId: payload.stallId, menu: payload.menu })
        });
      } else if (type === 'delete_menu') {
        await fetch('/api/canteen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_menu', menuId: payload })
        });
      } else if (type === 'save_profile') {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.profile)
        });
      } else if (type === 'add_diary') {
        await fetch('/api/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (type === 'delete_diary') {
        await fetch(`/api/diary?id=${payload}`, { method: 'DELETE' });
      } else if (type === 'clear_today_diary') {
        const todayStr = new Date().toISOString().split('T')[0];
        await fetch(`/api/diary?clearDate=${todayStr}`, { method: 'DELETE' });
      }
    } catch(err) {
      console.warn("Background cloud sync error:", err);
    }
  },

  // Calculate consumed calories today
  getTodayStats() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntries = this.diary.filter(item => item.date === todayStr);

    const consumedCalories = todayEntries.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
    const spentBudget = todayEntries.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    const targetCal = Number(this.profile.targetCalories) || 1800;
    const dailyBudget = Number(this.profile.dailyBudget) || 150;

    const remainingCalories = Math.max(0, targetCal - consumedCalories);
    const remainingBudget = Math.max(0, dailyBudget - spentBudget);

    return {
      date: todayStr,
      entries: todayEntries,
      consumedCalories,
      targetCalories: targetCal,
      remainingCalories,
      spentBudget,
      dailyBudget,
      remainingBudget,
      caloriePercentage: Math.min(100, Math.round((consumedCalories / targetCal) * 100)) || 0,
      budgetPercentage: Math.min(100, Math.round((spentBudget / dailyBudget) * 100)) || 0,
      isCalorieOver: consumedCalories > targetCal,
      isBudgetOver: spentBudget > dailyBudget
    };
  },

  // Add eaten meal to diary
  addDiaryEntry(entry) {
    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry = {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      date: todayStr,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      mealType: entry.mealType || this.inferMealType(),
      stallName: entry.stallName || 'ทั่วไป',
      menuName: entry.menuName || 'เมนูอาหาร',
      calories: Math.round(Number(entry.calories) || 0),
      price: Math.round(Number(entry.price) || 0),
      modifiers: entry.modifiers || [],
      isAiRecognized: !!entry.isAiRecognized,
      imageUrl: entry.imageUrl || null,
      nutrition: entry.nutrition || null
    };

    this.diary.unshift(newEntry);
    this.saveState();
    this.syncToCloud('add_diary', newEntry);
    return newEntry;
  },

  removeDiaryEntry(id) {
    this.diary = this.diary.filter(item => item.id !== id);
    this.saveState();
    this.syncToCloud('delete_diary', id);
  },

  clearTodayDiary() {
    const todayStr = new Date().toISOString().split('T')[0];
    this.diary = this.diary.filter(item => item.date !== todayStr);
    this.saveState();
    this.syncToCloud('clear_today_diary', todayStr);
  },

  // Infer current meal type based on hour
  inferMealType() {
    const hour = new Date().getHours();
    if (hour < 10) return 'breakfast';
    if (hour < 15) return 'lunch';
    if (hour < 19) return 'dinner';
    return 'snack';
  },

  // Get recently eaten menu names for Anti-Monotony
  getRecentEatenMenuNames(limit = 2) {
    const recent = this.diary.slice(0, limit);
    return recent.map(item => item.menuName.trim().toLowerCase());
  },

  // Reset stalls to preset default
  resetStallsToPreset() {
    this.stalls = JSON.parse(JSON.stringify(window.SIETPresets.stalls));
    this.canteenInfo.name = window.SIETPresets.canteenName;
    this.saveState();
    this.syncToCloud('full_canteen_sync');
  },

  // Update profile and recalculate targets
  updateProfile(newProfile) {
    this.profile = { ...this.profile, ...newProfile };
    this.saveState();
    this.syncToCloud('save_profile');
  },

  // Update settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveState();
  }
};
