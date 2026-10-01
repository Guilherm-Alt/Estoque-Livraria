// --- VARIÁVEIS DOM: INDEX ---
const productForm = document.getElementById('productForm');
const nameInput = document.getElementById('name');
const authorInput = document.getElementById('author');
const quantityInput = document.getElementById('quantity');
const priceInput = document.getElementById('price');
const dateInput = document.getElementById('date');
const editIdInput = document.getElementById('editId');
const submitBtn = document.getElementById('submitBtn');

const totalProductsEl = document.getElementById('totalProducts');
const totalItemsEl = document.getElementById('totalItems');
const totalValueEl = document.getElementById('totalValue');

// Atualiza cards de resumo
function updateDashboard() {
    if (!totalProductsEl) return;
    const totalProducts = inventory.length;
    const totalItems = inventory.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
    const totalValue = inventory.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)), 0);

    totalProductsEl.textContent = totalProducts;
    totalItemsEl.textContent = totalItems;
    totalValueEl.textContent = formatCurrency(totalValue);
}

function setDefaultDate() {
    if (!dateInput) return;
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    dateInput.value = localDate;
}

if (productForm) {
    productForm.addEventListener('submit', async function (e) {
        e.preventDefault(); 
        const product = {
            name: nameInput.value,
            author: authorInput.value,
            quantity: quantityInput.value,
            price: priceInput.value,
            date: dateInput.value
        };

        const editId = editIdInput.value;
        let qtyChange = parseFloat(product.quantity) || 0;

        // --- Verifica duplicata (só ao cadastrar novo, não ao editar) ---
        if (editId === '') {
            const normalize = str => String(str || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // remove acentos
                .trim();

            const nomeBusca  = normalize(product.name);
            const autorBusca = normalize(product.author);

            const duplicado = inventory.find(item =>
                normalize(item.name)   === nomeBusca &&
                normalize(item.author) === autorBusca
            );

            if (duplicado) {
                const ok = await showConfirm(
                    `Já existe um livro com esse nome e autor no estoque:\n\n📖 "${duplicado.name}" — ${duplicado.author || 'Autor não informado'}\n(Saldo atual: ${duplicado.quantity} exemplar(es))\n\nDeseja cadastrar mesmo assim?`,
                    'Livro Duplicado'
                );
                if (!ok) return;
            }
        }

        if (editId === '') {
            inventory.push(product);
            logTransaction(product.name, 'ENTRADA', `+${qtyChange}`, qtyChange);
        } else {
            let oldItem = inventory[editId];
            let oldQty = parseFloat(oldItem.quantity) || 0;
            let newQty = parseFloat(product.quantity) || 0;
            let diff = newQty - oldQty;
            
            inventory[editId] = product;
            editIdInput.value = '';
            submitBtn.innerHTML = "<i class='bx bx-plus'></i> Salvar Livro";
            
            if (diff > 0) {
                logTransaction(product.name, 'ENTRADA', `+${diff}`, newQty);
            } else if (diff < 0) {
                logTransaction(product.name, 'SAÍDA', `${diff}`, newQty);
            }
        }

        localStorage.setItem('inventory', JSON.stringify(inventory));
        productForm.reset();
        setDefaultDate();
        updateDashboard();
        window.history.replaceState({}, document.title, window.location.pathname);
    });


    const urlParams = new URLSearchParams(window.location.search);
    const editIdParam = urlParams.get('editId');
    if (editIdParam !== null && inventory[editIdParam]) {
        const item = inventory[editIdParam];
        nameInput.value = item.name;
        if(authorInput) authorInput.value = item.author || '';
        quantityInput.value = item.quantity;
        priceInput.value = item.price;
        dateInput.value = item.date;
        
        editIdInput.value = editIdParam;
        submitBtn.innerHTML = "<i class='bx bx-save'></i> Atualizar Livro";
    }
}

// Inicializa a página
if(productForm){ 
    setDefaultDate();
    updateDashboard();
}
