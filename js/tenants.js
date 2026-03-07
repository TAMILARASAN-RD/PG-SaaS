document.addEventListener('DOMContentLoaded', () => {
    renderTenantsList();
});

function renderTenantsList() {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    // Pull properties from local storage
    const propertiesData = localStorage.getItem('staywise_properties');
    let properties = [];
    if (propertiesData) {
        properties = JSON.parse(propertiesData);
    }

    let allTenants = [];

    // Extract all assigned occupants across all properties
    properties.forEach(prop => {
        const propType = prop.type || 'PG';
        const isOffice = propType === 'Office Space';
        const isCommercial = propType === 'Commercial Space';
        const isHousehold = propType === 'RK' || propType === 'BHK';

        let subUnitName = 'Bed';
        if (isOffice) subUnitName = 'Desk';
        if (isCommercial || isHousehold) subUnitName = 'Unit';

        prop.floors.forEach(floor => {
            floor.rooms.forEach(room => {
                room.beds.forEach(bed => {
                    if (bed.status === 'occupied' && bed.tenant) {
                        // Try to get join date if exists in profile
                        const profileKey = `staywise_profile_${bed.email}`;
                        const existingProfile = JSON.parse(localStorage.getItem(profileKey) || '{}');
                        const joinDate = existingProfile.joinedDate ? new Date(existingProfile.joinedDate).toLocaleDateString() : new Date().toLocaleDateString();

                        allTenants.push({
                            name: bed.tenant,
                            email: bed.email || 'N/A',
                            property: prop.name,
                            propertyType: propType,
                            room: room.number,
                            subUnit: bed.id,
                            subUnitName: subUnitName,
                            rentAmount: bed.rentAmount || 'N/A',
                            joinDate: joinDate
                        });
                    }
                });
            });
        });
    });

    // Pull past tenants from local storage
    const pastTenantsData = localStorage.getItem('staywise_past_tenants');
    let pastTenants = [];
    if (pastTenantsData) {
        pastTenants = JSON.parse(pastTenantsData);
    }

    pastTenants.forEach(tenant => {
        allTenants.push({
            name: tenant.name,
            email: tenant.email,
            property: tenant.property,
            propertyType: tenant.propertyType,
            room: tenant.room,
            subUnit: tenant.subUnit,
            subUnitName: tenant.subUnitName || 'Unit',
            rentAmount: tenant.rentAmount,
            joinDate: tenant.joinDate || 'Unknown',
            vacatedDate: tenant.vacatedDate,
            isVacated: true
        });
    });

    if (allTenants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    No tenants found. Assign a tenant from the Properties tab.
                </td>
            </tr>
        `;
        return;
    }

    // Sort: Active first, then by property name
    allTenants.sort((a, b) => {
        if (a.isVacated === b.isVacated) {
            return a.property.localeCompare(b.property);
        }
        return a.isVacated ? 1 : -1;
    });

    // Render rows
    let rowsHTML = '';
    allTenants.forEach(tenant => {

        let unitLabel = '';
        if (tenant.propertyType === 'Commercial Space' || tenant.propertyType === 'RK' || tenant.propertyType === 'BHK') {
            unitLabel = `Unit/Space: ${tenant.room}`;
        } else {
            unitLabel = `Room: ${tenant.room} · ${tenant.subUnitName} #${tenant.subUnit}`;
        }

        // Check if there is a generated password in their profile
        const profileStr = localStorage.getItem(`staywise_profile_${tenant.email}`);
        let generatedPin = 'Not Generated';
        if (profileStr) {
            const profile = JSON.parse(profileStr);
            if (profile.generatedPassword) {
                generatedPin = profile.generatedPassword;
            }
        }

        let typeColor = 'var(--brand-600)';
        let typeBg = 'var(--brand-50)';
        if (tenant.propertyType === 'Office Space') { typeColor = '#0369a1'; typeBg = '#e0f2fe'; }
        if (tenant.propertyType === 'Commercial Space') { typeColor = '#b45309'; typeBg = '#fef3c7'; }
        if (tenant.propertyType === 'RK' || tenant.propertyType === 'BHK') { typeColor = '#4d7c0f'; typeBg = '#ecfccb'; }

        const statusBadge = tenant.isVacated
            ? `<span class="badge" style="background: var(--bg-secondary); color: var(--text-muted);">Vacated</span>`
            : `<span class="badge success">Active</span>`;

        // Evaluate vacated date string
        const vacateStr = tenant.isVacated ? tenant.vacatedDate : '';

        // Make row clickable
        rowsHTML += `
            <tr style="cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'" onclick="showTenantCard('${tenant.name.replace(/'/g, "\\'")}', '${tenant.email}', '${tenant.property.replace(/'/g, "\\'")}', '${unitLabel}', '${tenant.rentAmount}', '${generatedPin}', '${tenant.joinDate}', '${vacateStr}')">
                <td>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 500;">${tenant.name}</span>
                        <span class="text-xs text-muted">${tenant.email}</span>
                        <span class="text-xs text-brand" style="margin-top:2px;">View Card &rarr;</span>
                    </div>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 500;">${tenant.property}</span>
                        <span class="badge" style="width: max-content; background: ${typeBg}; color: ${typeColor}; font-size: 0.65rem; padding: 2px 6px; margin-top: 4px;">${tenant.propertyType}</span>
                    </div>
                </td>
                <td>
                    <span class="text-sm">${unitLabel}</span>
                    ${tenant.rentAmount !== 'N/A' ? `<div class="text-xs text-muted" style="margin-top: 4px;">Rent: ₹${tenant.rentAmount}</div>` : ''}
                </td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; flex-direction: column;">
                        <span class="text-sm">${tenant.joinDate}</span>
                        <span class="text-xs text-muted">Join Date</span>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHTML;
}

window.showTenantCard = function (name, email, prop, unit, rent, pin, joinDate, vacatedDate) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    // inline styles for immediate modal rendering since we don't know if dashboard.css has modal-overlay
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(15, 23, 42, 0.4)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';

    overlay.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; width: 320px; max-width: 90%; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); transform: translateY(20px); animation: slideUp 0.3s forwards ease-out;">
            <div style="background: var(--brand-50); color: var(--brand-600); width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                <i data-lucide="user" style="width: 32px; height: 32px;"></i>
            </div>
            <h3 style="margin: 0 0 0.25rem; font-size: 1.25rem;">${name}</h3>
            <p class="text-sm text-muted" style="margin-bottom: 1.25rem;">${email}</p>
            
            <div style="background: var(--bg-secondary); padding: 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: left;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                    <span class="text-sm text-muted">Property:</span>
                    <span class="text-sm" style="font-weight: 500;">${prop}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                    <span class="text-sm text-muted">Unit:</span>
                    <span class="text-sm" style="font-weight: 500;">${unit}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                    <span class="text-sm text-muted">Rent:</span>
                    <span class="text-sm" style="font-weight: 500;">₹${rent}</span>
                </div>
                <hr style="margin: 0.75rem 0; border: none; border-top: 1px dashed var(--border);">
                
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span class="text-sm text-muted">Joined:</span>
                    <span class="text-sm" style="font-weight: 500; color: var(--success);">${joinDate}</span>
                </div>
                ${vacatedDate ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span class="text-sm text-muted">Vacated:</span>
                    <span class="text-sm" style="font-weight: 500; color: var(--text-muted);">${vacatedDate}</span>
                </div>
                ` : ''}

                <hr style="margin: 0.75rem 0; border: none; border-top: 1px dashed var(--border);">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <span class="text-sm text-muted">Login PIN:</span>
                    <span style="font-family: monospace; letter-spacing: 1px; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-weight: 700; color: #0f172a;">${pin}</span>
                </div>
            </div>
            
            <button class="btn btn-primary w-full" onclick="this.closest('.modal-overlay').remove()">Close Card</button>
        </div>
        <style>
            @keyframes slideUp {
                to { transform: translateY(0); opacity: 1; }
            }
        </style>
    `;

    document.body.appendChild(overlay);
    if (typeof lucide !== 'undefined') lucide.createIcons();
};
