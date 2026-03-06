// ── SELECTORS (all querySelector) ──
const submit      = document.querySelector("#add");
const tableBody   = document.querySelector("#tableBody");
const totalCount  = document.querySelector("#totalCount");
const itemCount   = document.querySelector("#itemCount");
const toast       = document.querySelector("#toast");
const contextMenu = document.querySelector("#contextMenu");
const ctxTitle    = document.querySelector("#ctxTitle");
const ctxUpdate   = document.querySelector("#ctxUpdate");
const ctxDelete   = document.querySelector("#ctxDelete");

// Track which row was clicked
let selectedRow = null;

// ─────────────────────────────────────────────────────────────
// ORIGINAL CODE — untouched
// ─────────────────────────────────────────────────────────────

// POST API — Add Product
submit.addEventListener('click', () => {
    let iName  = document.querySelector("#itemName").value;
    let uPrice = document.querySelector("#unitPrice").value;
    let qt     = document.querySelector("#quantity").value;
    let sp     = document.querySelector("#supplier").value;
    let formData = { iName, uPrice, qt, sp };

    fetch("http://localhost:1234/api/products", {
        method: 'POST',
        body: JSON.stringify(formData),
        headers: {
            "Content-Type": "application/json",
        },
    }).catch((error) => {
        console.log(error);
    });

    showToast("Product Added Successfully", "success");
    document.querySelector("#itemName").value  = "";
    document.querySelector("#unitPrice").value = "";
    document.querySelector("#quantity").value  = "";
    document.querySelector("#supplier").value  = "";
    getUsers();
});

// Load on page start
window.addEventListener('load', () => {
    getUsers();
});

// GET API — Display all products
function getUsers() {
    fetch('http://localhost:1234/api/products', { mode: 'cors' })
        .then(response => {
            return response.json();
        })
        .then(data => {
            let html = "";

            if (data.length === 0) {
                html = `
                <tr>
                  <td colspan="4">
                    <div class="empty-state">
                      <div class="empty-icon">📦</div>
                      <p>No products found. Add one!</p>
                    </div>
                  </td>
                </tr>`;
            } else {
                data.forEach((element) => {
                    html += `
                    <tr class="product-row"
                        data-name="${element.itemName}"
                        data-price="${element.unitPrice}"
                        data-qty="${element.quantity}"
                        data-supplier="${element.supplier}">
                        <td>${element.itemName}</td>
                        <td class="price">₱${parseFloat(element.unitPrice).toFixed(2)}</td>
                        <td class="qty">${element.quantity}</td>
                        <td class="supplier">${element.supplier}</td>
                    </tr>`;
                });
            }

            tableBody.innerHTML = html;
            itemCount.textContent  = `${data.length} item${data.length !== 1 ? 's' : ''}`;
            totalCount.textContent = `${data.length} item${data.length !== 1 ? 's' : ''}`;
        })
        .catch(error => {
            console.log(error);
            tableBody.innerHTML = `
            <tr>
              <td colspan="4">
                <div class="empty-state">
                  <div class="empty-icon">⚠️</div>
                  <p>Could not connect to server. Is it running?</p>
                </div>
              </td>
            </tr>`;
        });
}

// ─────────────────────────────────────────────────────────────
// UI LAYER
// ─────────────────────────────────────────────────────────────

// TAB SWITCHER
document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
        btn.classList.add('active');
        document.querySelector(`#panel-${btn.dataset.mode}`).classList.remove('hidden');
    });
});

// SEARCH
document.querySelector("#searchBtn").addEventListener('click', () => {
    const query = document.querySelector("#searchInput").value.trim().toLowerCase();
    document.querySelectorAll('#tableBody tr').forEach(row => {
        const name = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase() || '';
        row.style.display = name.includes(query) ? '' : 'none';
    });
    const visible = [...document.querySelectorAll('#tableBody tr')].filter(r => r.style.display !== 'none').length;
    itemCount.textContent = `${visible} item${visible !== 1 ? 's' : ''}`;
});

// CLEAR SEARCH
document.querySelector("#clearSearch").addEventListener('click', () => {
    document.querySelector("#searchInput").value = "";
    document.querySelectorAll('#tableBody tr').forEach(row => row.style.display = '');
    getUsers();
});

