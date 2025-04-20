export class DataHandler {
  constructor() {
    this.usersKey = "soldmax_users";
    this.productsKey = "soldmax_products";
    this.salesKey = "soldmax_sales";
    this.sessionKey = "current_session";
    this.cartKey = "soldmax_cart_"; // Prefijo para carritos por usuario
    this.favoritesKey = "soldmax_favorites_"; // Prefijo para favoritos por usuario
    this.globalFavoritesKey = "soldmax_global_favorites";
    this.pendingOrdersKey = "soldmax_pending_orders_";
    this.newsletterKey = "soldmax_newsletter_subscribers";


    // Verificar ofertas expiradas cada hora
  setInterval(() => this.checkExpiredDiscounts(), 3600000);
  this.checkExpiredDiscounts(); // Verificar al iniciar
  }

  async initialize() {
    await this.checkExpiredDiscounts();
    await this.seedAdminUser();
    return true;
  }

  /* ==================== USUARIOS Y SESIÓN ==================== */
  async readUsers() {
    const users = localStorage.getItem(this.usersKey);
    return users ? JSON.parse(users) : [];
  }

  async writeUsers(users) {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
    return true;
  }

  async createUser(userData) {
    const users = await this.readUsers();
    const newUser = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString(),
      role: userData.role || "user",
    };
    users.push(newUser);
    await this.writeUsers(users);
    return newUser;
  }

  async deleteUser(userId) {
    const users = await this.readUsers();
    const updatedUsers = users.filter((user) => user.id !== userId);
    await this.writeUsers(updatedUsers);
    return true;
  }

  async updateUserRole(userId, newRole) {
    const users = await this.readUsers();
    const userIndex = users.findIndex((user) => user.id === userId);

    if (userIndex !== -1) {
      users[userIndex].role = newRole;
      await this.writeUsers(users);
      return true;
    }
    return false;
  }

  async verifyAcount(value) {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const regexPhone = /^[0-9]{8}$/;
    const users = await this.readUsers();
    if (regexPhone.test(value)) {
      const user = users.find((user) => user.phone === value);
      if (!user) {
        return "La cuenta no exite, verifique su número de teléfono";
      }
      return user;
    } else if (regexEmail.test(value)) {
      const exist = await this.findUserByEmail(value);
      if (!exist) {
        return "La cuenta no exite, verifique su correo eléctronico";
      }
      return exist;
    } else {
      const user = users.find((user) => user.username === value);
      if (!user) {
        return "La cuenta no exite, verifique su usuario";
      }
      return user;
    }
  }

  async findUserByEmail(email) {
    const users = await this.readUsers();
    return users.find((user) => user.email === email);
  }

  async verifyUser(email, password) {
    const user = await this.findUserByEmail(email);
    if (!user) return false;
    return user.password === password ? user : false;
  }

  async seedAdminUser() {
    const users = await this.readUsers();
    const adminExists = users.some((user) => user.email === "admin@admin.com");
    if (!adminExists) {
      const admin = {
        id: 1,
        name: "Admin",
        username: "admin",
        email: "admin@admin.com",
        password: "Admin123*",
        phone: "12345678",
        role: "admin",
        createdAt: new Date().toISOString(),
      };
      await this.createUser(admin);
    }
    return true;
  }

  // Gestión de sesión
  setSession(user) {
    const session = {
      token: btoa(`${user.email}:${Date.now()}`),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
    };
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
    return session;
  }

  getSession() {
    const session = localStorage.getItem(this.sessionKey);
    if (!session) return null;
    try {
      const parsed = JSON.parse(session);
      if (parsed.expiresAt < Date.now()) {
        this.clearSession();
        return null;
      }
      return parsed;
    } catch (e) {
      this.clearSession();
      return null;
    }
  }

  clearSession() {
    localStorage.removeItem(this.sessionKey);
  }

  /* ==================== PRODUCTOS ==================== */
  async readProducts() {
    const products = localStorage.getItem(this.productsKey);
    return products ? JSON.parse(products) : [];
  }

  async writeProducts(products) {
    localStorage.setItem(this.productsKey, JSON.stringify(products));
    return true;
  }

  async deleteProduct(productId) {
    const products = await this.readProducts();
    const updatedProducts = products.filter((p) => p.id !== productId);
    return this.writeProducts(updatedProducts);
  }

  async createProduct(productData) {
    const products = await this.readProducts();
  
    const productExists = products.some(
      (p) => p.name.toLowerCase() === productData.name.toLowerCase()
    );
  
    if (productExists) {
      throw new Error("Ya existe un producto con ese nombre");
    }
  
    const newProduct = {
      id: Date.now(),
      ...productData,
      createdAt: new Date().toISOString(),
      status: productData.stock > 0 ? "Activo" : "Agotado",
      sold: 0,
      discountPrice: productData.discountPrice || null,
      discountEndDate: productData.discountEndDate || null
    };
  
    products.push(newProduct);
    await this.writeProducts(products);
    return newProduct;
  }
  
  async updateProduct(productId, newData) {
    const products = await this.readProducts();
    const index = products.findIndex((p) => p.id === productId);
  
    if (index === -1) return false;
  
    if (newData.name) {
      const nameExists = products.some(
        (p, i) => i !== index && p.name.toLowerCase() === newData.name.toLowerCase()
      );
  
      if (nameExists) {
        throw new Error("Ya existe otro producto con ese nombre");
      }
    }
  
    products[index] = {
      ...products[index],
      ...newData,
      status: newData.stock > 0 ? "Activo" : "Agotado",
      discountPrice: newData.discountPrice || null,
      discountEndDate: newData.discountEndDate || null
    };
    // Actualizar favoritos globales
    await this.updateProductInGlobalFavorites(productId, products[index]);

    // Actualizar favoritos de usuarios
    await this.updateProductInUserFavorites(productId, products[index]);
    
    return this.writeProducts(products);
  }
  
  async getDiscountedProducts() {
    const products = await this.readProducts();
    const now = new Date();
    
    return products.filter(product => {
      if (!product.discountPrice || !product.discountEndDate) return false;
      return new Date(product.discountEndDate) >= now;
    }).map(product => ({
      ...product,
      discountPercentage: Math.round(((product.price - product.discountPrice) / product.price) * 100)
    }));
  }

  async getProductById(productId) {
    const products = await this.readProducts();
    // Asegurarse de que productId es número (puede venir como string)
    const id = typeof productId === 'string' ? parseInt(productId) : productId;
    return products.find((p) => p.id === id) || null; // Devuelve null si no se encuentra
}

  async getProductsByCategory(category) {
    const products = await this.readProducts();
    return products.filter((p) => p.category === category);
  }

  async searchProducts(query) {
    const products = await this.readProducts();
    return products.filter(p => {
        const name = p.name || '';
        const description = p.description || '';
        return name.toLowerCase().includes(query.toLowerCase()) || 
               description.toLowerCase().includes(query.toLowerCase());
    });
}
  /* ==================== CARRITO DE COMPRAS ==================== */
  getCart() {
    const session = this.getSession();
    if (!session) return [];
    const cart = localStorage.getItem(`${this.cartKey}${session.user.id}`);
    return cart ? JSON.parse(cart) : [];
  }

  async addToCart(productId, quantity = 1) {
    const session = this.getSession();
    if (!session) throw new Error("Debe iniciar sesión");

    const product = await this.getProductById(productId);
    if (!product) throw new Error("Producto no encontrado");
    if (product.stock < quantity) {
      throw new Error(`No hay suficiente stock. Disponible: ${product.stock}`);
    }

    const cart = this.getCart();
    const existingItem = cart.find((item) => item.product.id === productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        throw new Error(`No hay suficiente stock. Disponible: ${product.stock}`);
      }
      existingItem.quantity = newQuantity;
    } else {
      cart.push({ product, quantity });
    }

    this.saveCart(cart);
    return cart;
  }

  async removeFromCart(productId) {
    const cart = this.getCart();
    const updatedCart = cart.filter((item) => item.product.id !== productId);
    this.saveCart(updatedCart);
    return updatedCart;
  }

  async updateCartItem(productId, newQuantity) {
    if (newQuantity < 1) return this.removeFromCart(productId);

    const product = await this.getProductById(productId);
    if (product.stock < newQuantity) {
      throw new Error(`No hay suficiente stock. Disponible: ${product.stock}`);
    }

    const cart = this.getCart();
    const item = cart.find((item) => item.product.id === productId);

    if (item) {
      item.quantity = newQuantity;
      this.saveCart(cart);
    }

    return cart;
  }

  saveCart(cart) {
    const session = this.getSession();
    if (!session) return false;
    localStorage.setItem(
      `${this.cartKey}${session.user.id}`,
      JSON.stringify(cart)
    );
    return true;
  }

  clearCart() {
    const session = this.getSession();
    if (!session) return false;
    localStorage.removeItem(`${this.cartKey}${session.user.id}`);
    return true;
  }

  /* ==================== FAVORITOS ==================== */
  async updateGlobalFavorites(productId, increment = true) {
    // Aseguramos que siempre obtenemos un array válido
    let globalFavorites = [];
    try {
        const favoritesData = localStorage.getItem(this.globalFavoritesKey);
        if (favoritesData) {
            globalFavorites = JSON.parse(favoritesData);
            // Verificamos que sea un array por si hay datos corruptos
            if (!Array.isArray(globalFavorites)) {
                console.warn('Datos de favoritos globales corruptos, reiniciando...');
                globalFavorites = [];
            }
        }
    } catch (e) {
        console.error('Error al parsear favoritos globales:', e);
        globalFavorites = [];
    }

    const index = globalFavorites.findIndex(fav => fav.productId === productId);

    if (index === -1 && increment) {
        const product = await this.getProductById(productId);
        if (product) {
            globalFavorites.push({
                productId,
                count: 1,
                productName: product.name,
                productImage: product.image,
                price: product.price,
                category: product.category
            });
        }
    } else if (index !== -1) {
        if (increment) {
            globalFavorites[index].count++;
        } else {
            globalFavorites[index].count--;
            if (globalFavorites[index].count <= 0) {
                globalFavorites.splice(index, 1);
            }
        }
    }

    localStorage.setItem(this.globalFavoritesKey, JSON.stringify(globalFavorites));
    return globalFavorites;
}

