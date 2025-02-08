async function showPedidoDetalhes(pedidoId) {
    try {
        const response = await fetch(`/api/admin/pedido/${pedidoId}`);
        const data = await response.json();
        
        document.getElementById('pedidoId').textContent = pedidoId;
        const detalhesDiv = document.getElementById('pedidoDetalhes');
        
        let html = `
            <div class="pedido-cliente">
                <h3>Dados do Cliente</h3>
                <p><strong>Nome:</strong> ${data.pedido.cliente_nome}</p>
                <p><strong>Endereço:</strong> ${data.pedido.cliente_endereco}</p>
                <p><strong>Data:</strong> ${data.pedido.data_pedido}</p>
            </div>
            <div class="pedido-itens">
                <h3>Itens do Pedido</h3>
                <ul>
        `;
        
        data.itens.forEach(item => {
            html += `
                <li>
                    ${item.quantidade}x - R$ ${item.preco_unitario.toFixed(2)}
                    (Total: R$ ${(item.quantidade * item.preco_unitario).toFixed(2)})
                </li>
            `;
        });
        
        html += `
                </ul>
            </div>
            <div class="pedido-total">
                <h3>Total: R$ ${data.pedido.valor_total.toFixed(2)}</h3>
            </div>
        `;
        
        detalhesDiv.innerHTML = html;
        document.getElementById('detalhesModal').classList.add('active');
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        alert('Erro ao carregar detalhes do pedido');
    }
}

function closeModal() {
    document.getElementById('detalhesModal').classList.remove('active');
}

