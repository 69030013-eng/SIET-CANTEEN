/**
 * Interactive HTML5 Canvas Roulette Wheel & Smart Randomizer Engine
 * Includes Web Audio API synthesis for wheel ticks & fanfare chimes
 */

window.SIETRoulette = {
  canvas: null,
  ctx: null,
  items: [],
  currentAngle: 0,
  isSpinning: false,
  spinVelocity: 0,
  selectedItem: null,
  activeModifiers: {
    rice: 'rice_normal',
    addons: []
  },
  audioCtx: null,

  // Color palette for slices
  sliceColors: [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', 
    '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
    '#EC4899', '#14B8A6', '#84CC16', '#E11D48'
  ],

  init(canvasElement) {
    this.canvas = canvasElement;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.setupAudio();
    this.updatePool();
    this.drawWheel();
  },

  setupAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch(e) {
      console.warn("Web Audio not supported", e);
    }
  },

  playTickSound() {
    if (!window.SIETState.settings.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.04);
    } catch(e) {}
  },

  playWinFanfare() {
    if (!window.SIETState.settings.soundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime + index * 0.09);
        gain.gain.setValueAtTime(0, this.audioCtx.currentTime + index * 0.09);
        gain.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + index * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + index * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(this.audioCtx.currentTime + index * 0.09);
        osc.stop(this.audioCtx.currentTime + index * 0.09 + 0.35);
      });
    } catch(e) {}
  },

  /**
   * Filter menus based on user requirements:
   * - Selected stall
   * - Budget cap
   * - Calorie cap (Strict TDEE)
   * - Anti-monotony (avoid last 2 meals)
   */
  getFilteredMenus() {
    const filter = window.SIETState.randomizerFilter;
    const stats = window.SIETState.getTodayStats();
    const recentNames = window.SIETState.getRecentEatenMenuNames(window.SIETState.settings.antiMonotonyCount || 2);

    let allMenus = [];
    window.SIETState.stalls.forEach(stall => {
      if (filter.stallId === 'all' || filter.stallId === stall.id) {
        stall.menus.forEach(menu => {
          allMenus.push({
            ...menu,
            stallId: stall.id,
            stallName: stall.name,
            stallIcon: stall.icon,
            stallColor: stall.color
          });
        });
      }
    });

    const totalBeforeFilters = allMenus.length;

    // 1. Budget Filter
    if (filter.maxPrice > 0) {
      allMenus = allMenus.filter(m => m.price <= filter.maxPrice);
    } else if (filter.maxPrice === -1) {
      // Use remaining daily budget
      allMenus = allMenus.filter(m => m.price <= stats.remainingBudget);
    }

    // 2. Strict Calorie Filter (<= remaining calories)
    let calorieFilteredOutCount = 0;
    if (filter.strictCalories && stats.remainingCalories > 0) {
      const filtered = allMenus.filter(m => m.calories <= stats.remainingCalories);
      calorieFilteredOutCount = allMenus.length - filtered.length;
      // If filtering leaves nothing, fall back to lowest calorie items rather than empty
      if (filtered.length > 0) {
        allMenus = filtered;
      }
    }

    // 3. Anti-Monotony Filter
    let monotonyFilteredOutCount = 0;
    if (filter.antiMonotony && recentNames.length > 0) {
      const filtered = allMenus.filter(m => !recentNames.includes(m.name.trim().toLowerCase()));
      monotonyFilteredOutCount = allMenus.length - filtered.length;
      if (filtered.length >= 2) {
        allMenus = filtered;
      }
    }

    return {
      menus: allMenus,
      totalBeforeFilters,
      calorieFilteredOutCount,
      monotonyFilteredOutCount,
      recentNames
    };
  },

  updatePool() {
    const result = this.getFilteredMenus();
    this.items = result.menus;
    return result;
  },

  drawWheel() {
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    this.ctx.clearRect(0, 0, width, height);

    if (this.items.length === 0) {
      // Draw empty wheel placeholder
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#334155';
      this.ctx.fill();
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#64748B';
      this.ctx.stroke();

      this.ctx.fillStyle = '#CBD5E1';
      this.ctx.font = 'bold 15px Sarabun, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('ไม่มีเมนูที่ตรงตามตัวกรอง', centerX, centerY - 10);
      this.ctx.font = '12px Sarabun, sans-serif';
      this.ctx.fillText('กรุณาปรับลดงบหรือผ่อนปรนแคลอรี่', centerX, centerY + 15);
      return;
    }

    const numSlices = this.items.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    // Draw Slices
    for (let i = 0; i < numSlices; i++) {
      const angle = this.currentAngle + (i * sliceAngle);
      const item = this.items[i];

      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
      this.ctx.closePath();

      // Alternate vibrant slice colors
      const color = this.sliceColors[i % this.sliceColors.length];
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.stroke();

      // Draw Text on slice
      this.ctx.save();
      this.ctx.translate(centerX, centerY);
      this.ctx.rotate(angle + sliceAngle / 2);

      this.ctx.textAlign = 'right';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = numSlices > 8 ? 'bold 11px Sarabun, sans-serif' : 'bold 13px Sarabun, sans-serif';
      this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
      this.ctx.shadowBlur = 4;

      // Truncate long menu names
      let displayName = item.name;
      if (displayName.length > 14) {
        displayName = displayName.substring(0, 13) + '…';
      }
      this.ctx.fillText(`${displayName} (${item.price}฿)`, radius - 20, 4);

      this.ctx.restore();
    }

    // Outer rim ring
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.ctx.lineWidth = 8;
    this.ctx.strokeStyle = '#1E293B';
    this.ctx.stroke();

    // Center Hub
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#0F172A';
    this.ctx.fill();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#F59E0B';
    this.ctx.stroke();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🎲', centerX, centerY);
  },

  spin(onComplete) {
    if (this.isSpinning || this.items.length === 0) return;

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.isSpinning = true;
    this.selectedItem = null;

    // Reset active modifiers
    this.activeModifiers = {
      rice: 'rice_normal',
      addons: []
    };

    // Calculate random target rotations (between 4 and 7 full circles + slice offset)
    const extraRotations = 4 + Math.random() * 3;
    const randomExtraAngle = Math.random() * (2 * Math.PI);
    const totalRotationAngle = extraRotations * (2 * Math.PI) + randomExtraAngle;

    const startAngle = this.currentAngle;
    const duration = 3800; // ms
    const startTime = performance.now();

    let lastTickAngle = this.currentAngle;
    const sliceAngle = (2 * Math.PI) / this.items.length;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic: 1 - pow(1 - x, 3)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      this.currentAngle = startAngle + (totalRotationAngle * easeOut);

      // Check slice crossing for sound ticks
      if (Math.abs(this.currentAngle - lastTickAngle) >= sliceAngle) {
        this.playTickSound();
        lastTickAngle = this.currentAngle;
      }

      this.drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.currentAngle = this.currentAngle % (2 * Math.PI);

        // Determine winning slice at the top pointer (angle = 3*PI/2 or -PI/2)
        // Pointer is at the top (270 degrees = 1.5 * PI)
        const pointerAngle = (1.5 * Math.PI) - (this.currentAngle % (2 * Math.PI));
        let normalizedAngle = (pointerAngle % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
        const winningIndex = Math.floor(normalizedAngle / sliceAngle) % this.items.length;

        this.selectedItem = this.items[winningIndex];
        this.playWinFanfare();

        if (onComplete) {
          onComplete(this.selectedItem);
        }
      }
    };

    requestAnimationFrame(animate);
  },

  /**
   * Recalculate total calories and price given current modifiers
   */
  calculateCurrentTotals(item, modifiers) {
    if (!item) return { calories: 0, price: 0 };

    let totalCal = Number(item.calories) || 0;
    let totalPrice = Number(item.price) || 0;

    // 1. Rice modifier
    const riceMod = window.SIETPresets.modifiers.rice.find(r => r.id === modifiers.rice);
    if (riceMod) {
      totalCal += riceMod.cal;
      totalPrice += riceMod.price;
    }

    // 2. Addons modifiers
    if (Array.isArray(modifiers.addons)) {
      modifiers.addons.forEach(addonId => {
        const addon = window.SIETPresets.modifiers.addons.find(a => a.id === addonId);
        if (addon) {
          totalCal += addon.cal;
          totalPrice += addon.price;
        }
      });
    }

    return {
      calories: Math.max(0, totalCal),
      price: Math.max(0, totalPrice)
    };
  }
};
