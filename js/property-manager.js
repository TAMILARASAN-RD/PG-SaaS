/**
 * property-manager.js
 * Handles the logic for the Property Detail UI (Floors, Rooms, Occupancy Map)
 * Full CRUD: Edit/Delete Building, Floors, Rooms, and manage Beds
 */

// Dynamic Property Retrieval
let currentProperty = null;

function fetchProperty(propertyId) {
    const props = JSON.parse(localStorage.getItem('staywise_properties') || '[]');
    const foundProp = props.find(p => p.id === propertyId);

    if (foundProp) {
        return foundProp;
    }

    // Fallback if not found (or direct navigation to property-detail.html without an ID)
    return {
        id: propertyId || 'green-heights',
        name: 'New Building',
        location: 'No location set',
        totalCapacity: 0,
        occupied: 0,
        floors: []
    };
}

function savePropertyData() {
    if (!currentProperty) return;
    const props = JSON.parse(localStorage.getItem('staywise_properties') || '[]');
    const index = props.findIndex(p => p.id === currentProperty.id);
    if (index >= 0) {
        props[index] = currentProperty;
    } else {
        props.push(currentProperty);
    }
    localStorage.setItem('staywise_properties', JSON.stringify(props));
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id') || 'green-heights';

    currentProperty = fetchProperty(propertyId);

    loadPropertyData(propertyId);
    setupEventListeners();
});

// ─── Modal System ───────────────────────────────────────────────────────────

