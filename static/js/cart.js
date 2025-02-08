let cart = {
    items: {},
    total: 0
};

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);

    // Remover o toast após 3 segundos
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function updateCartDisplay() {
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    let totalCount = Object.values(cart.items).reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalCount;
    
    cartItems.innerHTML = '';
    Object.values(cart.items).forEach(item => {
        cartItems.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">R$ ${item.price.toFixed(2)} x ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="cart-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="cart-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
            </div>
        `;
    });
    
    cartTotal.textContent = cart.total.toFixed(2);
}

function addToCart(id, name, price) {
    if (cart.items[id]) {
        cart.items[id].quantity += 1;
        cart.total += price;
        showToast(`Quantidade de ${name} aumentada!`, 'info');
    } else {
        cart.items[id] = { id, name, price, quantity: 1 };
        cart.total += price;
        showToast(`${name} adicionado ao carrinho!`, 'success');
    }
    updateCartDisplay();
    
    const modal = document.getElementById('cartModal');
    modal.classList.add('active');
}

function updateQuantity(id, newQuantity) {
    const itemName = cart.items[id].name;
    if (newQuantity <= 0) {
        cart.total -= cart.items[id].price * cart.items[id].quantity;
        delete cart.items[id];
        showToast(`${itemName} removido do carrinho`, 'info');
    } else {
        const diff = newQuantity - cart.items[id].quantity;
        cart.items[id].quantity = newQuantity;
        cart.total += cart.items[id].price * diff;
        showToast(`Quantidade de ${itemName} atualizada!`, 'info');
    }
    updateCartDisplay();
}

async function checkout() {
    try {
        const response = await fetch('/api/cart/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: Object.values(cart.items),
                total: cart.total
            })
        });
        
        const data = await response.json();
        if (data.success) {
            cart = { items: {}, total: 0 };
            updateCartDisplay();
            alert('Pedido realizado com sucesso!');
        }
    } catch (error) {
        alert('Erro ao finalizar pedido');
    }
}

function showCheckoutModal() {
    document.getElementById('checkoutModal').classList.add('active');
    document.getElementById('cartModal').classList.remove('active');
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
}

async function submitCheckout(event) {
    event.preventDefault();
    
    if (Object.keys(cart.items).length === 0) {
        alert('Adicione itens ao carrinho antes de finalizar o pedido');
        return;
    }

    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    
    if (!name || !address) {
        alert('Por favor, preencha todos os campos');
        return;
    }

    const submitButton = event.target.querySelector('.confirm-button');
    submitButton.textContent = 'Processando...';
    submitButton.disabled = true;

    try {
        const response = await fetch('/api/cart/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                address: address,
                items: Object.values(cart.items),
                total: parseFloat(cart.total.toFixed(2))
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            cart = { items: {}, total: 0 };
            updateCartDisplay();
            closeCheckoutModal();
            showToast(`Pedido #${data.order_id} realizado com sucesso!`, 'success');
        } else {
            throw new Error(data.message || 'Erro ao processar pedido');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast(error.message || 'Erro ao finalizar pedido', 'error');
    } finally {
        submitButton.textContent = 'Confirmar Pedido';
        submitButton.disabled = false;
    }
}

// Atualizar os event listeners dos botões
document.addEventListener('DOMContentLoaded', function() {
    // Event listener para o ícone do carrinho
    const cartIcon = document.getElementById('cartIcon');
    const cartModal = document.getElementById('cartModal');
    
    cartIcon.addEventListener('click', function(event) {
        event.stopPropagation();
        cartModal.classList.toggle('active');
    });

    // Event listener para os botões de pedido
    document.querySelectorAll('.order-button').forEach(button => {
        button.addEventListener('click', function(event) {
            const menuItem = this.closest('.menu-item');
            const id = parseInt(menuItem.dataset.id);
            const name = menuItem.querySelector('h3').textContent;
            const priceText = menuItem.querySelector('.price').textContent;
            const price = parseFloat(priceText.replace('R$ ', '').replace(',', '.'));
            
            addToCart(id, name, price);
        });
    });

    // Fechar modal quando clicar fora
    document.addEventListener('click', function(event) {
        if (!cartModal.contains(event.target) && !cartIcon.contains(event.target)) {
            cartModal.classList.remove('active');
        }
    });

    // Prevenir fechamento ao clicar dentro do modal
    cartModal.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    // Adicionar listener para o formulário de checkout
    document.getElementById('checkoutForm').addEventListener('submit', submitCheckout);

    // Adicionar listener para fechar modal de checkout ao clicar fora
    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) {
        document.addEventListener('click', function(event) {
            if (event.target === checkoutModal) {
                closeCheckoutModal();
            }
        });
    }
});
