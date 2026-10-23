/**
 * Chandigarh University - Official Lost & Found Portal
 * Application Engine & Interactive Controller
 * Uses ASCII-safe Unicode escapes to guarantee zero character encoding corruption
 */

(function () {
  'use strict';

  // Application State
  const AppState = {
    items: [],
    activeTab: 'browse',
    searchQuery: '',
    selectedCategory: 'all',
    typeFilter: 'all',
    blockFilter: 'all',
    statusFilter: 'all',
    staffMode: false,
    activeClaimItem: null,
    previewPhotoData: ''
  };

  // DOM Elements Selector Helper
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Sanitization Helper
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Toast System
  function showToast(message, type = 'info') {
    const toast = $('toastNotice');
    const toastMsg = $('toastMessage');
    const toastIcon = $('toastIcon');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    if (toastIcon) {
      toastIcon.textContent = type === 'success' ? '\u2705' : type === 'warning' ? '\u26A0\uFE0F' : '\u2139\uFE0F';
    }

    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3400);
  }

  // Initialize Portal
  function init() {
    AppState.items = PortalDB.loadItems();

    initTheme();
    initNavigation();
    initCategoryPills();
    initLocationDropdowns();
    initHeroSearch();
    initFilters();
    initReportingForm();
    initClaimModal();
    initTracking();
    initStaffControls();

    renderCampusMetrics();
    renderItems();
  }

  // Dark/Light Theme Handler
  function initTheme() {
    const savedTheme = localStorage.getItem('cu_lf_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    const toggleBtn = $('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('cu_lf_theme', next);
        updateThemeIcon(next);
        showToast('Theme switched to ' + next + ' mode');
      });
    }
  }

  function updateThemeIcon(theme) {
    const icon = $('themeIcon');
    if (icon) {
      icon.innerHTML = theme === 'dark' ? '&#9728;&#65039;' : '&#127769;';
    }
  }

  // Navigation & Tab Switching
  function initNavigation() {
    const navButtons = $$('.nav-tab-btn');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-target-tab');
        switchTab(targetTab);
      });
    });

    // Handle any links with data-goto-tab
    document.addEventListener('click', (e) => {
      const gotoLink = e.target.closest('[data-goto-tab]');
      if (gotoLink) {
        e.preventDefault();
        const tab = gotoLink.getAttribute('data-goto-tab');
        switchTab(tab);
      }
    });
  }

  function switchTab(tabId) {
    if (!tabId) return;
    AppState.activeTab = tabId;

    // Update Nav Buttons
    $$('.nav-tab-btn').forEach((btn) => {
      if (btn.getAttribute('data-target-tab') === tabId) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });

    // Update Sections
    $$('.view-section').forEach((sec) => {
      if (sec.id === `section-${tabId}`) {
        sec.classList.add('active');
      } else {
        sec.classList.remove('active');
      }
    });

    // Scroll smoothly to top of main
    $('mainContent').scrollIntoView({ behavior: 'smooth' });

    if (tabId === 'browse') {
      renderItems();
    } else if (tabId === 'security-desk') {
      renderStaffPendingList();
    }
  }

  // Render Stats & Metrics
  function renderCampusMetrics() {
    const totalCount = AppState.items.length;
    const returnedCount = AppState.items.filter((i) => i.status === 3).length;
    const inReviewCount = AppState.items.filter((i) => i.status === 1 || i.status === 2).length;
    const recoveryRate = totalCount > 0 ? Math.round(((returnedCount + inReviewCount) / totalCount) * 100) : 94;

    if ($('statTotalItems')) $('statTotalItems').textContent = totalCount;
    if ($('statReturned')) $('statReturned').textContent = returnedCount;
    if ($('statInReview')) $('statInReview').textContent = inReviewCount;
    if ($('statRate')) $('statRate').textContent = `${recoveryRate}%`;
  }

  // Category Pills Bar
  function initCategoryPills() {
    const container = $('categoryPillsBar');
    if (!container) return;

    let html = `
      <button class="cat-pill active" data-cat="all">
        <span>&#127775;</span> All Categories (${AppState.items.length})
      </button>
    `;

    ITEM_CATEGORIES.forEach((cat) => {
      const count = AppState.items.filter((i) => i.category === cat.id).length;
      html += `
        <button class="cat-pill" data-cat="${cat.id}">
          <span>${cat.icon}</span> ${cat.name} (${count})
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.cat-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        container.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        AppState.selectedCategory = pill.getAttribute('data-cat');
        renderItems();
      });
    });
  }

  // Populate Location Dropdowns
  function initLocationDropdowns() {
    const filterLoc = $('filterCampusBlock');
    const reportLoc = $('reportCampusLocation');

    if (filterLoc) {
      filterLoc.innerHTML = `<option value="all">&#128205; All Campus Blocks &amp; Locations</option>` +
        CAMPUS_LOCATIONS.map((loc) => `<option value="${escapeHtml(loc)}">${escapeHtml(loc)}</option>`).join('');
    }

    if (reportLoc) {
      reportLoc.innerHTML = `<option value="">-- Select Specific Campus Building / Zone --</option>` +
        CAMPUS_LOCATIONS.map((loc) => `<option value="${escapeHtml(loc)}">${escapeHtml(loc)}</option>`).join('');
    }
  }

  // Hero Search Input
  function initHeroSearch() {
    const searchInput = $('heroSearchInput');
    const searchBtn = $('heroSearchBtn');

    if (searchBtn && searchInput) {
      const doSearch = () => {
        AppState.searchQuery = searchInput.value.trim().toLowerCase();
        switchTab('browse');
        renderItems();
      };

      searchBtn.addEventListener('click', doSearch);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSearch();
      });

      // Keyboard shortcut '/' to focus search
      window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchInput.focus();
        }
      });
    }
  }

  // Filter Toolbar Controls
  function initFilters() {
    // Type Segmented Toggle
    $$('.seg-type-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.seg-type-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        AppState.typeFilter = btn.getAttribute('data-type');
        renderItems();
      });
    });

    // Campus Block Dropdown Filter
    const filterBlock = $('filterCampusBlock');
    if (filterBlock) {
      filterBlock.addEventListener('change', (e) => {
        AppState.blockFilter = e.target.value;
        renderItems();
      });
    }

    // Status Filter Dropdown
    const filterStatus = $('filterStatus');
    if (filterStatus) {
      filterStatus.addEventListener('change', (e) => {
        AppState.statusFilter = e.target.value;
        renderItems();
      });
    }

    // Clear Filters Button
    const clearBtn = $('clearFiltersBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        AppState.searchQuery = '';
        AppState.selectedCategory = 'all';
        AppState.typeFilter = 'all';
        AppState.blockFilter = 'all';
        AppState.statusFilter = 'all';

        if ($('heroSearchInput')) $('heroSearchInput').value = '';
        if ($('filterCampusBlock')) $('filterCampusBlock').value = 'all';
        if ($('filterStatus')) $('filterStatus').value = 'all';
        $$('.seg-type-btn').forEach((b) => b.classList.toggle('active', b.getAttribute('data-type') === 'all'));

        initCategoryPills();
        renderItems();
        showToast('All search filters reset');
      });
    }
  }

  // Main Items List Renderer
  function renderItems() {
    const listContainer = $('itemsListGrid');
    const countTag = $('resultsCountTag');
    if (!listContainer) return;

    const filtered = AppState.items.filter((item) => {
      // Search query
      if (AppState.searchQuery) {
        const query = AppState.searchQuery;
        const searchable = [
          item.title,
          item.description,
          item.location,
          item.id,
          item.campusBlock,
          item.category
        ].join(' ').toLowerCase();

        if (!searchable.includes(query)) return false;
      }

      // Category filter
      if (AppState.selectedCategory !== 'all' && item.category !== AppState.selectedCategory) {
        return false;
      }

      // Type filter (lost / found)
      if (AppState.typeFilter !== 'all' && item.type !== AppState.typeFilter) {
        return false;
      }

      // Campus Block filter
      if (AppState.blockFilter !== 'all' && item.location !== AppState.blockFilter) {
        return false;
      }

      // Status filter
      if (AppState.statusFilter !== 'all' && String(item.status) !== String(AppState.statusFilter)) {
        return false;
      }

      return true;
    });

    if (countTag) {
      countTag.textContent = `Showing ${filtered.length} of ${AppState.items.length} items`;
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">&#128269;</div>
          <h3>No Campus Items Match Your Search</h3>
          <p>Try broadening your query, selecting "All Categories", or report this item if you lost or found it today.</p>
          <button class="search-btn" style="margin: 0 auto;" data-goto-tab="report">
            &#128227; Report Lost or Found Item
          </button>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map((item) => {
      const catObj = ITEM_CATEGORIES.find((c) => c.id === item.category) || { name: item.category, icon: '\uD83D\uDCE6' };
      const statusObj = STATUS_PIPELINE[item.status] || STATUS_PIPELINE[0];
      const isFound = item.type === 'found';
      const hasClaim = !!item.claim;

      return `
        <article class="item-card" data-item-id="${item.id}">
          <div class="card-media">
            ${item.imageUrl ? `
              <img src="${item.imageUrl}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'media-fallback-icon\\'>${catObj.icon}</div>'">
            ` : `
              <div class="media-fallback-icon">${catObj.icon}</div>
            `}
            <div class="card-floating-badges">
              <span class="type-badge ${item.type}">
                ${isFound ? '&#128994; Found Item' : '&#128993; Lost Report'}
              </span>
              <span class="ref-code-chip">${item.id}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="card-category-row">
              <span>${catObj.icon}</span> ${catObj.name}
            </div>

            <h3 class="card-title">${escapeHtml(item.title)}</h3>

            <div class="card-location-meta">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>${escapeHtml(item.location)}</span>
            </div>

            <div class="card-desc">
              ${escapeHtml(item.description)}
            </div>

            <div class="status-pill-container">
              <span class="status-badge-inline ${statusObj.badgeClass}">
                &bull; ${statusObj.label}
              </span>
              <span style="font-size:0.75rem; color:var(--text-muted); float:right; margin-top:2px;">
                ${item.date}
              </span>
            </div>

            ${hasClaim && item.status < 3 ? `
              <div style="background:var(--cu-gold-100); border:1px solid #fde68a; border-radius:var(--radius-md); padding:0.5rem 0.75rem; font-size:0.78rem; color:#92400e; margin-bottom:0.75rem;">
                <strong>Claim Submitted:</strong> Student UID ${escapeHtml(item.claim.studentUid)} awaiting Security review.
              </div>
            ` : ''}

            <div class="card-actions-row">
              ${isFound && item.status === 0 ? `
                <button class="btn-card primary action-claim-btn" data-claim-id="${item.id}">
                  &#128587; Claim This Item
                </button>
              ` : `
                <button class="btn-card secondary action-track-btn" data-track-id="${item.id}">
                  &#128270; Track Status
                </button>
              `}
              <button class="btn-card secondary action-detail-btn" data-detail-id="${item.id}">
                Details
              </button>

              ${AppState.staffMode ? `
                <button class="btn-card staff-btn action-staff-advance" data-advance-id="${item.id}">
                  &#9889; Step +1
                </button>
              ` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach dynamic click listeners
    listContainer.querySelectorAll('.action-claim-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-claim-id');
        openClaimModal(id);
      });
    });

    listContainer.querySelectorAll('.action-track-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-track-id');
        switchTab('track');
        trackItemCode(id);
      });
    });

    listContainer.querySelectorAll('.action-detail-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-detail-id');
        openDetailModal(id);
      });
    });

    if (AppState.staffMode) {
      listContainer.querySelectorAll('.action-staff-advance').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-advance-id');
          advanceItemStatus(id);
        });
      });
    }
  }

  // Advance Status (Staff Feature)
  function advanceItemStatus(id) {
    const item = AppState.items.find((x) => x.id === id);
    if (!item) return;

    if (item.status < 3) {
      item.status += 1;
      PortalDB.saveItems(AppState.items);
      renderCampusMetrics();
      renderItems();
      renderStaffPendingList();
      showToast('Updated ' + item.id + ' status to: ' + STATUS_PIPELINE[item.status].label, 'success');
    } else {
      showToast(item.id + ' is already in completed state.', 'warning');
    }
  }

  // Item Detail Modal
  function openDetailModal(id) {
    const item = AppState.items.find((x) => x.id === id);
    if (!item) return;

    const modal = $('itemDetailDialog');
    const catObj = ITEM_CATEGORIES.find((c) => c.id === item.category) || { name: item.category, icon: '\uD83D\uDCE6' };
    const statusObj = STATUS_PIPELINE[item.status] || STATUS_PIPELINE[0];

    $('detailModalTitle').textContent = item.title;
    $('detailModalContent').innerHTML = `
      <div style="margin-bottom:1.25rem;">
        ${item.imageUrl ? `<img src="${item.imageUrl}" style="width:100%; max-height:240px; object-fit:cover; border-radius:var(--radius-md); margin-bottom:1rem;" onerror="this.style.display='none'">` : ''}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span class="type-badge ${item.type}">${item.type === 'found' ? '&#128994; Found Item' : '&#128993; Lost Item'}</span>
          <span class="status-badge-inline ${statusObj.badgeClass}">${statusObj.label}</span>
        </div>
        <p style="font-size:0.95rem; color:var(--text-secondary); margin-bottom:1rem;">${escapeHtml(item.description)}</p>

        <div class="track-detail-grid" style="margin-top:0;">
          <div class="detail-item-col">
            <span class="lbl">Campus Reference</span>
            <span class="val" style="font-family:monospace;">${item.id}</span>
          </div>
          <div class="detail-item-col">
            <span class="lbl">Category</span>
            <span class="val">${catObj.icon} ${catObj.name}</span>
          </div>
          <div class="detail-item-col">
            <span class="lbl">Reported Date & Time</span>
            <span class="val">${item.date} (${item.time || 'Office Hours'})</span>
          </div>
          <div class="detail-item-col">
            <span class="lbl">Location Block</span>
            <span class="val">${escapeHtml(item.location)}</span>
          </div>
          <div class="detail-item-col" style="grid-column:1/-1;">
            <span class="lbl">Official Custody Desk</span>
            <span class="val">${escapeHtml(item.custodianDesk || 'Central Security Desk Gate 1')}</span>
          </div>
          <div class="detail-item-col" style="grid-column:1/-1;">
            <span class="lbl">Reporting Authority / Contact</span>
            <span class="val">${escapeHtml(item.reportingPerson || 'Security Attendant')} (${escapeHtml(item.contact || 'Ext 401')})</span>
          </div>
        </div>

        ${item.privateIdentifier ? `
          <div style="background:var(--color-warning-bg); border:1px solid var(--color-warning-border); padding:0.8rem; border-radius:var(--radius-md); margin-top:1rem; font-size:0.84rem;">
            <strong>&#128274; Verification Policy:</strong> Anyone claiming this item must verify private specifics (e.g. ${escapeHtml(item.privateIdentifier)}).
          </div>
        ` : ''}
      </div>

      <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem;">
        ${item.type === 'found' && item.status === 0 ? `
          <button class="btn-card primary" id="btnModalClaimAction" style="padding:0.75rem 1.25rem;">&#128587; Claim This Item</button>
        ` : ''}
        <button class="btn-card secondary" id="btnModalTrackAction" style="padding:0.75rem 1.25rem;">&#128270; Track Status</button>
        <button class="btn-card secondary" id="btnModalCloseAction" style="padding:0.75rem 1.25rem;">Close</button>
      </div>
    `;

    if ($('btnModalClaimAction')) {
      $('btnModalClaimAction').addEventListener('click', () => {
        modal.close();
        openClaimModal(item.id);
      });
    }

    if ($('btnModalTrackAction')) {
      $('btnModalTrackAction').addEventListener('click', () => {
        modal.close();
        switchTab('track');
        trackItemCode(item.id);
      });
    }

    if ($('btnModalCloseAction')) {
      $('btnModalCloseAction').addEventListener('click', () => modal.close());
    }

    modal.showModal();
  }

  // Claim Modal Handling
  function initClaimModal() {
    const dialog = $('claimModalDialog');
    const cancelBtn = $('claimCancelBtn');
    const submitBtn = $('claimSubmitBtn');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => dialog.close());
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const studentName = $('claimStudentName').value.trim();
        const studentUid = $('claimStudentUid').value.trim().toUpperCase();
        const studentEmail = $('claimStudentEmail').value.trim().toLowerCase();
        const studentPhone = $('claimStudentPhone').value.trim();
        const claimProof = $('claimProofText').value.trim();
        const secretDetail = $('claimSecretDetail').value.trim();

        if (!studentName || !studentUid || !studentPhone || !claimProof) {
          showToast('Please fill in your name, UID, phone and proof of ownership', 'warning');
          return;
        }

        // Basic UID format check (CU UIDs are typically alphanumeric, e.g. 24BCS10884)
        if (studentUid.length < 5) {
          showToast('Please enter a valid Chandigarh University UID', 'warning');
          return;
        }

        if (!AppState.activeClaimItem) return;

        AppState.activeClaimItem.claim = {
          studentName,
          studentUid,
          studentEmail: studentEmail || `${studentUid.toLowerCase()}@cumail.in`,
          studentPhone,
          submittedOn: new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          claimProofText: claimProof,
          secretDetail: secretDetail || 'N/A'
        };

        // Advance item status to 1: Claim Under Review
        if (AppState.activeClaimItem.status === 0) {
          AppState.activeClaimItem.status = 1;
        }

        PortalDB.saveItems(AppState.items);
        dialog.close();

        // Clear form
        ['claimStudentName', 'claimStudentUid', 'claimStudentEmail', 'claimStudentPhone', 'claimProofText', 'claimSecretDetail'].forEach((k) => {
          if ($(k)) $(k).value = '';
        });

        renderCampusMetrics();
        renderItems();

        showToast(`Claim submitted! Security Desk will verify your UID ${studentUid}`, 'success');

        // Automatically switch to track view
        switchTab('track');
        trackItemCode(AppState.activeClaimItem.id);
      });
    }
  }

  function openClaimModal(itemId) {
    const item = AppState.items.find((x) => x.id === itemId);
    if (!item) return;

    AppState.activeClaimItem = item;
    $('claimItemTitleBadge').textContent = `${item.id}: ${item.title}`;
    $('claimModalDialog').showModal();
  }

  // Reporting Form (Wizard)
  function initReportingForm() {
    let reportType = 'found';

    // Type Selector Cards
    $$('.type-option-card').forEach((card) => {
      card.addEventListener('click', () => {
        $$('.type-option-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        reportType = card.getAttribute('data-report-type');

        const hintSpan = $('secretHintSpan');
        if (hintSpan) {
          hintSpan.textContent = reportType === 'found'
            ? '(Keep one secret detail hidden from the public to verify the real claimant later!)'
            : '(Describe private markers like wallpaper, IMEI, serial or contents to prove it is yours)';
        }
      });
    });

    // Photo input with canvas image compression
    const photoInput = $('reportPhotoInput');
    const photoThumbnail = $('reportPhotoThumbnail');

    if (photoInput && photoThumbnail) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
          AppState.previewPhotoData = '';
          photoThumbnail.src = '';
          photoThumbnail.classList.remove('has-photo');
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 640;
            const scale = Math.min(1, MAX_WIDTH / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const compressedData = canvas.toDataURL('image/jpeg', 0.75);
            AppState.previewPhotoData = compressedData;
            photoThumbnail.src = compressedData;
            photoThumbnail.classList.add('has-photo');
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    // Submit Report Handler
    const submitBtn = $('reportSubmitBtn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const title = $('reportItemName').value.trim();
        const category = $('reportCategory').value;
        const locationSelect = $('reportCampusLocation').value;
        const locationDetail = $('reportLocationDetail').value.trim();
        const date = $('reportDate').value || new Date().toISOString().split('T')[0];
        const description = $('reportDescription').value.trim();
        const privateIdentifier = $('reportPrivateIdentifier').value.trim();
        const reporterName = $('reportContactName').value.trim();
        const reporterContact = $('reportContactPhone').value.trim();
        const declaration = $('reportDeclarationCheckbox').checked;

        if (!title) {
          showToast('Please provide an item name', 'warning');
          return;
        }

        if (!locationSelect) {
          showToast('Please select a campus location building', 'warning');
          return;
        }

        if (!description) {
          showToast('Please provide a brief item description', 'warning');
          return;
        }

        if (!reporterName || !reporterContact) {
          showToast('Please provide your name and phone number for custody records', 'warning');
          return;
        }

        if (!declaration) {
          showToast('Please tick the official university declaration check', 'warning');
          return;
        }

        const newId = PortalDB.generateNextId(AppState.items);
        const fullLocation = locationDetail ? `${locationSelect} (${locationDetail})` : locationSelect;

        const newItem = {
          id: newId,
          type: reportType,
          title,
          category: category || 'other',
          location: fullLocation,
          campusBlock: locationSelect,
          date,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description,
          privateIdentifier: privateIdentifier || 'Verified with Official Student ID',
          custodianDesk: reportType === 'found' ? `${locationSelect} Security Booth` : 'DSW Central Lost & Found Desk',
          reportingPerson: reporterName,
          contact: reporterContact,
          status: 0,
          imageUrl: AppState.previewPhotoData || '',
          claim: null
        };

        AppState.items.unshift(newItem);
        PortalDB.saveItems(AppState.items);

        // Reset inputs
        ['reportItemName', 'reportLocationDetail', 'reportDescription', 'reportPrivateIdentifier', 'reportContactName', 'reportContactPhone'].forEach((id) => {
          if ($(id)) $(id).value = '';
        });
        if ($('reportDeclarationCheckbox')) $('reportDeclarationCheckbox').checked = false;
        if (photoThumbnail) {
          photoThumbnail.src = '';
          photoThumbnail.classList.remove('has-photo');
        }
        AppState.previewPhotoData = '';

        initCategoryPills();
        renderCampusMetrics();
        renderItems();

        showToast(`Report logged in CU database! Reference ID: ${newId}`, 'success');

        // Navigate to track view
        switchTab('track');
        trackItemCode(newId);
      });
    }
  }

  // Live Tracking System
  function initTracking() {
    const trackInput = $('trackingCodeInput');
    const trackBtn = $('trackingCodeSubmitBtn');

    if (trackBtn && trackInput) {
      const execTrack = () => {
        const code = trackInput.value.trim();
        if (!code) {
          showToast('Please enter a Reference Code or Student UID', 'warning');
          return;
        }
        trackItemCode(code);
      };

      trackBtn.addEventListener('click', execTrack);
      trackInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') execTrack();
      });
    }

    // Print Receipt button listener
    const printBtn = $('btnPrintHandoverSlip');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }
  }

  function trackItemCode(query) {
    const container = $('trackingResultContainer');
    if (!container) return;

    if ($('trackingCodeInput')) {
      $('trackingCodeInput').value = query;
    }

    const cleanQuery = query.toLowerCase().trim();
    // Search by Item ID or Student UID
    const item = AppState.items.find((x) =>
      x.id.toLowerCase() === cleanQuery ||
      (x.claim && x.claim.studentUid.toLowerCase() === cleanQuery)
    );

    if (!item) {
      container.innerHTML = `
        <div class="empty-state" style="margin-top:1.5rem;">
          <div class="empty-state-icon">&#9888;&#65039;</div>
          <h3>No Record Found for "${escapeHtml(query)}"</h3>
          <p>Please re-check the Reference ID (e.g. CU-LF-2026-1001) or Student UID. If you haven't reported it yet, you can submit a new report now.</p>
          <button class="search-btn" style="margin: 0 auto;" data-goto-tab="report">
            Log New Report
          </button>
        </div>
      `;
      return;
    }

    const catObj = ITEM_CATEGORIES.find((c) => c.id === item.category) || { name: item.category, icon: '\uD83D\uDCE6' };

    // Stepper HTML
    const stepsHtml = STATUS_PIPELINE.map((st, idx) => {
      let stateClass = '';
      let badgeLabel = idx + 1;

      if (idx < item.status) {
        stateClass = 'completed';
        badgeLabel = '&#10003;';
      } else if (idx === item.status) {
        stateClass = 'active';
        badgeLabel = '&#9203;';
      }

      return `
        <div class="pipeline-step ${stateClass}">
          <div class="pipeline-dot">${badgeLabel}</div>
          <div class="pipeline-label">${st.label}</div>
          <div class="pipeline-sub">${st.desc}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="tracking-result-header">
        <div>
          <span class="type-badge ${item.type}">${item.type === 'found' ? '&#128994; Found Item' : '&#128993; Lost Item'}</span>
          <h2 style="margin-top:0.4rem; font-size:1.6rem;">${escapeHtml(item.title)}</h2>
          <span style="font-family:monospace; color:var(--text-muted); font-size:0.9rem;">Reference Code: <strong>${item.id}</strong></span>
        </div>
        <div style="text-align:right;">
          <button class="btn-card primary" id="btnPrintSlipDynamic" style="padding:0.6rem 1rem;">
            &#128424;&#65039; Print Handover Pass
          </button>
        </div>
      </div>

      <div class="tracking-pipeline">
        ${stepsHtml}
      </div>

      <div class="track-detail-grid">
        <div class="detail-item-col">
          <span class="lbl">Category</span>
          <span class="val">${catObj.icon} ${catObj.name}</span>
        </div>
        <div class="detail-item-col">
          <span class="lbl">Reported Date</span>
          <span class="val">${item.date}</span>
        </div>
        <div class="detail-item-col">
          <span class="lbl">Location Logged</span>
          <span class="val">${escapeHtml(item.location)}</span>
        </div>
        <div class="detail-item-col">
          <span class="lbl">Current Custody Desk</span>
          <span class="val">${escapeHtml(item.custodianDesk || 'Central Security Command Post Gate 1')}</span>
        </div>
        <div class="detail-item-col" style="grid-column:1/-1;">
          <span class="lbl">Item Public Description</span>
          <span class="val">${escapeHtml(item.description)}</span>
        </div>
        ${item.claim ? `
          <div class="detail-item-col" style="grid-column:1/-1; background:var(--color-info-bg); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--color-info-border);">
            <span class="lbl" style="color:var(--color-info);">Active Claim In Progress</span>
            <span class="val" style="margin-top:0.3rem;">
              <strong>Student:</strong> ${escapeHtml(item.claim.studentName)} (${escapeHtml(item.claim.studentUid)})<br>
              <strong>Status:</strong> ${item.status >= 2 ? '&#10004;&#65039; Verified &amp; Ready for Gate 1 Handover' : '&#9203; Security Verification Underway'}<br>
              ${item.claim.adminNotes ? `<strong>Officer Remarks:</strong> ${escapeHtml(item.claim.adminNotes)}` : ''}
            </span>
          </div>
        ` : ''}
      </div>

      <div style="margin-top:1.5rem; padding:1.25rem; background:var(--bg-subtle); border-radius:var(--radius-md); font-size:0.88rem; color:var(--text-secondary);">
        <strong>&#128204; Handover Instructions for Students:</strong><br>
        To collect this item in person, bring your physical Chandigarh University Student Smart Card along with this reference code (<strong>${item.id}</strong>) to the <strong>Central Security Command Post at Gate 1</strong> between 09:00 AM and 05:30 PM (Mon-Sat).
      </div>
    `;

    // Populate Printable Handover Pass
    populatePrintCertificate(item);

    const dynamicPrint = $('btnPrintSlipDynamic');
    if (dynamicPrint) {
      dynamicPrint.addEventListener('click', () => window.print());
    }
  }

  // Populate Printable Handover Slip
  function populatePrintCertificate(item) {
    const cert = $('printCertificateSection');
    if (!cert) return;

    cert.innerHTML = `
      <div style="text-align:center; border-bottom:2px solid #000; padding-bottom:1rem; margin-bottom:1.5rem;">
        <h2 style="font-size:1.6rem; margin-bottom:0.2rem;">CHANDIGARH UNIVERSITY</h2>
        <h4 style="font-size:1.1rem; text-transform:uppercase; color:#333;">Department of Student Welfare &amp; Campus Security Command</h4>
        <p style="font-size:0.9rem;">Official Lost &amp; Found Custody &amp; Handover Pass</p>
      </div>

      <div style="display:flex; justify-content:space-between; margin-bottom:1.5rem;">
        <div>
          <p><strong>Tracking Pass No:</strong> ${item.id}</p>
          <p><strong>Issue Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
        </div>
        <div style="text-align:right;">
          <p><strong>Custody Location:</strong> ${escapeHtml(item.custodianDesk || 'Central Security Gate 1')}</p>
          <p><strong>Authorized By:</strong> Duty Security Officer</p>
        </div>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-bottom:2rem;" border="1" cellpadding="8">
        <tr>
          <td style="width:30%; font-weight:bold; background:#f0f0f0;">Item Designation</td>
          <td>${escapeHtml(item.title)}</td>
        </tr>
        <tr>
          <td style="font-weight:bold; background:#f0f0f0;">Category &amp; Type</td>
          <td>${item.category} (${item.type.toUpperCase()})</td>
        </tr>
        <tr>
          <td style="font-weight:bold; background:#f0f0f0;">Location Found / Logged</td>
          <td>${escapeHtml(item.location)}</td>
        </tr>
        <tr>
          <td style="font-weight:bold; background:#f0f0f0;">Claimant Student Name</td>
          <td>${item.claim ? escapeHtml(item.claim.studentName) : 'Self / Pending Match'}</td>
        </tr>
        <tr>
          <td style="font-weight:bold; background:#f0f0f0;">Student UID</td>
          <td>${item.claim ? escapeHtml(item.claim.studentUid) : 'To be checked on pickup'}</td>
        </tr>
        <tr>
          <td style="font-weight:bold; background:#f0f0f0;">Current Pipeline State</td>
          <td>${STATUS_PIPELINE[item.status].label}</td>
        </tr>
      </table>

      <div style="margin-top:3rem; display:flex; justify-content:space-between; padding-top:2rem;">
        <div style="text-align:center; width:220px; border-top:1px solid #000; padding-top:0.5rem;">
          Signature of Student Claimant
        </div>
        <div style="text-align:center; width:220px; border-top:1px solid #000; padding-top:0.5rem;">
          Campus Security Officer Seal
        </div>
      </div>
    `;
  }

  // Security / Staff Desk Controller
  function initStaffControls() {
    const staffBtn = $('staffPortalToggleBtn');
    if (staffBtn) {
      staffBtn.addEventListener('click', () => {
        AppState.staffMode = !AppState.staffMode;
        staffBtn.classList.toggle('active', AppState.staffMode);
        staffBtn.innerHTML = AppState.staffMode ? '&#128737;&#65039; Staff Mode: ON' : '&#128737;&#65039; Staff Portal';

        showToast(
          AppState.staffMode
            ? 'Security & Staff Desk unlocked. Authority tools enabled.'
            : 'Staff Mode deactivated',
          AppState.staffMode ? 'success' : 'info'
        );

        renderItems();
        renderStaffPendingList();
      });
    }

    // Reset database to demo seeds
    const resetBtn = $('btnResetDatabase');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset portal database to default official university sample dataset?')) {
          AppState.items = PortalDB.resetToDefault();
          initCategoryPills();
          renderCampusMetrics();
          renderItems();
          renderStaffPendingList();
          showToast('Portal database restored to default seed dataset', 'success');
        }
      });
    }
  }

  function renderStaffPendingList() {
    const container = $('staffClaimsListContainer');
    if (!container) return;

    const claimedItems = AppState.items.filter((i) => !!i.claim);

    if (claimedItems.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">&#10004;&#65039;</div>
          <h3>No Pending Ownership Claims</h3>
          <p>All student claims have been resolved or no claims have been submitted yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = claimedItems.map((item) => {
      const claim = item.claim;
      return `
        <div class="desk-card" style="margin-bottom:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
            <div>
              <span class="ref-code-chip">${item.id}</span>
              <h4 style="font-size:1.15rem; margin-top:0.3rem;">${escapeHtml(item.title)}</h4>
              <p style="font-size:0.85rem; color:var(--text-muted);">${escapeHtml(item.location)} &bull; Reported ${item.date}</p>
            </div>
            <span class="status-badge-inline ${STATUS_PIPELINE[item.status].badgeClass}">
              ${STATUS_PIPELINE[item.status].label}
            </span>
          </div>

          <div style="background:var(--bg-subtle); padding:1rem; border-radius:var(--radius-md); font-size:0.88rem; margin-bottom:1rem;">
            <p><strong>Claimant:</strong> ${escapeHtml(claim.studentName)} (UID: <code>${escapeHtml(claim.studentUid)}</code>)</p>
            <p><strong>Contact:</strong> ${escapeHtml(claim.studentPhone)} | ${escapeHtml(claim.studentEmail)}</p>
            <p style="margin-top:0.4rem;"><strong>Student Proof Provided:</strong> "${escapeHtml(claim.claimProofText)}"</p>
            ${claim.secretDetail ? `<p><strong>Private Verification Answer:</strong> "${escapeHtml(claim.secretDetail)}"</p>` : ''}
          </div>

          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            ${item.status === 1 ? `
              <button class="btn-card primary action-approve-claim" data-item-id="${item.id}" style="flex:auto;">
                &#10004;&#65039; Verify Proof &amp; Approve for Pickup
              </button>
            ` : ''}
            ${item.status === 2 ? `
              <button class="btn-card primary action-complete-handover" data-item-id="${item.id}" style="flex:auto; background:var(--color-success);">
                &#129309; Confirm Handover &amp; Close
              </button>
            ` : ''}
            <button class="btn-card secondary action-print-gatepass" data-item-id="${item.id}">
              &#128424;&#65039; Handover Pass
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.action-approve-claim').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-item-id');
        const item = AppState.items.find((x) => x.id === id);
        if (item) {
          item.status = 2; // Matched & Ready for Pickup
          PortalDB.saveItems(AppState.items);
          renderCampusMetrics();
          renderStaffPendingList();
          renderItems();
          showToast(`Claim approved for ${item.id}. Student may collect from Gate 1.`, 'success');
        }
      });
    });

    container.querySelectorAll('.action-complete-handover').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-item-id');
        const item = AppState.items.find((x) => x.id === id);
        if (item) {
          item.status = 3; // Returned & Dispatched
          PortalDB.saveItems(AppState.items);
          renderCampusMetrics();
          renderStaffPendingList();
          renderItems();
          showToast(`Handover confirmed! Item ${item.id} closed and logged.`, 'success');
        }
      });
    });

    container.querySelectorAll('.action-print-gatepass').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-item-id');
        switchTab('track');
        trackItemCode(id);
      });
    });
  }

  // Auto-boot on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