function createModal(title, bodyHTML, onSave) {
    // Remove any existing modal
    closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal-overlay';
    overlay.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close-btn" id="modal-close-btn">&times;</button>
            </div>
            <div class="modal-body">${bodyHTML}</div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
                <button class="btn btn-primary" id="modal-save-btn">Save</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => overlay.classList.add('active'));

    overlay.querySelector('#modal-close-btn').addEventListener('click', closeModal);
    overlay.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);
    overlay.querySelector('#modal-save-btn').addEventListener('click', () => {
        if (onSave) onSave();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Close on Escape
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    return overlay;
}

function createConfirmModal(title, message, onConfirm) {
    closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'active-modal-overlay';
    overlay.innerHTML = `
        <div class="modal-dialog" style="max-width: 420px;">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close-btn" id="modal-close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <p style="color: var(--text-secondary); line-height: 1.6;">${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
                <button class="btn btn-danger" id="modal-confirm-btn">Delete</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    overlay.querySelector('#modal-close-btn').addEventListener('click', closeModal);
    overlay.querySelector('#modal-cancel-btn').addEventListener('click', closeModal);
    overlay.querySelector('#modal-confirm-btn').addEventListener('click', () => {
        if (onConfirm) onConfirm();
        closeModal();
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeModal() {
    // Remove ALL modal overlays to prevent any stacking
    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
    });
}

// ─── Load & Recalculate Stats ───────────────────────────────────────────────

function loadPropertyData(id) {
    document.getElementById('property-name').textContent = currentProperty.name;
    document.getElementById('property-location').textContent = currentProperty.location;
    recalculateStats();
    renderOccupancyMap();
}

function recalculateStats() {
    let totalCapacity = 0;
    let occupiedCount = 0;

    currentProperty.floors.forEach(floor => {
        floor.rooms.forEach(room => {
            totalCapacity += room.beds.length;
            occupiedCount += room.beds.filter(b => b.status === 'occupied').length;
        });
    });

    const isOffice = currentProperty.type === 'Office Space';
    const isCommercial = currentProperty.type === 'Commercial Space';
    const isHousehold = currentProperty.type === 'RK' || currentProperty.type === 'BHK';

    let capacityLabel = 'TOTAL CAPACITY (BEDS)';
    if (isOffice) capacityLabel = 'TOTAL CAPACITY (DESKS)';
    else if (isCommercial) capacityLabel = 'TOTAL CAPACITY (SPACES)';
    else if (isHousehold) capacityLabel = 'TOTAL CAPACITY (UNITS)';

    const capLabelEl = document.querySelector('#stat-capacity').previousElementSibling;
    if (capLabelEl) capLabelEl.textContent = capacityLabel;

    document.getElementById('stat-capacity').textContent = totalCapacity;
    document.getElementById('stat-occupied').textContent = occupiedCount;
    document.getElementById('stat-vacant').textContent = totalCapacity - occupiedCount;

    // Persist to local storage tracking whenever we recount
    currentProperty.totalCapacity = totalCapacity;
    currentProperty.occupied = occupiedCount;
    savePropertyData();
}

// ─── Edit Building ──────────────────────────────────────────────────────────

function editBuilding() {
    const bodyHTML = `
        <div class="form-group">
            <label class="form-label">Building Name</label>
            <input type="text" class="form-input" id="edit-building-name" value="${currentProperty.name}">
        </div>
        <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-input" id="edit-building-location" value="${currentProperty.location}">
        </div>
    `;
    createModal('Edit Building', bodyHTML, () => {
        const newName = document.getElementById('edit-building-name').value.trim();
        const newLocation = document.getElementById('edit-building-location').value.trim();
        if (newName) {
            currentProperty.name = newName;
            currentProperty.location = newLocation;
            document.getElementById('property-name').textContent = newName;
            document.getElementById('property-location').textContent = newLocation;
            savePropertyData();
            showToast('Building updated successfully');
        }
        closeModal();
    });
}

function deleteBuilding() {
    createConfirmModal(
        'Delete Building',
        `Are you sure you want to delete <strong>${currentProperty.name}</strong>? This will remove all floors, rooms, and tenant assignments. This action cannot be undone.`,
        () => {
            const props = JSON.parse(localStorage.getItem('staywise_properties') || '[]');
            const updatedProps = props.filter(p => p.id !== currentProperty.id);
            localStorage.setItem('staywise_properties', JSON.stringify(updatedProps));

            showToast('Building deleted');
            setTimeout(() => {
                window.location.href = '../owners-pages/properties.html';
            }, 800);
        }
    );
}

// ─── Floor Management ─────────────────────────────────────────────────────

function suggestNextFloorName() {
    const existing = currentProperty.floors.map(f => f.level.toLowerCase().trim());

    // Ordered floor sequence
    const ordinals = [
        'Ground Floor',
        '1st Floor', '2nd Floor', '3rd Floor', '4th Floor',
        '5th Floor', '6th Floor', '7th Floor', '8th Floor',
        '9th Floor', '10th Floor', '11th Floor', '12th Floor',
        '13th Floor', '14th Floor', '15th Floor', '16th Floor',
        '17th Floor', '18th Floor', '19th Floor', '20th Floor'
    ];

    for (const name of ordinals) {
        if (!existing.includes(name.toLowerCase())) {
            return name;
        }
    }
    return `${currentProperty.floors.length + 1}th Floor`;
}

function addFloor() {
    const suggested = suggestNextFloorName();
    const bodyHTML = `
        <div class="form-group">
            <label class="form-label">Floor Name</label>
            <input type="text" class="form-input" id="add-floor-name" value="${suggested}" placeholder="e.g. 2nd Floor">
        </div>
        <p class="text-xs text-muted" style="margin-top:-0.5rem;">Suggested based on existing floors. You can change it.</p>
    `;
    createModal('Add New Floor', bodyHTML, () => {
        const floorName = document.getElementById('add-floor-name').value.trim();
        if (floorName) {
            currentProperty.floors.push({ level: floorName, rooms: [] });
            recalculateStats();
            renderOccupancyMap();
            showToast(`Floor "${floorName}" added`);
            closeModal();
        }
    });
}

function editFloor(floorIndex) {
    const floor = currentProperty.floors[floorIndex];
    const bodyHTML = `
        <div class="form-group">
            <label class="form-label">Floor Name</label>
            <input type="text" class="form-input" id="edit-floor-name" value="${floor.level}">
        </div>
    `;
    createModal('Edit Floor', bodyHTML, () => {
        const newName = document.getElementById('edit-floor-name').value.trim();
        if (newName) {
            floor.level = newName;
            renderOccupancyMap();
            showToast(`Floor renamed to "${newName}"`);
            closeModal();
        }
    });
}

function deleteFloor(floorIndex) {
    const floor = currentProperty.floors[floorIndex];
    const roomCount = floor.rooms.length;
    createConfirmModal(
        'Delete Floor',
        `Delete <strong>${floor.level}</strong>${roomCount > 0 ? ` and its ${roomCount} room(s)` : ''}? This cannot be undone.`,
        () => {
            currentProperty.floors.splice(floorIndex, 1);
            recalculateStats();
            renderOccupancyMap();
            showToast(`${floor.level} deleted`);
        }
    );
}

// ─── Room Management ────────────────────────────────────────────────────────

function addRoom(floorIndex) {
    const pType = currentProperty.type || 'PG';
    const isOffice = pType === 'Office Space';
    const isCommercial = pType === 'Commercial Space';
    const isHousehold = pType === 'RK' || pType === 'BHK';
    const isPG = !isOffice && !isCommercial && !isHousehold;

    let formTypeHtml = '';

    if (isOffice) {
        formTypeHtml = `
            <div class="form-group">
                <label class="form-label">Number of Desks in this Cabin</label>
                <input type="number" min="1" class="form-input" id="add-room-capacity" placeholder="e.g. 10" value="1">
            </div>
        `;
    } else if (isPG) {
        formTypeHtml = `
            <div class="form-group">
                <label class="form-label">Room Type</label>
                <select class="form-input" id="add-room-type">
                    <option value="Private">Private (1 Bed)</option>
                    <option value="2 Sharing" selected>2 Sharing</option>
                    <option value="3 Sharing">3 Sharing</option>
                    <option value="4 Sharing">4 Sharing</option>
                    <option value="5 Sharing">5 Sharing</option>
                </select>
            </div>
        `;
    } else if (isCommercial) {
        formTypeHtml = `
            <div class="form-group">
                <label class="form-label">Space Dimensions (e.g. 1000 sq ft)</label>
                <input type="text" class="form-input" id="add-room-dimensions" placeholder="e.g. 1000 sq ft">
            </div>
            <!-- Commercial spaces are counted as 1 entity to rent -->
            <input type="hidden" id="add-room-capacity" value="1">
        `;
    } else if (isHousehold) {
        formTypeHtml = `
            <!-- RK/BHK are rented as whole units -->
            <input type="hidden" id="add-room-capacity" value="1">
        `;
    }

    let roomNumberLabel = 'Room Number';
    if (isOffice) roomNumberLabel = 'Cabin Number';
    if (isCommercial) roomNumberLabel = 'Space Identifier';
    if (isHousehold) roomNumberLabel = 'Unit Number';

    const bodyHTML = `
        <div class="form-group">
            <label class="form-label">${roomNumberLabel}</label>
            <input type="text" class="form-input" id="add-room-number" placeholder="e.g. 201">
        </div>
        ${formTypeHtml}
    `;
    createModal('Add ' + roomNumberLabel.split(' ')[0], bodyHTML, () => {
        const roomNum = document.getElementById('add-room-number').value.trim();
        if (!roomNum) return;

        let bedCount = 1;
        let finalTypeLabel = '';

        if (isPG) {
            const roomType = document.getElementById('add-room-type').value;
            bedCount = roomType === 'Private' ? 1 : parseInt(roomType);
            finalTypeLabel = roomType;
        } else if (isOffice) {
            bedCount = parseInt(document.getElementById('add-room-capacity').value) || 1;
            finalTypeLabel = bedCount === 1 ? 'Private Cabin' : `${bedCount} Desks`;
        } else if (isCommercial) {
            bedCount = 1;
            const dims = document.getElementById('add-room-dimensions').value.trim();
            finalTypeLabel = dims || 'Commercial Space';
        } else if (isHousehold) {
            bedCount = 1;
            finalTypeLabel = pType; // 'RK' or 'BHK'
        }

        const beds = [];
        for (let i = 1; i <= bedCount; i++) {
            beds.push({ id: i, tenant: null, status: 'vacant' });
        }

        currentProperty.floors[floorIndex].rooms.push({
            number: roomNum,
            type: finalTypeLabel,
            status: 'Vacant',
            beds: beds
        });

        recalculateStats();
        renderOccupancyMap();
        showToast(`${roomNumberLabel.split(' ')[0]} ${roomNum} added`);
        closeModal();
    });
}

function editRoom(floorIndex, roomIndex) {
    const pType = currentProperty.type || 'PG';
    const isOffice = pType === 'Office Space';
    const isCommercial = pType === 'Commercial Space';
    const isHousehold = pType === 'RK' || pType === 'BHK';
    const isPG = !isOffice && !isCommercial && !isHousehold;

    const room = currentProperty.floors[floorIndex].rooms[roomIndex];

    let formTypeHtml = '';

    if (isOffice) {
        formTypeHtml = `
            <div class="form-group">
                <label class="form-label">Number of Desks in this Cabin</label>
                <input type="number" min="1" class="form-input" id="edit-room-capacity" value="${room.beds.length}">
            </div>
        `;
    } else if (isPG) {
        formTypeHtml = `
            <div class="form-group">
                <label class="form-label">Room Type</label>
                <select class="form-input" id="edit-room-type">
                    <option value="Private" ${room.type === 'Private' ? 'selected' : ''}>Private (1 Bed)</option>
                    <option value="2 Sharing" ${room.type === '2 Sharing' ? 'selected' : ''}>2 Sharing</option>
                    <option value="3 Sharing" ${room.type === '3 Sharing' ? 'selected' : ''}>3 Sharing</option>
                    <option value="4 Sharing" ${room.type === '4 Sharing' ? 'selected' : ''}>4 Sharing</option>
                    <option value="5 Sharing" ${room.type === '5 Sharing' ? 'selected' : ''}>5 Sharing</option>
                </select>
            </div>
        `;
    } else if (isCommercial) {
        formTypeHtml = `
            <div class="form-group">
                <label class="form-label">Space Dimensions</label>
                <input type="text" class="form-input" id="edit-room-dimensions" value="${room.type !== 'Commercial Space' ? room.type : ''}">
            </div>
            <input type="hidden" id="edit-room-capacity" value="1">
        `;
    } else if (isHousehold) {
        formTypeHtml = `<input type="hidden" id="edit-room-capacity" value="1">`;
    }

    let roomNumberLabel = 'Room Number';
    if (isOffice) roomNumberLabel = 'Cabin Number';
    if (isCommercial) roomNumberLabel = 'Space Identifier';
    if (isHousehold) roomNumberLabel = 'Unit Number';

    const bodyHTML = `
        <div class="form-group">
            <label class="form-label">${roomNumberLabel}</label>
            <input type="text" class="form-input" id="edit-room-number" value="${room.number}">
        </div>
        ${formTypeHtml}
    `;

    createModal('Edit ' + roomNumberLabel.split(' ')[0], bodyHTML, () => {
        const newNum = document.getElementById('edit-room-number').value.trim();
        if (!newNum) return;

        let newBedCount = room.beds.length;
        let newTypeLabel = room.type;

        if (isPG) {
            newTypeLabel = document.getElementById('edit-room-type').value;
            newBedCount = newTypeLabel === 'Private' ? 1 : parseInt(newTypeLabel);
        } else if (isOffice) {
            newBedCount = parseInt(document.getElementById('edit-room-capacity').value) || 1;
            newTypeLabel = newBedCount === 1 ? 'Private Cabin' : `${newBedCount} Desks`;
        } else if (isCommercial) {
            newBedCount = 1;
            newTypeLabel = document.getElementById('edit-room-dimensions').value.trim() || 'Commercial Space';
        } else if (isHousehold) {
            newBedCount = 1;
        }

        room.number = newNum;

        // If type or capacity changed, adjust beds
        if (room.type !== newTypeLabel || room.beds.length !== newBedCount) {
            // Preserve existing occupied beds
            const occupiedBeds = room.beds.filter(b => b.status === 'occupied');
            const newBeds = [];
            for (let i = 0; i < newBedCount; i++) {
                if (i < occupiedBeds.length) {
                    newBeds.push({ ...occupiedBeds[i], id: i + 1 });
                } else {
                    newBeds.push({ id: i + 1, tenant: null, status: 'vacant' });
                }
            }
            room.beds = newBeds;
            room.type = newTypeLabel;
        }

        recalculateStats();
        renderOccupancyMap();
        showToast(`${roomNumberLabel.split(' ')[0]} ${newNum} updated`);
        closeModal();
    });
}

function deleteRoom(floorIndex, roomIndex) {
    const room = currentProperty.floors[floorIndex].rooms[roomIndex];
    const occupiedCount = room.beds.filter(b => b.status === 'occupied').length;
    const warning = occupiedCount > 0 ? `<br><strong style="color: var(--error);">⚠ ${occupiedCount} tenant(s) currently assigned will be unassigned.</strong>` : '';

    createConfirmModal(
        'Delete Room',
        `Delete Room <strong>${room.number}</strong> (${room.type})?${warning}`,
        () => {
            currentProperty.floors[floorIndex].rooms.splice(roomIndex, 1);
            recalculateStats();
            renderOccupancyMap();
            showToast(`Room ${room.number} deleted`);
        }
    );
}

// ─── Bed / Tenant Management ────────────────────────────────────────────────

function manageBeds(floorIndex, roomIndex) {
    const room = currentProperty.floors[floorIndex].rooms[roomIndex];

    const pType = currentProperty.type || 'PG';
    const isOffice = pType === 'Office Space';
    const isCommercial = pType === 'Commercial Space';
    const isHousehold = pType === 'RK' || pType === 'BHK';
    const isPG = !isOffice && !isCommercial && !isHousehold;

    // Determine Nomenclature
    let spaceName = 'Room';
    let subUnitName = 'Bed';

    if (isOffice) {
        spaceName = 'Cabin';
        subUnitName = 'Desk';
    } else if (isCommercial) {
        spaceName = 'Space';
        subUnitName = 'Unit';
    } else if (isHousehold) {
        spaceName = 'Property Unit';
        subUnitName = 'Unit';
    }
    let bedsListHTML = '';
    room.beds.forEach((bed, bedIdx) => {
        const existingProfile = bed.email ? JSON.parse(localStorage.getItem(`staywise_profile_${bed.email}`)) : null;
        let passwordDOM = '';
        if (existingProfile && existingProfile.generatedPassword) {
            passwordDOM = `<div style="font-size: 0.75rem; display: inline-block; background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; margin-top: 4px; border: 1px dashed var(--border);">PIN: <strong>${existingProfile.generatedPassword}</strong></div>`;
        }

        const isOccupied = bed.status === 'occupied';
        const statusClass = isOccupied ? 'occupied' : 'vacant';
        const statusLabel = isOccupied ? `<span class="badge success">${bed.tenant}</span>${passwordDOM}` : `<span class="badge">Vacant</span>`;

        bedsListHTML += `
            <div class="bed-manage-row" data-bed-index="${bedIdx}">
                <div class="bed-manage-info">
                    <div class="bed-indicator-lg bed-${statusClass}"></div>
                    <div>
                        <strong>${isHousehold || isCommercial ? spaceName : subUnitName + ' ' + bed.id}</strong><br>
                        ${statusLabel}
                    </div>
                </div>
                <div class="bed-manage-actions">
                    ${isOccupied
                ? `<button class="btn btn-secondary btn-sm btn-remove-tenant" data-bed="${bedIdx}">Remove Tenant</button>`
                : `<button class="btn btn-primary btn-sm btn-assign-tenant" data-bed="${bedIdx}">Assign Tenant</button>`
            }
                </div>
            </div>
        `;
    });

    const bodyHTML = `
        <div style="margin-bottom: var(--space-3);">
            <span class="text-muted">${spaceName} ${room.number} · ${room.type}</span>
        </div>
        <div class="bed-manage-list">
            ${bedsListHTML}
        </div>
        <div style="margin-top: var(--space-4); border-top: 1px solid var(--border); padding-top: var(--space-3); display: flex; gap: var(--space-2);">
            ${isPG || isOffice ? `<button class="btn btn-secondary btn-sm" id="btn-add-bed">+ Add ${subUnitName}</button>` : ''}
            ${(isPG || isOffice) && room.beds.length > 1 ? `<button class="btn btn-secondary btn-sm" id="btn-remove-last-bed" style="color: var(--error);">- Remove Last ${subUnitName}</button>` : ''}
        </div>
    `;

    const modal = createModal(`Manage ${subUnitName}s — ${spaceName} ${room.number}`, bodyHTML, () => {
        closeModal();
    });

    // Change the Save button to Done
    const saveBtn = modal.querySelector('#modal-save-btn');
    saveBtn.textContent = 'Done';

    // Assign tenant buttons
    modal.querySelectorAll('.btn-assign-tenant').forEach(btn => {
        btn.addEventListener('click', () => {
            const bedIdx = parseInt(btn.dataset.bed);
            closeModal();
            assignTenantToBed(floorIndex, roomIndex, bedIdx);
        });
    });

    // Remove tenant buttons
    modal.querySelectorAll('.btn-remove-tenant').forEach(btn => {
        btn.addEventListener('click', () => {
            const bedIdx = parseInt(btn.dataset.bed);

            // Save to vacate log
            const profileKey = `staywise_profile_${room.beds[bedIdx].email}`;
            const existingProfile = JSON.parse(localStorage.getItem(profileKey) || '{}');
            const joinDate = existingProfile.joinedDate ? new Date(existingProfile.joinedDate).toLocaleDateString() : new Date().toLocaleDateString();

            const vacatedTenant = {
                name: room.beds[bedIdx].tenant,
                email: room.beds[bedIdx].email || 'N/A',
                property: currentProperty.name,
                propertyType: currentProperty.type || 'PG',
                room: room.number,
                subUnit: room.beds[bedIdx].id,
                rentAmount: room.beds[bedIdx].rentAmount || 'N/A',
                joinDate: joinDate,
                vacatedDate: new Date().toLocaleDateString()
            };
            const pastTenants = JSON.parse(localStorage.getItem('staywise_past_tenants') || '[]');
            pastTenants.push(vacatedTenant);
            localStorage.setItem('staywise_past_tenants', JSON.stringify(pastTenants));

            room.beds[bedIdx].tenant = null;
            room.beds[bedIdx].email = null;
            room.beds[bedIdx].rentAmount = 0;
            room.beds[bedIdx].status = 'vacant';
            recalculateStats();
            renderOccupancyMap();
            showToast('Tenant removed');
            closeModal();
            // Re-open the manage beds modal to show updated state
            setTimeout(() => manageBeds(floorIndex, roomIndex), 250);
        });
    });

    // Add bed button
    const addBedBtn = modal.querySelector('#btn-add-bed');
    if (addBedBtn) {
        addBedBtn.addEventListener('click', () => {
            const newId = room.beds.length + 1;
            room.beds.push({ id: newId, tenant: null, status: 'vacant' });
            // Update room type label if PG or Office
            if (isPG) {
                room.type = room.beds.length === 1 ? 'Private' : `${room.beds.length} Sharing`;
            } else if (isOffice) {
                room.type = room.beds.length === 1 ? 'Private Cabin' : `${room.beds.length} Desks`;
            }
            recalculateStats();
            renderOccupancyMap();
            closeModal();
            setTimeout(() => manageBeds(floorIndex, roomIndex), 250);
        });
    }

    // Remove last bed button
    const removeBedBtn = modal.querySelector('#btn-remove-last-bed');
    if (removeBedBtn) {
        removeBedBtn.addEventListener('click', () => {
            if (room.beds.length <= 1) return;
            room.beds.pop();
            // Update room type label if PG or Office
            if (isPG) {
                room.type = room.beds.length === 1 ? 'Private' : `${room.beds.length} Sharing`;
            } else if (isOffice) {
                room.type = room.beds.length === 1 ? 'Private Cabin' : `${room.beds.length} Desks`;
            }
            recalculateStats();
            renderOccupancyMap();
            closeModal();
            setTimeout(() => manageBeds(floorIndex, roomIndex), 250);
        });
    }
}

function assignTenantToBed(floorIndex, roomIndex, bedIndex) {
    const floor = currentProperty.floors[floorIndex];
    const room = floor.rooms[roomIndex];
    const bed = room.beds[bedIndex];

    const pType = currentProperty.type || 'PG';
    const isOffice = pType === 'Office Space';
    const isCommercial = pType === 'Commercial Space';
    const isHousehold = pType === 'RK' || pType === 'BHK';

    let spaceName = 'Room';
    let subUnitName = 'Bed';

    if (isOffice) {
        spaceName = 'Cabin';
        subUnitName = 'Desk';
    } else if (isCommercial) {
        spaceName = 'Space';
        subUnitName = 'Unit';
    } else if (isHousehold) {
        spaceName = 'Property Unit';
        subUnitName = 'Unit';
    }

    const bodyHTML = `
        <div class="form-group">
            <label class="form-label">Tenant Email</label>
            <input type="email" class="form-input" id="assign-tenant-email" placeholder="e.g. tenant@email.com" autofocus>
        </div>
        <div class="form-group">
            <label class="form-label">Tenant Name</label>
            <input type="text" class="form-input" id="assign-tenant-name" placeholder="e.g. Rahul Sharma">
        </div>
        <div class="form-group">
            <label class="form-label">Monthly Rent Amount (₹)</label>
            <input type="number" class="form-input" id="assign-tenant-rent" placeholder="e.g. 15000">
        </div>
        <div class="assign-summary">
            <p class="text-xs text-muted" style="margin-bottom:0.25rem;">Assignment Details</p>
            <div class="assign-detail-box">
                <span><strong>Building:</strong> ${currentProperty.name}</span>
                <span><strong>Floor:</strong> ${floor.level}</span>
                <span><strong>${spaceName}:</strong> ${room.number}</span>
                <span><strong>${subUnitName}:</strong> #${bed.id}</span>
            </div>
        </div>
        <p class="text-xs text-muted" style="margin-top:var(--space-3);"><i data-lucide="bell" style="width:12px;height:12px;vertical-align:-2px;"></i> A notification will be sent to the tenant upon assignment.</p>
    `;
    const modal = createModal('Assign Tenant', bodyHTML, () => {
        const email = document.getElementById('assign-tenant-email').value.trim();
        const name = document.getElementById('assign-tenant-name').value.trim();
        const rent = document.getElementById('assign-tenant-rent').value.trim();
        if (!email) {
            document.getElementById('assign-tenant-email').style.borderColor = 'var(--error)';
            return;
        }
        if (!name) {
            document.getElementById('assign-tenant-name').style.borderColor = 'var(--error)';
            return;
        }

        // Assign the tenant
        bed.tenant = name;
        bed.email = email;
        bed.rentAmount = rent ? parseInt(rent) : 0;
        bed.status = 'occupied';
        recalculateStats();
        renderOccupancyMap();

        // Send notification to the tenant's account (stored in localStorage for this demo)
        sendTenantNotification(email, name, currentProperty.name, floor.level, room.number, bed.id);

        // --- GENERATE TENANT CREDENTIALS ---
        // Format: 4-digit random PIN
        const generatedPassword = Math.floor(1000 + Math.random() * 9000).toString();

        // PERSIST TENANT PROFILE: Ensure the assigned name, email, and password are stored for their login
        const profileKey = `staywise_profile_${email}`;
        const existingProfile = JSON.parse(localStorage.getItem(profileKey) || '{}');
        const newProfile = {
            ...existingProfile,
            email: email,
            name: name,
            role: 'tenant',
            kycStatus: existingProfile.kycStatus || 'Pending',
            assignedBuilding: currentProperty.name,
            assignedRoom: room.number,
            rentAmount: rent ? parseInt(rent) : 0,
            generatedPassword: generatedPassword // SAVE GENERATED PASSWORD
        };
        localStorage.setItem(profileKey, JSON.stringify(newProfile));

        showToast(`${name} assigned to ${spaceName} ${room.number}`);
        closeModal();

        // Important: Show the generated password explicitly to the owner
        setTimeout(() => {
            alert(`✅ TENANT ASSIGNED SUCCESSFULLY\n\nName: ${name}\nEmail: ${email}\n\nLogin Password: ${generatedPassword}\n\nPlease share this password with the tenant. They cannot log in without it.`);
        }, 500);
    });

    // Re-init icons inside the modal
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Sends an in-app notification to a tenant's account.
 * In production this would be an API call; here we store in localStorage
 * so the tenant dashboard can read it upon login.
 */
function sendTenantNotification(email, name, buildingName, floorLevel, roomNumber, bedId) {
    const notification = {
        id: Date.now(),
        type: 'assignment',
        email: email,
        message: `You're successfully assigned with ${buildingName}, ${floorLevel}, Room ${roomNumber}, Bed #${bedId}.`,
        timestamp: new Date().toISOString(),
        read: false
    };

    // Store notifications in localStorage keyed by email
    const storageKey = `staywise_notifications_${email}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existing.unshift(notification);
    localStorage.setItem(storageKey, JSON.stringify(existing));

    console.log(`[Notification] Sent to ${email}:`, notification.message);
}

// ─── Toast Notification ─────────────────────────────────────────────────────

function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i data-lucide="check-circle" style="width:16px;height:16px;"></i> ${message}`;
    document.body.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ─── Occupancy Map Details ──────────────────────────────────────────────────

function renderOccupancyMap() {
    const mapContainer = document.getElementById('occupancy-map-container');
    if (!mapContainer) return;
    mapContainer.innerHTML = '';

    const pType = currentProperty.type || 'PG';
    const isOffice = pType === 'Office Space';
    const isCommercial = pType === 'Commercial Space';
    const isHousehold = pType === 'RK' || pType === 'BHK';

    let spaceName = 'Room';
    let subUnitName = 'Bed';

    if (isOffice) {
        spaceName = 'Cabin';
        subUnitName = 'Desk';
    } else if (isCommercial) {
        spaceName = 'Space';
        subUnitName = 'Unit';
    } else if (isHousehold) {
        spaceName = 'Property Unit';
        subUnitName = 'Unit';
    }

    if (currentProperty.floors.length === 0) {
        mapContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                <i data-lucide="building" style="width:48px;height:48px;margin-bottom:1rem;opacity:0.4;"></i>
                <p>No floors yet. Click <strong>+ Add Floor</strong> to get started.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    currentProperty.floors.forEach((floor, floorIndex) => { // Changed floorIdx to floorIndex for consistency
        const roomCount = floor.rooms.length; // Added roomCount variable
        let roomsHTML = ''; // Initialize roomsHTML

        if (floor.rooms.length === 0) {
            roomsHTML = `<p class="text-muted" style="padding: var(--space-3); grid-column: 1/-1;">No ${spaceName.toLowerCase()}s on this floor. Click + Add ${spaceName}.</p>`; // Updated text
        }

        floor.rooms.forEach((room, roomIndex) => {
            const occupied = room.beds.filter(b => b.status === 'occupied').length;
            const total = room.beds.length;

            let bedsGridDOM = '';
            room.beds.forEach(bed => {
                const statusClass = bed.status === 'occupied' ? 'occupied' : 'vacant';
                bedsGridDOM += `<div class="bed-indicator bed-${statusClass}" title="${subUnitName} ${bed.id}${bed.tenant ? ': ' + bed.tenant : ''}"></div>`;
            });

            const statusBadge = occupied === total
                ? '<span class="badge success" style="font-size:0.65rem; padding: 0.1rem 0.35rem;">Full</span>'
                : occupied === 0
                    ? '<span class="badge" style="font-size:0.65rem; padding: 0.1rem 0.35rem;">Empty</span>'
                    : `<span class="badge warning" style="font-size:0.65rem; padding: 0.1rem 0.35rem;">${occupied}/${total}</span>`;

            const actionButtons = `
                <button class="btn-icon btn-icon-sm" style="padding: 0.25rem;" onclick="editRoom(${floorIndex}, ${roomIndex})" title="Edit ${spaceName}"><i data-lucide="pencil" style="width: 14px; height: 14px;"></i></button>
                <button class="btn-icon btn-icon-sm text-error" style="padding: 0.25rem;" onclick="deleteRoom(${floorIndex}, ${roomIndex})" title="Delete ${spaceName}"><i data-lucide="trash-2" style="width: 14px; height: 14px;"></i></button>
            `;

            roomsHTML += `
                <div class="room-card" style="display: flex; flex-direction: column; height: 100%;">
                    <div class="room-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                        <div style="display: flex; align-items: center; gap: 0.35rem; min-width: 0;">
                            <strong style="font-size: 1.1rem; line-height: 1;">${room.number}</strong>
                            ${statusBadge}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
                            <span class="room-type-label" style="font-size: 0.75rem; color: var(--text-muted); padding-right: 0.25rem;">${room.type}</span>
                            ${actionButtons}
                        </div>
                    </div>
                    <div class="beds-container" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 0.75rem;">
                        ${bedsGridDOM}
                    </div>
                    <div style="margin-top: auto; padding-top: var(--space-2);">
                        <button class="btn btn-secondary btn-sm" style="width: 100%; border-radius: var(--radius-sm);" onclick="manageBeds(${floorIndex}, ${roomIndex})">Manage ${isHousehold || isCommercial ? spaceName : subUnitName + 's'}</button>
                    </div>
                </div>
            `;
        });

        const floorSection = document.createElement('div');
        floorSection.className = 'floor-section';
        floorSection.innerHTML = `
            <div class="floor-header" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                <h3 style="font-size: var(--text-lg); margin: 0;">${floor.level} <span class="text-sm text-muted" style="font-weight: 400;">${roomCount} ${spaceName.toLowerCase()}(s)</span></h3>
                <div style="display: flex; gap: var(--space-2);">
                    <button class="btn-icon" onclick="event.stopPropagation(); editFloor(${floorIndex})" title="Edit Floor"><i data-lucide="edit-2"></i></button>
                    <button class="btn-icon text-error" onclick="event.stopPropagation(); deleteFloor(${floorIndex})" title="Delete Floor"><i data-lucide="trash-2"></i></button>
                    <button class="btn btn-secondary btn-sm" style="margin-left: var(--space-4);" onclick="event.stopPropagation(); addRoom(${floorIndex})">+ Add ${spaceName}</button>
                </div>
            </div>
            <div class="rooms-grid" style="${roomCount === 0 ? 'display: none;' : ''}">
                ${roomsHTML}
            </div>
        `;
        mapContainer.appendChild(floorSection);
    });

    // Re-init Lucide icons for dynamically added elements
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Attach event delegation ONCE (not on every render)
    if (!mapContainer._hasListeners) {
        attachMapEventListeners(mapContainer);
        mapContainer._hasListeners = true;
    }
}

function attachMapEventListeners(container) {
    container.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        const floorIdx = parseInt(btn.dataset.floor);
        const roomIdx = parseInt(btn.dataset.room);

        switch (action) {
            case 'edit-floor':
                editFloor(floorIdx);
                break;
            case 'delete-floor':
                deleteFloor(floorIdx);
                break;
            case 'add-room':
                addRoom(floorIdx);
                break;
            case 'edit-room':
                editRoom(floorIdx, roomIdx);
                break;
            case 'delete-room':
                deleteRoom(floorIdx, roomIdx);
                break;
            case 'manage-beds':
                manageBeds(floorIdx, roomIdx);
                break;
        }
    });
}

// ─── Global Setup ───────────────────────────────────────────────────────────

function setupEventListeners() {
    // Add Floor button in header
    document.getElementById('btn-add-floor').addEventListener('click', addFloor);

    // Edit Building button in header
    const editBuildingBtn = document.getElementById('btn-edit-building');
    if (editBuildingBtn) editBuildingBtn.addEventListener('click', editBuilding);

    // Delete Building button in header
    const deleteBuildingBtn = document.getElementById('btn-delete-building');
    if (deleteBuildingBtn) deleteBuildingBtn.addEventListener('click', deleteBuilding);
}