async getGlobalFavorites() {
    try {
        const favorites = localStorage.getItem(this.globalFavoritesKey);
        if (!favorites) return [];
        
        const parsed = JSON.parse(favorites);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Error al obtener favoritos globales:', e);
        return [];
    }
}

  // En dataHandler.js
async getTopFavorites(limit = 5) {
  const globalFavorites = await this.getGlobalFavorites();
  const sortedFavorites = globalFavorites
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  
  // Resolvemos todas las promesas de productos en paralelo
  const favoritesWithProducts = await Promise.all(
    sortedFavorites.map(async fav => {
      const product = await this.getProductById(fav.productId);
      return {
        ...fav,
        product: product || { 
          name: fav.productName, 
          image: fav.productImage,
          price: 0,
          category: 'No disponible'
        }
      };
    })
  );
  
  return favoritesWithProducts;
}

  getFavorites() {
    const session = this.getSession();
    if (!session) return [];
    const favorites = localStorage.getItem(
      `${this.favoritesKey}${session.user.id}`
    );
    return favorites ? JSON.parse(favorites) : [];
  }

  async toggleFavorite(productId) {
    const session = this.getSession();
    if (!session) throw new Error("Debe iniciar sesión");

    const product = await this.getProductById(productId);
    if (!product) throw new Error("Producto no encontrado");

    const favorites = this.getFavorites();
    const index = favorites.findIndex(fav => fav.id === productId);

    let isFavorite;
    if (index === -1) {
      favorites.push(product);
      isFavorite = true;
    } else {
      favorites.splice(index, 1);
      isFavorite = false;
    }

    this.saveFavorites(favorites);
    await this.updateGlobalFavorites(productId, isFavorite);
    return isFavorite;
  }

  saveFavorites(favorites) {
    const session = this.getSession();
    if (!session) return false;
    localStorage.setItem(
      `${this.favoritesKey}${session.user.id}`,
      JSON.stringify(favorites)
    );
    return true;
  }

  isFavorite(productId) {
    const favorites = this.getFavorites();
    return favorites.some((fav) => fav.id === productId);
  }
  // Nuevo método para actualizar en favoritos globales
