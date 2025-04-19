import { protectRoute } from "./auth-middleware.js";
import { DataHandler } from "./dataHandler.js";
import { logout ,showSuccess, showError } from "./auth.js";
import { loadProducts } from "./products.js";
import { loadSales } from "./sales.js";
import { setupProfileModal, loadProfile } from "./profileAccount.js";

const dataHandler = new DataHandler();
let currentAction = null;
let selectedUserId = null;
let actionData = null;
let currentUsers = []; // Variable global para almacenar los usuarios
const itemsPerPage = 10;
let currentUsersPage = 1;
let totalUsersPages = 1;

// Configurar menú móvil
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");
const closeMobileMenuBtn = document.getElementById("closeMobileMenu");

// Función para alternar (toggle) el menú
const toggleMobileMenu = () => {
  mobileMenu.classList.toggle("-translate-x-full");
};

// Abrir/cerrar menú con el botón flotante
mobileMenuBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // Evitar que el clic se propague
  toggleMobileMenu();
});

// Cerrar menú con el botón de cerrar (X)
closeMobileMenuBtn.addEventListener("click", () => {
  mobileMenu.classList.add("-translate-x-full");
});

// Cerrar menú al hacer clic en cualquier enlace del menú móvil
document.querySelectorAll("#mobileMenu a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.add("-translate-x-full");
  });
});

// Cerrar menú al hacer clic fuera de él
document.addEventListener("click", (e) => {
  if (!mobileMenu.contains(e.target) && e.target !== mobileMenuBtn) {
    mobileMenu.classList.add("-translate-x-full");
  }
});

// Configurar modal de logout
const logoutBtn = document.getElementById("logoutBtn");
const logoutModal = document.getElementById("logoutModal");
const logoutCancel = document.getElementById("logoutCancel");
const logoutConfirm = document.getElementById("logoutConfirm");

//logoutBtn.addEventListener("click", () => {
//  logoutModal.classList.remove("hidden");
//});
//
//logoutCancel.addEventListener("click", () => {
//  logoutModal.classList.add("hidden");
//});
//
//logoutConfirm.addEventListener("click", () => {
//  logout();
//});

// Configurar modales
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

const confirmModal = document.getElementById("confirmModal");
const closeConfirmModal = document.getElementById("closeConfirmModal");
const cancelConfirm = document.getElementById("cancelConfirm");

closeConfirmModal.addEventListener("click", () => {
  confirmModal.classList.add("hidden");
});

cancelConfirm.addEventListener("click", () => {
  confirmModal.classList.add("hidden");
});

// Función para verificar contraseña del admin
async function verifyAdminPassword(password) {
  const session = dataHandler.getSession();
  if (!session) return false;

  const users = await dataHandler.readUsers();
  const admin = users.find((user) => user.id === session.user.id);
  return admin && admin.password === password;
}

// Mostrar modal de confirmación
export function showConfirmModal(
  title,
  message,
  action,
  id = null,
  showPassword = true,
  data = null
) {
  currentAction = action;
  selectedUserId = id;
  actionData = data;

  document.getElementById("confirmModalTitle").textContent = title;
  document.getElementById("confirmModalMessage").textContent = message;
  document
    .getElementById("passwordConfirmSection")
    .classList.toggle("hidden", !showPassword);
  document.getElementById("confirmModal").classList.remove("hidden");
  document.getElementById("confirmPasswordAdmin").value = "";
  document.getElementById("confirmPasswordAdminError").classList.add("hidden");
}

// Función para limpiar errores
function clearError(field) {
  const errorElement = document.getElementById(`${field}Error`);
  const inputElement = document.getElementById(field);

  if (errorElement) errorElement.classList.add("hidden");
  if (inputElement) {
    inputElement.classList.remove("input-error");
    inputElement.classList.add("input-success");
  }
}

