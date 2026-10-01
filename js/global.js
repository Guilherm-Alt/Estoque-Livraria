// --- VARIÁVEIS DO BANCO DE DADOS (LOCAL STORAGE) ---
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
let movements = JSON.parse(localStorage.getItem('movements')) || [];

// --- FUNÇÕES UTILITÁRIAS GLOBAIS ---
function logTransaction(bookTitle, type, diff, newTotal, personStr = "Sistema / Automático") {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    movements.push({
        dateTime: `${dateStr} ${timeStr}`,
        title: bookTitle,
        person: personStr,
        type: type,
        diff: diff,
        total: newTotal
    });
    localStorage.setItem('movements', JSON.stringify(movements));
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
