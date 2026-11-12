/**
 * Cloudflare Pages Function: Canteen & Stalls API
 * Routes:
 * GET /api/canteen -> Returns { canteenName, stalls: [...] }
 * POST /api/canteen -> Syncs/Updates canteen and stalls
 */

export async function onRequestGet(context) {
  const db = context.env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database 'DB' binding not found" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. Get canteen name
    const info = await db.prepare("SELECT name FROM canteen_info WHERE id = 1").first();
    const canteenName = info?.name || "โรงอาหารกลาง (Main Canteen)";

    // 2. Get stalls
    const { results: stalls } = await db.prepare("SELECT * FROM stalls ORDER BY sort_order ASC, created_at ASC").all();

    // 3. Get all menus
    const { results: menus } = await db.prepare("SELECT * FROM menus ORDER BY created_at ASC").all();

    // Map menus to their respective stalls
    const stallsWithMenus = (stalls || []).map(stall => {
      const stallMenus = (menus || [])
        .filter(m => m.stall_id === stall.id)
        .map(m => {
          let parsedTags = [];
          try {
            parsedTags = typeof m.tags === 'string' ? JSON.parse(m.tags) : (m.tags || []);
          } catch(e) {
            parsedTags = (m.tags || '').split(',').map(t => t.trim()).filter(Boolean);
          }
          return {
            id: m.id,
            name: m.name,
            price: Number(m.price),
            calories: Number(m.calories),
            category: m.category,
            tags: parsedTags
          };
        });

      return {
        id: stall.id,
        name: stall.name,
        icon: stall.icon,
        color: stall.color,
        sort_order: stall.sort_order,
        menus: stallMenus
      };
    });

    return new Response(JSON.stringify({
      success: true,
      canteenName,
      stalls: stallsWithMenus
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const db = context.env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "D1 Database 'DB' binding not found" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await context.request.json();
    const { action, canteenName, stall, menu, stallId, menuId, stalls } = body;

    // Action 1: Update canteen name
    if (action === 'update_canteen_name' || canteenName) {
      if (canteenName) {
        await db.prepare("INSERT OR REPLACE INTO canteen_info (id, name, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)")
          .bind(canteenName)
          .run();
      }
    }

    // Action 2: Add or update single stall
    if (action === 'save_stall' && stall) {
      await db.prepare(`
        INSERT OR REPLACE INTO stalls (id, name, icon, color, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `).bind(stall.id, stall.name, stall.icon || '🍲', stall.color || '#3B82F6', stall.sort_order || 0).run();
      return new Response(JSON.stringify({ success: true, message: "Stall saved" }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Action 3: Delete stall
    if (action === 'delete_stall' && stallId) {
      await db.batch([
        db.prepare("DELETE FROM menus WHERE stall_id = ?").bind(stallId),
        db.prepare("DELETE FROM stalls WHERE id = ?").bind(stallId)
      ]);
      return new Response(JSON.stringify({ success: true, message: "Stall deleted" }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Action 4: Save menu
    if (action === 'save_menu' && menu && stallId) {
      const tagsStr = JSON.stringify(Array.isArray(menu.tags) ? menu.tags : (menu.tags || '').split(',').map(t => t.trim()).filter(Boolean));
      await db.prepare(`
        INSERT OR REPLACE INTO menus (id, stall_id, name, price, calories, category, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(menu.id, stallId, menu.name, Number(menu.price), Number(menu.calories), menu.category || 'จานเดียว', tagsStr).run();
      return new Response(JSON.stringify({ success: true, message: "Menu saved" }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Action 5: Delete menu
    if (action === 'delete_menu' && menuId) {
      await db.prepare("DELETE FROM menus WHERE id = ?").bind(menuId).run();
      return new Response(JSON.stringify({ success: true, message: "Menu deleted" }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Action 6: Full Sync (saves all stalls and menus)
    if (Array.isArray(stalls)) {
      const queries = [];
      // Clean and recreate
      queries.push(db.prepare("DELETE FROM menus"));
      queries.push(db.prepare("DELETE FROM stalls"));

      stalls.forEach((s, idx) => {
        queries.push(
          db.prepare("INSERT INTO stalls (id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)")
            .bind(s.id, s.name, s.icon || '🍲', s.color || '#3B82F6', idx)
        );

        if (Array.isArray(s.menus)) {
          s.menus.forEach(m => {
            const tagsStr = JSON.stringify(Array.isArray(m.tags) ? m.tags : (m.tags || '').split(',').map(t => t.trim()).filter(Boolean));
            queries.push(
              db.prepare("INSERT INTO menus (id, stall_id, name, price, calories, category, tags) VALUES (?, ?, ?, ?, ?, ?, ?)")
                .bind(m.id, s.id, m.name, Number(m.price), Number(m.calories), m.category || 'จานเดียว', tagsStr)
            );
          });
        }
      });

      if (queries.length > 0) {
        await db.batch(queries);
      }

      return new Response(JSON.stringify({ success: true, message: "All stalls and menus synced to D1" }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: "Canteen updated" }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
