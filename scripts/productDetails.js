import { DataHandler } from "./dataHandler.js";
import { showError, showSuccess } from './auth.js';
import { updateCartCount } from './cart.js';
import { toggleFavorite } from './favorites.js';

const dataHandler = new DataHandler();

// Variable para mantener el estado actual del producto en el modal
let currentProductInModal = null;

// Función para actualizar el estado de favoritos en el modal
export function updateFavoriteStatusInModal() {
    if (!currentProductInModal) return;
    
    const isFavorite = dataHandler.isFavorite(currentProductInModal.id);
    const favoriteBtn = document.getElementById('toggleFavoriteFromDetail');
    if (!favoriteBtn) return;
    
    const favoriteIcon = favoriteBtn.querySelector('i');
    const favoriteText = document.getElementById('favoriteText');
    
    if (favoriteIcon) {
        favoriteIcon.className = isFavorite ? 'fas fa-heart text-red-500' : 'far fa-heart';
    }
    
    if (favoriteText) {
        favoriteText.textContent = isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos';
    }
    
    // Actualizar estilos del botón
    favoriteBtn.className = isFavorite 
        ? 'flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors'
        : 'flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors';
}

// Función para actualizar el modal cuando cambia el estado de favoritos desde afuera
export function updateModalFavoriteStatus(productId) {
    if (currentProductInModal && currentProductInModal.id === productId) {
        updateFavoriteStatusInModal();
    }
}

export async function showProductDetails(productId) {
    try {
            const product = await dataHandler.getProductById(productId);
            
            if (!product) {
                console.error('Product not found for ID:', productId); // Debug
                showError('Producto no encontrado');
                return;
            }
            
            // Guardar el producto actual en la variable
            currentProductInModal = product;
    
            // Verificar que el modal existe
            const modal = document.getElementById('productDetailModal');
            if (!modal) {
                console.error('Modal element not found'); // Debug
                return;
            }
    
        
        modal.dataset.productId = productId;
        
        document.getElementById('productDetailTitle').textContent = product.name;
        document.getElementById('productDetailImage').src = product.image || '/images/no-image-icon.png';
        document.getElementById('productDetailName').textContent = product.name;
        document.getElementById('productDetailPrice').textContent = `$${product.discountPrice ? product.discountPrice.toFixed(2) : product.price.toFixed(2)}`;
        
        const oldPriceElement = document.getElementById('productDetailOldPrice');
        const discountElement = document.getElementById('productDetailDiscount');
        
        if (product.discountPrice) {
            oldPriceElement.textContent = `$${product.price.toFixed(2)}`;
            oldPriceElement.classList.remove('hidden');
            discountElement.textContent = `${Math.round(((product.price - product.discountPrice) / product.price * 100))}% OFF`;
            discountElement.classList.remove('hidden');
        } else {
            oldPriceElement.classList.add('hidden');
            discountElement.classList.add('hidden');
        }
        
        document.getElementById('productDetailDescription').textContent = product.description || 'Descripción no disponible';
        document.getElementById('productDetailCategory').textContent = product.category || 'Sin categoría';
        
        // Mostrar stock con estilo
        const stockElement = document.getElementById('productDetailStock');
        stockElement.textContent = product.stock > 0 ? `${product.stock} disponibles` : 'Agotado';
        stockElement.className = product.stock > 0 ? 
            'text-xs px-2 py-1 rounded bg-green-100 text-green-800' : 
            'text-xs px-2 py-1 rounded bg-red-100 text-red-800';
        
        // Configurar favorito
        updateFavoriteStatusInModal();
        
        // Configurar cantidad
        const quantityInput = document.getElementById('productQuantity');
        quantityInput.value = 1;
        quantityInput.max = product.stock;
        
        // Configurar botón de añadir al carrito
        const addToCartBtn = document.getElementById('addToCartFromDetail');
        if (product.stock <= 0) {
            addToCartBtn.disabled = true;
            addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            addToCartBtn.disabled = false;
            addToCartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        
        // Mostrar modal
        modal.classList.remove('hidden');

        // Configurar eventos de cantidad
        document.getElementById('increaseQuantity').onclick = () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue < product.stock) {
                quantityInput.value = currentValue + 1;
            }
        };

        document.getElementById('decreaseQuantity').onclick = () => {
            const currentValue = parseInt(quantityInput.value);
            if (currentValue > 1) {
                quantityInput.value = currentValue - 1;
            }
        };

        // Configurar evento de añadir al carrito desde el modal
        addToCartBtn.onclick = async () => {
            try {
                const quantity = parseInt(quantityInput.value);
                await dataHandler.addToCart(productId, quantity);
                updateCartCount();
                showSuccess(`Producto añadido al carrito (${quantity})`);
                document.getElementById('productDetailModal').classList.add("hidden"); // Añade esta línea
            } catch (error) {
                showError(error.message);
            }
        };
    } catch (error) {
        console.error("Error al mostrar detalles del producto:", error);
        showError("Error al cargar los detalles del producto");
    }
}