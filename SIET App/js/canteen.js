/**
 * Canteen, Stall & Menu Management Controller
 * Handles CRUD operations, category filters, and JSON Import/Export
 */

window.SIETCanteen = {
  // Available stall icon options
  stallIcons: ['🍲', '🍜', '🍗', '🍳', '🥗', '🥘', '🍛', '🍱', '🍙', '🥩', '☕', '🥤'],

  // Preset stall theme colors
  stallColors: ['#F97316', '#3B82F6', '#EAB308', '#10B981', '#06B6D4', '#8B5CF6', '#EC4899', '#EF4444'],

  /**
   * Add a new stall
   */
  addStall(name, icon, color) {
    if (!name || !name.trim()) return null;
    const newStall = {
      id: 'stall-' + Date.now(),
      name: name.trim(),
      icon: icon || '🍲',
      color: color || '#3B82F6',
      menus: []
    };
    window.SIETState.stalls.push(newStall);
    window.SIETState.saveState();
    window.SIETState.syncToCloud('save_stall', newStall);
    return newStall;
  },

  /**
   * Edit stall info
   */
  updateStall(stallId, name, icon, color) {
    const stall = window.SIETState.stalls.find(s => s.id === stallId);
    if (!stall) return false;
    stall.name = name.trim();
    if (icon) stall.icon = icon;
    if (color) stall.color = color;
    window.SIETState.saveState();
    window.SIETState.syncToCloud('save_stall', stall);
    return true;
  },

  /**
   * Delete stall
   */
  deleteStall(stallId) {
    window.SIETState.stalls = window.SIETState.stalls.filter(s => s.id !== stallId);
    window.SIETState.saveState();
    window.SIETState.syncToCloud('delete_stall', stallId);
  },

  /**
   * Add menu item to a stall
   */
  addMenu(stallId, menuData) {
    const stall = window.SIETState.stalls.find(s => s.id === stallId);
    if (!stall) return null;

    const newMenu = {
      id: 'm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: menuData.name.trim(),
      price: Math.max(0, Number(menuData.price) || 0),
      calories: Math.max(0, Number(menuData.calories) || 0),
      category: menuData.category || 'อาหารจานเดียว',
      tags: Array.isArray(menuData.tags) ? menuData.tags : (menuData.tags || '').split(',').map(t => t.trim()).filter(Boolean)
    };

    stall.menus.push(newMenu);
    window.SIETState.saveState();
    window.SIETState.syncToCloud('save_menu', { stallId, menu: newMenu });
    return newMenu;
  },

  /**
   * Update menu item
   */
  updateMenu(stallId, menuId, menuData) {
    const stall = window.SIETState.stalls.find(s => s.id === stallId);
    if (!stall) return false;

    const menu = stall.menus.find(m => m.id === menuId);
    if (!menu) return false;

    menu.name = menuData.name.trim();
    menu.price = Math.max(0, Number(menuData.price) || 0);
    menu.calories = Math.max(0, Number(menuData.calories) || 0);
    if (menuData.category) menu.category = menuData.category;
    if (menuData.tags) {
      menu.tags = Array.isArray(menuData.tags) ? menuData.tags : menuData.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    window.SIETState.saveState();
    window.SIETState.syncToCloud('save_menu', { stallId, menu });
    return true;
  },

  /**
   * Delete menu item
   */
  deleteMenu(stallId, menuId) {
    const stall = window.SIETState.stalls.find(s => s.id === stallId);
    if (!stall) return false;
    stall.menus = stall.menus.filter(m => m.id !== menuId);
    window.SIETState.saveState();
    window.SIETState.syncToCloud('delete_menu', menuId);
    return true;
  },

  /**
   * Duplicate an existing menu item for fast variation creation
   */
  duplicateMenu(stallId, menuId) {
    const stall = window.SIETState.stalls.find(s => s.id === stallId);
    if (!stall) return null;

    const source = stall.menus.find(m => m.id === menuId);
    if (!source) return null;

    const clonedMenu = {
      id: 'm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: `${source.name} (พิเศษ/เพิ่ม)`,
      price: source.price + 10,
      calories: source.calories + 100,
      category: source.category,
      tags: [...(source.tags || [])]
    };

    stall.menus.push(clonedMenu);
    window.SIETState.saveState();
    window.SIETState.syncToCloud('save_menu', { stallId, menu: clonedMenu });
    return clonedMenu;
  },

  /**
   * Update canteen name
   */
  updateCanteenName(newName) {
    if (!newName || !newName.trim()) return;
    window.SIETState.canteenInfo.name = newName.trim();
    window.SIETState.saveState();
    window.SIETState.syncToCloud('canteen_name', newName.trim());
  },

  /**
   * Export all canteen data and profile as JSON file
   */
  exportData() {
    const data = {
      exportVersion: '1.0',
      exportDate: new Date().toISOString(),
      canteenInfo: window.SIETState.canteenInfo,
      profile: window.SIETState.profile,
      stalls: window.SIETState.stalls,
      settings: window.SIETState.settings
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siet-canteen-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Import data from JSON
   */
  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.stalls)) {
        window.SIETState.stalls = data.stalls;
      }
      if (data.profile) {
        window.SIETState.profile = { ...window.SIETState.profile, ...data.profile };
      }
      if (data.canteenInfo) {
        window.SIETState.canteenInfo = data.canteenInfo;
      }
      window.SIETState.saveState();
      return { success: true };
    } catch(e) {
      return { success: false, error: e.message };
    }
  }
};
