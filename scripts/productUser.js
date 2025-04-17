import { DataHandler } from "./dataHandler.js";
import { showSuccess, showError } from './auth.js';
import { toggleFavorite } from './favorites.js';
import { updateCartCount } from './cart.js';
import { showProductDetails } from './productDetails.js';

const dataHandler = new DataHandler();

export function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    container.innerHTML = products.map(product => {
        const shortDescription = product.description 
            ? (product.description.length > 30 
                ? `${product.description.substring(0, 30)}...` 
                : product.description)
            : 'Sin descripción';
        
        return `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1" 
             data-product-id="${product.id}">
            <div class="relative h-48 overflow-hidden">
                <img src="${product.image || '/images/no-image-icon.png'}" 
                     alt="${product.name}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105">
                ${product.discountPrice ? 
                    `<div class="discount-badge bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -${Math.round(((product.price - product.discountPrice) / product.price * 100))}%
                    </div>` : ''}
                <button class="favorite-btn absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                        data-product-id="${product.id}">
                    <i class="fas ${dataHandler.isFavorite(product.id) ? 'fa-heart text-red-500' : 'fa-heart text-gray-400'}"></i>
                </button>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-1 truncate">${product.name}</h3>
                <p class="text-xs text-gray-500 mb-2">${shortDescription}</p>
                <div class="flex items-center mb-2">
                    <span class="font-bold text-green-600">
                        $${product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}
                    </span>
                    ${product.discountPrice ? 
                        `<span class="text-xs text-gray-500 line-through ml-2">$${product.price.toFixed(2)}</span>` : ''}
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                    </span>
                    <button class="add-to-cart bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                            data-product-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    setupProductEvents(container);
}

export function renderDiscountedProducts(products) {
    const container = document.getElementById('offersContainer');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="inline-block p-4 bg-yellow-50 rounded-lg">
                    <i class="fas fa-tag text-yellow-500 text-3xl mb-2"></i>
                    <p class="text-yellow-800">No hay ofertas disponibles</p>
                    <p class="text-sm text-yellow-600 mt-2">Revisa más tarde nuestras promociones</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const shortDescription = product.description 
            ? (product.description.length > 30 
                ? `${product.description.substring(0, 30)}...` 
                : product.description)
            : 'Sin descripción';
        
        return `
        <div class="offer-card bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-md overflow-hidden border border-amber-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1" data-product-id="${product.id}">
            <div class="relative h-48 overflow-hidden">
                <img src="${product.image || '/images/no-image-icon.png'}" 
                     alt="${product.name}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105">
                <div class="discount-badge bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                    ${Math.round(((product.price - product.discountPrice) / product.price * 100))}% OFF
                </div>
                <button class="favorite-btn absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                        data-product-id="${product.id}">
                    <i class="fas ${dataHandler.isFavorite(product.id) ? 'fa-heart text-red-500' : 'fa-heart text-gray-400'}"></i>
                </button>
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-lg mb-1 truncate">${product.name}</h3>
                <p class="text-xs text-gray-500 mb-2">${shortDescription}</p>
                <div class="flex items-center mb-2">
                    <span class="font-bold text-red-600">
                        $${product.discountPrice.toFixed(2)}
                    </span>
                    <span class="text-xs text-gray-500 line-through ml-2">$${product.price.toFixed(2)}</span>
                </div>
                <div class="text-xs text-amber-800 mb-2">
                    <i class="fas fa-clock mr-1"></i> Hasta ${new Date(product.discountEndDate).toLocaleDateString()}
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                    </span>
                    <button class="add-to-cart bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                            data-product-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    setupProductEvents(container);
}

export function updateProductAvailability(products) {
    const containers = [
        document.getElementById('productsContainer'),
        document.getElementById('offersContainer'),
        document.getElementById('favoritesContainer'), // Asegurarnos de incluir favoritos
        document.getElementById('topProductsContainer')
    ].filter(container => container !== null);

    containers.forEach(container => {
        products.forEach(product => {
            const card = container.querySelector(`[data-product-id="${product.id}"]`);
            if (card) {
                // Actualizar badge de stock
                const stockBadge = card.querySelector('.add-to-cart')?.previousElementSibling;
                if (stockBadge) {
                    stockBadge.textContent = product.stock > 0 ? 
                        (container.id === 'favoritesContainer' ? 'Disponible' : `${product.stock} disponibles`) : 'Agotado';
                    stockBadge.className = `text-xs px-2 py-1 rounded ${
                        product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`;
                }

                // Actualizar botón de añadir al carrito
                const addToCartBtn = card.querySelector('.add-to-cart');
                if (addToCartBtn) {
                    addToCartBtn.disabled = product.stock <= 0;
                    if (product.stock <= 0) {
                        addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    } else {
                        addToCartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    }
                }

                // Actualizar estado de descuento si es necesario
                const discountBadge = card.querySelector('.discount-badge');
                if (discountBadge && product.discountPrice) {
                    const discountPercent = Math.round(((product.price - product.discountPrice) / product.price * 100));
                    discountBadge.textContent = `${discountPercent}% OFF`;
                }
            }
        });
    });
}

export function setupProductEvents(container) {
    // Evento click en las tarjetas de producto para mostrar detalles
    container.querySelectorAll('.product-card, .offer-card').forEach(card => {
        card.addEventListener('click', async (e) => {
            // Verificar si el click fue en un botón
            if (e.target.closest('button')) return;
            
            const productId = parseInt(card.dataset.productId);
            await showProductDetails(productId);
        });
    });

    // Botones de favoritos
    container.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const productId = parseInt(e.currentTarget.dataset.productId);
            const isFavorite = await toggleFavorite(productId);
            
            // Actualizar icono inmediatamente
            const icon = e.currentTarget.querySelector('i');
            icon.className = isFavorite ? 'fas fa-heart text-red-500' : 'far fa-heart text-gray-400';
            
            showSuccess(isFavorite ? 'Añadido a favoritos' : 'Eliminado de favoritos');
        });
    });

    // Botones de añadir al carrito
    container.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const productId = parseInt(e.currentTarget.dataset.productId);
            try {
                await dataHandler.addToCart(productId);
                updateCartCount();
                showSuccess('Producto añadido al carrito');
            } catch (error) {
                showError(error.message);
            }
        });
    });
}