async updateProductInGlobalFavorites(productId, updatedProduct) {
  const globalFavorites = await this.getGlobalFavorites();
  const favoriteIndex = globalFavorites.findIndex(fav => fav.productId === productId);

  if (favoriteIndex !== -1) {
    globalFavorites[favoriteIndex] = {
      ...globalFavorites[favoriteIndex],
      productName: updatedProduct.name,
      productImage: updatedProduct.image,
      price: updatedProduct.price,
      category: updatedProduct.category
    };
    localStorage.setItem(this.globalFavoritesKey, JSON.stringify(globalFavorites));
  }
}

// Nuevo método para actualizar en favoritos de usuarios
async updateProductInUserFavorites(productId, updatedProduct) {
  const users = await this.readUsers();
  
  for (const user of users) {
    const userFavoritesKey = `${this.favoritesKey}${user.id}`;
    const userFavorites = JSON.parse(localStorage.getItem(userFavoritesKey) || '[]');
    const favoriteIndex = userFavorites.findIndex(fav => fav.id === productId);

    if (favoriteIndex !== -1) {
      userFavorites[favoriteIndex] = {
        ...userFavorites[favoriteIndex],
        name: updatedProduct.name,
        image: updatedProduct.image,
        price: updatedProduct.price,
        category: updatedProduct.category,
        status: updatedProduct.status,
        stock: updatedProduct.stock
      };
      localStorage.setItem(userFavoritesKey, JSON.stringify(userFavorites));
    }
  }
}

  /* ==================== COMPRAS ==================== */
  async processPurchase(paymentData) {
    const session = this.getSession();
    if (!session) throw new Error("Debe iniciar sesión");

    // Verificar datos de pago
    if (!this.validatePaymentData(paymentData)) {
        throw new Error("Datos de pago inválidos");
    }

    const cart = this.getCart();
    if (cart.length === 0) throw new Error("El carrito está vacío");

    // Verificar stock y actualizar productos
    const products = await this.readProducts();
    const updatedProducts = [...products];
    const stockErrors = [];

    cart.forEach((cartItem) => {
        const productIndex = updatedProducts.findIndex(p => p.id === cartItem.product.id);
        if (productIndex === -1 || updatedProducts[productIndex].stock < cartItem.quantity) {
            stockErrors.push({
                product: cartItem.product.name,
                requested: cartItem.quantity,
                available: productIndex !== -1 ? updatedProducts[productIndex].stock : 0,
            });
        }
    });

    if (stockErrors.length > 0) {
        throw {
            name: "StockError",
            message: "Algunos productos no tienen suficiente stock",
            errors: stockErrors,
        };
    }

    // Crear orden (pendiente o completada según paymentData.autoProcess)
    const orderData = {
        id: paymentData.autoProcess ? `V-${Date.now()}` : `P-${Date.now()}`,
        userId: session.user.id,
        customer: session.user.name,
        products: cart.map(item => ({
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.product.discountPrice || item.product.price,
        })),
        total: cart.reduce((sum, item) => {
            const price = item.product.discountPrice || item.product.price;
            return sum + (price * item.quantity);
        }, 0),
        date: new Date().toISOString(),
        shippingAddress: paymentData.shippingAddress,
        paymentMethod: paymentData.paymentMethod,
        status: paymentData.autoProcess ? "Completada" : "Pendiente",
        expiresAt: paymentData.autoProcess ? null : Date.now() + 24 * 60 * 60 * 1000, // 24 horas para pendientes
        reservedStock: paymentData.autoProcess ? null : cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity
        }))
    };

    // Actualizar stock (tanto para completados como pendientes)
    cart.forEach(cartItem => {
        const productIndex = updatedProducts.findIndex(p => p.id === cartItem.product.id);
        if (productIndex !== -1) {
            updatedProducts[productIndex].stock -= cartItem.quantity;
            updatedProducts[productIndex].sold += (paymentData.autoProcess ? cartItem.quantity : 0);
            if (updatedProducts[productIndex].stock <= 0) {
                updatedProducts[productIndex].status = "Agotado";
            }
        }
    });

    await this.writeProducts(updatedProducts);

    // Guardar en ventas (tanto pendientes como completadas)
    const sales = await this.readSales();
    sales.push(orderData);
    await this.writeSales(sales);

    // Si es pendiente, guardar también en pendientes
    if (!paymentData.autoProcess) {
        const pendingOrders = this.getPendingOrders();
        pendingOrders.push(orderData);
        localStorage.setItem(`${this.pendingOrdersKey}${session.user.id}`, JSON.stringify(pendingOrders));
    }

    // Limpiar carrito
    await this.clearCart();

    return orderData;
}

