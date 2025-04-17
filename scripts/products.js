import { DataHandler } from "./dataHandler.js";
import { showConfirmModal } from "./admin.js";
import { showSuccess, showError } from "./auth.js";

const dataHandler = new DataHandler();

// Configuración de Cloudinary
const cloudinaryConfig = {
  cloudName: 'dwad8nrdl',
  apiKey: '266517934682538',
  uploadPreset: 'SoldMax_Ventas'
};

export const productValidations = {
  name: {
    regex: /^[A-ZÁÉÍÓÚ][a-záéíóúñ0-9\s]{1,24}$/,
    error: "Debe comenzar con mayúscula, solo letras/números y máximo 25 caracteres",
    empty: "Nombre no puede estar vacío",
    maxLength: 25,
  },
  price: {
    regex: /^\d+(\.\d{1,2})?$/,
    error: "Formato de precio inválido (ej. 10.99)",
    empty: "Precio no puede estar vacío",
    min: 0.01,
  },
  stock: {
    regex: /^\d+$/,
    error: "Debe ser un número entero positivo",
    empty: "Stock no puede estar vacío",
    min: 0,
    max: 9999,
  },
  category: {
    empty: "Debe seleccionar una categoría",
  },
  description: {
    minLength: 5,
    maxLength: 200,
    empty: "La descripción no puede estar vacía",
    error: "La descripción debe tener entre 5 y 200 caracteres",
  },
  image: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 2 * 1024 * 1024, // 2MB
    error: "Formato de imagen no válido o tamaño excedido (max 2MB)"
  },
  discountPrice: {
    validate: (value, originalPrice) => {
      if (!value) return "El precio con descuento es requerido";
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return "Precio inválido";
      if (numValue <= 0) return "Debe ser mayor que 0";
      if (numValue >= originalPrice) return "Debe ser menor al precio original";
      return null;
    }
  },
  discountEndDate: {
    validate: (value) => {
      if (!value) return "La fecha de fin de oferta es requerida";
      const date = new Date(value);
      if (isNaN(date.getTime())) return "Fecha inválida";
      if (date < new Date()) return "La fecha no puede ser en el pasado";
      return null;
    }
  }
};

let editingProductId = null;

async function uploadImageToCloudinary(file) {
  // 1. Validación del archivo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Formato de imagen no válido. Use JPG, PNG, GIF o WEBP.');
  }

  // 2. Validación de tamaño (2MB máximo)
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('La imagen no debe exceder 2MB de tamaño.');
  }

  // 3. Configurar FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', cloudinaryConfig.uploadPreset);
  formData.append('cloud_name', cloudinaryConfig.cloudName);
  formData.append('api_key', cloudinaryConfig.apiKey);

  try {
    // 4. Subir a Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      showError(errorData.error?.message || 'Error al subir la imagen');
    }

    const data = await response.json();
    
    // 5. Aplicar transformaciones de optimización
    const optimizedUrl = data.secure_url
      .replace('/upload/', '/upload/q_auto,f_auto,w_800,c_scale/');
    showSuccess("Imagen subida correctamente");
    return optimizedUrl;

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    showError(error.message || 'No se pudo procesar la imagen. Intente nuevamente.');
  }
}

// Función para capitalizar el nombre del producto
function capitalizeProductName(name) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Función para actualizar el asterisco de campos requeridos
function updateAsterisk(fieldId, isValid) {
  const asterisk = document.querySelector(`label[for="${fieldId}"] span`);
  if (asterisk) {
    asterisk.classList.toggle("text-red-500", !isValid);
    asterisk.classList.toggle("text-black", isValid);
  }
}

// Función para actualizar el contador de caracteres de la descripción
function updateDescriptionCounter(value) {
  const counter = document.getElementById("descriptionCounter");
  if (!counter) return;

  const length = value ? value.length : 0;
  counter.textContent = `${length}/${productValidations.description.maxLength} caracteres`;
}

