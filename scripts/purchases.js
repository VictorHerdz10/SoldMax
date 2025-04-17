import { DataHandler } from "./dataHandler.js";
import { showError, showSuccess } from './auth.js';

const dataHandler = new DataHandler();
export async function loadUserPurchases() {
    try {
        const purchases = await dataHandler.getUserPurchases();
        const tableBody = document.getElementById('purchasesTable');
        
        if (purchases.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        No has realizado ninguna compra aún
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = purchases.map(purchase => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${purchase.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(purchase.date).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${purchase.total.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full 
                        ${purchase.status === 'Completada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
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
        `).join('');

        document.querySelectorAll('.view-purchase-detail').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const purchaseId = e.currentTarget.dataset.purchaseId;
                await showPurchaseDetails(purchaseId);
            });
        });
    } catch (error) {
        console.error("Error al cargar compras:", error);
        showError("Error al cargar el historial de compras");
    }
}

export async function loadPendingOrders() {
    try {
        const pendingOrders = dataHandler.getPendingOrders();
        const container = document.getElementById('pendingOrdersContainer');
        if (!container) return;
        
        if (pendingOrders.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <div class="inline-block p-4 bg-blue-50 rounded-lg">
                        <i class="fas fa-clock text-blue-500 text-3xl mb-2"></i>
                        <p class="text-blue-800">No tienes pedidos pendientes</p>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = pendingOrders.map(order => `
            <div class="pending-order bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-400">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold">Pedido #${order.id}</h3>
                        <p class="text-sm text-gray-600">${new Date(order.date).toLocaleDateString()}</p>
                    </div>
                    <span class="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">
                        Pendiente
                    </span>
                </div>
                <div class="mt-2">
                    <p class="text-sm"><span class="font-medium">Total:</span> $${order.total.toFixed(2)}</p>
                    <p class="text-sm"><span class="font-medium">Dirección:</span> ${order.shippingAddress.substring(0, 20)}...</p>
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
        `).join('');

        document.querySelectorAll('.process-order').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderId = e.currentTarget.dataset.orderId;
                try {
                    await dataHandler.processPendingOrder(orderId);
                    showSuccess('Pedido completado con éxito');
                    await loadPendingOrders();
                    await loadUserPurchases();
                } catch (error) {
                    showError(error.message);
                }
            });
        });

        document.querySelectorAll('.cancel-order').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderId = e.currentTarget.dataset.orderId;
                try {
                    await dataHandler.cancelOrder(orderId);
                    showSuccess('Pedido cancelado');
                    await loadPendingOrders();
                } catch (error) {
                    showError(error.message);
                }
            });
        });
    } catch (error) {
        console.error("Error al cargar pedidos pendientes:", error);
        showError("Error al cargar pedidos pendientes");
    }
}

async function showPurchaseDetails(purchaseId) {
    try {
        const purchases = await dataHandler.readSales();
        const purchase = purchases.find(p => p.id === purchaseId);
        
        if (!purchase) {
            showError('No se encontró la compra solicitada');
            return;
        }

        document.getElementById('purchaseId').textContent = purchase.id;
        document.getElementById('purchaseDate').textContent = new Date(purchase.date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('purchaseTotal').textContent = `$${purchase.total.toFixed(2)}`;
        document.getElementById('purchaseStatus').textContent = purchase.status;

        const productsContainer = document.getElementById('purchaseProducts');
        productsContainer.innerHTML = purchase.products.map(product => `
            <div class="flex justify-between items-center border-b pb-2">
                <div class="flex items-center space-x-4">
                    <div class="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <i class="fas fa-box text-gray-400"></i>
                    </div>
                    <div>
                        <h4 class="font-medium">${product.productName}</h4>
                        <p class="text-gray-600">${product.quantity} x $${product.unitPrice.toFixed(2)}</p>
                    </div>
                </div>
                <span class="font-medium">$${(product.quantity * product.unitPrice).toFixed(2)}</span>
            </div>
        `).join('');

        document.getElementById('purchaseDetailModal').classList.remove('hidden');
    } catch (error) {
        console.error("Error al mostrar detalles de compra:", error);
        showError("Error al cargar los detalles de la compra");
    }
}