// Reemplazar ambos métodos cancelOrder con este único método:
async cancelOrder(orderId) {
  const session = this.getSession();
  if (!session) throw new Error("Debe iniciar sesión");

  // Buscar en ventas
  const sales = await this.readSales();
  const orderIndex = sales.findIndex(o => o.id === orderId);
  
  if (orderIndex === -1) {
    throw new Error("Orden no encontrada");
  }

  const order = sales[orderIndex];
  
  // Devolver stock si era pendiente y tenía stock reservado
  if (order.status === "Pendiente" && order.reservedStock) {
    const products = await this.readProducts();
    let updatedProducts = [...products];
    
    order.reservedStock.forEach(reserved => {
      const productIndex = updatedProducts.findIndex(p => p.id === reserved.productId);
      if (productIndex !== -1) {
        updatedProducts[productIndex].stock += reserved.quantity;
        if (updatedProducts[productIndex].stock > 0 && 
            updatedProducts[productIndex].status === "Agotado") {
          updatedProducts[productIndex].status = "Activo";
        }
      }
    });
    
    await this.writeProducts(updatedProducts);
  }

  // Actualizar estado a Cancelada en ventas
  sales[orderIndex].status = "Cancelada";
  sales[orderIndex].id = `C-${sales[orderIndex].id.split('-')[1]}`
  sales[orderIndex].cancellationDate = new Date().toISOString();
  await this.writeSales(sales);
  
  // Eliminar de pendientes si aún está allí
  const pendingOrders = this.getPendingOrders();
  const pendingIndex = pendingOrders.findIndex(o => o.id === orderId);
  if (pendingIndex !== -1) {
    pendingOrders.splice(pendingIndex, 1);
    localStorage.setItem(`${this.pendingOrdersKey}${session.user.id}`, JSON.stringify(pendingOrders));
  }
  
  return true;
}

  validatePaymentData(paymentData) {
    // Validar tarjeta de crédito (formato ficticio)
    const cardRegex = /^[0-9]{16}$/;
    if (!cardRegex.test(paymentData.cardNumber)) return false;
    
    // Validar CVV
    const cvvRegex = /^[0-9]{3,4}$/;
    if (!cvvRegex.test(paymentData.cvv)) return false;
    
    // Validar fecha de expiración (MM/YY)
    const expRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    if (!expRegex.test(paymentData.cardExpiry)) return false;
    
    // Validar dirección
    if (!paymentData.shippingAddress || paymentData.shippingAddress.length < 10) return false;
    
    return true;
  }

  getPendingOrders() {
    const session = this.getSession();
    if (!session) return [];
    const orders = localStorage.getItem(`${this.pendingOrdersKey}${session.user.id}`);
    return orders ? JSON.parse(orders) : [];
  }

  async processPendingOrder(orderId) {
    const session = this.getSession();
    if (!session) throw new Error("Debe iniciar sesión");

    const pendingOrders = this.getPendingOrders();
    const order = pendingOrders.find(o => o.id === orderId);
    
    if (!order) {
        throw new Error("Orden no encontrada");
    }

    // No necesitamos verificar el stock nuevamente porque ya fue reservado
    const products = await this.readProducts();
    const updatedProducts = [...products];

    // Actualizar stock (restar lo ya reservado)
    order.products.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
            // No necesitamos verificar stock, solo actualizar las ventas
            updatedProducts[productIndex].sold += item.quantity;
            if (updatedProducts[productIndex].stock <= 0) {
                updatedProducts[productIndex].status = "Agotado";
            }
        }
    });

    await this.writeProducts(updatedProducts);

    // Actualizar estado en ventas
    const sales = await this.readSales();
    const saleIndex = sales.findIndex(s => s.id === orderId);
    if (saleIndex !== -1) {
        sales[saleIndex].status = "Completada";
        sales[saleIndex].completedAt = new Date().toISOString();
        await this.writeSales(sales);
    }

    // Eliminar de pedidos pendientes
    const pendingIndex = pendingOrders.findIndex(o => o.id === orderId);
    if (pendingIndex !== -1) {
        pendingOrders.splice(pendingIndex, 1);
        localStorage.setItem(`${this.pendingOrdersKey}${session.user.id}`, JSON.stringify(pendingOrders));
    }

    return sales[saleIndex] || order;
}

  async createSale(saleData) {
    const sales = await this.readSales();
    const newSale = {
      id: `V-${Date.now()}`,
      ...saleData,
      status: "Completada",
    };
    sales.push(newSale);
    await this.writeSales(sales);
    return newSale;
  }

  async readSales() {
    const sales = localStorage.getItem(this.salesKey);
    return sales ? JSON.parse(sales) : [];
  }

  async writeSales(sales) {
    localStorage.setItem(this.salesKey, JSON.stringify(sales));
    return true;
  }

  async getUserPurchases() {
    const session = this.getSession();
    if (!session) return [];

    const sales = await this.readSales();
    return sales.filter((sale) => sale.userId === session.user.id);
  }

  /* ==================== REPORTES ==================== */
  async getMonthlySales() {
    const sales = await this.readSales();
    const months = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];
    
    const result = { 
      labels: [...months], 
      data: Array(12).fill(0),
      count: Array(12).fill(0)
    };

    sales.forEach(sale => {
      if (sale.status === "Completada") {
        const date = new Date(sale.date);
        const month = date.getMonth();
        result.data[month] += sale.total;
        result.count[month]++;
      }
    });

    return result;
  }

  async getDailySales(days = 30) {
    const sales = await this.readSales();
    const result = {
      labels: [],
      data: [],
      count: []
    };

    // Crear array para los últimos 'days' días
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.labels.push(dateStr);
      result.data.push(0);
      result.count.push(0);
    }

    // Procesar ventas
    sales.forEach(sale => {
      if (sale.status === "Completada") {
        const saleDate = sale.date.split('T')[0];
        const index = result.labels.indexOf(saleDate);
        if (index !== -1) {
          result.data[index] += sale.total;
          result.count[index]++;
        }
      }
    });

    return result;
  }

  async getTopProducts(limit = 5) {
    const products = await this.readProducts();
    return products
      .filter((p) => p.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, limit)
      .map(p => ({
        ...p,
        revenue: p.sold * (p.discountPrice || p.price)
      }));
  }

  async getSalesSummary() {
    const sales = await this.readSales();
    const today = new Date().toISOString().split("T")[0];
    const completedSales = sales.filter(s => s.status === "Completada");

    return {
      todaySales: completedSales
        .filter((s) => s.date.includes(today))
        .reduce((sum, s) => sum + s.total, 0),
      todayOrders: completedSales
        .filter((s) => s.date.includes(today)).length,
      totalProducts: (await this.readProducts()).length,
      activeProducts: (await this.readProducts()).filter(
        (p) => p.status === "Activo"
      ).length,
      totalCustomers: (await this.readUsers()).length,
      pendingOrders: (await this.readSales()).filter(
        s => s.status === "Pendiente"
      ).length
    };
  }

  async getSalesByCategory() {
    const products = await this.readProducts();
    const sales = await this.readSales();
    
    const categoryMap = {};
    
    // Inicializar categorías
    products.forEach(product => {
      if (product.category && !categoryMap[product.category]) {
        categoryMap[product.category] = {
          sales: 0,
          count: 0
        };
      }
    });
    
    // Procesar ventas
    sales.forEach(sale => {
      if (sale.status === "Completada") {
        sale.products.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product && product.category) {
            if (!categoryMap[product.category]) {
              categoryMap[product.category] = {
                sales: 0,
                count: 0
              };
            }
            categoryMap[product.category].sales += item.quantity * item.unitPrice;
            categoryMap[product.category].count += item.quantity;
          }
        });
      }
    });
    
    // Convertir a array para gráficos
    const categories = Object.keys(categoryMap);
    return {
      labels: categories,
      salesData: categories.map(cat => categoryMap[cat].sales),
      countData: categories.map(cat => categoryMap[cat].count)
    };
  }
  async checkExpiredDiscounts() {
    const products = await this.readProducts();
    const now = new Date();
    let updated = false;
  
    const updatedProducts = products.map(product => {
      if (product.discountEndDate && new Date(product.discountEndDate) < now) {
        updated = true;
        return {
          ...product,
          discountPrice: null,
          discountEndDate: null
        };
      }
      return product;
    });
  
    if (updated) {
      await this.writeProducts(updatedProducts);
    }
    return updated;
  }
  /* ==================== NEWSLETTER ==================== */
async getSubscribers() {
  const subscribers = localStorage.getItem(this.newsletterKey);
  return subscribers ? JSON.parse(subscribers) : [];
}

async addSubscriber(email) {
  const subscribers = await this.getSubscribers();
  
  // Verificar si el email ya está suscrito
  if (subscribers.includes(email)) {
    throw new Error('Este correo ya está suscrito');
  }
  
  subscribers.push(email);
  localStorage.setItem(this.newsletterKey, JSON.stringify(subscribers));
  return true;
}
/* ==================== VALIDACIONES ADICIONALES ==================== */
async findUserByUsername(username) {
  const users = await this.readUsers();
  return users.find((user) => 
    user.username && username && 
    user.username.toLowerCase() === username.toLowerCase()
  );
}

async findUserByPhone(phone) {
  const users = await this.readUsers();
  return users.find((user) => user.phone && user.phone === phone);
}
}
