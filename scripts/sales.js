import { DataHandler } from "./dataHandler.js";
import { showConfirmModal } from "./admin.js";
import { showError, showInfo, showSuccess } from "./auth.js";

const dataHandler = new DataHandler();
let currentSales = []; // Para mantener el estado de las ventas filtradas

export async function loadSales(filter = {}) {
  const allSales = await dataHandler.readSales();
  
  // Aplicar filtros
  currentSales = allSales.filter(sale => {
    // Filtro por estado
    if (filter.status && sale.status !== filter.status) return false;
    
    // Filtro por cliente
    if (filter.customer && filter.customer.length > 0) {
      if (!sale.customer || !sale.customer.toLowerCase().includes(filter.customer.toLowerCase())) {
        return false;
      }
    }
    
    // Filtro por producto
    if (filter.product && filter.product.length > 0) {
      const hasProduct = sale.products.some(p => 
        p.productName.toLowerCase().includes(filter.product.toLowerCase())
      );
      if (!hasProduct) return false;
    }
    
    // Filtro por categoría
    if (filter.category && filter.category.length > 0) {
      const hasCategory = sale.products.some(p => 
        p.category && p.category.toLowerCase() === filter.category.toLowerCase()
      );
      if (!hasCategory) return false;
    }
    
    // Filtro por fecha
    const saleDate = new Date(sale.date);
    
    if (filter.startDate) {
      const startDate = new Date(filter.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (saleDate < startDate) return false;
    }
    
    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (saleDate > endDate) return false;
    }
    
    return true;
  });

  window.salesModule.currentSales = currentSales;
  renderSalesTable(currentSales);
}

