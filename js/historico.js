// --- VARIÁVEIS DOM: HISTORICO ---
const historyBody = document.getElementById('historyBody');
const searchHistory = document.getElementById('searchHistory');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const movementForm = document.getElementById('movementForm');
const movBook = document.getElementById('movBook');
const movType = document.getElementById('movType');
const movPerson = document.getElementById('movPerson');
const movQty = document.getElementById('movQty');

function renderHistory(searchTerm = "") {
    if (!historyBody) return;
    
    historyBody.innerHTML = '';
    const termo = searchTerm.toLowerCase();
    
    const reversed = [...movements].reverse();
    
    reversed.forEach((mov, revIndex) => {
        const realIndex = movements.length - 1 - revIndex;
        
        const safeTitle = mov.title ? String(mov.title).toLowerCase() : "";
        if (!safeTitle.includes(termo)) return;
        
        const isEntrada = mov.type === 'ENTRADA';
        const badgeClass = isEntrada ? 'badge-in' : 'badge-out';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${mov.dateTime}</td>
            <td><strong>${mov.title || 'Sem título'}</strong></td>
            <td>${mov.person || '-'}</td>
            <td><span class="badge ${badgeClass}">${mov.type}</span></td>
            <td style="color: ${isEntrada ? '#27ae60' : '#c0392b'}; font-weight: bold;">${mov.diff}</td>
            <td>${mov.total}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-delete" onclick="deleteHistoryItem(${realIndex})" title="Excluir Registro">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </td>
        `;
        historyBody.appendChild(tr);
    });
}

if (searchHistory) {
    searchHistory.addEventListener('input', function(e) {
        renderHistory(e.target.value);
    });
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', function() {
        if(confirm('Tem certeza que deseja apagar TODO o histórico? Esta ação é irreversível.')) {
            movements = [];
            localStorage.setItem('movements', JSON.stringify(movements));
            renderHistory();
        }
    });
}

window.deleteHistoryItem = function(index) {
    if(confirm('Tem certeza que deseja excluir esta anotação do histórico? (Isso apagará a linha para sempre, mas o saldo atual do livro não será revertido).')) {
        movements.splice(index, 1);
        localStorage.setItem('movements', JSON.stringify(movements));
        renderHistory(searchHistory && searchHistory.value ? searchHistory.value : "");
    }
}


function populateMovBooks() {
    if(!movBook) return;
    movBook.innerHTML = '<option value="" disabled selected>Escolha um livro da lista...</option>';
    inventory.forEach((item, index) => {
        if(!item) return;
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = `${item.name} (Saldo: ${item.quantity})`;
        movBook.appendChild(opt);
    });
}

if (movementForm) {
    populateMovBooks(); 
    
    movementForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const bIndex = movBook.value;
        if(bIndex === '') return alert("Selecione um livro válido!");
        
        const bookItem = inventory[bIndex];
        const qtyToMove = parseInt(movQty.value) || 0;
        const currQty = parseInt(bookItem.quantity) || 0;
        const opType = movType.value;
        
        let newQty = currQty;
        let diffStr = "";
        
        if (opType === 'SAÍDA') {
            if (qtyToMove > currQty) {
                return alert("Erro: Não há saldo suficiente deste livro em estoque para realizar este empréstimo/saída!");
            }
            newQty = currQty - qtyToMove;
            diffStr = `-${qtyToMove}`;
        } else {
            newQty = currQty + qtyToMove;
            diffStr = `+${qtyToMove}`;
        }
        
        bookItem.quantity = newQty;
        inventory[bIndex] = bookItem;
        localStorage.setItem('inventory', JSON.stringify(inventory));
        
        logTransaction(bookItem.name, opType, diffStr, newQty, movPerson.value);
        
        alert("Movimentação registrada com sucesso!");
        movementForm.reset();
        populateMovBooks(); 
        renderHistory();
    });
}


if(historyBody) {
    renderHistory();
}
