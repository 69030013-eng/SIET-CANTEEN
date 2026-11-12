/**
 * Gemini Vision AI Food & Nutrition Recognition Engine
 * Integrates with Google Gemini API (1.5 Flash / 2.0 Flash)
 * Includes Smart Offline/Demo AI fallback for immediate out-of-the-box testing.
 */

window.SIETGemini = {
  // Pre-configured simulated recognitions for Demo Mode
  demoPresets: [
    {
      foodName: 'ข้าวราดผัดกะเพราหมูสับ + ไข่ดาวกรอบ',
      portionDesc: '1 จานมาตรฐาน (ประมาณ 380 กรัม)',
      estimatedCalories: 580,
      macronutrients: { protein: 28, carbs: 62, fat: 24, sodium: 980 },
      estimatedPrice: 50,
      healthRating: 'B',
      healthAdvice: 'โปรตีนดีจากหมูสับและไข่ แต่มีน้ำมันผัดและโซเดียมค่อนข้างสูง แนะนำให้ดื่มน้ำมากๆ และลดของทอดในมื้อเย็น',
      ingredients: ['หมูสับ', 'ข้าวสวยหอมมะลิ', 'ใบกะเพรา', 'พริกขี้หนู', 'ไข่ดาว']
    },
    {
      foodName: 'สุกี้น้ำรวมมิตรผักเยอะ (อกไก่ + กุ้ง + ไข่)',
      portionDesc: '1 ชามใหญ่ (ประมาณ 450 กรัม)',
      estimatedCalories: 290,
      macronutrients: { protein: 26, carbs: 28, fat: 6, sodium: 850 },
      estimatedPrice: 50,
      healthRating: 'A',
      healthAdvice: 'ยอดเยี่ยมสำหรับควบคุมน้ำหนัก! แคลอรี่ต่ำ ไฟเบอร์สูง ไขมันต่ำมาก แต่ระวังซดน้ำซุปจนหมดเพราะมีโซเดียม',
      ingredients: ['ผักกาดขาว', 'ผักบุ้ง', 'วุ้นเส้น', 'อกไก่', 'กุ้งสด', 'ไข่ไก่']
    },
    {
      foodName: 'ข้าวมันไก่ต้ม (ไก่เนื้ออก ไม่เอาหนัง)',
      portionDesc: '1 จาน (ประมาณ 320 กรัม)',
      estimatedCalories: 430,
      macronutrients: { protein: 32, carbs: 54, fat: 9, sodium: 650 },
      estimatedPrice: 45,
      healthRating: 'A',
      healthAdvice: 'เมนูสุขภาพที่ดีมากเมื่อเลือกเนื้ออกไม่เอาหนัง ได้โปรตีนสูงไขมันต่ำ น้ำจิ้มควรตักราดพอดีๆ ไม่หวานเกินไป',
      ingredients: ['เนื้ออกไก่ต้ม', 'ข้าวมันสูตรน้ำซุปใส', 'แตงกวา', 'เลือดหมูต้ม', 'น้ำจิ้มเต้าเจี้ยว']
    },
    {
      foodName: 'เส้นหมี่น้ำใสลูกชิ้นปลา + หมูชิ้น',
      portionDesc: '1 ชาม (ประมาณ 350 กรัม)',
      estimatedCalories: 280,
      macronutrients: { protein: 20, carbs: 42, fat: 4, sodium: 890 },
      estimatedPrice: 45,
      healthRating: 'A',
      healthAdvice: 'พลังงานต่ำ อิ่มสบายท้อง เส้นหมี่ให้พลังงานกำลังดี ไขมันต่ำมาก ปรุงรสด้วยพริกป่นหรือน้ำส้มสายชูแทนการเติมน้ำตาล',
      ingredients: ['เส้นหมี่ขาว', 'ลูกชิ้นปลาแท้', 'หมูชิ้นนุ่ม', 'ถั่วงอก', 'น้ำซุปใส']
    },
    {
      foodName: 'สลัดอกไก่ฉีก & ไข่ต้ม น้ำสลัดงาญี่ปุ่น',
      portionDesc: '1 กล่อง (ประมาณ 280 กรัม)',
      estimatedCalories: 260,
      macronutrients: { protein: 25, carbs: 14, fat: 11, sodium: 480 },
      estimatedPrice: 50,
      healthRating: 'A+',
      healthAdvice: 'เมนูสุดยอดเพื่อสุขภาพ ช่วยลดไขมันสะสม มีสารต้านอนุมูลอิสระจากผักสลัดหลากสีและไขมันดีจากงาขาว',
      ingredients: ['ผักสลัดกรีนโอ๊ค เรดโอ๊ค', 'อกไก่ฉีก', 'ไข่ต้มยางมะตูม', 'มะเขือเทศราชินี', 'น้ำสลัดงาคั่ว']
    }
  ],

  /**
   * Convert File to Base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Analyze food image with Gemini Vision API or Fallback Demo
   */
  async analyzeFoodImage(base64DataUrl, onProgress) {
    const apiKey = window.SIETState.settings.geminiApiKey?.trim();

    if (onProgress) onProgress("กำลังวิเคราะห์องค์ประกอบอาหารในภาพ...");

    // If no API Key is provided, use high-fidelity Smart Demo Mode
    if (!apiKey) {
      // Simulate realistic AI network latency (1.2s)
      await new Promise(r => setTimeout(r, 1200));

      const randomIndex = Math.floor(Math.random() * this.demoPresets.length);
      const result = JSON.parse(JSON.stringify(this.demoPresets[randomIndex]));
      return {
        ...result,
        isSimulated: true,
        notice: 'วิเคราะห์ด้วย AI Demo Preset (ใส่ Gemini API Key ในแท็บตั้งค่าเพื่อเชื่อมต่อ Gemini 1.5/2.0 Flash จริง)'
      };
    }

    // Call Real Gemini Vision API
    try {
      if (onProgress) onProgress("เชื่อมต่อ Google Gemini Vision API...");

      // Extract base64 raw string and mime type
      const match = base64DataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (!match) {
        throw new Error("Invalid image base64 format");
      }
      const mimeType = match[1];
      const base64Data = match[2];

      const promptText = `
คุณคือนักกำหนดอาหารและผู้เชี่ยวชาญโภชนาการอาหารไทย
กรุณาวิเคราะห์ภาพถ่ายอาหารจานนี้ในโรงอาหาร/ร้านอาหารตามสั่ง
ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น ห้ามใส่เครื่องหมาย markdown หรือข้อความอื่นนอกเหนือจาก JSON:
{
  "foodName": "ชื่อเมนูอาหารภาษาไทยที่ตรงที่สุด",
  "portionDesc": "ขนาดและปริมาณของจาน เช่น 1 จาน ประมาณ 350 กรัม",
  "estimatedCalories": 450,
  "macronutrients": {
    "protein": 24,
    "carbs": 58,
    "fat": 14,
    "sodium": 820
  },
  "estimatedPrice": 45,
  "healthRating": "A" (เลือกจาก A, B, C, D),
  "healthAdvice": "คำแนะนำสั้นๆ 1-2 ประโยคสำหรับผู้คุมน้ำหนักและสุขภาพ",
  "ingredients": ["วัตถุดิบ 1", "วัตถุดิบ 2", "วัตถุดิบ 3"]
}
`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          responseMimeType: "application/json"
        }
      };

      // Try gemini-1.5-flash or gemini-2.0-flash
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `API Error HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("AI ไม่ส่งผลลัพธ์ข้อความกลับมา");
      }

      // Clean markdown code blocks if any
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        ...parsed,
        isSimulated: false,
        notice: 'วิเคราะห์สำเร็จด้วย Google Gemini Vision AI'
      };

    } catch (err) {
      console.warn("Gemini API call failed, falling back to Demo Mode:", err);
      // Fallback with warning
      const randomIndex = Math.floor(Math.random() * this.demoPresets.length);
      const fallbackResult = JSON.parse(JSON.stringify(this.demoPresets[randomIndex]));
      return {
        ...fallbackResult,
        isSimulated: true,
        notice: `API เกิดข้อผิดพลาด (${err.message}) ระบบจึงสลับมาใช้ผลลัพธ์จำลองชั่วคราว`
      };
    }
  }
};
