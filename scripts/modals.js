import { DataHandler } from "./dataHandler.js";
import { logout, showError, showSuccess } from "./auth.js";
import { updateCartModal, updateCartCount } from "./cart.js";
import { Validations } from "./userValidations.js";
import { loadUserPurchases, loadPendingOrders } from "./purchases.js";
import { loadFavorites, toggleFavorite } from "./favorites.js";
import { updateFavoriteStatusInModal } from "./productDetails.js";
import { updateProductAvailability } from "./productUser.js";

const dataHandler = new DataHandler();

// Bancos cubanos y sus códigos
const CUBAN_BANKS = {
  BANMET: {
    codes: ["9225", "9226", "9235", "9245", "9560"],
    logo: "/images/banks/banmet.jpeg",
    colors: ["#0056a6", "#ffffff"],
  },
  BANDEC: {
    codes: ["9201", "9202", "9203", "9207"],
    logo: "/images/banks/bandec.jpg",
    colors: ["#1a6e1a", "#ffffff"],
  },
  BPA: {
    codes: ["9204", "9205", "9206", "9212", "9233", "9237", "9238"],
    logo: "/images/banks/bpa.jpg",
    colors: ["#8b0000", "#ffffff"],
  },
};

export function setupModals() {
  // Modal de carrito
  const cartBtn = document.getElementById("cartBtn");
  const cartModal = document.getElementById("cartModal");
  const closeCartModal = document.getElementById("closeCartModal");

  cartBtn.addEventListener("click", () => {
    updateCartModal();
    cartModal.classList.remove("hidden");
  });

  closeCartModal.addEventListener("click", () => {
    cartModal.classList.add("hidden");
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

  // Modal de logout
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById("logoutModal");
  const logoutCancel = document.getElementById("logoutCancel");
  const logoutConfirm = document.getElementById("logoutConfirm");

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

  // Modal de pago
  const checkoutBtn = document.getElementById("checkoutBtn");
  const paymentModal = document.getElementById("paymentModal");
  const closePaymentModal = document.getElementById("closePaymentModal");
  const cancelPaymentBtn = document.getElementById("cancelPaymentBtn");

  checkoutBtn?.addEventListener("click", () => {
    const cart = dataHandler.getCart();
    if (cart.length === 0) {
      showError("El carrito está vacío");
      return;
    }

    document.getElementById("paymentForm").reset();
    document.getElementById("cardNumber").value = "";
    document.getElementById("cardExpiry").value = "";
    document.getElementById("cvv").value = "";
    document.getElementById("shippingAddress").value = "";

    const total = cart.reduce((sum, item) => {
      const price = item.product.discountPrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);

    document.getElementById("paymentTotal").textContent = `$${total.toFixed(
      2
    )}`;

    cartModal.classList.add("hidden");
    paymentModal.classList.remove("hidden");

    // Reset card preview
    updateCardPreview();
  });

  closePaymentModal?.addEventListener("click", () => {
    paymentModal.classList.add("hidden");
  });

  cancelPaymentBtn?.addEventListener("click", () => {
    paymentModal.classList.add("hidden");
  });

  // Configurar máscaras para los inputs
  const cardNumberInput = document.getElementById("cardNumber");
  const cardExpiryInput = document.getElementById("cardExpiry");
  const cvvInput = document.getElementById("cvv");

  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 16) value = value.substring(0, 16);
      e.target.value = value.replace(/(\d{4})(?=\d)/g, "$1 ");
      updateCardPreview();
    });
  }

  if (cardExpiryInput) {
    cardExpiryInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4);
      }
      e.target.value = value;
      updateCardPreview();
    });
  }

  if (cvvInput) {
    cvvInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
    });
  }

  // Actualizar vista previa de la tarjeta
  function updateCardPreview() {
    const cardNumber = cardNumberInput?.value.replace(/\s/g, "") || "";
    const cardExpiry = cardExpiryInput?.value || "";
    const bank = detectBank(cardNumber);

    const cardPreview = document.getElementById("cardPreview");
    if (!cardPreview) return;

    // Actualizar colores según el banco
    if (bank) {
      cardPreview.style.background = `linear-gradient(135deg, ${bank.colors[0]}, ${bank.colors[1]})`;
      document.getElementById("bankLogo").src = bank.logo;
      document.getElementById("bankLogo").classList.remove("hidden");
    } else {
      cardPreview.style.background =
        "linear-gradient(135deg, #4b5563, #9ca3af)";
      document.getElementById("bankLogo").classList.add("hidden");
    }

    // Actualizar número de tarjeta
    const cardNumberDisplay = document.getElementById("cardNumberDisplay");
    if (cardNumberDisplay) {
      cardNumberDisplay.textContent = cardNumber.replace(
        /(\d{4})(?=\d)/g,
        "$1 "
      );
    }

    // Actualizar fecha de expiración
    const expiryDisplay = document.getElementById("cardExpiryDisplay");
    if (expiryDisplay) {
      expiryDisplay.textContent = cardExpiry;
    }
  }

  function detectBank(cardNumber) {
    if (!cardNumber || cardNumber.length < 4) return null;

    const firstFour = cardNumber.substring(0, 4);
    for (const [bankName, bankData] of Object.entries(CUBAN_BANKS)) {
      if (bankData.codes.some((code) => firstFour.startsWith(code))) {
        return bankData;
      }
    }
    return null;
  }

  // Confirmar pago
  const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
  // En modals.js - Configuración del modal de pago
  confirmPaymentBtn?.addEventListener("click", async () => {
    const paymentData = {
      cardNumber:
        document.getElementById("cardNumber")?.value.replace(/\s/g, "") || "",
      cardExpiry: document.getElementById("cardExpiry")?.value || "",
      cvv: document.getElementById("cvv")?.value || "",
      shippingAddress: document.getElementById("shippingAddress")?.value || "",
      paymentMethod: "credit", // Solo un método ahora
      autoProcess: document.getElementById("autoProcess")?.checked || false,
    };

    // Validaciones
    if (!paymentData.cardNumber) {
      showError("Ingrese el número de tarjeta");
      return;
    }

    if (!Validations.creditCard(paymentData.cardNumber)) {
      showError("Número de tarjeta inválido");
      return;
    }

    if (!paymentData.cardExpiry) {
      showError("Ingrese la fecha de expiración");
      return;
    }

    if (!Validations.cardExpiry(paymentData.cardExpiry)) {
      showError("Fecha de expiración inválida");
      return;
    }

    if (!paymentData.cvv) {
      showError("Ingrese el CVV");
      return;
    }

    if (!Validations.cvv(paymentData.cvv)) {
      showError("CVV inválido");
      return;
    }

    if (!paymentData.shippingAddress) {
      showError("Ingrese la dirección de envío");
      return;
    }

    if (!Validations.address(paymentData.shippingAddress)) {
      showError("Dirección de envío demasiado corta (mínimo 10 caracteres)");
      return;
    }

    // Solo mostrar modal de confirmación si autoProcess está activado
    if (paymentData.autoProcess) {
      document
        .getElementById("passwordConfirmModal")
        .classList.remove("hidden");
      document.getElementById("passwordConfirmModal").dataset.paymentData =
        JSON.stringify(paymentData);
      document.getElementById("confirmPasswordError").classList.add("hidden");
      document.getElementById("confirmPasswordInput").value = "";
    } else {
      // Procesar directamente como pendiente
      try {
        const result = await dataHandler.processPurchase(paymentData);
        showSuccess(
          "Pedido creado como pendiente. Puedes completar el pago más tarde."
        );
        paymentModal.classList.add("hidden");
        updateCartCount();
        await loadUserPurchases();
        await loadPendingOrders();
        // Actualizar productos y favoritos
        const products = await dataHandler.readProducts();
        updateProductAvailability(products);
        if (document.getElementById("favoritesContainer")) {
          await loadFavorites();
        }
      } catch (error) {
        showError(error.message);
      }
    }
  });

  // Confirmar pago con contraseña
  document
    .getElementById("confirmPaymentWithPassword")
    ?.addEventListener("click", async () => {
      const password = document.getElementById("confirmPasswordInput").value;
      const session = dataHandler.getSession();
      const orderId = document.getElementById("passwordConfirmModal").dataset
        .orderId;
      const paymentData = JSON.parse(
        document.getElementById("passwordConfirmModal").dataset.paymentData ||
          "{}"
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
        } else if (paymentData.cardNumber) {
          // Verificar si hay datos de pago
          // Procesar nuevo pago
          result = await dataHandler.processPurchase(paymentData);
          showSuccess("Compra realizada con éxito");
        }

        document.getElementById("passwordConfirmModal").classList.add("hidden");
        document.getElementById("paymentModal")?.classList.add("hidden");
        updateCartCount();
        await loadUserPurchases();
        await loadPendingOrders();

        // Actualizar productos y favoritos
        const products = await dataHandler.readProducts();
        updateProductAvailability(products);
        if (document.getElementById("favoritesContainer")) {
          await loadFavorites();
        }
      } catch (error) {
        document.getElementById("confirmPasswordError").textContent =
          error.message;
        document
          .getElementById("confirmPasswordError")
          .classList.remove("hidden");
      }
    });

  // Cancelar confirmación de contraseña
  document
    .getElementById("cancelPasswordConfirm")
    ?.addEventListener("click", () => {
      document.getElementById("passwordConfirmModal").classList.add("hidden");
    });

  // Modal de detalles del producto
  const closeProductDetailModal = document.getElementById(
    "closeProductDetailModal"
  );
  closeProductDetailModal?.addEventListener("click", () => {
    document.getElementById("productDetailModal").classList.add("hidden");
  });

  const toggleFavoriteFromDetail = document.getElementById(
    "toggleFavoriteFromDetail"
  );
  toggleFavoriteFromDetail?.addEventListener("click", async (e) => {
    e.stopPropagation();
    const productId = parseInt(
      document.getElementById("productDetailModal").dataset.productId
    );
    try {
      const isCurrentlyFavorite = dataHandler.isFavorite(productId);
      const newFavoriteStatus = await toggleFavorite(productId, true);

      if (isCurrentlyFavorite !== newFavoriteStatus) {
        showSuccess(
          newFavoriteStatus ? "Añadido a favoritos" : "Eliminado de favoritos"
        );
      }

      updateFavoriteStatusInModal();
    } catch (error) {
      showError("Error al actualizar favoritos");
      console.error(error);
    }
  });

  // Modal de detalles de compra
  const closePurchaseDetailModal = document.getElementById(
    "closePurchaseDetailModal"
  );
  closePurchaseDetailModal?.addEventListener("click", () => {
    document.getElementById("purchaseDetailModal").classList.add("hidden");
  });

  // Manejar cambio de método de pago
  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const method = e.target.value;
      const cardFields = document.getElementById("cardFields");
      const transferFields = document.getElementById("transferFields"); // Si implementas transferencia

      // Resetear todos los campos
      document.querySelectorAll(".payment-method-fields").forEach((el) => {
        el.classList.add("hidden");
      });

      // Mostrar campos según método seleccionado
      if (method === "credit" || method === "debit") {
        document.getElementById("cardPreview").classList.remove("hidden");
        if (cardFields) cardFields.classList.remove("hidden");
      } else if (method === "transfer" && transferFields) {
        transferFields.classList.remove("hidden");
      }

      // Actualizar vista previa de tarjeta
      updateCardPreview();
    });
  });

  // Inicializar campos visibles según método seleccionado por defecto
  const defaultMethod =
    document.querySelector('input[name="paymentMethod"]:checked')?.value ||
    "credit";
  document.querySelectorAll(".payment-method-fields").forEach((el) => {
    el.classList.add("hidden");
  });
  if (defaultMethod === "credit" || defaultMethod === "debit") {
    const cardFields = document.getElementById("cardFields");
    if (cardFields) cardFields.classList.remove("hidden");
  }
}
