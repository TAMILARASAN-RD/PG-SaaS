/**
 * rent-manager.js
 * Logic for Rent Management Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Render
    renderRentData();
});

/**
 * Creates and shows a modal (re-used from property-manager style logic).
 */
function createRentModal(title, bodyHTML, onSave) {
    // Remove existing
    const existingOverlays = document.querySelectorAll('.modal-overlay');
    existingOverlays.forEach(o => o.remove());

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
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

    // Animate
    requestAnimationFrame(() => overlay.classList.add('active'));

    const closeHandler = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('#modal-close-btn').addEventListener('click', closeHandler);
    overlay.querySelector('#modal-cancel-btn').addEventListener('click', closeHandler);

    overlay.querySelector('#modal-save-btn').addEventListener('click', () => {
        if (onSave) {
            onSave(closeHandler);
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeHandler();
    });
}

function openRecordPaymentModal(recordId) {
    const existingRecords = JSON.parse(localStorage.getItem('staywise_rent_records') || '[]');
    const recordIndex = existingRecords.findIndex(r => r.id === recordId);
    if (recordIndex === -1) return;
    const record = existingRecords[recordIndex];

    const bodyHTML = `
        <div class="form-group">
            <p style="margin-bottom: 0.5rem;"><strong>Tenant:</strong> ${escapeHTML(record.tenant)}</p>
            <p style="margin-bottom: 0.5rem;"><strong>Property:</strong> ${escapeHTML(record.property)}</p>
            <p style="margin-bottom: 1.5rem;"><strong>Total Expected:</strong> ${formatCurrency(record.amount)}</p>
        </div>
        <div class="form-group">
            <label class="form-label">Amount Paid (₹)</label>
            <input type="number" class="form-input" id="payment-amount" placeholder="e.g. ${record.amount}">
        </div>
        <div class="form-group">
            <label class="form-label">Update Status</label>
            <select class="form-input" id="payment-status">
                <option value="Paid" selected>Paid</option>
                <option value="Partially Paid">Partially Paid</option>
            </select>
        </div>
    `;

    createRentModal('Record Payment', bodyHTML, (closeModalCallback) => {
        const amountPaid = parseFloat(document.getElementById('payment-amount').value.trim());
        const status = document.getElementById('payment-status').value;

        if (isNaN(amountPaid)) {
            alert('Please enter the payment amount.');
            return;
        }

        // Technically, you might want to track a 'paidAmount' separately than the original rent 'amount', 
        // but for now we'll just update the status so the Dashboard clears the overdue/pending buckets.

        // Update the record's status
        existingRecords[recordIndex].status = status;
        existingRecords[recordIndex].amountPaid = amountPaid;

        // Optionally update the amount if they partially paid. 
        // If "Partially Paid", the outstanding remainder might become a new pending record, but we will leave that for later.

        localStorage.setItem('staywise_rent_records', JSON.stringify(existingRecords));

        renderRentData();
        closeModalCallback();
    });
}

function renderRentData() {
    const records = JSON.parse(localStorage.getItem('staywise_rent_records') || '[]');

    // 1. Calculate Stats
    let collected = 0;
    let pending = 0;
    let overdue = 0;

    records.forEach(r => {
        if (r.status === 'Paid') collected += r.amount;
        if (r.status === 'Pending') pending += r.amount;
        if (r.status === 'Overdue') overdue += r.amount;
    });

    const totalExpected = collected + pending + overdue;
    const collectionRate = totalExpected > 0 ? Math.round((collected / totalExpected) * 100) : 0;

    // Update the DOM Stats safely check if elements exist
    if (document.getElementById('stat-month-collected'))
        document.getElementById('stat-month-collected').textContent = formatCurrency(collected);

    if (document.getElementById('stat-pending'))
        document.getElementById('stat-pending').textContent = formatCurrency(pending);

    if (document.getElementById('stat-overdue'))
        document.getElementById('stat-overdue').textContent = formatCurrency(overdue);

    const collectionRateEl = document.getElementById('stat-collection-rate');
    if (collectionRateEl) {
        collectionRateEl.textContent = collectionRate + '%';
        if (collectionRate > 79) {
            collectionRateEl.style.color = 'var(--success)';
        } else if (collectionRate >= 50) {
            collectionRateEl.style.color = 'var(--warning)';
        } else {
            collectionRateEl.style.color = 'var(--error)';
        }
    }


    // 2. Render Table Rows
    const tbody = document.getElementById('rent-table-body');
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    No rent records found.
                </td>
            </tr>
        `;
        return;
    }

    // Sort newest first
    const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sortedRecords.map(r => {
        let badgeClass = '';
        if (r.status === 'Paid') badgeClass = 'success';
        else if (r.status === 'Pending') badgeClass = 'warning';
        else if (r.status === 'Partially Paid') badgeClass = 'warning';
        else if (r.status === 'Overdue') badgeClass = 'error';

        // Format Date nicely
        const dateObj = new Date(r.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

        return `
            <tr>
                <td>${escapeHTML(r.tenant)}</td>
                <td>${escapeHTML(r.property)}</td>
                <td>${formatCurrency(r.amount)}</td>
                <td>${formattedDate}</td>
                <td><span class="badge ${badgeClass}">${r.status}</span></td>
                <td>
                    ${r.status !== 'Paid'
                ? `<button class="btn btn-sm btn-secondary" onclick="openRecordPaymentModal(${r.id})">Record Payment</button>`
                : `<span style="color:var(--text-muted); font-size:var(--text-sm);">Completed</span>`
            }
                </td>
            </tr>
        `;
    }).join('');
}

function formatCurrency(amount) {
    // If over 1,00L, maybe format as Lakhs (for example: ₹3.8L). 
    // Here we'll do a basic format with commas for simplicity up to 99,999 -> ₹8,500
    if (amount >= 100000) {
        return '₹' + (amount / 100000).toFixed(1) + 'L';
    }
    return '₹' + amount.toLocaleString('en-IN');
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}
