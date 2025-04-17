// scripts/products.js
import { DataHandler } from './dataHandler.js';

export class ProductManager {
    constructor() {
        this.dataHandler = new DataHandler();
        this.init();
        this.visibleProducts = 5; // Número inicial de productos a mostrar
        this.loadMoreStep = 5; // Cuántos productos cargar al hacer clic en "Ver más"
    }

    async init() {
        await this.dataHandler.initialize();
    }

    async renderProducts(containerId, products = null, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Mostrar skeleton loading
        container.innerHTML = this.getSkeletonLoading(options.skeletonCount || 5);

        try {
            // Obtener productos si no se proporcionan
            let productsToRender = products || await this.dataHandler.readProducts();
            
            // Si no hay productos
            if (!productsToRender || productsToRender.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-600">No hay productos disponibles</p>
                    </div>
                `;
                return;
            }

            // Renderizar solo los primeros 5 productos inicialmente
            const initialProducts = productsToRender.slice(0, this.visibleProducts);
            container.innerHTML = '';
            initialProducts.forEach(product => {
                container.innerHTML += this.getProductCard(product);
            });

            // Agregar botón "Ver más" si hay más productos
            if (productsToRender.length > this.visibleProducts) {
                const loadMoreBtn = document.createElement('button');
                loadMoreBtn.className = 'mt-6 mx-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-300 block';
                loadMoreBtn.innerHTML = '<i class="fas fa-plus-circle mr-2"></i> Ver más productos';
                loadMoreBtn.addEventListener('click', async () => {
                    loadMoreBtn.disabled = true;
                    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Cargando...';
                    
                    // Mostrar los siguientes productos
                    this.visibleProducts += this.loadMoreStep;
                    const nextProducts = productsToRender.slice(0, this.visibleProducts);
                    
                    // Volver a renderizar todos los productos visibles
                    container.innerHTML = '';
                    nextProducts.forEach(product => {
                        container.innerHTML += this.getProductCard(product);
                    });

                    // Volver a agregar el botón si aún hay más productos
                    if (productsToRender.length > this.visibleProducts) {
                        container.appendChild(loadMoreBtn);
                        loadMoreBtn.disabled = false;
                        loadMoreBtn.innerHTML = '<i class="fas fa-plus-circle mr-2"></i> Ver más productos';
                    }
                });
                container.appendChild(loadMoreBtn);
            }

        } catch (error) {
            console.error('Error al renderizar productos:', error);
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <p class="text-gray-600">Error al cargar los productos</p>
                </div>
            `;
        }
    }

    getSkeletonLoading(count) {
        let skeletons = '';
        for (let i = 0; i < count; i++) {
            skeletons += `
                <div class="text-center py-12">
                    <div class="animate-pulse">
                        <div class="h-64 bg-gray-200 rounded-lg mb-4"></div>
                        <div class="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                        <div class="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
                        <div class="h-10 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                </div>
            `;
        }
        return skeletons;
    }

    getProductCard(product) {
        const discountBadge = product.discountPrice ? `
            <div class="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                ${Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
            </div>
        ` : '';

        const priceSection = product.discountPrice ? `
            <span class="text-gray-500 line-through mr-2">$${product.price.toFixed(2)}</span>
            <span class="text-red-500 font-bold">$${product.discountPrice.toFixed(2)}</span>
        ` : `
            <span class="text-gray-800 font-bold">$${product.price.toFixed(2)}</span>
        `;

        // Estrellas basadas en favoritos (simulado)
        const favoriteStars = Math.min(5, Math.max(1, Math.floor(Math.random() * 5) + 1));

        return `
            <div class="product-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition duration-300">
                <div class="relative overflow-hidden h-64">
                    <img src="${product.image || '/images/no-image-icon.png'}" 
                         alt="${product.name}" 
                         class="w-full h-full object-cover transition duration-500 hover:scale-110">
                    ${discountBadge}
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-1 truncate">${product.name}</h3>
                    <p class="text-gray-600 text-sm mb-2 line-clamp-2">${product.description || 'Descripción no disponible'}</p>
                    <div class="flex items-center mb-2">
                        <div class="flex text-yellow-400 text-sm">
                            ${'<i class="fas fa-star"></i>'.repeat(favoriteStars)}
                            ${'<i class="far fa-star"></i>'.repeat(5 - favoriteStars)}
                        </div>
                        <span class="text-gray-500 text-sm ml-1">(${product.sold || 0})</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            ${priceSection}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async renderFeaturedProducts(containerId, limit = 4) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            // Primero intentar con productos destacados
            let featuredProducts = await this.dataHandler.getTopProducts(limit);
            
            // Si no hay suficientes, mezclar con favoritos
            if (!featuredProducts || featuredProducts.length < limit) {
                const favorites = await this.dataHandler.getTopFavorites(limit);
                if (favorites && favorites.length > 0) {
                    // Combinar y eliminar duplicados
                    const combined = [...(featuredProducts || []), ...favorites];
                    const uniqueProducts = combined.reduce((acc, current) => {
                        const x = acc.find(item => item.id === current.id);
                        if (!x) {
                            return acc.concat([current]);
                        } else {
                            return acc;
                        }
                    }, []);
                    featuredProducts = uniqueProducts.slice(0, limit);
                }
            }
            
            // Si aún no hay suficientes, obtener los últimos productos
            if (!featuredProducts || featuredProducts.length < limit) {
                const allProducts = await this.dataHandler.readProducts();
                featuredProducts = allProducts
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, limit);
            }

            // Renderizar productos
            await this.renderProducts(containerId, featuredProducts, { skeletonCount: limit });

        } catch (error) {
            console.error('Error al renderizar productos destacados:', error);
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <p class="text-gray-600">Error al cargar los productos destacados</p>
                </div>
            `;
        }
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const productManager = new ProductManager();
    
    // Renderizar productos en la página principal
    if (document.getElementById('productsContainer')) {
        productManager.renderProducts('productsContainer');
    }
    
    // Renderizar productos destacados en la página principal
    if (document.getElementById('featuredProducts')) {
        productManager.renderFeaturedProducts('featuredProducts');
    }
});