// ── UPDATE HELPER ──
// FIX: changed from PUT /api/products/:name  →  PUT /api/products
// because the controller reads from req.body, not req.params
function updateProduct(originalName, iName, uPrice, qt, sp) {
    fetch("http://localhost:1234/api/products", {
        method: 'PUT',
        body: JSON.stringify({ iName: originalName, uPrice, qt, sp }),
        headers: { "Content-Type": "application/json" },
    })
    .then(res => res.json())
    .then(data => {
        showToast(data.message || "Item updated.", "success");
        getUsers();
    })
    .catch(err => {
        console.log(err);
        showToast("Update failed.", "error");
    });
}

// UPDATE BUTTON (sidebar)
document.querySelector("#updateBtn").addEventListener('click', () => {
    const iName  = document.querySelector("#updateName").value;
    const uPrice = document.querySelector("#updatePrice").value;
    const qt     = document.querySelector("#updateQty").value;
    const sp     = document.querySelector("#updateSupplier").value;

    if (!iName) { showToast("Enter the item name to update.", "error"); return; }

    updateProduct(iName, iName, uPrice, qt, sp);
});

// DELETE BUTTON (sidebar)
document.querySelector("#deleteBtn").addEventListener('click', () => {
    const iName = document.querySelector("#deleteName").value;
    if (!iName) { showToast("Enter the item name to delete.", "error"); return; }
    deleteProduct(iName);
});

// ── ROW CLICK → open context menu ──
tableBody.addEventListener('click', e => {
    const row = e.target.closest('.product-row');
    if (!row) return;

    // Highlight row
    document.querySelectorAll('.product-row').forEach(r => r.classList.remove('selected'));
    row.classList.add('selected');
    selectedRow = row;

    // Position & show context menu
    ctxTitle.textContent = row.dataset.name;

    let x = e.clientX;
    let y = e.clientY;

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top  = `${y}px`;
    contextMenu.classList.add('show');

    // Adjust if off-screen
    const menuRect = contextMenu.getBoundingClientRect();
    if (menuRect.right  > window.innerWidth)  contextMenu.style.left = `${x - menuRect.width}px`;
    if (menuRect.bottom > window.innerHeight) contextMenu.style.top  = `${y - menuRect.height}px`;
});

// Close context menu on outside click
document.addEventListener('click', e => {
    if (!contextMenu.contains(e.target)) {
        contextMenu.classList.remove('show');
        document.querySelectorAll('.product-row').forEach(r => r.classList.remove('selected'));
    }
});

// ── CONTEXT MENU: UPDATE ──
ctxUpdate.addEventListener('click', () => {
    if (!selectedRow) return;

    document.querySelector("#updateName").value     = selectedRow.dataset.name;
    document.querySelector("#updatePrice").value    = selectedRow.dataset.price;
    document.querySelector("#updateQty").value      = selectedRow.dataset.qty;
    document.querySelector("#updateSupplier").value = selectedRow.dataset.supplier;

    // Switch to Update tab
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    document.querySelector('[data-mode="update"]').classList.add('active');
    document.querySelector('#panel-update').classList.remove('hidden');

    contextMenu.classList.remove('show');
    showToast("Row loaded — edit and confirm.", "info");
});

// ── CONTEXT MENU: DELETE ──
ctxDelete.addEventListener('click', () => {
    if (!selectedRow) return;
    const iName = selectedRow.dataset.name;
    contextMenu.classList.remove('show');
    deleteProduct(iName);
});

// ── DELETE HELPER ──
function deleteProduct(iName) {
    fetch("http://localhost:1234/api/products", {
        method: 'DELETE',
        body: JSON.stringify({ id: iName }),
        headers: { "Content-Type": "application/json" },
    })
    .then(res => res.json())
    .then(data => {
        showToast(data.message || "Item deleted.", "success");
        document.querySelector("#deleteName").value = "";
        getUsers();
    })
    .catch(err => {
        console.log(err);
        showToast("Delete failed.", "error");
    });
}

// ── TOAST HELPER ──
function showToast(msg, type = 'info') {
    toast.textContent = msg;
    toast.className = `show toast-${type}`;
    setTimeout(() => { toast.className = ''; }, 3000);
}