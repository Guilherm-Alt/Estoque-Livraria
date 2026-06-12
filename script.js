// --- VARIÁVEIS DO HTML (Ligação do JS com o Documento) ---
const productForm = document.getElementById('productForm');
const nameInput = document.getElementById('name');
const categoryInput = document.getElementById('category');
const quantityInput = document.getElementById('quantity');
const priceInput = document.getElementById('price');
const dateInput = document.getElementById('date');
const editIdInput = document.getElementById('editId'); // Para saber se estamos criando ou editando
const submitBtn = document.getElementById('submitBtn');

const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

// Capturamos as áreas do Dashboard (Cards lá de cima)
const totalProductsEl = document.getElementById('totalProducts');
const totalItemsEl = document.getElementById('totalItems');
const totalValueEl = document.getElementById('totalValue');

// --- CARREGAR BANCO DE DADOS (LOCAL STORAGE) ---
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];

// --- FUNÇÕES UTILITÁRIAS ---

function setDefaultDate() {
    if (!dateInput) return; // Apenas rola se existir na aba
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    dateInput.value = localDate;
}

function formatCurrency(value) {
    return Number(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatDateBR(dateString) {
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString; 
    return `${parts[2]}/${parts[1]}/${parts[0]}`; 
}


// --- ATUALIZAÇÕES DO LAYOUT ---

function updateDashboard() {
    if (!totalProductsEl) return; // Proteção para rodar apenas no index.html
    const totalProducts = inventory.length;
    const totalItems = inventory.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const totalValue = inventory.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0);

    totalProductsEl.textContent = totalProducts;
    totalItemsEl.textContent = totalItems;
    totalValueEl.textContent = formatCurrency(totalValue);
}

function renderTable(searchTerm = "") {
    if (!tableBody) return; // Proteção para rodar apenas no estoque.html

    tableBody.innerHTML = '';
    const termo = searchTerm.toLowerCase();

    inventory.forEach((item, index) => {
        // Evita crash se existir algum dado corrompido ou vazio no Local Storage
        if (!item) return;

        const safeName = item.name ? String(item.name).toLowerCase() : "";
        const safeCategory = item.category ? String(item.category).toLowerCase() : "";
        const safePriceStr = item.price ? String(item.price).toLowerCase() : "";
        const safeDate = item.date ? formatDateBR(item.date) : "Sem data";

        const isMatchText = safeName.includes(termo) ||
                        safeCategory.includes(termo) ||
                        safePriceStr.includes(termo) ||
                        safeDate.includes(termo);

        const filterCategoryValue = categoryFilter && categoryFilter.value ? categoryFilter.value.toLowerCase() : "";
        let matchCategory = true;
        if (filterCategoryValue !== "") {
            matchCategory = safeCategory === filterCategoryValue;
        }

        if(!isMatchText || !matchCategory) return;

        const safeQuantityRaw = item.quantity ? String(item.quantity) : "0";
        const safeQuantityNum = parseFloat(safeQuantityRaw) || 0;
        const safePrice = item.price ? Number(item.price) : 0;
        const totalItemValue = safeQuantityNum * safePrice;
        
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td><strong>${item.name || 'Sem nome'}</strong></td>
            <td>${item.category || 'Sem categoria'}</td>
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


// --- LÓGICA DE APLICATIVO ---

if (productForm) {
    // Somente roda na página inicial (onde tem form)
    productForm.addEventListener('submit', function (e) {
        e.preventDefault(); 

        const product = {
            name: nameInput.value,
            category: categoryInput.value,
            quantity: quantityInput.value,
            price: priceInput.value,
            date: dateInput.value
        };

        const editId = editIdInput.value;

        if (editId === '') {
            inventory.push(product);
        } else {
            inventory[editId] = product;
            editIdInput.value = '';
            submitBtn.innerHTML = "<i class='bx bx-plus'></i> Salvar Produto";
        }

        localStorage.setItem('inventory', JSON.stringify(inventory));
        productForm.reset();
        setDefaultDate();
        updateDashboard();
        
        // Remove parâmetro da URL se estivéssemos no modo edição e já salvamos
        window.history.replaceState({}, document.title, window.location.pathname);
    });

    // TRUQUE DE MÁGICA DE EDIÇÃO ENTRE PÁGINAS! 
    // Ao carregar a página index.html, verifica se tem '?editId=numero' na URL e puxa os dados!
    const urlParams = new URLSearchParams(window.location.search);
    const editIdParam = urlParams.get('editId');
    
    if (editIdParam !== null && inventory[editIdParam]) {
        const item = inventory[editIdParam];
        
        nameInput.value = item.name;
        categoryInput.value = item.category;
        quantityInput.value = item.quantity;
        priceInput.value = item.price;
        dateInput.value = item.date;
        
        editIdInput.value = editIdParam;
        submitBtn.innerHTML = "<i class='bx bx-save'></i> Atualizar Produto";
    }
}

// BIND da Barra de Busca e Filtro: só rodam no estoque.html
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        // Vai pegando letrinha por letrinha em tempo real e desenhando a tabela
        renderTable(e.target.value);
    });
}

if (categoryFilter) {
    categoryFilter.addEventListener('change', function() {
        renderTable(searchInput ? searchInput.value : "");
    });
}

window.editProduct = function (index) {
    // Agora o editar apenas direciona da listagem para a página de Formulário (Repassando na URL qual item vamos alterar)
    window.location.href = `index.html?editId=${index}`;
}

let itemToDeleteIndex = null;
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

window.deleteProduct = function (index) {
    if (deleteModal) {
        // Abre o modal estiloso invés do nativo do navegador
        itemToDeleteIndex = index;
        deleteModal.style.display = 'flex';
    } else {
        // Fallback caso a pessoa delete da página inicial ou onde o modal nao existe (se tiver no futuro)
        if (confirm('Tem certeza que deseja excluir este material do estoque? Essa ação é irreversível.')) {
            executeDelete(index);
        }
    }
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
        if (itemToDeleteIndex !== null) {
            executeDelete(itemToDeleteIndex);
            itemToDeleteIndex = null;
            deleteModal.style.display = 'none'; // Fecha o modal
        }
    });
}

if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => {
        itemToDeleteIndex = null;
        deleteModal.style.display = 'none'; // Apenas fecha o modal
    });
}

function executeDelete(index) {
    inventory.splice(index, 1);
    localStorage.setItem('inventory', JSON.stringify(inventory));
    
    // Redesenhar a tabela limpa sem o item deletado
    if (typeof renderTable === 'function') {
        renderTable(searchInput ? searchInput.value : "");
    }
    if (typeof updateDashboard === 'function') {
        updateDashboard(); 
    }
}

// --- BOOT (Iniciando a Página) ---
setDefaultDate();
renderTable(); 
updateDashboard();

// --- BACKUP (EXPORTAR E IMPORTAR) ---
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');

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
                        
                        if (typeof renderTable === 'function') {
                            renderTable(searchInput && searchInput.value ? searchInput.value : "");
                        }
                        if (typeof updateDashboard === 'function') {
                            updateDashboard();
                        }
                        
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
        
        // Resetar o input para permitir importar o mesmo arquivo novamente, se necessário
        e.target.value = '';
    });
}