// Manejar confirmación de acción
document.getElementById("confirmAction").addEventListener("click", async () => {
  const password = document.getElementById("confirmPasswordAdmin").value;
  const showPassword = !document
    .getElementById("passwordConfirmSection")
    .classList.contains("hidden");

  if (showPassword && !(await verifyAdminPassword(password))) {
    document.getElementById("confirmPasswordAdminError").textContent =
      "Contraseña incorrecta";
    document
      .getElementById("confirmPasswordAdminError")
      .classList.remove("hidden");
    return;
  }

  try {
    if (currentAction === "exportSalesConfirmed") {
      const success = await window.salesModule.exportToExcel(
        window.salesModule.currentSales
      );
      if (success) {
        showSuccess("Ventas exportadas correctamente");
      }
    } else if (currentAction === "exportSingleSaleConfirmed") {
      const saleId = selectedUserId;
      const sale = window.salesModule.currentSales.find((s) => s.id === saleId);
      if (sale) {
        const success = await window.salesModule.exportToExcel(
          [sale],
          `venta_${saleId}`
        );
        if (success) {
          showSuccess("Venta exportada correctamente");
        }
      }
    } else if (currentAction === "deleteUser") {
      await dataHandler.deleteUser(selectedUserId);
      showSuccess("Usuario eliminado correctamente");
      // Cerrar modal de detalles si está abierto
      if (modal && !modal.classList.contains("hidden")) {
        modal.classList.add("hidden");
      }
      await loadAdminData();
    } else if (currentAction === "editRole") {
      const users = await dataHandler.readUsers();
      const user = users.find((u) => u.id === selectedUserId);
      if (user) {
        const newRole = user.role === "admin" ? "user" : "admin";
        await dataHandler.updateUserRole(selectedUserId, newRole);
        showSuccess(`Rol cambiado a ${newRole} correctamente`);
        // Actualizar la lista de usuarios global
        currentUsers = await dataHandler.readUsers();
        // Si el modal de detalles está abierto, actualizarlo
        if (modal && !modal.classList.contains("hidden")) {
          showDetails(selectedUserId);
        }
        await loadAdminData();
      }
    } else if (currentAction === "saveProduct") {
      if (selectedUserId) {
        await dataHandler.updateProduct(selectedUserId, actionData);
        showSuccess("Producto actualizado correctamente");
      } else {
        await dataHandler.createProduct(actionData);
        showSuccess("Producto creado correctamente");
      }
      await loadProducts();
      window.productModule.closeProductModal();
      await loadAdminData();
      if (window.reportsModule) {
        await window.reportsModule.loadReports();
      }
    } else if (currentAction === "deleteProduct") {
      await dataHandler.deleteProduct(selectedUserId);
      showSuccess("Producto eliminado correctamente");
      await loadProducts();
      await loadAdminData();
      if (window.reportsModule) {
        await window.reportsModule.loadReports();
      }
    }

    confirmModal.classList.add("hidden");
  } catch (error) {
    console.error("Error al ejecutar acción:", error);
    showError("Ocurrió un error al realizar la acción");
  }
});

