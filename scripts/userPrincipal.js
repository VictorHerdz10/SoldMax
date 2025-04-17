import { protectRoute } from "./auth-middleware.js";
import { DataHandler } from "./dataHandler.js";
import { Validations } from "./userValidations.js";
import { logout, showError, showSuccess } from "./auth.js";

import { setupUI } from "./ui.js";
import { setupModals } from "./modals.js";
import { setupCart, updateCartCount } from "./cart.js";
import { setupSearch } from "./search.js";
import {
  setupCategoryEvents,
  loadCategories,
  highlightActiveCategory,
} from "./categories.js";
import { renderProducts, renderDiscountedProducts } from "./productUser.js";
import { loadFavorites } from "./favorites.js";
import { loadUserPurchases, loadPendingOrders } from "./purchases.js";
import { setupHeroAnimations, setupProfileModal } from "./profileAccount.js";

const dataHandler = new DataHandler();
let currentProducts = [];
let currentCategoryFilter = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (!protectRoute()) return;

  // Configuración inicial de UI
  setupUI();
  setupModals();
  setupCart();
  setupSearch();
  setupCategoryEvents();

  // Cargar datos iniciales
  await loadInitialData();
});

async function loadInitialData() {
  try {
    currentProducts = await dataHandler.readProducts();

    // Mostrar productos destacados
    renderProducts(currentProducts.slice(0, 8));

    // Mostrar productos en oferta
    const discountedProducts = await dataHandler.getDiscountedProducts();
    renderDiscountedProducts(discountedProducts);

    // Cargar favoritos del usuario
    await loadFavorites();

    // Cargar compras y pedidos pendientes del usuario
    await loadUserPurchases();
    await loadPendingOrders();

    await setupHeroAnimations();
    await setupProfileModal();

    // Cargar categorías
    loadCategories(currentProducts);
  } catch (error) {
    console.error("Error al cargar datos iniciales:", error);
    showError("Error al cargar los datos iniciales");
  }
}
// Mostrar fecha actual
const currentDateElement = document.getElementById("currentDate");
if (currentDateElement) {
  currentDateElement.textContent = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Hacer funciones disponibles globalmente para el HTML
//window.showProductDetails = showProductDetails;
//window.toggleFavorite = toggleFavorite;
