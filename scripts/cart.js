import { DataHandler } from "./dataHandler.js";
import { showSuccess, showError } from './auth.js';

const dataHandler = new DataHandler();

export function setupCart() {
    updateCartCount();
}

export function updateCartCount() {
    const cart = dataHandler.getCart();
    document.getElementById('cartCount').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function updateCartModal() {
    const cart = dataHandler.getCart();
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">Tu carrito está vacío</p>
            </div>
        `;
        cartTotalElement.textContent = '$0.00';
        return;
    }

    let subtotal = 0;
    let totalDiscount = 0;
    let total = 0;
    
    cartItemsContainer.innerHTML = cart.map(item => {
        const price = item.product.discountPrice || item.product.price;
        const itemSubtotal = price * item.quantity;
        const itemDiscount = item.product.discountPrice 
            ? (item.product.price - item.product.discountPrice) * item.quantity 
            : 0;
        
        subtotal += item.product.price * item.quantity;
        totalDiscount += itemDiscount;
        total += itemSubtotal;
        
        const shortDescription = item.product.description 
            ? (item.product.description.length > 50 
                ? `${item.product.description.substring(0, 50)}...` 
                : item.product.description)
            : 'Sin descripción';
        
        return `
            <div class="cart-item border-b pb-4 mb-4">
                <div class="flex justify-between">
                    <div class="flex items-start space-x-4 w-3/4">
                        <img src="${item.product.image || ' '}" 
                             alt="${item.product.name}" 
                             class="w-16 h-16 object-cover rounded-lg">
                        <div class="flex-1">
                            <h4 class="font-medium text-gray-800">${item.product.name}</h4>
                            <p class="text-sm text-gray-500 mb-1">${shortDescription}</p>
                            <div class="flex items-center space-x-4">
                                <span class="text-sm font-medium ${item.product.discountPrice ? 'text-red-600' : 'text-gray-600'}">
                                    $${price.toFixed(2)} c/u
                                </span>
                                <span class="text-xs px-2 py-1 rounded ${
                                    item.product.stock > 0 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }">
                                    ${item.product.stock > 0 
                                        ? `${item.product.stock} en stock` 
                                        : 'Agotado'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col items-end justify-between">
                        <span class="font-medium text-gray-800">
                            $${itemSubtotal.toFixed(2)}
                        </span>
                        <div class="flex items-center space-x-2 mt-2">
                            <button class="decrease-quantity px-2 py-1 border rounded hover:bg-gray-100" 
                                    data-product-id="${item.product.id}">
                                <i class="fas fa-minus text-xs"></i>
                            </button>
                            <span class="w-8 text-center">${item.quantity}</span>
                            <button class="increase-quantity px-2 py-1 border rounded hover:bg-gray-100" 
                                    data-product-id="${item.product.id}">
                                <i class="fas fa-plus text-xs"></i>
                            </button>
                            <button class="remove-item text-red-500 ml-2 hover:text-red-700" 
                                    data-product-id="${item.product.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                ${item.product.discountPrice ? `
                <div class="mt-2 text-xs text-green-600">
                    <i class="fas fa-tag mr-1"></i>
                    Descuento aplicado: $${(item.product.price - item.product.discountPrice).toFixed(2)} (${Math.round(((item.product.price - item.product.discountPrice) / item.product.price * 100))}%)
                </div>
                ` : ''}
            </div>
        `;
    }).join('');

    // Mostrar resumen con descuentos
    cartTotalElement.innerHTML = `
        <div class="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        ${totalDiscount > 0 ? `
        <div class="flex justify-between mb-1 text-green-600">
            <span>Descuentos:</span>
            <span>-$${totalDiscount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
        </div>
    `;
    
    setupCartItemButtons();
}

function setupCartItemButtons() {
    document.querySelectorAll('.increase-quantity').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const productId = parseInt(e.currentTarget.dataset.productId);
            const cart = dataHandler.getCart();
            const item = cart.find(item => item.product.id === productId);
            
            if (item) {
                try {
                    await dataHandler.updateCartItem(productId, item.quantity + 1);
                    updateCartModal();
                    updateCartCount();
                } catch (error) {
                    showError(error.message);
                }
            }
        });
    });

    document.querySelectorAll('.decrease-quantity').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const productId = parseInt(e.currentTarget.dataset.productId);
            const cart = dataHandler.getCart();
            const item = cart.find(item => item.product.id === productId);
            
            if (item && item.quantity > 1) {
                try {
                    await dataHandler.updateCartItem(productId, item.quantity - 1);
                    updateCartModal();
                    updateCartCount();
                } catch (error) {
                    showError(error.message);
                }
            }
        });
    });

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const productId = parseInt(e.currentTarget.dataset.productId);
            try {
                await dataHandler.removeFromCart(productId);
                updateCartModal();
                updateCartCount();
                showSuccess('Producto eliminado del carrito');
            } catch (error) {
                showError(error.message);
            }
        });
    });
}