// Mostrar detalles del usuario con diseño mejorado
async function showDetails(id) {
  // Usar la lista global de usuarios o cargarla si no está disponible
  const users =
    currentUsers.length > 0 ? currentUsers : await dataHandler.readUsers();
  const user = users.find((r) => r.id === id);
  if (!user) return;

  document.getElementById("modalTitle").textContent = "Detalles del Usuario";
  const modalContent = document.getElementById("modalContent");

  modalContent.innerHTML = `
    <div class="space-y-6">
      <!-- Encabezado con avatar -->
      <div class="flex items-center space-x-4">
        <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl">
          <i class="fas fa-user"></i>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-800">${user.name}</h3>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            user.role === "admin"
              ? "bg-purple-100 text-purple-800"
              : "bg-green-100 text-green-800"
          }">
            <i class="fas fa-${
              user.role === "admin" ? "shield-alt" : "user"
            } mr-1"></i>
            ${user.role === "admin" ? "Administrador" : "Usuario"}
          </span>
        </div>
      </div>

      <!-- Tarjeta de información -->
      <div class="bg-gray-50 rounded-lg p-4 space-y-4">
        <div class="flex items-start">
          <div class="flex-shrink-0 h-5 w-5 text-gray-400">
            <i class="fas fa-at"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm text-gray-500">Nombre de usuario</p>
            <p class="text-sm font-medium text-gray-900">${user.username}</p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex-shrink-0 h-5 w-5 text-gray-400">
            <i class="fas fa-envelope"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm text-gray-500">Correo electrónico</p>
            <p class="text-sm font-medium text-gray-900">${user.email}</p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex-shrink-0 h-5 w-5 text-gray-400">
            <i class="fas fa-phone"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm text-gray-500">Teléfono</p>
            <p class="text-sm font-medium text-gray-900">${
              user.phone || "No proporcionado"
            }</p>
          </div>
        </div>
      </div>

      <!-- Fechas -->
      <div class="border-t border-gray-200 pt-4">
        <div class="flex items-center text-sm text-gray-500">
          <i class="fas fa-calendar-alt mr-2"></i>
          <span>Registrado el ${new Date(user.createdAt).toLocaleDateString(
            "es-ES",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          )}</span>
        </div>
      </div>

      <!-- Acciones -->
      <div class="border-t border-gray-200 pt-4 flex justify-end space-x-3">
        <button onclick="window.showRoleEdit(${
          user.id
        })" class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <i class="fas fa-user-edit mr-2"></i> Cambiar Rol
        </button>
        <button onclick="window.showDeleteConfirm(${
          user.id
        })" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          <i class="fas fa-trash mr-2"></i> Eliminar
        </button>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
}

// Función para eliminar usuario
function showDeleteConfirm(userId) {
  showConfirmModal(
    "Eliminar usuario",
    "¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.",
    "deleteUser",
    userId
  );
}

// Función para editar rol
function showRoleEdit(userId) {
  showConfirmModal(
    "Cambiar rol",
    "¿Estás seguro de que deseas cambiar el rol de este usuario?",
    "editRole",
    userId
  );
}

// Función para resaltar la sección activa
function highlightActiveSection() {
  const sections = ["dashboard", "usuarios", "productos", "ventas", "reportes"];
  const scrollPosition = window.scrollY + 100;

  sections.forEach((section) => {
    const element = document.getElementById(
      section.charAt(0).toUpperCase() + section.slice(1)
    );
    if (element) {
      const offset = element.offsetTop;
      const height = element.offsetHeight;

      if (scrollPosition >= offset && scrollPosition < offset + height) {
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.remove("text-blue-300", "font-semibold");
        });

        const activeLinks = document.querySelectorAll(
          `.nav-link[data-section="${section}"]`
        );
        activeLinks.forEach((link) => {
          link.classList.add("text-blue-300", "font-semibold");
        });
      }
    }
  });
}

// En admin.js, modificar la función loadAdminData
async function loadAdminData() {
  const session = dataHandler.getSession();
  if (!session) return;

  try {
    // Cargar datos del usuario
    const userNameElement = document.getElementById("userName");
    if (userNameElement) {
      userNameElement.textContent = session.user.name;
      userNameElement.style.cursor = "pointer";
      userNameElement.classList.add("hover:text-blue-300", "transition-colors");
    }

    // Cargar usuarios excluyendo al admin actual y actualizar la lista global
    currentUsers = (await dataHandler.readUsers()).filter(
      (user) => user.id !== session.user.id
    );

    const userCountElement = document.getElementById("userCount");
    if (userCountElement) {
      userCountElement.textContent = currentUsers.length;
    }

    // Renderizar tabla con paginación
    renderUsersTable(currentUsers);


    // Cargar productos y actualizar contador
    const products = await dataHandler.readProducts();
    const productCountElement = document.getElementById("productCount");
    if (productCountElement) {
      productCountElement.textContent = products.length;
    }

    // Cargar ventas y actualizar contadores
    const sales = await dataHandler.readSales();
    const today = new Date().toISOString().split("T")[0];
    const todaySales = sales.filter(
      (s) => s.date.includes(today) && s.status !== "Pendiente"
    );

    const todaySalesElement = document.getElementById("todaySales");
    if (todaySalesElement) {
      todaySalesElement.textContent = todaySales.length;
    }

    const todayIncomeElement = document.getElementById("todayIncome");
    if (todayIncomeElement) {
      const totalIncome = todaySales.reduce(
        (sum, sale) => sum + (parseFloat(sale.total) || 0),
        0
      );
      todayIncomeElement.textContent = `$${totalIncome.toFixed(2)}`;
    }

    // Cargar tablas de usuarios y productos
    const usersTable = document.getElementById("usersTable");
    if (usersTable) {
      usersTable.innerHTML = "";

      currentUsers
        .slice(-5)
        .reverse()
        .forEach((user) => {
          const row = document.createElement("tr");
          row.className = "border-b hover:bg-gray-50";
          row.innerHTML = `
                  <td class="py-3 px-4 text-center">${user.name}</td>
                  <td class="py-3 px-4 text-center">${user.email}</td>
                  <td class="py-3 px-4 text-center">${user.phone || "N/A"}</td>
                  <td class="py-3 px-4 text-center">${user.role}</td>
                  <td class="py-3 px-4 text-center whitespace-nowrap">
                      <button onclick="window.showDetails(${
                        user.id
                      })" class="text-blue-500 hover:text-blue-700 mr-2">
                          <i class="fas fa-eye"></i>
                      </button>
                      <button onclick="window.showRoleEdit(${
                        user.id
                      })" class="text-green-500 hover:text-green-700 mr-2">
                          <i class="fas fa-user-edit"></i>
                      </button>
                      <button onclick="window.showDeleteConfirm(${
                        user.id
                      })" class="text-red-500 hover:text-red-700">
                          <i class="fas fa-trash"></i>
                      </button>
                  </td>
              `;
          usersTable.appendChild(row);
        });
    }

    // Cargar otras secciones
    await loadProducts();
    await loadSales();
    if (window.reportsModule) {
      await window.reportsModule.loadReports();
    }
  } catch (error) {
    console.error("Error al cargar datos del admin:", error);
    showError("Error al cargar los datos del administrador");
  }
}

// Mostrar fecha actual
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Configurar eventos de scroll y carga
window.addEventListener("scroll", highlightActiveSection);
window.addEventListener("load", () => {
  highlightActiveSection();
  const newProductBtn = document.getElementById("newProductBtn");
  if (newProductBtn) {
    newProductBtn.addEventListener("click", () => {
      if (window.productModule) {
        window.productModule.openProductModal();
      }
    });
  }
});

// Hacer funciones globales para los botones
window.showDetails = showDetails;
window.showDeleteConfirm = showDeleteConfirm;
window.showRoleEdit = showRoleEdit;
window.loadAdminData = loadAdminData;

// Proteger ruta y cargar datos
if (protectRoute("admin")) {
  loadAdminData();
}

document.addEventListener("DOMContentLoaded", () => {
  if (protectRoute("admin")) {
    loadAdminData();
    setupProfileModal();
    const exportSalesBtn = document.getElementById("exportSalesBtn");
    if (exportSalesBtn) {
      exportSalesBtn.addEventListener("click", () => {
        if (window.salesModule && window.salesModule.exportSales) {
          window.salesModule.exportSales();
        }
      });
    }

    // Asignar evento al botón de nuevo producto
    const newProductBtn = document.getElementById("newProductBtn");
    if (newProductBtn) {
      newProductBtn.addEventListener("click", () => {
        if (window.productModule) {
          window.productModule.openProductModal();
        }
      });
    }

    // Asignar eventos de scroll suave a los enlaces del menú
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }
  
  window.profileModule.setupProfileAvatar();

});

// Función para renderizar la tabla de usuarios con paginación
function renderUsersTable(users) {
  const tbody = document.getElementById("usersTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Calcular índices para la paginación
  const startIndex = (currentUsersPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, users.length);
  const paginatedUsers = users.slice(startIndex, endIndex);

  paginatedUsers.forEach((user) => {
    const row = document.createElement("tr");
    row.className = "border-b hover:bg-gray-50";
    row.innerHTML = `
      <td class="py-3 px-4 text-center">${user.name}</td>
      <td class="py-3 px-4 text-center">${user.email}</td>
      <td class="py-3 px-4 text-center">${user.phone || "N/A"}</td>
      <td class="py-3 px-4 text-center">${user.role}</td>
      <td class="py-3 px-4 text-center whitespace-nowrap">
        <button onclick="window.showDetails(${user.id})" class="text-blue-500 hover:text-blue-700 mr-2">
          <i class="fas fa-eye"></i>
        </button>
        <button onclick="window.showRoleEdit(${user.id})" class="text-green-500 hover:text-green-700 mr-2">
          <i class="fas fa-user-edit"></i>
        </button>
        <button onclick="window.showDeleteConfirm(${user.id})" class="text-red-500 hover:text-red-700">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Actualizar información de paginación
  document.getElementById("usersPaginationInfo").textContent = 
    `Mostrando ${startIndex + 1}-${endIndex} de ${users.length} usuarios`;

  // Actualizar controles de paginación
  updateUsersPaginationControls(users.length);
}

