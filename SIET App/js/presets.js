/**
 * Preset data for SIET Smart Canteen App
 * Includes realistic Thai canteen stalls, menus, nutritional estimations, and modifiers
 */

window.SIETPresets = {
  canteenName: "โรงอาหารกลาง (Main Canteen)",
  dailyBudget: 150, // บาท/วัน
  targetCalories: 1800, // kcal/วัน (default)
  
  defaultProfile: {
    gender: 'male',
    age: 22,
    weight: 68,
    height: 172,
    activityLevel: 1.375, // ออกกำลังกายเบาๆ 1-3 วัน/สัปดาห์
    goal: 'deficit', // 'deficit' (-500 kcal), 'maintain' (0), 'surplus' (+300 kcal)
    tdee: 2150,
    bmr: 1620,
    targetCalories: 1650,
    dailyBudget: 150
  },

  modifiers: {
    rice: [
      { id: 'rice_normal', name: '🍚 ข้าวปกติ', cal: 0, price: 0 },
      { id: 'rice_half', name: '🍚 ข้าวครึ่งจาน (-80 kcal)', cal: -80, price: 0 },
      { id: 'rice_none', name: '🥗 ไม่เอาข้าว (-160 kcal)', cal: -160, price: 0 },
      { id: 'rice_extra', name: '🍚 ข้าวพิเศษ (+100 kcal / +5฿)', cal: 100, price: 5 }
    ],
    addons: [
      { id: 'add_boiled_egg', name: '🥚 เพิ่มไข่ต้ม (+75 kcal / +10฿)', cal: 75, price: 10 },
      { id: 'add_fried_egg', name: '🍳 เพิ่มไข่ดาว (+120 kcal / +10฿)', cal: 120, price: 10 },
      { id: 'add_omelet', name: '🥞 เพิ่มไข่เจียว (+180 kcal / +12฿)', cal: 180, price: 12 },
      { id: 'add_extra_meat', name: '🥩 พิเศษเนื้อสัตว์ (+110 kcal / +15฿)', cal: 110, price: 15 },
      { id: 'sub_no_garlic', name: '🧄 ไม่ใส่กระเทียมเจียว (-50 kcal)', cal: -50, price: 0 },
      { id: 'sub_no_skin', name: '🍗 ไม่เอาหนังไก่ (-70 kcal)', cal: -70, price: 0 },
      { id: 'sub_less_sugar', name: '🧂 ไม่ใส่น้ำตาล / หวานน้อย (-30 kcal)', cal: -30, price: 0 }
    ]
  },

  stalls: [
    {
      id: 'stall-1',
      name: 'ร้านป้าศรี ข้าวราดแกง & ตามสั่ง',
      icon: '🍲',
      color: '#F97316', // Orange
      menus: [
        { id: 'm-1-1', name: 'ข้าวราดแกงส้มชะอมกุ้ง', price: 40, calories: 320, category: 'ต้ม/แกง', tags: ['โปรตีน', 'ไขมันต่ำ'] },
        { id: 'm-1-2', name: 'ข้าวราดผัดกะเพราหมูสับ', price: 40, calories: 550, category: 'ตามสั่ง', tags: ['ยอดนิยม', 'รสจัด'] },
        { id: 'm-1-3', name: 'ข้าวราดพะแนงหมู', price: 40, calories: 490, category: 'แกงกะทิ', tags: ['แกง'] },
        { id: 'm-1-4', name: 'ข้าวราดไข่พะโล้หมู', price: 40, calories: 430, category: 'ต้ม', tags: ['โปรตีน'] },
        { id: 'm-1-5', name: 'ข้าวราดต้มจืดเต้าหู้หมูสับ', price: 35, calories: 230, category: 'ต้ม/แกง', tags: ['คลีน', 'ไขมันต่ำ'] },
        { id: 'm-1-6', name: 'ข้าวผัดกะเพราอกไก่ (น้ำมันน้อย)', price: 45, calories: 360, category: 'ตามสั่ง', tags: ['คลีน', 'โปรตีนสูง'] },
        { id: 'm-1-7', name: 'ข้าวราดผัดผักรวมมิตรหมูชิ้น', price: 35, calories: 310, category: 'ผัด', tags: ['ผักเยอะ', 'ใยอาหาร'] }
      ]
    },
    {
      id: 'stall-2',
      name: 'ร้านเจ๊หมวย ก๋วยเตี๋ยวปลา & ต้มยำ',
      icon: '🍜',
      color: '#3B82F6', // Blue
      menus: [
        { id: 'm-2-1', name: 'เส้นหมี่น้ำใสลูกชิ้นปลา', price: 45, calories: 280, category: 'ก๋วยเตี๋ยว', tags: ['ไขมันต่ำ', 'คลีน'] },
        { id: 'm-2-2', name: 'บะหมี่ต้มยำหมูสับ', price: 50, calories: 430, category: 'ก๋วยเตี๋ยว', tags: ['รสจัด', 'ยอดนิยม'] },
        { id: 'm-2-3', name: 'เกาเหลาเลือดหมูใบตำลึง + ข้าวเปล่า', price: 45, calories: 310, category: 'ต้ม', tags: ['โปรตีนสูง', 'ผักเยอะ'] },
        { id: 'm-2-4', name: 'เส้นเล็กแห้งต้มยำหมู', price: 50, calories: 470, category: 'ก๋วยเตี๋ยว', tags: ['แห้ง'] },
        { id: 'm-2-5', name: 'วุ้นเส้นน้ำใสไก่ฉีก', price: 40, calories: 240, category: 'ก๋วยเตี๋ยว', tags: ['แคลอรี่ต่ำ', 'คลีน'] },
        { id: 'm-2-6', name: 'ก๋วยเตี๋ยวเส้นใหญ่น้ำตกเนื้อ', price: 50, calories: 460, category: 'ก๋วยเตี๋ยว', tags: ['เข้มข้น'] }
      ]
    },
    {
      id: 'stall-3',
      name: 'ร้านลุงหนุ่ม ข้าวมันไก่ & ข้าวหมูแดง',
      icon: '🍗',
      color: '#EAB308', // Amber/Yellow
      menus: [
        { id: 'm-3-1', name: 'ข้าวมันไก่ต้ม (ไม่เอาหนัง)', price: 45, calories: 440, category: 'จานเดียว', tags: ['โปรตีนสูง', 'ยอดนิยม'] },
        { id: 'm-3-2', name: 'ข้าวมันไก่ทอด', price: 50, calories: 650, category: 'จานเดียว', tags: ['ของทอด', 'แคลอรี่สูง'] },
        { id: 'm-3-3', name: 'ข้าวหน้าไก่ต้ม (ข้าวสวยธรรมดา)', price: 40, calories: 340, category: 'จานเดียว', tags: ['คลีน', 'ไขมันต่ำ'] },
        { id: 'm-3-4', name: 'ข้าวหมูแดงล้วน (ไม่เอากรอบ)', price: 45, calories: 430, category: 'จานเดียว', tags: ['โปรตีน'] },
        { id: 'm-3-5', name: 'ข้าวหมูกรอบล้วน', price: 50, calories: 680, category: 'จานเดียว', tags: ['ของทอด', 'ไขมันสูง'] }
      ]
    },
    {
      id: 'stall-4',
      name: 'ร้านเจ๊แต๋ว อาหารตามสั่ง & สุกี้',
      icon: '🍳',
      color: '#10B981', // Emerald
      menus: [
        { id: 'm-4-1', name: 'สุกี้น้ำรวมมิตร (ไม่ใส่น้ำมัน)', price: 50, calories: 270, category: 'สุกี้/ต้ม', tags: ['คลีน', 'ผักเยอะ', 'ลดน้ำหนัก'] },
        { id: 'm-4-2', name: 'สุกี้แห้งไก่', price: 50, calories: 390, category: 'สุกี้/ผัด', tags: ['ผักเยอะ'] },
        { id: 'm-4-3', name: 'ผัดซีอิ๊วหมูนุ่มเส้นใหญ่', price: 50, calories: 570, category: 'ผัด', tags: ['เส้น', 'ยอดนิยม'] },
        { id: 'm-4-4', name: 'ข้าวผัดไข่ใส่ไก่', price: 45, calories: 490, category: 'ข้าวผัด', tags: ['จานเดียว'] },
        { id: 'm-4-5', name: 'ราดหน้าหมูนุ่มเส้นหมี่ขาว', price: 50, calories: 410, category: 'เส้น', tags: ['ผักคะน้า'] }
      ]
    },
    {
      id: 'stall-5',
      name: 'ร้านกรีนไลฟ์ สลัดผลไม้ & น้ำสมุนไพร',
      icon: '🥗',
      color: '#06B6D4', // Cyan
      menus: [
        { id: 'm-5-1', name: 'สลัดอกไก่ฉีกไข่ต้ม น้ำสลัดงาญี่ปุ่น', price: 50, calories: 250, category: 'สลัด', tags: ['คลีน', 'โปรตีนสูง', 'ไฟเบอร์'] },
        { id: 'm-5-2', name: 'ผลไม้รวมจานสด (แตงโม+ฝรั่ง+สับปะรด)', price: 25, calories: 90, category: 'ผลไม้', tags: ['วิตามิน', 'หวานธรรมชาติ'] },
        { id: 'm-5-3', name: 'น้ำเต้าหู้หวานน้อยทรงเครื่อง', price: 15, calories: 120, category: 'เครื่องดื่ม', tags: ['โปรตีนพืช'] },
        { id: 'm-5-4', name: 'ชาเขียวมะลิแท้ ไม่ใส่น้ำตาล (0 kcal)', price: 20, calories: 5, category: 'เครื่องดื่ม', tags: ['0แคลอรี่', 'คีโต'] },
        { id: 'm-5-5', name: 'แซนด์วิชไข่ต้มอกไก่ ขนมปังโฮลวีท', price: 30, calories: 210, category: 'ของว่าง', tags: ['โฮลวีท', 'พกพาสะดวก'] }
      ]
    }
  ]
};