async function atualizarStatus(pedidoId, novoStatus) {
    try {
        const response = await fetch(`/api/admin/pedido/${pedidoId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: novoStatus })
        });
        
        const data = await response.json();
        if (data.success) {
            const statusBadge = document.querySelector(`.pedido-card[data-id="${pedidoId}"] .status-badge`);
            statusBadge.className = `status-badge ${novoStatus}`;
            statusBadge.textContent = novoStatus;
            
            showToast('Status atualizado com sucesso!', 'success');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showToast('Erro ao atualizar status', 'error');
    }
}

async function imprimirPedido(pedidoId) {
    try {
        const response = await fetch(`/api/admin/pedido/${pedidoId}`);
        const data = await response.json();
        
        // Criar uma nova janela para impressão
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Pedido #${pedidoId}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        width: 58mm;
                        padding: 5mm;
                        line-height: 1.2;
                    }
                    .pedido-header {
                        border-bottom: 1px dashed #000;
                        padding-bottom: 5mm;
                        margin-bottom: 5mm;
                        text-align: center;
                    }
                    .pedido-header h2 {
                        margin: 0;
                        font-size: 16px;
                    }
                    .pedido-info, .item-list, .total {
                        margin-bottom: 5mm;
                    }
                    .item-list ul {
                        padding: 0;
                        list-style: none;
                    }
                    .item-list li {
                        display: flex;
                        justify-content: space-between;
                        font-size: 14px;
                    }
                    .total {
                        border-top: 1px dashed #000;
                        padding-top: 5mm;
                        text-align: right;
                        font-weight: bold;
                    }
                    @media print {
                        body { print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="pedido-header">
                    <h2>Pedido #${pedidoId}</h2>
                    <p><strong>Data:</strong> ${data.pedido.data_pedido}</p>
                    <p><strong>Cliente:</strong> ${data.pedido.cliente_nome}</p>
                    <p><strong>Endereço:</strong> ${data.pedido.cliente_endereco}</p>
                    <p><strong>Status:</strong> ${data.pedido.status}</p>
                </div>
                <div class="item-list">
                    <h3>Itens do Pedido:</h3>
                    <ul>
                        ${data.itens.map(item => `
                            <li>
                                <span>${item.quantidade}x ${item.nome}</span>
                                <span>R$ ${(item.quantidade * item.preco_unitario).toFixed(2)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <div class="total">
                    <p>Total: R$ ${data.pedido.valor_total.toFixed(2)}</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    } catch (error) {
        console.error('Erro ao imprimir pedido:', error);
        showToast('Erro ao gerar impressão', 'error');
    }
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(event) {
    const modal = document.getElementById('detalhesModal');
    if (event.target === modal) {
        closeModal();
    }
});

let pedidoParaExcluir = null;

function confirmarExclusao(pedidoId) {
    pedidoParaExcluir = pedidoId;
    document.getElementById('deleteModal').classList.add('active');
}

function fecharModalExclusao() {
    document.getElementById('deleteModal').classList.remove('active');
    pedidoParaExcluir = null;
}

async function excluirPedido() {
    if (!pedidoParaExcluir) return;

    try {
        const response = await fetch(`/api/admin/pedido/${pedidoParaExcluir}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remover o pedido do DOM
            const pedido = document.querySelector(`.pedido-card[data-id="${pedidoParaExcluir}"]`);
            pedido.remove();
            showToast('Pedido excluído com sucesso!', 'success');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        showToast('Erro ao excluir pedido', 'error');
    } finally {
        fecharModalExclusao();
    }
}

// Fechar modal de exclusão ao clicar fora
document.addEventListener('click', function(event) {
    const modal = document.getElementById('deleteModal');
    if (event.target === modal) {
        fecharModalExclusao();
    }
});

class OrderUpdater {
    constructor() {
        this.setupEventSource();
        this.notificationSound = new Audio("/static/notification.mp3");
    }

    setupEventSource() {
        this.eventSource = new EventSource('/admin/stream');
        
        this.eventSource.onmessage = (event) => {
            const pedido = JSON.parse(event.data);
            this.handleNewOrder(pedido);
        };
        
        this.eventSource.onerror = (error) => {
            console.error('Erro na conexão:', error);
            setTimeout(() => this.setupEventSource(), 5000); // Reconectar após 5 segundos
        };
    }

    handleNewOrder(pedido) {
        // Tocar som de notificação
        this.notificationSound.play();
        
        // Adicionar pedido no topo da lista
        const pedidosLista = document.querySelector('.pedidos-list');
        const novoPedidoHtml = this.createOrderHtml(pedido);
        
        // Inserir no início da lista com animação
        pedidosLista.insertAdjacentHTML('afterbegin', novoPedidoHtml);
        
        // Aplicar efeito de destaque
        const novoPedidoElement = pedidosLista.firstElementChild;
        novoPedidoElement.classList.add('novo-pedido');
        
        // Mostrar notificação toast
        showToast('Novo pedido recebido!', 'success');
        
        // Remover efeito de destaque após 3 segundos
        setTimeout(() => {
            novoPedidoElement.classList.remove('novo-pedido');
        }, 3000);
        
        // Imprimir automaticamente após 2 segundos
        setTimeout(() => {
            imprimirPedido(pedido.id);
        }, 2000);
    }

    createOrderHtml(pedido) {
        return `
            <div class="pedido-card" data-id="${pedido.id}">
                <div class="pedido-header">
                    <h3>Pedido #${pedido.id}</h3>
                    <span class="status-badge ${pedido.status}">${pedido.status}</span>
                </div>
                <div class="pedido-info">
                    <p><strong>Cliente:</strong> ${pedido.cliente_nome}</p>
                    <p><strong>Data:</strong> ${pedido.data_pedido.split(' ')[0]}</p>
                    <p><strong>Total:</strong> R$ ${Number(pedido.valor_total).toFixed(2)}</p>
                </div>
                <div class="pedido-actions">
                    <div class="pedido-actions-left">
                        <button class="view-details-btn" onclick="showPedidoDetalhes(${pedido.id})">
                            Ver Detalhes
                        </button>
                        <select class="status-select" onchange="atualizarStatus(${pedido.id}, this.value)">
                            <option value="pendente" ${pedido.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="preparo" ${pedido.status === 'preparo' ? 'selected' : ''}>Em Preparo</option>
                            <option value="entrega" ${pedido.status === 'entrega' ? 'selected' : ''}>Em Entrega</option>
                            <option value="concluido" ${pedido.status === 'concluido' ? 'selected' : ''}>Concluído</option>
                            <option value="cancelado" ${pedido.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                    <div class="pedido-actions-right">
                        <button class="print-btn" onclick="imprimirPedido(${pedido.id})">
                            <i class="fas fa-print"></i>
                        </button>
                        <button class="delete-btn" onclick="confirmarExclusao(${pedido.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Inicializar o atualizador de pedidos quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.orderUpdater = new OrderUpdater();
});