// Función para actualizar los controles de paginación de usuarios
function updateUsersPaginationControls(totalItems) {
  totalUsersPages = Math.ceil(totalItems / itemsPerPage);
  const prevBtn = document.getElementById("usersPrevPage");
  const nextBtn = document.getElementById("usersNextPage");
  const pageNumbers = document.getElementById("usersPageNumbers");

  prevBtn.disabled = currentUsersPage === 1;
  nextBtn.disabled = currentUsersPage === totalUsersPages;

  // Limpiar números de página existentes
  pageNumbers.innerHTML = "";

  // Mostrar máximo 5 números de página alrededor de la página actual
  const startPage = Math.max(1, currentUsersPage - 2);
  const endPage = Math.min(totalUsersPages, currentUsersPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `px-3 py-1 border rounded ${i === currentUsersPage ? "bg-blue-500 text-white" : "bg-white"}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener("click", () => {
      currentUsersPage = i;
      renderUsersTable(currentUsers);
      updateUsersPaginationControls(currentUsers.length);
    });
    pageNumbers.appendChild(pageBtn);
  }
}

// Event listeners para los botones de paginación de usuarios
document.getElementById("usersPrevPage")?.addEventListener("click", () => {
  if (currentUsersPage > 1) {
    currentUsersPage--;
    renderUsersTable(currentUsers);
    updateUsersPaginationControls(currentUsers.length);
  }
});

document.getElementById("usersNextPage")?.addEventListener("click", () => {
  if (currentUsersPage < totalUsersPages) {
    currentUsersPage++;
    renderUsersTable(currentUsers);
    updateUsersPaginationControls(currentUsers.length);
  }
});
  // Modal de usuario
  const userMenuBtn = document.getElementById("userMenuBtn");
  const userModal = document.getElementById("userModal");
  const closeUserModal = document.getElementById("closeUserModal");

  userMenuBtn.addEventListener("click", () => {
    userModal.classList.remove("hidden");
  });

  closeUserModal.addEventListener("click", () => {
    userModal.classList.add("hidden");
  });

  logoutBtn.addEventListener("click", () => {
    userModal.classList.add("hidden");
    logoutModal.classList.remove("hidden");
  });

  logoutCancel.addEventListener("click", () => {
    logoutModal.classList.add("hidden");
  });

  logoutConfirm.addEventListener("click", () => {
    logout();
  });