// Función para actualizar el contador de caracteres del nombre
function updateCharacterCounter(value) {
  const counter = document.getElementById("nameCounter");
  if (!counter) return;

  const length = value ? value.length : 0;
  const remaining = productValidations.name.maxLength - length;
  counter.textContent = `${remaining} caracteres restantes`;
  counter.classList.toggle("text-red-500", remaining < 0);
}

// Función para limpiar errores de validación
function clearError(fieldId) {
  const errorElement = document.getElementById(`${fieldId}Error`);
  const inputElement = document.getElementById(fieldId);

  if (errorElement) errorElement.classList.add("hidden");
  if (inputElement) {
    inputElement.classList.remove("input-error");
    inputElement.classList.add("input-success");
  }
  updateAsterisk(fieldId, true);
}

// Función para mostrar errores de validación
function showProductError(fieldId, message) {
  const errorElement = document.getElementById(`${fieldId}Error`);
  const inputElement = document.getElementById(fieldId);

  if (!errorElement || !inputElement) return;

  errorElement.textContent = message;
  errorElement.classList.remove("hidden");
  inputElement.classList.add("input-error");
  inputElement.classList.remove("input-success");
  updateAsterisk(fieldId, false);
}

// Configurar validación del nombre
function setupNameValidation() {
  const nameInput = document.getElementById("productName");
  if (!nameInput) return;

  nameInput.addEventListener("input", function (e) {
    const value = e.target.value.trim();
    updateCharacterCounter(value);

    if (value.length > 0) {
      const cursorPos = e.target.selectionStart;
      e.target.value = capitalizeProductName(value);
      e.target.setSelectionRange(cursorPos, cursorPos);

      if (!value.match(productValidations.name.regex)) {
        showProductError("productName", productValidations.name.error);
      } else {
        clearError("productName");
      }

      if (value.length > productValidations.name.maxLength) {
        e.target.value = value.substring(0, productValidations.name.maxLength);
      }
    } else {
      clearError("productName");
    }
  });
}

// Configurar validación de la descripción
function setupDescriptionValidation() {
  const descriptionInput = document.getElementById("productDescription");
  if (!descriptionInput) return;

  descriptionInput.addEventListener("input", function () {
    const value = this.value.trim();
    updateDescriptionCounter(value);

    if (value.length === 0) {
      showProductError("productDescription", productValidations.description.empty);
    } else if (
      value.length < productValidations.description.minLength ||
      value.length > productValidations.description.maxLength
    ) {
      showProductError("productDescription", productValidations.description.error);
    } else {
      clearError("productDescription");
    }
  });
}

// Configurar validación del precio
function setupPriceValidation() {
  const priceInput = document.getElementById("productPrice");
  if (!priceInput) return;

  priceInput.addEventListener("input", function () {
    const value = parseFloat(this.value) || 0;

    if (isNaN(value) || this.value.trim() === "") {
      showProductError("productPrice", productValidations.price.empty);
    } else if (value < productValidations.price.min) {
      showProductError("productPrice", `El precio mínimo es ${productValidations.price.min}`);
    } else {
      clearError("productPrice");
    }
  });
}

// Configurar validación del stock
function setupStockValidation() {
  const stockInput = document.getElementById("productStock");
  if (!stockInput) return;

  stockInput.addEventListener("input", function () {
    const value = this.value.trim();
    const numericValue = parseInt(value) || 0;

    if (value === "") {
      showProductError("productStock", productValidations.stock.empty);
    } else if (!/^\d+$/.test(value)) {
      showProductError("productStock", productValidations.stock.error);
    } else if (numericValue > productValidations.stock.max) {
      showProductError("productStock", `El stock máximo es ${productValidations.stock.max}`);
    } else {
      clearError("productStock");
    }
  });
}

