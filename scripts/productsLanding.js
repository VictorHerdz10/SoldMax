import { DataHandler } from './dataHandler.js';

export class ProductManager {
    constructor() {
        this.dataHandler = new DataHandler();
        this.init();
        this.visibleProducts = 4; // Número inicial de productos a mostrar (coincide con el grid)
        this.loadMoreStep = 4; // Cuántos productos cargar al hacer clic en "Ver más"
        this.isExpanded = false; // Estado para controlar si se muestran todos los productos
    }

    async init() {
        await this.dataHandler.initialize();
    }

    async renderProducts(containerId, products = null, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Mostrar skeleton loading
        container.innerHTML = this.getSkeletonLoading(options.skeletonCount || this.visibleProducts);

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

            // Renderizar productos
            this.updateProductDisplay(container, productsToRender);

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

    updateProductDisplay(container, products) {
        // Determinar qué productos mostrar según el estado
        const productsToShow = this.isExpanded ? 
            products : 
            products.slice(0, this.visibleProducts);
        
        // Limpiar el contenedor
        container.innerHTML = '';
        
        // Renderizar los productos seleccionados
        productsToShow.forEach(product => {
            container.innerHTML += this.getProductCard(product);
        });

        // Agregar controles de expansión si hay más productos
        if (products.length > this.visibleProducts) {
            this.addExpansionControls(container, products);
        }
    }

    addExpansionControls(container, products) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'col-span-full text-center mt-6';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white px-6 py-2 rounded-lg font-medium transition duration-300 shadow-md';
        
        if (this.isExpanded) {
            toggleBtn.innerHTML = '<i class="fas fa-minus-circle mr-2"></i> Mostrar menos';
            toggleBtn.addEventListener('click', () => {
                this.isExpanded = false;
                this.updateProductDisplay(container, products);
            });
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-plus-circle mr-2"></i> Ver más productos';
            toggleBtn.addEventListener('click', () => {
                this.isExpanded = true;
                this.updateProductDisplay(container, products);
            });
        }
        
        controlsDiv.appendChild(toggleBtn);
        container.appendChild(controlsDiv);
    }

    getSkeletonLoading(count) {
        let skeletons = '';
        for (let i = 0; i < count; i++) {
            skeletons += `
                <div class="bg-white rounded-lg shadow-md overflow-hidden">
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

        // Estrellas basadas en ventas (simuladas)
        const ratingStars = this.calculateRatingStars(product.sold || 0);

        return `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300 h-full flex flex-col">
                <div class="relative overflow-hidden h-48">
                    <img src="${product.image || '/images/no-image-icon.png'}" 
                         alt="${product.name}" 
                         class="w-full h-full object-cover transition duration-500 hover:scale-110">
                    ${discountBadge}
                    ${product.status === 'Agotado' ? `
                        <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span class="text-white font-bold bg-red-500 px-2 py-1 rounded">AGOTADO</span>
                        </div>
                    ` : ''}
                </div>
                <div class="p-4 flex-grow flex flex-col">
                    <h3 class="font-semibold text-lg mb-1 truncate">${product.name}</h3>
                    <p class="text-gray-600 text-sm mb-2 line-clamp-2 flex-grow">${product.description || 'Descripción no disponible'}</p>
                    <div class="flex items-center mb-2">
                        <div class="flex text-yellow-400 text-sm">
                            ${ratingStars}
                        </div>
                        <span class="text-gray-500 text-sm ml-1">(${product.sold || 0})</span>
                    </div>
                    <div class="flex items-center justify-between mt-auto">
                        <div class="text-sm">
                            ${priceSection}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    calculateRatingStars(soldCount) {
        // Lógica para calcular estrellas basadas en ventas
        let stars = 0;
        if (soldCount > 50) stars = 5;
        else if (soldCount > 30) stars = 4;
        else if (soldCount > 15) stars = 3;
        else if (soldCount > 5) stars = 2;
        else stars = 1;
        
        let starsHTML = '';
        for (let i = 0; i < 5; i++) {
            if (i < stars) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        return starsHTML;
    }

    async renderFeaturedProducts(containerId, limit = 20) {
        const container = document.getElementById(containerId);
        if (!container) return;

        try {
            // Obtener productos más vendidos
            let topSoldProducts = await this.dataHandler.getTopProducts(limit);
            
            // Obtener productos más favoritos
            const topFavorites = await this.dataHandler.getTopFavorites(limit);
            
            // Combinar y eliminar duplicados
            let featuredProducts = this.combineProducts(topSoldProducts, topFavorites, limit);
            
            // Si aún no hay suficientes, obtener los últimos productos agregados
            if (featuredProducts.length < limit) {
                const allProducts = await this.dataHandler.readProducts();
                const newestProducts = allProducts
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, limit - featuredProducts.length);
                
                featuredProducts = [...featuredProducts, ...newestProducts]
                    .filter((product, index, self) => 
                        index === self.findIndex(p => p.id === product.id)
                    )
                    .slice(0, limit);
            }

            // Renderizar productos destacados
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

    combineProducts(topSold, topFavorites, limit) {
        // Convertir topFavorites a formato consistente si es necesario
        const formattedFavorites = topFavorites.map(fav => {
            return fav.product ? fav.product : fav;
        });
        
        // Combinar sin duplicados
        const combined = [...(topSold || []), ...formattedFavorites];
        const uniqueProducts = combined.reduce((acc, current) => {
            const exists = acc.some(item => item.id === current.id);
            if (!exists) {
                return [...acc, current];
            }
            return acc;
        }, []);
        
        return uniqueProducts.slice(0, limit);
    }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const productManager = new ProductManager();
    
    // Renderizar productos destacados en la página principal
    if (document.getElementById('featuredProducts')) {
        productManager.renderFeaturedProducts('featuredProducts');
    }
});