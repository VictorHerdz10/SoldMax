import { DataHandler } from "./dataHandler.js";
import { showError, showSuccess } from "./auth.js";
import { updateProductAvailability } from "./productUser.js";

const dataHandler = new DataHandler();
let currentPurchasePage = 1;
const purchasesPerPage = 10;
let allPurchases = [];

let currentPendingOrdersPage = 1;
const pendingOrdersPerPage = 10;
let allPendingOrders = [];

// Modificar la función loadUserPurchases
export async function loadUserPurchases(page = 1) {
  try {
    currentPurchasePage = page;
    allPurchases = await dataHandler.getUserPurchases();
    const startIndex = (page - 1) * purchasesPerPage;
    const endIndex = startIndex + purchasesPerPage;
    const paginatedPurchases = allPurchases.slice(startIndex, endIndex);

    const tableBody = document.getElementById("purchasesTable");
    const paginationContainer = document.getElementById("purchasesPagination");

    if (allPurchases.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        No has realizado ninguna compra aún
                    </td>
                </tr>
            `;
      paginationContainer.innerHTML = "";
      return;
    }

    tableBody.innerHTML = paginatedPurchases
      .map(
        (purchase) => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
                  purchase.id
                }</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(purchase.date).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${purchase.total.toFixed(
                  2
                )}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full 
                        ${
                          purchase.status === "Completada"
                            ? "bg-green-100 text-green-800"
                            : purchase.status === "Cancelada"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }">
                        ${purchase.status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button class="view-purchase-detail text-blue-500 hover:text-blue-700" 
                            data-purchase-id="${purchase.id}">
                        <i class="fas fa-eye"></i> Ver detalles
                    </button>
                </td>
            </tr>
        `
      )
      .join("");

    // Configurar los botones de paginación
    renderPagination(
      allPurchases.length,
      purchasesPerPage,
      currentPurchasePage,
      "purchasesPagination",
      loadUserPurchases
    );

    document.querySelectorAll(".view-purchase-detail").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const purchaseId = e.currentTarget.dataset.purchaseId;
        await showPurchaseDetails(purchaseId);
      });
    });
  } catch (error) {
    console.error("Error al cargar compras:", error);
    showError("Error al cargar el historial de compras");
  }
}