function renderSalesTable(sales) {
  const tbody = document.getElementById("salesTable");
  tbody.innerHTML = "";

  sales.forEach((sale) => {
    const row = document.createElement("tr");
    row.className = "border-b hover:bg-gray-50";

    const date = new Date(sale.date);
    const formattedDate = date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    row.innerHTML = `
      <td class="py-3 px-4 text-center">${sale.id}</td>
      <td class="py-3 px-4 text-center">${formattedDate}</td>
      <td class="py-3 px-4 text-center">${sale.customer || "N/A"}</td>
      <td class="py-3 px-4 text-center">${sale.products.length}</td>
      <td class="py-3 px-4 text-center">$${sale.total.toFixed(2)}</td>
      <td class="py-3 px-4 text-center">
        <span class="px-2 py-1 rounded-full text-xs ${
          sale.status === "Completada"
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }">
          ${sale.status}
        </span>
      </td>
      <td class="py-3 px-4 text-center space-x-2 whitespace-nowrap">
        <button onclick="window.salesModule.showSaleDetails(${JSON.stringify(
          sale
        ).replace(/"/g, "&quot;")})" 
          class="text-blue-500 hover:text-blue-700">
          <i class="fas fa-eye"></i>
        </button>
        <button onclick="window.salesModule.exportSingleSale('${sale.id}')" 
          class="text-purple-500 hover:text-purple-700">
          <i class="fas fa-file-export"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

export function showSaleDetails(sale) {
  const modalContent = document.getElementById("modalContent");
  const productsList = sale.products
    .map(
      (p) => `
    <tr class="border-b">
      <td class="py-2 px-4">${p.productName}</td>
      <td class="py-2 px-4 text-center">${p.quantity}</td>
      <td class="py-2 px-4 text-right">$${p.unitPrice.toFixed(2)}</td>
      <td class="py-2 px-4 text-right">$${(p.unitPrice * p.quantity).toFixed(
        2
      )}</td>
    </tr>
  `
    )
    .join("");

  modalContent.innerHTML = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p class="font-semibold">ID Venta:</p>
          <p>${sale.id}</p>
        </div>
        <div>
          <p class="font-semibold">Fecha:</p>
          <p>${new Date(sale.date).toLocaleString()}</p>
        </div>
        <div>
          <p class="font-semibold">Cliente:</p>
          <p>${sale.customer || "N/A"}</p>
        </div>
        <div>
          <p class="font-semibold">Estado:</p>
          <p class="inline-block px-2 py-1 rounded-full text-xs ${
            sale.status === "Completada"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }">${sale.status}</p>
        </div>
      </div>
      
      <div class="mt-4">
        <h4 class="font-semibold mb-2">Productos:</h4>
        <div class="overflow-x-auto">
          <table class="min-w-full">
            <thead>
              <tr class="bg-gray-100">
                <th class="py-2 px-4 text-left">Producto</th>
                <th class="py-2 px-4 text-center">Cantidad</th>
                <th class="py-2 px-4 text-right">Precio Unitario</th>
                <th class="py-2 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productsList}
              <tr class="border-t font-semibold">
                <td colspan="3" class="py-2 px-4 text-right">Total:</td>
                <td class="py-2 px-4 text-right">$${sale.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  document.getElementById(
    "modalTitle"
  ).textContent = `Detalles de Venta ${sale.id}`;
  document.getElementById("modal").classList.remove("hidden");
}

function exportToExcel(salesData, fileName = "ventas") {
  try {
    // Crear un libro de trabajo
    const wb = XLSX.utils.book_new();

    // Hoja de resumen de ventas - Mejorada
    const summaryData = salesData.map((sale) => ({
      "ID Venta": sale.id,
      "Fecha": new Date(sale.date).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      "Cliente": sale.customer || "N/A",
      "Total Productos": sale.products.length,
      "Total": {
        v: sale.total,  // Valor numérico
        t: 'n',         // Tipo numérico
        z: '"$"#,##0.00' // Formato de moneda
      },
      "Estado": sale.status
    }));

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    
    // Ajustar anchos de columnas para el resumen
    wsSummary['!cols'] = [
      { width: 15 }, // ID Venta
      { width: 20 }, // Fecha
      { width: 25 }, // Cliente
      { width: 15 }, // Total Productos
      { width: 15 }, // Total
      { width: 15 }  // Estado
    ];
    
    // Agregar filtros a la primera fila
    wsSummary['!autofilter'] = { ref: "A1:F1" };
    
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen Ventas");

    // Hoja de detalle de productos - Mejorada
    const detailData = [];
    salesData.forEach((sale) => {
      sale.products.forEach((product) => {
        detailData.push({
          "ID Venta": sale.id,
          "Producto": product.productName,
          "Cantidad": product.quantity,
          "Precio Unitario": {
            v: product.unitPrice,
            t: 'n',
            z: '"$"#,##0.00'
          },
          "Subtotal": {
            v: product.unitPrice * product.quantity,
            t: 'n',
            z: '"$"#,##0.00'
          },
          "Fecha Venta": new Date(sale.date).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }),
          "Estado": sale.status
        });
      });
    });

    const wsDetails = XLSX.utils.json_to_sheet(detailData);
    
    // Ajustar anchos de columnas para los detalles
    wsDetails['!cols'] = [
      { width: 15 }, // ID Venta
      { width: 30 }, // Producto
      { width: 12 }, // Cantidad
      { width: 15 }, // Precio Unitario
      { width: 15 }, // Subtotal
      { width: 15 }, // Fecha Venta
      { width: 15 }  // Estado
    ];
    
    // Agregar filtros a la primera fila
    wsDetails['!autofilter'] = { ref: "A1:G1" };
    
    XLSX.utils.book_append_sheet(wb, wsDetails, "Detalle Productos");

    // Hoja adicional con estadísticas (nueva)
    const statsData = [
      { "Métrica": "Total Ventas", "Valor": salesData.length },
      { "Métrica": "Productos Vendidos", "Valor": salesData.reduce((sum, sale) => sum + sale.products.length, 0) },
      { "Métrica": "Ingresos Totales", "Valor": {
        v: salesData.reduce((sum, sale) => sum + sale.total, 0),
        t: 'n',
        z: '"$"#,##0.00'
      }},
      { "Métrica": "Ventas Completadas", "Valor": salesData.filter(s => s.status === 'Completada').length },
      { "Métrica": "Ventas Pendientes", "Valor": salesData.filter(s => s.status === 'Pendiente').length }
    ];

    const wsStats = XLSX.utils.json_to_sheet(statsData);
    
    // Ajustar anchos de columnas para estadísticas
    wsStats['!cols'] = [
      { width: 25 }, // Métrica (más ancho)
      { width: 20 }  // Valor
    ];
    
    XLSX.utils.book_append_sheet(wb, wsStats, "Estadísticas");

    // Estilo para los encabezados
    const headerStyle = {
      fill: { fgColor: { rgb: "4472C4" } }, // Color azul
      font: { bold: true, color: { rgb: "FFFFFF" } }, // Texto blanco en negrita
      alignment: { horizontal: "center" }
    };

    // Aplicar estilos a los encabezados
    [wsSummary, wsDetails, wsStats].forEach(ws => {
      if (ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
          if (!cell) continue;
          cell.s = headerStyle;
        }
      }
    });

    // Exportar el archivo
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);

    return true;
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
    return false;
  }
}

async function exportAllSales() {
  try {
    if (currentSales.length === 0) {
      showInfo("No hay ventas para exportar");
      return;
    }

    showConfirmModal(
      "Exportar ventas",
      `¿Exportar ${currentSales.length} ventas a Excel?`,
      "exportSalesConfirmed",
      null,
      false
    );
  } catch (error) {
    console.error("Error al exportar ventas:", error);
    showError("Error al exportar ventas");
  }
}

async function exportSingleSale(saleId) {
  try {
    const sale = currentSales.find((s) => s.id === saleId);
    if (!sale) {
      showError("Venta no encontrada");
      return;
    }

    showConfirmModal(
      "Exportar venta",
      `¿Exportar venta ${saleId} a Excel?`,
      "exportSingleSaleConfirmed",
      saleId,
      false
    );
  } catch (error) {
    console.error("Error al exportar venta:", error);
    showError("Error al exportar venta");
  }
}

function openFilterModal() {
  const modalContent = document.getElementById("modalContent");
  // Obtener filtros actuales (si existen)
  const currentFilters = window.salesModule.currentFilters || {};
  
  modalContent.innerHTML = `
    <form id="filterForm" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label for="filterStatus" class="block text-gray-700 font-medium">Estado</label>
          <select id="filterStatus" class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors">
            <option value="">Todos los estados</option>
            <option value="Completada" ${currentFilters.status === 'Completada' ? 'selected' : ''}>Completada</option>
            <option value="Pendiente" ${currentFilters.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="Cancelada" ${currentFilters.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
          </select>
        </div>
        
        <div class="space-y-2">
          <label for="filterCustomer" class="block text-gray-700 font-medium">Cliente</label>
          <input type="text" id="filterCustomer" 
                 class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                 placeholder="Nombre del cliente"
                 value="${currentFilters.customer || ''}">
          <div id="customerError" class="text-sm text-rose-600 mt-1 hidden"></div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label for="filterProduct" class="block text-gray-700 font-medium">Producto</label>
          <input type="text" id="filterProduct" 
                 class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors" 
                 placeholder="Nombre del producto"
                 value="${currentFilters.product || ''}">
          <div id="productError" class="text-sm text-rose-600 mt-1 hidden"></div>
        </div>
        
        <div class="space-y-2">
          <label for="filterCategory" class="block text-gray-700 font-medium">Categoría</label>
          <select id="filterCategory" class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors">
            <option value="">Todas las categorías</option>
            <option value="Electrónica" ${currentFilters.category === 'Electrónica' ? 'selected' : ''}>Electrónica</option>
            <option value="Ropa" ${currentFilters.category === 'Ropa' ? 'selected' : ''}>Ropa</option>
            <option value="Hogar" ${currentFilters.category === 'Hogar' ? 'selected' : ''}>Hogar</option>
            <option value="Alimentos" ${currentFilters.category === 'Alimentos' ? 'selected' : ''}>Alimentos</option>
          </select>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label for="filterStartDate" class="block text-gray-700 font-medium">Desde</label>
          <input type="date" id="filterStartDate" 
                 class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                 value="${currentFilters.startDate || ''}">
          <div id="startDateError" class="text-sm text-rose-600 mt-1 hidden"></div>
        </div>
        
        <div class="space-y-2">
          <label for="filterEndDate" class="block text-gray-700 font-medium">Hasta</label>
          <input type="date" id="filterEndDate" 
                 class="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-colors"
                 value="${currentFilters.endDate || ''}">
          <div id="endDateError" class="text-sm text-rose-600 mt-1 hidden"></div>
        </div>
      </div>
      
      <div class="flex justify-end space-x-4 pt-2">
        <button type="button" id="resetFiltersBtn"
                class="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-300">
          Limpiar filtros
        </button>
        <button type="button" id="applyFiltersBtn"
                class="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Aplicar Filtros
        </button>
      </div>
    </form>
  `;

  // Configurar eventos de validación
  setupFilterValidations();

  document.getElementById("modalTitle").textContent = "Filtrar Ventas";
  document.getElementById("modal").classList.remove("hidden");
}

function setupFilterValidations() {
  const fields = {
    filterCustomer: {
      validate: (value) => {
        if (!value) return null;
        const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
        if (!regex.test(value)) {
          return "Solo letras y espacios (2-50 caracteres)";
        }
        return null;
      }
    },
    filterProduct: {
      validate: (value) => {
        if (!value) return null;
        const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]{2,50}$/;
        if (!regex.test(value)) {
          return "Solo letras, números, espacios y guiones (2-50 caracteres)";
        }
        return null;
      }
    },
    filterStartDate: {
      validate: (value) => {
        const today = new Date().toISOString().split('T')[0];
        const endDate = document.getElementById('filterEndDate')?.value;
        
        if (value) {
          // Validar que no sea mayor que hoy
          if (new Date(value) > new Date(today)) {
            return "No puede ser mayor que hoy";
          }
          
          // Validar relación con fecha final
          if (endDate && new Date(value) > new Date(endDate)) {
            return "No puede ser mayor que fecha final";
          }
        }
        return null;
      }
    },
    filterEndDate: {
      validate: (value) => {
        const today = new Date().toISOString().split('T')[0];
        const startDate = document.getElementById('filterStartDate')?.value;
        
        if (value) {
          // Validar que no sea mayor que hoy
          if (new Date(value) > new Date(today)) {
            return "No puede ser mayor que hoy";
          }
          
          // Validar relación con fecha inicial
          if (startDate && new Date(value) < new Date(startDate)) {
            return "No puede ser menor que fecha inicial";
          }
        }
        return null;
      }
    }
  };

  // Configurar eventos para cada campo
  Object.keys(fields).forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (!field) return; // Si el campo no existe, salir
    
    // Obtener el elemento de error de forma segura
    const errorId = `${fieldId.replace('filter', '').toLowerCase()}Error`;
    const errorElement = document.getElementById(errorId);

    field.addEventListener('blur', () => validateField(field, errorElement, fields[fieldId].validate));
    field.addEventListener('input', () => {
      // Verificar si el elemento de error existe y está visible
      if (errorElement && !errorElement.classList.contains('hidden')) {
        validateField(field, errorElement, fields[fieldId].validate);
      }
    });
  });

  // Configurar botones de forma segura
  const resetBtn = document.getElementById('resetFiltersBtn');
  const applyBtn = document.getElementById('applyFiltersBtn');
  
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }
  if (applyBtn) {
    applyBtn.addEventListener('click', applyFiltersWithValidation);
  }
}

function validateField(field, errorElement, validationFn) {
  const error = validationFn(field.value);
  if (error) {
    errorElement.textContent = error;
    errorElement.classList.remove('hidden');
    field.classList.add('border-rose-500', 'bg-rose-50');
    field.classList.remove('border-gray-200');
  } else {
    errorElement.classList.add('hidden');
    field.classList.remove('border-rose-500', 'bg-rose-50');
    field.classList.add('border-gray-200');
  }
}

function applyFiltersWithValidation() {
  // Validar todos los campos antes de aplicar
  let isValid = true;
  
  // Validar campos de fecha primero
  const startDate = document.getElementById("filterStartDate");
  const endDate = document.getElementById("filterEndDate");
  const startDateError = document.getElementById("startDateError");
  const endDateError = document.getElementById("endDateError");
  const today = new Date().toISOString().split('T')[0];

  // Validar fecha de inicio
  if (startDate.value) {
    const startDateObj = new Date(startDate.value);
    const todayObj = new Date(today);
    
    if (startDateObj > todayObj) {
      startDateError.textContent = "No puede ser mayor que hoy";
      startDateError.classList.remove('hidden');
      startDate.classList.add('border-rose-500', 'bg-rose-50');
      isValid = false;
    }
  }

  // Validar fecha final
  if (endDate.value) {
    const endDateObj = new Date(endDate.value);
    const todayObj = new Date(today);
    
    if (endDateObj > todayObj) {
      endDateError.textContent = "No puede ser mayor que hoy";
      endDateError.classList.remove('hidden');
      endDate.classList.add('border-rose-500', 'bg-rose-50');
      isValid = false;
    }
  }

  // Validar relación entre fechas
  if (startDate.value && endDate.value) {
    const startDateObj = new Date(startDate.value);
    const endDateObj = new Date(endDate.value);
    
    if (startDateObj > endDateObj) {
      startDateError.textContent = "No puede ser mayor que fecha final";
      startDateError.classList.remove('hidden');
      startDate.classList.add('border-rose-500', 'bg-rose-50');
      isValid = false;
    }
    
    if (endDateObj < startDateObj) {
      endDateError.textContent = "No puede ser menor que fecha inicial";
      endDateError.classList.remove('hidden');
      endDate.classList.add('border-rose-500', 'bg-rose-50');
      isValid = false;
    }
  }

  // Verificar si hay errores visibles
  document.querySelectorAll('[id$="Error"]').forEach(el => {
    if (!el.classList.contains('hidden')) {
      isValid = false;
    }
  });

  if (!isValid) {
    showError("Por favor corrige los errores en las fechas");
    return;
  }

  applyFilters();
}

function applyFilters() {
  const filter = {
    status: document.getElementById("filterStatus").value,
    customer: document.getElementById("filterCustomer").value.trim(),
    product: document.getElementById("filterProduct").value.trim(),
    category: document.getElementById("filterCategory").value,
    startDate: document.getElementById("filterStartDate").value,
    endDate: document.getElementById("filterEndDate").value,
  };

  // Guardar filtros actuales para persistencia
  window.salesModule.currentFilters = filter;

  // Cargar ventas con los filtros (incluso si están vacíos)
  loadSales(filter);
  
  document.getElementById("modal").classList.add("hidden");
}

function resetFilters() {
  // Limpiar todos los campos
  const form = document.getElementById("filterForm");
  form.reset();
  
  // Limpiar valores de fecha manualmente (por si el reset no funciona en algunos navegadores)
  document.getElementById("filterStartDate").value = "";
  document.getElementById("filterEndDate").value = "";
  
  // Forzar el select de Estado a "Todos los estados"
  const statusSelect = document.getElementById("filterStatus");
  const categorySelect = document.getElementById("filterCategory");
  if (statusSelect) {
    statusSelect.value = ""; // Esto seleccionará la opción con value=""
  }
  if (categorySelect) {
    categorySelect.value = ""; // Esto seleccionará la opción con value=""
  }
  
  // Limpiar errores y estilos
  document.querySelectorAll('[id$="Error"]').forEach(el => {
    el.classList.add('hidden');
  });
  
  document.querySelectorAll('#filterForm input, #filterForm select').forEach(field => {
    field.classList.remove('border-rose-500', 'bg-rose-50');
    field.classList.add('border-gray-200');
  });

  // Eliminar filtros actuales y recargar todas las ventas
  delete window.salesModule.currentFilters;
  loadSales();
}

// Exportar para acceso global
window.salesModule = {
  loadSales,
  showSaleDetails,
  exportAllSales,
  exportSingleSale,
  openFilterModal,
  applyFilters,
  resetFilters,
  exportToExcel,
  currentSales,
};
