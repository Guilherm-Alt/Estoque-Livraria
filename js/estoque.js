// --- VARIÁVEIS DOM: ESTOQUE ---
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');

let itemToDeleteIndex = null;
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');

function renderTable(searchTerm = "") {
    if (!tableBody) return;

    tableBody.innerHTML = '';
    const termo = searchTerm.toLowerCase();

    inventory.forEach((item, index) => {
        if (!item) return;

        const safeName = item.name ? String(item.name).toLowerCase() : "";
        const safeAuthor = item.author ? String(item.author).toLowerCase() : "autor desconhecido";
        const safePriceStr = item.price ? String(item.price).toLowerCase() : "";
        const safeDate = item.date ? formatDateBR(item.date) : "Sem data";

        const isMatchText = safeName.includes(termo) ||
                        safeAuthor.includes(termo) ||
                        safePriceStr.includes(termo) ||
                        safeDate.includes(termo);

        if(!isMatchText) return;

        const safeQuantityRaw = item.quantity ? String(item.quantity) : "0";
        const safeQuantityNum = parseFloat(safeQuantityRaw) || 0;
        const safePrice = item.price ? Number(item.price) : 0;
        const totalItemValue = safeQuantityNum * safePrice;
        
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td><strong>${item.name || 'Sem título'}</strong></td>
            <td>${item.author || 'Autor(a) Desconhecido(a)'}</td>
            <td>${safeQuantityRaw}</td>
            <td>${formatCurrency(safePrice)}</td>
            <td>${formatCurrency(totalItemValue)}</td>
            <td>${safeDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editProduct(${index})" title="Editar Produto">
                        <i class='bx bx-edit-alt'></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteProduct(${index})" title="Excluir Produto">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        renderTable(e.target.value);
    });
}

window.editProduct = function (index) {
    window.location.href = `../index.html?editId=${index}`;
}

window.deleteProduct = function (index) {
    if (deleteModal) {
        itemToDeleteIndex = index;
        deleteModal.style.display = 'flex';
    }
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
        if (itemToDeleteIndex !== null) {
            executeDelete(itemToDeleteIndex);
            itemToDeleteIndex = null;
            deleteModal.style.display = 'none'; 
        }
    });
}

if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => {
        itemToDeleteIndex = null;
        deleteModal.style.display = 'none'; 
    });
}

function executeDelete(index) {
    let itemToDel = inventory[index];
    if (itemToDel) {
        logTransaction(itemToDel.name, 'SAÍDA', `-${itemToDel.quantity}`, 0);
    }
    inventory.splice(index, 1);
    localStorage.setItem('inventory', JSON.stringify(inventory));
    renderTable(searchInput ? searchInput.value : "");
}

// --- BACKUP (EXPORTAR E IMPORTAR) ---
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(inventory, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `estoque_backup_${date}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    });
}

if (importBtn) {
    importBtn.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData)) {
                    if (confirm('Atenção: Restaurar um backup irá substituir TODO o estoque atual.\n\nDeseja continuar?')) {
                        inventory = importedData;
                        localStorage.setItem('inventory', JSON.stringify(inventory));
                        renderTable(searchInput && searchInput.value ? searchInput.value : "");
                        alert('Backup restaurado com sucesso! O seu estoque foi atualizado.');
                    }
                } else {
                    alert('Arquivo de backup inválido. O formato dos dados não é reconhecido (deveria ser uma lista de itens).');
                }
            } catch (error) {
                alert('Erro ao ler o arquivo. Certifique-se de que é um arquivo de backup válido do sistema.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });
}

// Inicializa a página de estoque
if(tableBody) {
    renderTable();
}
