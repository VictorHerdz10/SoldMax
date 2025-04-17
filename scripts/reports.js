import { DataHandler } from './dataHandler.js';

const dataHandler = new DataHandler();
let monthlySalesChart = null;
let dailySalesChart = null;
let topProductsChart = null;
let categorySalesChart = null; // Nueva variable para el gráfico de categorías

export async function loadReports() {
  try {
    await loadCharts();
    await loadFavoritesRanking();
    await loadSummary();
  } catch (error) {
    console.error('Error general al cargar reportes:', error);
  }
}

async function loadCharts() {
  try {
    // Ventas mensuales
    const monthlySales = await dataHandler.getMonthlySales();
    createLineChart('monthlySalesChart', 'Ventas Mensuales', monthlySales.labels, monthlySales.data);
    
    // Ventas diarias (últimos 30 días)
    const dailySales = await dataHandler.getDailySales(30);
    createBarChart('dailySalesChart', 'Ventas Diarias (Últimos 30 días)', 
      dailySales.labels.map(label => label.split('-')[2]), // Mostrar solo el día
      dailySales.data
    );
    
    // Productos más vendidos
    const topProducts = await dataHandler.getTopProducts();
    const topProductsLabels = topProducts.map(p => p.name);
    const topProductsData = topProducts.map(p => p.sold);
    createDoughnutChart('topProductsChart', 'Productos más Vendidos', topProductsLabels, topProductsData);
    
    // Ventas por categoría
    const salesByCategory = await dataHandler.getSalesByCategory();
    createHorizontalBarChart('categorySalesChart', 'Ventas por Categoría', 
      salesByCategory.labels, 
      salesByCategory.salesData
    );
  } catch (error) {
    console.error('Error al cargar gráficos:', error);
  }
}

function createBarChart(id, label, labels, data) {
  const ctx = document.getElementById(id);
  if (!ctx) return;

  if (dailySalesChart) {
    dailySalesChart.destroy();
  }

  dailySalesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function createHorizontalBarChart(id, label, labels, data) {
  const ctx = document.getElementById(id);
  if (!ctx) return;

  // Destruir el gráfico existente si hay uno
  if (categorySalesChart) {
    categorySalesChart.destroy();
  }

  categorySalesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: '#8b5cf6',
        borderColor: '#7c3aed',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
}

async function loadSummary() {
  try {
    const summary = await dataHandler.getSalesSummary();
    const summaryContainer = document.getElementById('reportSummary');
    
    summaryContainer.innerHTML = `
      <div class="border rounded-lg p-4 flex items-center">
        <div class="bg-blue-100 text-blue-600 rounded-full p-3 mr-4">
          <i class="fas fa-shopping-cart text-lg"></i>
        </div>
        <div>
          <p class="text-gray-500 text-sm">Ventas Hoy</p>
          <p class="text-xl font-semibold">$${summary.todaySales.toFixed(2)}</p>
        </div>
      </div>
      <div class="border rounded-lg p-4 flex items-center">
        <div class="bg-green-100 text-green-600 rounded-full p-3 mr-4">
          <i class="fas fa-box-open text-lg"></i>
        </div>
        <div>
          <p class="text-gray-500 text-sm">Productos Activos</p>
          <p class="text-xl font-semibold">${summary.activeProducts}</p>
        </div>
      </div>
      <div class="border rounded-lg p-4 flex items-center">
        <div class="bg-purple-100 text-purple-600 rounded-full p-3 mr-4">
          <i class="fas fa-user-plus text-lg"></i>
        </div>
        <div>
          <p class="text-gray-500 text-sm">Total Productos</p>
          <p class="text-xl font-semibold">${summary.totalProducts}</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error al cargar resumen:', error);
  }
}

function createLineChart(id, label, labels, data) {
  const ctx = document.getElementById(id);
  if (!ctx) return;

  // Destruir el gráfico existente si hay uno
  if (monthlySalesChart) {
    monthlySalesChart.destroy();
  }

  monthlySalesChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function createDoughnutChart(id, label, labels, data) {
  const ctx = document.getElementById(id);
  if (!ctx) return;

  // Destruir el gráfico existente si hay uno
  if (topProductsChart) {
    topProductsChart.destroy();
  }

  topProductsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: label,
        data: data,
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

async function loadFavoritesRanking() {
  try {
    const existingContainer = document.getElementById('favoritesRankingContainer');
    if (existingContainer) {
      existingContainer.remove();
    }

    const topFavorites = await dataHandler.getTopFavorites();
    
    const favoritesContainer = document.createElement('div');
    favoritesContainer.id = 'favoritesRankingContainer';
    favoritesContainer.className = 'border rounded-lg p-4 mt-6';
    
    favoritesContainer.innerHTML = `
      <h3 class="text-lg font-semibold mb-4 flex items-center">
        <i class="fas fa-heart text-red-500 mr-2"></i> Ranking de Productos Favoritos
      </h3>
      <div class="space-y-2">
        ${topFavorites.length > 0 ? 
          topFavorites.map((fav, index) => `
            <div class="ranking-item ranking-${index+1} flex items-center justify-between p-2 rounded hover:bg-gray-50">
              <div class="flex items-center">
                <span class="ranking-number">${index + 1}</span>
                <div class="flex items-center">
                  <img src="${fav.product?.image || '/images/no-image-icon.png'}" 
                       alt="${fav.productName}" 
                       class="w-10 h-10 object-cover rounded-full mr-3">
                  <div>
                    <p class="font-medium">${fav.productName}</p>
                    <p class="text-xs text-gray-500">${fav.product?.category || 'Sin categoría'}</p>
                  </div>
                </div>
              </div>
              <span class="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded-full">
                ${fav.count} ${fav.count === 1 ? 'favorito' : 'favoritos'}
              </span>
            </div>
          `).join('') : 
          '<p class="text-gray-500 text-center py-4">No hay datos de favoritos disponibles</p>'
        }
      </div>
    `;
    
    const reportSection = document.getElementById('Reportes');
    if (reportSection) {
      reportSection.appendChild(favoritesContainer);
    }
  } catch (error) {
    console.error('Error al cargar ranking de favoritos:', error);
  }
}

// Exportar para acceso global
window.reportsModule = {
  loadReports
};