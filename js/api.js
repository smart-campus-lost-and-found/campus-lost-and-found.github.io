/**
 * Chandigarh University - Official Lost & Found Portal
 * Central API Client & Hybrid Storage Sync
 * Connected to Live Cloud Database on Render
 */

window.CampusAPI = (function () {
  'use strict';

  // LIVE CLOUD BACKEND URL (Verified & Active)
  const BACKEND_URL = 'https://campus-lost-and-found-github-io-1.onrender.com';

  let backendUrl = BACKEND_URL;
  let isConnectedToCloud = false;

  // Clear any old corrupted or local file paths from memory
  try {
    const oldUrl = localStorage.getItem('cu_backend_api_url');
    if (oldUrl && (oldUrl.startsWith('file:') || oldUrl.includes(':\\') || oldUrl.includes('localhost'))) {
      localStorage.removeItem('cu_backend_api_url');
    }
  } catch (e) {}

  // Helper to construct endpoint URLs safely
  function getEndpoint(path) {
    const base = backendUrl.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
  }

  // Update visual connection indicator in the UI
  function updateConnectionBadge(online) {
    const badge = document.getElementById('backendStatusBadge');
    if (badge) {
      if (online) {
        badge.innerHTML = '&#128994; Cloud DB Connected';
        badge.className = 'backend-status-pill connected';
        badge.title = 'Live Central Database: ' + backendUrl;
      } else {
        badge.innerHTML = '&#128993; Local Storage Mode';
        badge.className = 'backend-status-pill offline';
        badge.title = 'Running in offline/local browser mode.';
      }
    }
  }

  // Check backend health
  async function checkHealth() {
    try {
      const res = await fetch(getEndpoint('/api/health'), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      });
      if (res.ok) {
        const data = await res.json();
        isConnectedToCloud = true;
        updateConnectionBadge(true);
        return { online: true, data };
      }
    } catch (e) {
      console.warn('Backend server connecting...', e);
    }

    isConnectedToCloud = false;
    updateConnectionBadge(false);
    return { online: false };
  }

  // 1. Fetch Items with filters
  async function getItems(params = {}) {
    if (isConnectedToCloud) {
      try {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.category && params.category !== 'all') query.append('category', params.category);
        if (params.type && params.type !== 'all') query.append('type', params.type);
        if (params.location && params.location !== 'all') query.append('location', params.location);
        if (params.status !== undefined && params.status !== 'all') query.append('status', params.status);

        const url = getEndpoint(`/api/items?${query.toString()}`);
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) {
            PortalDB.saveItems(data.items);
            return data.items;
          }
        }
      } catch (err) {
        console.warn('Backend query failed, falling back to local DB', err);
      }
    }
    return filterLocalItems(params);
  }

  // Local filtering logic fallback
  function filterLocalItems(params) {
    const all = PortalDB.loadItems();
    return all.filter((item) => {
      if (params.search) {
        const q = params.search.toLowerCase().trim();
        const searchable = [
          item.title,
          item.description,
          item.location,
          item.id,
          item.campusBlock,
          item.category
        ].join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      if (params.category && params.category !== 'all' && item.category !== params.category) {
        return false;
      }
      if (params.type && params.type !== 'all' && item.type !== params.type) {
        return false;
      }
      if (params.location && params.location !== 'all' && item.location !== params.location) {
        return false;
      }
      if (params.status !== undefined && params.status !== 'all' && String(item.status) !== String(params.status)) {
        return false;
      }
      return true;
    });
  }

  // 2. Get Single Item / Track
  async function getItemById(id) {
    if (isConnectedToCloud) {
      try {
        const res = await fetch(getEndpoint(`/api/items/${encodeURIComponent(id)}`));
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend item lookup failed, falling back to local DB', err);
      }
    }
    const cleanId = String(id).toLowerCase().trim();
    const all = PortalDB.loadItems();
    return all.find((x) =>
      x.id.toLowerCase() === cleanId ||
      (x.claim && x.claim.studentUid && x.claim.studentUid.toLowerCase() === cleanId)
    ) || null;
  }

  // 3. Create Item Report
  async function createItem(itemData) {
    if (isConnectedToCloud) {
      try {
        const res = await fetch(getEndpoint('/api/items'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });
        if (res.ok) {
          const result = await res.json();
          const local = PortalDB.loadItems();
          local.unshift(result.item);
          PortalDB.saveItems(local);
          return result.item;
        }
      } catch (err) {
        console.warn('Backend save failed, saving locally', err);
      }
    }

    const local = PortalDB.loadItems();
    const newId = PortalDB.generateNextId(local);
    const newItem = {
      ...itemData,
      id: newId,
      status: 0,
      createdAt: new Date().toISOString()
    };
    local.unshift(newItem);
    PortalDB.saveItems(local);
    return newItem;
  }

  // 4. Submit Claim
  async function submitClaim(itemId, claimData) {
    if (isConnectedToCloud) {
      try {
        const res = await fetch(getEndpoint(`/api/items/${encodeURIComponent(itemId)}/claim`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(claimData)
        });
        if (res.ok) {
          const result = await res.json();
          const local = PortalDB.loadItems();
          const idx = local.findIndex((x) => x.id === itemId);
          if (idx !== -1) {
            local[idx] = result.item;
            PortalDB.saveItems(local);
          }
          return result.item;
        }
      } catch (err) {
        console.warn('Backend claim failed, saving locally', err);
      }
    }

    const local = PortalDB.loadItems();
    const item = local.find((x) => x.id === itemId);
    if (item) {
      item.claim = {
        ...claimData,
        submittedOn: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        adminNotes: 'Claim received. Awaiting Security Officer in-person verification.'
      };
      if (item.status === 0) item.status = 1;
      PortalDB.saveItems(local);
      return item;
    }
    throw new Error('Item not found');
  }

  // 5. Update Status
  async function updateStatus(itemId, newStatus, adminNotes = '') {
    if (isConnectedToCloud) {
      try {
        const res = await fetch(getEndpoint(`/api/items/${encodeURIComponent(itemId)}/status`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus, adminNotes })
        });
        if (res.ok) {
          const result = await res.json();
          const local = PortalDB.loadItems();
          const idx = local.findIndex((x) => x.id === itemId);
          if (idx !== -1) {
            local[idx] = result.item;
            PortalDB.saveItems(local);
          }
          return result.item;
        }
      } catch (err) {
        console.warn('Backend status update failed, saving locally', err);
      }
    }

    const local = PortalDB.loadItems();
    const item = local.find((x) => x.id === itemId);
    if (item) {
      item.status = Number(newStatus);
      if (adminNotes && item.claim) {
        item.claim.adminNotes = adminNotes;
      }
      PortalDB.saveItems(local);
      return item;
    }
    throw new Error('Item not found');
  }

  // 6. Reset Database
  async function resetDatabase() {
    if (isConnectedToCloud) {
      try {
        await fetch(getEndpoint('/api/admin/reset'), { method: 'POST' });
      } catch (e) {
        console.warn('Cloud reset failed', e);
      }
    }
    return PortalDB.resetToDefault();
  }

  const apiObj = {
    checkHealth,
    getItems,
    getItemById,
    createItem,
    submitClaim,
    updateStatus,
    resetDatabase,
    isOnline: () => isConnectedToCloud,
    setBackendUrl: function (url) {
      backendUrl = (url || BACKEND_URL).trim();
      localStorage.setItem('cu_backend_api_url', backendUrl);
      return checkHealth();
    },
    getBackendUrl: () => backendUrl
  };

  // Run health check immediately when script loads!
  checkHealth();

  return apiObj;
})();

// Also expose as global variable
var CampusAPI = window.CampusAPI;