// Configurar validación de categoría
function setupCategoryValidation() {
  const categoryInput = document.getElementById("productCategory");
  if (!categoryInput) return;

  categoryInput.addEventListener("change", function () {
    if (!this.value) {
      showProductError("productCategory", productValidations.category.empty);
    } else {
      clearError("productCategory");
    }
  });
}

// Función para mostrar/ocultar campos de descuento
function toggleDiscountFields(show) {
  const discountFields = document.getElementById("discountFields");
  if (discountFields) {
    discountFields.style.display = show ? "block" : "none";
  }
}

// Configurar validación de campos de descuento
function setupDiscountValidation() {
  const discountPriceInput = document.getElementById("productDiscountPrice");
  const discountDateInput = document.getElementById("productDiscountEndDate");
  const priceInput = document.getElementById("productPrice");

  if (!discountPriceInput || !discountDateInput || !priceInput) return;

  // Validación precio de descuento
  discountPriceInput.addEventListener("input", function() {
    const value = this.value.trim();
    const originalPrice = parseFloat(priceInput.value) || 0;
    
    if (value === "") {
      showProductError("productDiscountPrice", productValidations.discountPrice.validate("", originalPrice));
    } else {
      const error = productValidations.discountPrice.validate(value, originalPrice);
      if (error) {
        showProductError("productDiscountPrice", error);
      } else {
        clearError("productDiscountPrice");
      }
    }
  });

  // Validación fecha de descuento
  discountDateInput.addEventListener("change", function() {
    const value = this.value;
    const error = productValidations.discountEndDate.validate(value);
    if (error) {
      showProductError("productDiscountEndDate", error);
    } else {
      clearError("productDiscountEndDate");
    }
  });
}

// Configurar evento para el checkbox de descuento
function setupDiscountToggle() {
  const discountCheckbox = document.getElementById("productHasDiscount");
  if (discountCheckbox) {
    discountCheckbox.addEventListener("change", (e) => {
      toggleDiscountFields(e.target.checked);
      
      // Limpiar errores al desactivar
      if (!e.target.checked) {
        clearError("productDiscountPrice");
        clearError("productDiscountEndDate");
      } else {
        // Forzar validación al activar
        document.getElementById("productDiscountPrice").dispatchEvent(new Event("input"));
        document.getElementById("productDiscountEndDate").dispatchEvent(new Event("change"));
      }
    });
  }
}

// Configurar cálculo de descuentos
function setupDiscountCalculations() {
  const priceInput = document.getElementById("productPrice");
  const discountPriceInput = document.getElementById("productDiscountPrice");
  
  if (priceInput && discountPriceInput) {
    const calculateDiscount = () => {
      const price = parseFloat(priceInput.value) || 0;
      const discountPrice = parseFloat(discountPriceInput.value) || 0;
      
      if (price > 0 && discountPrice > 0 && discountPrice < price) {
        const discountPercentage = Math.round(((price - discountPrice) / price) * 100);
        const discountAmount = price - discountPrice;
        
        document.getElementById("discountPercentageDisplay").textContent = discountPercentage;
        document.getElementById("discountAmountDisplay").textContent = discountAmount.toFixed(2);
      } else {
        document.getElementById("discountPercentageDisplay").textContent = "0";
        document.getElementById("discountAmountDisplay").textContent = "0.00";
      }
    };
    
    priceInput.addEventListener("input", calculateDiscount);
    discountPriceInput.addEventListener("input", calculateDiscount);
  }
}

