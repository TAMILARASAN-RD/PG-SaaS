/**
 * dashboard.js
 * Logic for Dashboard interactions & dynamic overview stats
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard loaded');

    // Add active state to sidebar links based on current URL
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.sidebar-link');

    links.forEach(link => {
        const linkPath = new URL(link.href, window.location.origin).pathname;

        const isMatch = linkPath === currentPath ||
            linkPath === currentPath + '.html' ||
            linkPath === currentPath + '/index.html' ||
            (currentPath.endsWith('/') && linkPath === currentPath + 'index.html');

        if (isMatch) {
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });

    // Profile Dropdown Toggle
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileDropdown) {
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('open');
            }
        });
    }

    // ─── Render Overview Stats ───────────────────────────────────────────────
    renderOverviewStats();
});

function handleLogout() {
    window.location.href = '/auth/login.html';
}

/**
 * Dynamically populates the Dashboard Overview page with real data
 * from localStorage: properties, tenants, capacity, revenue, and recent payments.
 */
function renderOverviewStats() {
    // 1. Load properties
    const properties = JSON.parse(localStorage.getItem('staywise_properties') || '[]');

    // 2. Calculate stats
    let totalProperties = properties.length;
    let totalTenants = 0;
    let totalCapacity = 0;
    let totalOccupied = 0;
    let monthlyRevenue = 0;

    properties.forEach(prop => {
        const propType = prop.type || 'PG';
        if (prop.floors) {
            prop.floors.forEach(floor => {
                if (floor.rooms) {
                    floor.rooms.forEach(room => {
                        if (room.beds) {
                            totalCapacity += room.beds.length;
                            room.beds.forEach(bed => {
                                if (bed.status === 'occupied') {
                                    totalOccupied++;
                                    totalTenants++;
                                    if (bed.rentAmount && !isNaN(parseFloat(bed.rentAmount))) {
                                        monthlyRevenue += parseFloat(bed.rentAmount);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    const capacityPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    // 3. Update stat cards
    const elTotalProps = document.getElementById('stat-total-properties');
    const elTotalTenants = document.getElementById('stat-total-tenants');
    const elCapacity = document.getElementById('stat-capacity');
    const elRevenue = document.getElementById('stat-monthly-revenue');

    if (elTotalProps) elTotalProps.textContent = totalProperties;
    if (elTotalTenants) elTotalTenants.textContent = totalTenants;
    if (elCapacity) elCapacity.textContent = capacityPct + '%';
    if (elRevenue) elRevenue.textContent = formatOverviewCurrency(monthlyRevenue);

    // 4. Render Properties Quick View
    renderPropertiesQuickView(properties);

    // 5. Render Recent Rent Payments
    renderRecentPayments();
}

/**
 * Renders property cards in the overview
 */
function renderPropertiesQuickView(properties) {
    const container = document.getElementById('properties-quick-view');
    if (!container) return;

    if (properties.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i data-lucide="home" style="width: 32px; height: 32px; color: var(--text-muted);"></i>
                <p>No properties yet.</p>
                <a href="../owners-pages/properties.html" class="btn btn-primary" style="margin-top: 0.75rem;">+ Add Property</a>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    container.innerHTML = properties.map(prop => {
        const propType = prop.type || 'PG';

        // Count capacity & occupancy for this property
        let capacity = 0;
        let occupied = 0;
        if (prop.floors) {
            prop.floors.forEach(floor => {
                if (floor.rooms) {
                    floor.rooms.forEach(room => {
                        if (room.beds) {
                            capacity += room.beds.length;
                            occupied += room.beds.filter(b => b.status === 'occupied').length;
                        }
                    });
                }
            });
        }

        const occupancyPct = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

        // Color by type
        let typeColor = '#1d5beb';
        let typeBg = '#eef5ff';
        if (propType === 'Office Space') { typeColor = '#0369a1'; typeBg = '#e0f2fe'; }
        if (propType === 'Commercial Space') { typeColor = '#b45309'; typeBg = '#fef3c7'; }
        if (propType === 'RK' || propType === 'BHK') { typeColor = '#4d7c0f'; typeBg = '#ecfccb'; }

        // Occupancy bar color
        let barColor = '#3478f6';
        if (occupancyPct >= 80) barColor = '#10b981';
        else if (occupancyPct >= 50) barColor = '#f59e0b';
        else if (occupancyPct > 0) barColor = '#3478f6';
        else barColor = '#e2e8f0';

        // Capacity label
        let unitLabel = 'Beds';
        if (propType === 'Office Space') unitLabel = 'Desks';
        else if (propType === 'Commercial Space') unitLabel = 'Spaces';
        else if (propType === 'RK' || propType === 'BHK') unitLabel = 'Units';

        return `
            <div class="property-quick-card">
                <div class="pqc-header">
                    <span class="pqc-name">${escapeOverviewHTML(prop.name)}</span>
                    <span class="pqc-type" style="background: ${typeBg}; color: ${typeColor};">${propType}</span>
                </div>
                <div class="pqc-location">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${escapeOverviewHTML(prop.location || 'No location')}
                </div>
                <div class="pqc-stats">
                    <div class="pqc-stat-item">
                        <span class="pqc-stat-label">${unitLabel}</span>
                        <span class="pqc-stat-value">${capacity}</span>
                    </div>
                    <div class="pqc-stat-item">
                        <span class="pqc-stat-label">Occupancy</span>
                        <span class="pqc-stat-value">${occupancyPct}%</span>
                    </div>
                    <div class="pqc-stat-item">
                        <span class="pqc-stat-label">Occupied</span>
                        <span class="pqc-stat-value">${occupied}/${capacity}</span>
                    </div>
                </div>
                <div class="occupancy-bar">
                    <div class="occupancy-fill" style="width: ${occupancyPct}%; background: ${barColor};"></div>
                </div>
                <div class="pqc-footer">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${occupied} of ${capacity} ${unitLabel.toLowerCase()} occupied</span>
                    <a href="../owners-pages/property-detail.html?id=${prop.id}" class="pqc-manage-link">
                        Manage →
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renders the 5 most recent rent payments in the overview table
 */
function renderRecentPayments() {
    const tbody = document.getElementById('recent-payments-body');
    if (!tbody) return;

    const records = JSON.parse(localStorage.getItem('staywise_rent_records') || '[]');

    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    No recent rent payments.
                </td>
            </tr>
        `;
        return;
    }

    // Sort newest first, take top 5
    const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    tbody.innerHTML = sorted.map(r => {
        let badgeClass = '';
        if (r.status === 'Paid') badgeClass = 'success';
        else if (r.status === 'Pending') badgeClass = 'warning';
        else if (r.status === 'Partially Paid') badgeClass = 'warning';
        else if (r.status === 'Overdue') badgeClass = 'error';

        const dateObj = new Date(r.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

        return `
            <tr>
                <td>${escapeOverviewHTML(r.tenant)}</td>
                <td>${escapeOverviewHTML(r.property)}</td>
                <td>${formatOverviewCurrency(r.amount)}</td>
                <td><span class="badge ${badgeClass}">${r.status}</span></td>
                <td>${formattedDate}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Format currency for overview
 */
function formatOverviewCurrency(amount) {
    if (!amount || isNaN(amount)) return '₹0';
    if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(1) + 'L';
    }
    return '₹' + Number(amount).toLocaleString('en-IN');
}

/**
 * Escape HTML for overview
 */
function escapeOverviewHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}
