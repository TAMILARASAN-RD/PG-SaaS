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
                <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
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

    // Pull rent records
    const rentRecordsData = localStorage.getItem('staywise_rent_records');
    let rentRecords = [];
    if (rentRecordsData) {
        rentRecords = JSON.parse(rentRecordsData);
    }

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
        const vacateStr = tenant.isVacated ? (tenant.vacatedDate || '') : '';

        // Calculate payment status & total paid
        let paymentStatus = 'Pending';
        let totalPaidForStatus = 0;

        if (!tenant.isVacated) {
            const tenantRentRecords = rentRecords.filter(r => r.tenant === tenant.name && r.property === tenant.property);

            tenantRentRecords.forEach(r => { totalPaidForStatus += parseFloat(r.amountPaid) || 0; });
            const rentAmt = parseFloat(tenant.rentAmount) || 0;

            if (totalPaidForStatus >= rentAmt && rentAmt > 0) {
                paymentStatus = 'Paid';
            } else if (totalPaidForStatus > 0 && totalPaidForStatus < rentAmt) {
                paymentStatus = 'Partially Paid';
            } else {
                paymentStatus = 'Pending';
            }

            // Check overdue
            const now = new Date();
            let joinDateObj = new Date(tenant.joinDate);
            if (isNaN(joinDateObj.getTime())) joinDateObj = new Date();

            let lastDate = joinDateObj;
            if (tenantRentRecords.length > 0) {
                const sorted = [...tenantRentRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
                lastDate = new Date(sorted[0].date);
            }

            const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
            if (paymentStatus !== 'Paid' && daysSince > 30) {
                paymentStatus = 'Overdue';
            }
        } else {
            paymentStatus = 'N/A';
        }

        let paymentBadgeClass = 'badge ';
        if (paymentStatus === 'Paid') paymentBadgeClass += 'success';
        else if (paymentStatus === 'Pending' || paymentStatus === 'Partially Paid') paymentBadgeClass += 'warning';
        else if (paymentStatus === 'Overdue') paymentBadgeClass += 'error';
        else paymentBadgeClass += 'text-muted';

        const paymentStatusBadge = `<span class="${paymentBadgeClass}">${paymentStatus}</span>`;

        // Helper to precisely escape single quotes natively for onclick attributes
        const escapeQuote = (str) => {
            return (str || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
        };

        const safeName = escapeQuote(tenant.name);
        const safeEmail = escapeQuote(tenant.email);
        const safeProp = escapeQuote(tenant.property);
        const safeUnit = escapeQuote(unitLabel);
        const safeRent = escapeQuote(String(tenant.rentAmount));
        const safePin = escapeQuote(generatedPin);
        const safeJoin = escapeQuote(tenant.joinDate);
        const safeVacate = escapeQuote(vacateStr);
        const safeStatus = escapeQuote(paymentStatus);

        const onClickHandler = `showTenantCard('${safeName}', '${safeEmail}', '${safeProp}', '${safeUnit}', '${safeRent}', '${safePin}', '${safeJoin}', '${safeVacate}')`;

        // Make row clickable
        rowsHTML += `
            <tr style="cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='transparent'">
                <td onclick="${onClickHandler}">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 500;">${tenant.name}</span>
                        <span class="text-xs text-muted">${tenant.email}</span>
                        <span class="text-xs text-brand" style="margin-top:2px;">View Card &rarr;</span>
                    </div>
                </td>
                <td onclick="${onClickHandler}">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 500;">${tenant.property}</span>
                        <span class="badge" style="width: max-content; background: ${typeBg}; color: ${typeColor}; font-size: 0.65rem; padding: 2px 6px; margin-top: 4px;">${tenant.propertyType}</span>
                    </div>
                </td>
                <td onclick="${onClickHandler}">
                    <span class="text-sm">${unitLabel}</span>
                    ${tenant.rentAmount !== 'N/A' ? `<div class="text-xs text-muted" style="margin-top: 4px;">Rent: ₹${tenant.rentAmount}</div>` : ''}
                </td>
                <td onclick="${onClickHandler}">${statusBadge}</td>
                <td onclick="${onClickHandler}">
                    <div style="display: flex; flex-direction: column;">
                        <span class="text-sm">${tenant.joinDate}</span>
                        <span class="text-xs text-muted">Join Date</span>
                    </div>
                </td>
                <td onclick="${onClickHandler}">${paymentStatusBadge}</td>
                <td class="action-cell">
                    ${!tenant.isVacated ? `<button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); openUpdatePaymentModal('${safeName}', '${safeProp}', '${safeRent}', '${safeJoin}')">Update Payment</button>` : `<span class="text-xs text-muted">N/A</span>`}
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
            
            <button class="btn btn-primary w-full" onclick="this.closest('.modal-overlay').classList.remove('active'); setTimeout(() => this.closest('.modal-overlay').remove(), 200)">Close Card</button>
        </div>
        <style>
            @keyframes slideUp {
                to { transform: translateY(0); opacity: 1; }
            }
        </style>
    `;

    document.body.appendChild(overlay);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Add active class for transition
    requestAnimationFrame(() => overlay.classList.add('active'));
};
function openUpdatePaymentModal(tenantName, propertyName, rentAmountStr, joinDateStr) {
    const existingOverlays = document.querySelectorAll('.modal-overlay');
    existingOverlays.forEach(o => o.remove());

    const rentAmount = parseFloat(rentAmountStr) || 0;

    // Fetch records
    const rentRecordsData = localStorage.getItem('staywise_rent_records');
    let rentRecords = [];
    if (rentRecordsData) {
        rentRecords = JSON.parse(rentRecordsData);
    }

    const tenantRecords = rentRecords.filter(r => r.tenant === tenantName && r.property === propertyName);
    tenantRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    let totalPaid = 0;
    tenantRecords.forEach(r => { totalPaid += parseFloat(r.amountPaid) || 0; });
    let remaining = Math.max(0, rentAmount - totalPaid);

    // Auto-calculate current status
    let currentStatus = 'Pending';
    if (totalPaid >= rentAmount) currentStatus = 'Paid';
    else if (totalPaid > 0) currentStatus = 'Partially Paid';

    const now = new Date();
    let joinDate = new Date(joinDateStr);
    if (isNaN(joinDate.getTime())) joinDate = new Date();
    let lastDate = tenantRecords.length > 0 ? new Date(tenantRecords[0].date) : joinDate;
    const daysSince = (now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
    if (currentStatus !== 'Paid' && daysSince > 30) currentStatus = 'Overdue';

    // Build history HTML
    let historyHTML = '';
    if (tenantRecords.length === 0) {
        historyHTML = `<p class="text-sm text-muted">No payments recorded yet.</p>`;
    } else {
        historyHTML = `<ul style="list-style:none; padding:0; margin:0; max-height:120px; overflow-y:auto; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.5rem; background:var(--bg-primary);">`;
        tenantRecords.forEach(r => {
            const dateObj = new Date(r.date);
            const dateStr = !isNaN(dateObj.getTime()) ? dateObj.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown Date';
            historyHTML += `<li style="display:flex; justify-content:space-between; padding: 0.35rem 0; border-bottom: 1px solid var(--border-light); font-size: 0.875rem;">
                <span class="text-muted" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%;">${dateStr}</span>
                <span style="font-weight:600; color:var(--success);">+ ₹${parseFloat(r.amountPaid).toFixed(2)}</span>
            </li>`;
        });
        historyHTML += `</ul>`;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-header">
                <h3>Record Payment</h3>
                <button class="modal-close-btn" id="modal-close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group" style="background: var(--bg-secondary); padding: 1.25rem; border-radius: 8px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
                        <span class="text-sm text-muted">Tenant:</span>
                        <span style="font-weight:500;">${tenantName}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
                        <span class="text-sm text-muted">Property:</span>
                        <span style="font-weight:500;">${propertyName}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                        <span class="text-sm text-muted">Rent Amount:</span>
                        <span style="font-weight:500;">₹${rentAmount.toFixed(2)}</span>
                    </div>
                    <hr style="margin: 0.75rem 0; border: none; border-top: 1px dashed var(--border);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
                        <span class="text-sm text-muted">Total Paid:</span>
                        <span style="font-weight:500; color: var(--success);">₹${totalPaid.toFixed(2)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem;">
                        <span class="text-sm text-muted">Remaining to be paid:</span>
                        <span style="font-weight:500; color: var(--error);">₹${remaining.toFixed(2)}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span class="text-sm text-muted">Current Status:</span>
                        <span style="font-weight:600;">${currentStatus}</span>
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 1.5rem;">
                    <label class="form-label" style="display: flex; justify-content: space-between;">
                        <span>Payment Log</span>
                        <span class="text-xs text-muted" style="font-weight: normal;">Latest first</span>
                    </label>
                    ${historyHTML}
                </div>

                <div class="form-group" style="margin-top: 1.5rem;">
                    <label class="form-label">New Payment Amount (₹)</label>
                    <input type="number" class="form-input" id="payment-amount" placeholder="${remaining > 0 ? 'Remaining: ₹' + remaining.toFixed(2) : 'Fully paid'}" ${remaining <= 0 ? 'disabled' : 'autofocus'} max="${remaining}">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="modal-cancel-btn">Close</button>
                <button class="btn btn-primary" id="modal-save-btn" ${remaining <= 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>Record Payment</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('active'));

    const closeHandler = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('#modal-close-btn').addEventListener('click', closeHandler);
    overlay.querySelector('#modal-cancel-btn').addEventListener('click', closeHandler);

    const saveBtn = overlay.querySelector('#modal-save-btn');
    if (!saveBtn.disabled) {
        saveBtn.addEventListener('click', () => {
            const amountInput = document.getElementById('payment-amount');
            const amountPaid = parseFloat(amountInput.value.trim());

            if (isNaN(amountPaid) || amountPaid <= 0) {
                alert('Please enter a valid payment amount greater than 0.');
                return;
            }

            if (amountPaid > remaining) {
                alert('Amount exceeds the remaining rent due.');
                return;
            }

            const newTotalPaid = totalPaid + amountPaid;
            let newStatus = 'Pending';
            if (newTotalPaid >= rentAmount) newStatus = 'Paid';
            else if (newTotalPaid > 0) newStatus = 'Partially Paid';

            rentRecords.push({
                id: Date.now(),
                tenant: tenantName,
                property: propertyName,
                amount: rentAmount,
                date: new Date().toISOString(),
                status: newStatus,
                amountPaid: amountPaid
            });

            localStorage.setItem('staywise_rent_records', JSON.stringify(rentRecords));
            renderTenantsList();
            closeHandler();
        });
    }

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeHandler();
    });
}