// Configurar carga y previsualización de imagen
function setupImageUpload() {
  const imageInput = document.getElementById("productImageUpload");
  const imagePreview = document.getElementById("imagePreview");
  
  if (!imageInput || !imagePreview) return;

  imageInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!productValidations.image.allowedTypes.includes(file.type)) {
      showProductError("productImageUpload", productValidations.image.error);
      return;
    }

    // Validar tamaño
    if (file.size > productValidations.image.maxSize) {
      showProductError("productImageUpload", productValidations.image.error);
      return;
    }

    clearError("productImageUpload");

    // Mostrar previsualización
    const reader = new FileReader();
    reader.onload = function(event) {
      imagePreview.innerHTML = `
        <img src="${event.target.result}" class="w-32 h-32 object-cover rounded-lg">
        <button type="button" onclick="window.productModule.clearImageUpload()" 
          class="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center transform translate-x-1 -translate-y-1">
          <i class="fas fa-times text-xs"></i>
        </button>
      `;
      imagePreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

// Función para limpiar la carga de imagen
function clearImageUpload() {
  const imageInput = document.getElementById("productImageUpload");
  const imagePreview = document.getElementById("imagePreview");
  
  imageInput.value = "";
  imagePreview.innerHTML = "";
  imagePreview.classList.add("hidden");
  clearError("productImageUpload");
}

// Configurar todas las validaciones del formulario
function setupFormValidations() {
  setupNameValidation();
  setupDescriptionValidation();
  setupPriceValidation();
  setupStockValidation();
  setupCategoryValidation();
  setupDiscountValidation();
  setupDiscountCalculations();
  setupDiscountToggle();
  setupImageUpload();
}

// Función para abrir el modal de producto
export async function openProductModal(product = null) {
  editingProductId = product?.id || null;
  const form = document.getElementById("productForm");
  if (!form) return;

  // Resetear el formulario
  form.reset();
  clearImageUpload();
  document.getElementById("productHasDiscount").checked = false;
  toggleDiscountFields(false);

  // Si el producto viene como string (desde el onclick), parsearlo
  const productData = typeof product === 'string' ? JSON.parse(product) : product;

  if (productData) {
    document.getElementById("productModalTitle").textContent = "Editar Producto";
    document.getElementById("productName").value = productData.name;
    document.getElementById("productDescription").value = productData.description || "";
    
    // Mostrar imagen existente si hay una
    if (productData.image) {
      const imagePreview = document.getElementById("imagePreview");
      imagePreview.innerHTML = `
        <img src="${productData.image}" class="w-32 h-32 object-cover rounded-lg">
        <button type="button" onclick="window.productModule.clearImageUpload()" 
          class="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center transform translate-x-1 -translate-y-1">
          <i class="fas fa-times text-xs"></i>
        </button>
      `;
      imagePreview.classList.remove("hidden");
    }
    
    document.getElementById("productPrice").value = productData.price;
    document.getElementById("productStock").value = productData.stock;
    document.getElementById("productCategory").value = productData.category;
    
    if (productData.discountPrice && productData.discountEndDate) {
      document.getElementById("productHasDiscount").checked = true;
      document.getElementById("productDiscountPrice").value = productData.discountPrice;
      document.getElementById("productDiscountEndDate").value = productData.discountEndDate.split('T')[0];
      toggleDiscountFields(true);
      updateDiscountDisplay(productData.price, productData.discountPrice);
    }
  } else {
    document.getElementById("productModalTitle").textContent = "Nuevo Producto";
    document.getElementById("productStock").value = "0";
    document.getElementById("productCategory").value = "Electrónicos";
  }

  // Actualizar contadores
  updateCharacterCounter(document.getElementById("productName").value || "");
  updateDescriptionCounter(document.getElementById("productDescription").value || "");

  // Configurar validaciones
  setupFormValidations();
  
  document.getElementById("productModal").classList.remove("hidden");
}

// Función para cerrar el modal de producto
export function closeProductModal() {
  document.getElementById("productModal").classList.add("hidden");
}

// Función para actualizar la visualización del descuento
function updateDiscountDisplay(price, discountPrice) {
  if (!price || !discountPrice) return;
  
  const { percentage, amount } = calculateDiscount(price, discountPrice);
  document.getElementById("discountPercentageDisplay").textContent = percentage;
  document.getElementById("discountAmountDisplay").textContent = amount.toFixed(2);
}

// Función para calcular el descuento
function calculateDiscount(price, discountPrice) {
  if (!price || !discountPrice) return { percentage: 0, amount: 0 };
  const amount = price - discountPrice;
  const percentage = Math.round((amount / price) * 100);
  return { percentage, amount };
}

// Función para manejar el envío del formulario
export async function handleProductSubmit(e) {
  e.preventDefault();

  const formData = {
    name: document.getElementById("productName").value.trim(),
    description: document.getElementById("productDescription").value.trim(),
    price: parseFloat(document.getElementById("productPrice").value) || 0,
    stock: parseInt(document.getElementById("productStock").value) || 0,
    category: document.getElementById("productCategory").value,
    discountPrice: null,
    discountEndDate: null
  };

  // Manejar la imagen subida
  const imageInput = document.getElementById("productImageUpload");
  if (imageInput.files.length > 0) {
    try {
      const file = imageInput.files[0];
      const imageUrl = await uploadImageToCloudinary(file);
      formData.image = imageUrl;
    } catch (error) {
      showError("Error al subir la imagen: " + error.message);
      return;
    }
  } else if (editingProductId) {
    // Mantener la imagen existente si no se subió una nueva
    const products = await dataHandler.readProducts();
    const existingProduct = products.find(p => p.id === editingProductId);
    if (existingProduct && existingProduct.image) {
      formData.image = existingProduct.image;
    }
  }

  // Validaciones básicas
  let isValid = true;

  // Validar nombre
  if (!formData.name) {
    showProductError("productName", productValidations.name.empty);
    isValid = false;
  } else if (!formData.name.match(productValidations.name.regex)) {
    showProductError("productName", productValidations.name.error);
    isValid = false;
  }

  // Validar descripción
  if (!formData.description) {
    showProductError("productDescription", productValidations.description.empty);
    isValid = false;
  } else if (
    formData.description.length < productValidations.description.minLength ||
    formData.description.length > productValidations.description.maxLength
  ) {
    showProductError("productDescription", productValidations.description.error);
    isValid = false;
  }

  // Validar precio
  if (isNaN(formData.price)) {
    showProductError("productPrice", productValidations.price.empty);
    isValid = false;
  } else if (formData.price < productValidations.price.min) {
    showProductError("productPrice", `Precio debe ser mayor o igual a ${productValidations.price.min}`);
    isValid = false;
  }

  // Validar stock
  if (isNaN(formData.stock)) {
    showProductError("productStock", productValidations.stock.empty);
    isValid = false;
  } else if (formData.stock < productValidations.stock.min) {
    showProductError("productStock", "Stock no puede ser negativo");
    isValid = false;
  }

  // Validar categoría
  if (!formData.category) {
    showProductError("productCategory", productValidations.category.empty);
    isValid = false;
  }

  // Validar descuento si está activo
  const hasDiscount = document.getElementById("productHasDiscount").checked;
  if (hasDiscount) {
    formData.discountPrice = document.getElementById("productDiscountPrice").value.trim();
    formData.discountEndDate = document.getElementById("productDiscountEndDate").value.trim();
    
    // Validar precio de descuento
    const discountError = productValidations.discountPrice.validate(
      formData.discountPrice, 
      formData.price
    );
    
    if (discountError) {
      showProductError("productDiscountPrice", discountError);
      isValid = false;
    }
    
    // Validar fecha de descuento
    const dateError = productValidations.discountEndDate.validate(formData.discountEndDate);
    if (dateError) {
      showProductError("productDiscountEndDate", dateError);
      isValid = false;
    }

    // Convertir a valores numéricos/fecha si son válidos
    if (isValid) {
      formData.discountPrice = parseFloat(formData.discountPrice);
      formData.discountEndDate = new Date(formData.discountEndDate).toISOString();
    }
  }

  if (!isValid) return;

  try {
    // Capitalizar nombre y establecer estado
    formData.name = capitalizeProductName(formData.name);
    formData.status = formData.stock > 0 ? "Activo" : "Agotado";

    // Mostrar confirmación antes de guardar
    showConfirmModal(
      editingProductId ? "Editar Producto" : "Crear Producto",
      `¿Desea ${editingProductId ? "actualizar" : "crear"} este producto?`,
      "saveProduct",
      editingProductId,
      true,
      formData
    );
  } catch (error) {
    showError("Error al procesar el producto: " + error.message);
  }
}

// Función para cargar productos en la tabla
export async function loadProducts() {
  try {
    const products = await dataHandler.readProducts();
    const tbody = document.getElementById("productsTable");
    if (!tbody) return;

    tbody.innerHTML = "";

    products.forEach((product) => {
      const productForModal = {
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        stock: product.stock,
        category: product.category,
        status: product.status,
        discountPrice: product.discountPrice,
        discountEndDate: product.discountEndDate
      };

      const hasDiscount = product.discountPrice && product.discountEndDate && 
                       new Date(product.discountEndDate) >= new Date();
      
      const { percentage } = hasDiscount ? 
        calculateDiscount(product.price, product.discountPrice) : 
        { percentage: 0 };

      const row = document.createElement("tr");
      row.className = "border-b hover:bg-gray-50";
      row.innerHTML = `
        <td class="py-3 px-4 text-center">${product.id}</td>
        <td class="py-3 px-4 text-center">
          ${product.image ? 
            `<img src="${product.image}" alt="${product.name}" class="w-10 h-10 object-cover mx-auto rounded">` : 
            '<i class="fas fa-image text-gray-400 text-xl"></i>'}
        </td>
        <td class="py-3 px-4 text-center">${product.name}</td>
        <td class="py-3 px-4 text-center">${product.category}</td>
        <td class="py-3 px-4 text-center">
          ${hasDiscount ? `
            <span class="text-gray-500 line-through">$${product.price.toFixed(2)}</span>
            <br>
            <span class="text-green-600 font-semibold">
              $${product.discountPrice.toFixed(2)}
              <span class="text-xs bg-green-100 text-green-800 px-1 rounded ml-1">
                -${percentage}%
              </span>
            </span>
            <i class="fas fa-tag text-red-500 ml-1"></i>
          ` : `$${product.price.toFixed(2)}`}
        </td>
        <td class="py-3 px-4 text-center ${product.stock < 10 ? 'text-red-600 font-semibold' : ''}">
          ${product.stock}
        </td>
        <td class="py-3 px-4 text-center">
          <span class="px-2 py-1 rounded-full text-xs ${
            product.status === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }">
            ${product.status}
          </span>
        </td>
        <td class="py-3 px-4 text-center space-x-2 whitespace-nowrap">
          ${hasDiscount ? `
            <span class="relative group">
              <i class="fas fa-tag text-red-500 cursor-help"></i>
              <span class="absolute z-10 hidden group-hover:block bg-white shadow-lg p-2 rounded text-xs w-auto left-0 transform -translate-x-1/2">
                Oferta válida hasta: ${new Date(product.discountEndDate).toLocaleDateString()}
              </span>
            </span>
          ` : ''}
          <button onclick="window.productModule.openProductModal(${escapeHtml(JSON.stringify(productForModal))})" 
            class="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="window.productModule.deleteProduct(${product.id})" 
            class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50">
            <i class="fas fa-trash"></i>
          </button>
          <button onclick="window.productModule.showProductDetails(${product.id})"
            class="text-purple-500 hover:text-purple-700 p-1 rounded hover:bg-purple-50">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error al cargar productos:", error);
    showError("Error al cargar los productos");
  }
}

// Función auxiliar para escapar HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Función para mostrar detalles del producto
async function showProductDetails(productId) {
  try {
    const products = await dataHandler.readProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      showError("Producto no encontrado");
      return;
    }

    const hasDiscount = product.discountPrice && product.discountEndDate && 
                      new Date(product.discountEndDate) >= new Date();
    
    const { percentage, amount } = hasDiscount ? 
      calculateDiscount(product.price, product.discountPrice) : 
      { percentage: 0, amount: 0 };

    document.getElementById("modalTitle").textContent = "Detalles del Producto";
    const modalContent = document.getElementById("modalContent");
    
    modalContent.innerHTML = `
      <div class="grid grid-cols-1 gap-6">
        <div class="flex flex-col items-center">
          ${product.image ? 
            `<img src="${product.image}" alt="${product.name}" class="w-full max-w-xs h-64 object-contain rounded-lg shadow-md mb-4">` : 
            '<div class="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-4xl mb-4"><i class="fas fa-image"></i></div>'}
          
          <div class="text-center">
            <h3 class="text-2xl font-bold text-gray-800">${product.name}</h3>
            <span class="inline-block mt-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              ${product.category}
            </span>
          </div>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-3">
            <span class="font-medium text-gray-700">Estado:</span>
            <span class="px-3 py-1 rounded-full text-sm ${
              product.status === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }">
              ${product.status}
            </span>
          </div>
          
          <div class="flex justify-between items-center mb-3">
            <span class="font-medium text-gray-700">Stock disponible:</span>
            <span class="font-semibold ${product.stock < 10 ? 'text-red-600' : 'text-gray-800'}">
              ${product.stock} unidades
            </span>
          </div>
          
          <div class="flex justify-between items-center mb-3">
            <span class="font-medium text-gray-700">Precio:</span>
            <span class="text-lg ${hasDiscount ? 'text-green-600 font-semibold' : 'text-gray-800'}">
              ${hasDiscount ? 
                `<span class="text-gray-500 line-through mr-2">$${product.price.toFixed(2)}</span>
                 $${product.discountPrice.toFixed(2)}` : 
                `$${product.price.toFixed(2)}`}
            </span>
          </div>
          
          ${hasDiscount ? `
            <div class="flex justify-between items-center mb-3">
              <span class="font-medium text-gray-700">Descuento:</span>
              <span class="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                -${percentage}% (Ahorro: $${amount.toFixed(2)})
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-medium text-gray-700">Oferta válida hasta:</span>
              <span class="text-sm text-gray-600">
                ${new Date(product.discountEndDate).toLocaleDateString()}
              </span>
            </div>
          ` : ''}
        </div>
        
        <div class="border-t pt-4">
          <h4 class="font-medium text-gray-800 mb-2">Descripción</h4>
          <p class="text-gray-600">${product.description || "No hay descripción disponible"}</p>
        </div>
        
        <div class="border-t pt-4 text-sm text-gray-500">
          <p><span class="font-medium">ID del producto:</span> ${product.id}</p>
          <p class="mt-1"><span class="font-medium">Fecha de creación:</span> ${new Date(product.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    `;

    document.getElementById("modal").classList.remove("hidden");
  } catch (error) {
    console.error("Error al mostrar detalles del producto:", error);
    showError("Error al cargar los detalles del producto");
  }
}

// Función para eliminar un producto
async function deleteProduct(productId) {
  try {
    showConfirmModal(
      "Eliminar Producto",
      "¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.",
      "deleteProduct",
      productId,
      true
    );
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    showError("Error al intentar eliminar el producto");
  }
}

// Exportar funciones para acceso global
window.productModule = {
  openProductModal,
  closeProductModal,
  loadProducts,
  handleProductSubmit,
  deleteProduct,
  calculateDiscount,
  updateDiscountDisplay,
  showProductDetails,
  clearImageUpload
};

// Asignar el manejador de eventos al formulario cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  const productForm = document.getElementById("productForm");
  if (productForm) {
    productForm.addEventListener("submit", handleProductSubmit);
  }

  // Cargar productos al iniciar
  loadProducts();
});