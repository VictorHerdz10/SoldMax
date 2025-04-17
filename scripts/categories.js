import { DataHandler } from "./dataHandler.js";
import { showProductDetails } from './productDetails.js';

const dataHandler = new DataHandler();
let activeCategory = null;
let currentProductsContainer = null;

// Paleta de colores para categorías
const categoryColors = {
    'Electrónica': 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300',
    'Hogar': 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300',
    'Ropa': 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300',
    'Deportes': 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300',
    'Juguetes': 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300',
    'Default': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-300'
};

export function setupCategoryEvents() {
    document.addEventListener('categorySelected', async (e) => {
        const category = e.detail.category;
        
        // Clic en la misma categoría: cerrar
        if (activeCategory === category) {
            closeProductsContainer();
            activeCategory = null;
            highlightActiveCategory();
            return;
        }

        // Clic en nueva categoría
        activeCategory = category;
        const products = await dataHandler.readProducts();
        const filteredProducts = products.filter(p => p.category === activeCategory);
        
        renderProductsList(filteredProducts);
        highlightActiveCategory();
    });
}

function closeProductsContainer() {
    if (currentProductsContainer) {
        currentProductsContainer.remove();
        currentProductsContainer = null;
    }
}

function renderProductsList(products) {
    closeProductsContainer(); // Limpiar antes de renderizar
    
    const mainContainer = document.getElementById('categoriesContainer');
    currentProductsContainer = document.createElement('div');
    currentProductsContainer.className = 'category-products-container mt-6 w-full animate-fade-in';
    
    const productsList = document.createElement('ol');
    productsList.className = 'grid grid-cols-1 gap-4 list-decimal list-inside';
    
    products.forEach((product, index) => {
        const item = document.createElement('li');
        item.className = `p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow 
                          flex items-start gap-4 border-l-4 ${getCategoryBorderColor(product.category)}`;
        
        // Número con estilo moderno
        const numberSpan = document.createElement('span');
        numberSpan.className = 'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 font-medium text-gray-700';
        numberSpan.textContent = index + 1;
        
        // Contenido del producto
        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex-1';
        
        contentDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <h3 class="font-semibold text-gray-800">${product.name}</h3>
                <span class="text-lg font-bold ${product.discountPrice ? 'text-green-600' : 'text-gray-800'}">
                    $${product.discountPrice?.toFixed(2) || product.price.toFixed(2)}
                </span>
            </div>
            ${product.discountPrice ? `
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-sm line-through text-gray-500">$${product.price.toFixed(2)}</span>
                    <span class="text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full">
                        ${Math.round(((product.price - product.discountPrice) / product.price * 100))}% OFF
                    </span>
                </div>
            ` : ''}
            <div class="mt-2 flex items-center gap-3 text-sm">
                <span class="${getCategoryColorClass(product.category)} px-2 py-1 rounded-full text-xs font-medium">
                    ${product.category || 'Sin categoría'}
                </span>
                <span class="${product.stock > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} 
                             px-2 py-1 rounded-full text-xs font-medium">
                    ${product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                </span>
            </div>
        `;
        
        item.prepend(numberSpan);
        item.appendChild(contentDiv);
        
        item.addEventListener('click', () => {
            showProductDetails(product.id); // Pasamos el producto completo al modal
        });
        
        productsList.appendChild(item);
    });

    if (products.length === 0) {
        productsList.innerHTML = `
            <li class="text-center py-6">
                <div class="flex flex-col items-center text-gray-400">
                    <i class="fas fa-box-open text-4xl mb-2"></i>
                    <p>No hay productos en esta categoría</p>
                </div>
            </li>
        `;
    }

    currentProductsContainer.appendChild(productsList);
    mainContainer.insertAdjacentElement('afterend', currentProductsContainer);
}

function getCategoryColorClass(category) {
    if (!category) return categoryColors['Default'];
    const baseColor = Object.keys(categoryColors).find(key => 
        category.toLowerCase().includes(key.toLowerCase())
    );
    return baseColor ? categoryColors[baseColor] : categoryColors['Default'];
}

function getCategoryBorderColor(category) {
    const colorMap = {
        'Electrónica': 'border-l-blue-400',
        'Hogar': 'border-l-green-400',
        'Ropa': 'border-l-purple-400',
        'Deportes': 'border-l-orange-400',
        'Juguetes': 'border-l-red-400',
        'Default': 'border-l-indigo-400'
    };
    
    if (!category) return colorMap['Default'];
    const baseColor = Object.keys(colorMap).find(key => 
        category.toLowerCase().includes(key.toLowerCase())
    );
    return baseColor ? colorMap[baseColor] : colorMap['Default'];
}

export function highlightActiveCategory() {
    const categoryChips = document.querySelectorAll('.category-chip');
    categoryChips.forEach(chip => {
        if (chip.dataset.category === activeCategory) {
            chip.classList.add('ring-2', 'ring-offset-2', 'ring-opacity-50', 'scale-105');
            chip.classList.remove('opacity-90');
        } else {
            chip.classList.remove('ring-2', 'ring-offset-2', 'ring-opacity-50', 'scale-105');
            chip.classList.add('opacity-90', 'hover:opacity-100');
        }
    });
}

export function loadCategories(products) {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    
    container.innerHTML = categories.length === 0 
        ? `
            <div class="col-span-full text-center py-8">
                <div class="inline-flex flex-col items-center text-gray-400">
                    <i class="fas fa-tags text-3xl mb-2"></i>
                    <p>No hay categorías disponibles</p>
                </div>
            </div>
        `
        : categories.map(category => `
            <div class="category-chip ${getCategoryColorClass(category)} rounded-xl p-4 text-center 
                 cursor-pointer transition-all duration-300 border shadow-sm flex flex-col items-center"
                 data-category="${category}">
                <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2 shadow-inner">
                    <i class="${getCategoryIcon(category)} text-xl"></i>
                </div>
                <h3 class="font-semibold">${category}</h3>
                <span class="text-xs mt-1 opacity-80">
                    ${products.filter(p => p.category === category).length} items
                </span>
            </div>
        `).join('');

    container.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4';

    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('categorySelected', { 
                detail: { category: chip.dataset.category } 
            }));
        });
    });
}

function getCategoryIcon(category) {
    const iconMap = {
        'Electrónica': 'fas fa-laptop text-blue-500',
        'Hogar': 'fas fa-home text-green-500',
        'Ropa': 'fas fa-tshirt text-purple-500',
        'Deportes': 'fas fa-running text-orange-500',
        'Juguetes': 'fas fa-gamepad text-red-500',
        'Default': 'fas fa-boxes text-indigo-500'
    };
    
    if (!category) return iconMap['Default'];
    const baseIcon = Object.keys(iconMap).find(key => 
        category.toLowerCase().includes(key.toLowerCase())
    );
    return baseIcon ? iconMap[baseIcon] : iconMap['Default'];
}