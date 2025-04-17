import { DataHandler } from "./dataHandler.js";
import { showSuccess, showError } from './auth.js';
import { setupProductEvents } from './productUser.js';

const dataHandler = new DataHandler();

export async function loadFavorites() {
    try {
        const favorites = dataHandler.getFavorites();
        const container = document.getElementById('favoritesContainer');
        if (!container) return;
        
        if (favorites.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="inline-block p-4 bg-pink-50 rounded-lg">
                        <i class="fas fa-heart text-pink-500 text-3xl mb-2"></i>
                        <p class="text-pink-800">No tienes productos favoritos</p>
                        <p class="text-sm text-pink-600 mt-2">Haz clic en el corazón de un producto para añadirlo aquí</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = favorites.map(product => `
            <div class="favorite-card bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg shadow-md overflow-hidden border border-pink-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1" data-product-id="${product.id}">
                <div class="relative h-48 overflow-hidden">
                    <img src="${product.image || ''}" 
                         alt="${product.name}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-105">
                    <button class="favorite-btn absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                            data-product-id="${product.id}">
                        <i class="fas fa-heart text-red-500"></i>
                    </button>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2 truncate">${product.name}</h3>
                    <div class="flex items-center mb-2">
                        <span class="font-bold text-rose-600">
                            $${product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}
                        </span>
                        ${product.discountPrice ? 
                            `<span class="text-sm text-gray-500 line-through ml-2">$${product.price.toFixed(2)}</span>` : ''}
                    </div>
                    <p class="text-xs text-pink-600 mb-2">${product.category || 'Sin categoría'}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-xs px-2 py-1 rounded ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                            ${product.stock > 0 ? 'Disponible' : 'Agotado'}
                        </span>
                        <button class="add-to-cart bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition-colors"
                                data-product-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        setupProductEvents(container);
    } catch (error) {
        console.error("Error al cargar favoritos:", error);
        showError("Error al cargar los productos favoritos");
    }
}

export async function toggleFavorite(productId, fromDetail = false) {
    try {
        const isCurrentlyFavorite = dataHandler.isFavorite(productId);
        const newFavoriteStatus = await dataHandler.toggleFavorite(productId);
        
        // Actualizar todos los iconos de favorito en la página
        document.querySelectorAll(`.favorite-btn[data-product-id="${productId}"] i`).forEach(icon => {
            icon.className = newFavoriteStatus ? 'fas fa-heart text-red-500' : 'far fa-heart';
        });

        // Actualizar modal si está abierto
        if (typeof updateModalFavoriteStatus === 'function') {
            updateModalFavoriteStatus(productId);
        }

        // Mostrar notificación si no es desde el detalle
        if (!fromDetail) {
            showSuccess(newFavoriteStatus ? 'Añadido a favoritos' : 'Eliminado de favoritos');
        }

        // Recargar la sección de favoritos si estamos en esa vista
        if (document.getElementById('favoritesContainer') && isCurrentlyFavorite !== newFavoriteStatus) {
            await loadFavorites();
        }

        return newFavoriteStatus;
    } catch (error) {
        console.error("Error al actualizar favoritos:", error);
        throw error;
    }
}