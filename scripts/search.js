import { DataHandler } from "./dataHandler.js";
import { renderProducts } from './productUser.js';

const dataHandler = new DataHandler();
let lastSearchResults = [];
let currentProducts = []; // Almacena los productos actuales

export async function setupSearch() {
    // Cargar todos los productos inicialmente
    currentProducts = await dataHandler.readProducts();
    
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        
        if (query.length > 2) {
            lastSearchResults = await dataHandler.searchProducts(query);
            renderProducts(lastSearchResults);
        } else if (query.length === 0) {
            // Restaurar los productos originales
            lastSearchResults = [];
            currentProducts = await dataHandler.readProducts();
            renderProducts(currentProducts);
        }
    });
}

export function getLastSearchResults() {
    return lastSearchResults;
}