function renderPagination(
  totalItems,
  itemsPerPage,
  currentPage,
  containerId,
  pageChangeCallback
) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.getElementById(containerId);

  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  let paginationHTML = `
        <div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
            <div class="flex flex-1 justify-between sm:hidden">
                <button data-page="${currentPage > 1 ? currentPage - 1 : 1}" 
                        class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        ${currentPage === 1 ? "disabled" : ""}>
                    Anterior
                </button>
                <button data-page="${
                  currentPage < totalPages ? currentPage + 1 : totalPages
                }" 
                        class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        ${currentPage === totalPages ? "disabled" : ""}>
                    Siguiente
                </button>
            </div>
            <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-gray-700">
                        Mostrando <span class="font-medium">${
                          (currentPage - 1) * itemsPerPage + 1
                        }</span> a 
                        <span class="font-medium">${Math.min(
                          currentPage * itemsPerPage,
                          totalItems
                        )}</span> de 
                        <span class="font-medium">${totalItems}</span> resultados
                    </p>
                </div>
                <div>
                    <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
    `;

  // Botón Anterior
  paginationHTML += `
        <button data-page="${currentPage > 1 ? currentPage - 1 : 1}" 
                class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                ${currentPage === 1 ? "disabled" : ""}>
            <span class="sr-only">Anterior</span>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

  // Números de página
  const maxVisiblePages = 5;
  let startPage, endPage;

  if (totalPages <= maxVisiblePages) {
    startPage = 1;
    endPage = totalPages;
  } else {
    const maxPagesBeforeCurrent = Math.floor(maxVisiblePages / 2);
    const maxPagesAfterCurrent = Math.ceil(maxVisiblePages / 2) - 1;

    if (currentPage <= maxPagesBeforeCurrent) {
      startPage = 1;
      endPage = maxVisiblePages;
    } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
      startPage = totalPages - maxVisiblePages + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - maxPagesBeforeCurrent;
      endPage = currentPage + maxPagesAfterCurrent;
    }
  }

  if (startPage > 1) {
    paginationHTML += `
            <button data-page="1" 
                    class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                1
            </button>
            ${
              startPage > 2
                ? '<span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">...</span>'
                : ""
            }
        `;
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
            <button data-page="${i}" 
                    class="relative inline-flex items-center px-4 py-2 text-sm font-semibold 
                    ${
                      i === currentPage
                        ? "bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                    }">
                ${i}
            </button>
        `;
  }

  if (endPage < totalPages) {
    paginationHTML += `
            ${
              endPage < totalPages - 1
                ? '<span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">...</span>'
                : ""
            }
            <button data-page="${totalPages}" 
                    class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                ${totalPages}
            </button>
        `;
  }

  // Botón Siguiente
  paginationHTML += `
        <button data-page="${
          currentPage < totalPages ? currentPage + 1 : totalPages
        }" 
                class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                ${currentPage === totalPages ? "disabled" : ""}>
            <span class="sr-only">Siguiente</span>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

  paginationHTML += `
                    </nav>
                </div>
            </div>
        </div>
    `;

  paginationContainer.innerHTML = paginationHTML;

  // Agregar event listeners a los botones de paginación
  paginationContainer
    .querySelectorAll("button[data-page]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const page = parseInt(button.dataset.page);
        pageChangeCallback(page);
      });
    });
}

export async function loadPendingOrders(page = 1) {
  try {
    currentPendingOrdersPage = page;
    allPendingOrders = await dataHandler.getPendingOrders();
    const startIndex = (page - 1) * pendingOrdersPerPage;
    const endIndex = startIndex + pendingOrdersPerPage;
    const paginatedOrders = allPendingOrders.slice(startIndex, endIndex);

    const container = document.getElementById("pendingOrdersContainer");
    const paginationContainer = document.getElementById(
      "pendingOrdersPagination"
    );

    if (allPendingOrders.length === 0) {
      container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="inline-block p-4 bg-blue-50 rounded-lg">
                        <i class="fas fa-clock text-blue-500 text-3xl mb-2"></i>
                        <p class="text-blue-800">No tienes pedidos pendientes</p>
                    </div>
                </div>
            `;
      paginationContainer.innerHTML = "";
      return;
    }

    container.innerHTML = paginatedOrders
      .map(
        (order) => `
            <div class="pending-order bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-400">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold">Pedido #${order.id}</h3>
                        <p class="text-sm text-gray-600">${new Date(
                          order.date
                        ).toLocaleDateString()}</p>
                    </div>
                    <span class="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                        ${order.status}
                    </span>
                </div>
                <div class="mt-2">
                    <p class="text-sm"><span class="font-medium">Total:</span> $${order.total.toFixed(
                      2
                    )}</p>
                    <p class="text-sm"><span class="font-medium">Dirección:</span> ${order.shippingAddress.substring(
                      0,
                      20
                    )}...</p>
                </div>
                <div class="mt-4 flex space-x-2">
                    <button class="process-order px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                            data-order-id="${order.id}">
                        Completar Pago
                    </button>
                    <button class="cancel-order px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                            data-order-id="${order.id}">
                        Cancelar
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    // Configurar los botones de paginación
    renderPagination(
      allPendingOrders.length,
      pendingOrdersPerPage,
      currentPendingOrdersPage,
      "pendingOrdersPagination",
      loadPendingOrders
    );

    // Configurar event listeners para los botones
    setupOrderButtons();
  } catch (error) {
    console.error("Error al cargar pedidos pendientes:", error);
    showError("Error al cargar pedidos pendientes");
  }
}

function setupOrderButtons() {
  // Botones para procesar órdenes pendientes
  document.querySelectorAll(".process-order").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const orderId = e.currentTarget.dataset.orderId;
      try {
        // Mostrar modal de confirmación de contraseña
        document.getElementById("passwordConfirmModal").dataset.orderId =
          orderId;
        document
          .getElementById("passwordConfirmModal")
          .classList.remove("hidden");
        document.getElementById("confirmPasswordError").classList.add("hidden");
        document.getElementById("confirmPasswordInput").value = "";
      } catch (error) {
        showError(error.message);
      }
    });
  });

  // Botones para cancelar órdenes
  document.querySelectorAll(".cancel-order").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const orderId = e.currentTarget.dataset.orderId;
      try {
        await dataHandler.cancelOrder(orderId);
        showSuccess("Pedido cancelado");
        // Obtener productos actualizados y actualizar vistas
        const products = await dataHandler.readProducts();
        await updateProductAvailability(products);
        await loadPendingOrders();
        await loadUserPurchases();
      } catch (error) {
        showError(error.message);
      }
    });
  });
}

// Configurar el botón de confirmación de pago con contraseña
document.getElementById("confirmPaymentWithPassword")?.addEventListener("click", async () => {
    const password = document.getElementById("confirmPasswordInput").value;
    const session = dataHandler.getSession();
    const orderId = document.getElementById("passwordConfirmModal").dataset.orderId;
    const paymentData = JSON.parse(
        document.getElementById("passwordConfirmModal").dataset.paymentData || "{}"
    );

    try {
        if (!password) {
            throw new Error("Ingrese su contraseña");
        }

        const user = await dataHandler.findUserByEmail(session.user.email);
        if (!user || user.password !== password) {
            throw new Error("Contraseña incorrecta");
        }

        let result;
        if (orderId) {
            // Procesar orden pendiente
            result = await dataHandler.processPendingOrder(orderId);
            showSuccess("Pedido completado con éxito");
        } else if (paymentData) {
            // Procesar nuevo pago
            result = await dataHandler.processPurchase(paymentData);
            showSuccess("Compra realizada con éxito");
        }

        document.getElementById("passwordConfirmModal").classList.add("hidden");
        document.getElementById("paymentModal").classList.add("hidden");
        updateCartCount();
        await loadUserPurchases();
        await loadPendingOrders();
    } catch (error) {
        document.getElementById("confirmPasswordError").textContent = error.message;
        document.getElementById("confirmPasswordError").classList.remove("hidden");
    }
});

async function showPurchaseDetails(purchaseId) {
  try {
    const purchases = await dataHandler.readSales();
    const purchase = purchases.find((p) => p.id === purchaseId);

    if (!purchase) {
      showError("No se encontró la compra solicitada");
      return;
    }

    document.getElementById("purchaseId").textContent = purchase.id;
    document.getElementById("purchaseDate").textContent = new Date(
      purchase.date
    ).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    document.getElementById(
      "purchaseTotal"
    ).textContent = `$${purchase.total.toFixed(2)}`;
    document.getElementById("purchaseStatus").textContent = purchase.status;
    const estilo = purchase.status  === "Completada"
    ? "bg-green-100 text-green-800 px-2 py-1 text-xs font-semibold rounded-full"
    : purchase.status === "Pendiente"
    ? "bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-semibold rounded-full"
    : "bg-red-100 text-red-800 px-2 py-1 text-xs font-semibold rounded-full";
    document.getElementById("purchaseStatus").className = estilo;


    const productsContainer = document.getElementById("purchaseProducts");
    productsContainer.innerHTML = purchase.products
      .map(
        (product) => `
            <div class="flex justify-between items-center border-b pb-2">
                <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <i class="fas fa-box text-gray-400"></i>
                    </div>
                    <div>
                        <h4 class="font-medium">${product.productName}</h4>
                        <p class="text-gray-600">${
                          product.quantity
                        } x $${product.unitPrice.toFixed(2)}</p>
                    </div>
                </div>
                <span class="font-medium">$${(
                  product.quantity * product.unitPrice
                ).toFixed(2)}</span>
            </div>
        `
      )
      .join("");

    document.getElementById("purchaseDetailModal").classList.remove("hidden");
  } catch (error) {
    console.error("Error al mostrar detalles de compra:", error);
    showError("Error al cargar los detalles de la compra");
  }
}

// Función para actualizar el contador del carrito
function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    const cart = dataHandler.getCart();
    // Asegúrate de que cart sea un array y tenga elementos
    const totalItems = Array.isArray(cart)
      ? cart.reduce((total, product) => total + (product.quantity || 0), 0)
      : 0;
    cartCount.textContent = totalItems;
  }
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();

  // Cerrar modales
  document.querySelectorAll("[data-modal-hide]").forEach((button) => {
    button.addEventListener("click", () => {
      const modalId = button.getAttribute("data-modal-hide");
      document.getElementById(modalId).classList.add("hidden");
    });
  });
});
