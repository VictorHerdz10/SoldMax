import { DataHandler } from './dataHandler.js';
import { error } from './validations.js';
const dataHandler = new DataHandler();

export function logout() {
    const dataHandler = new DataHandler();
    dataHandler.clearSession();
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  await dataHandler.initialize();
  
  // Esperar a que el DOM esté completamente cargado
  setTimeout(() => {
      checkRememberedUser();
  }, 100);
  
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
  }
  
  if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
  }
});

async function handleLogin(e) {
  e.preventDefault();
  const userAcount = document.getElementById('userAcount').value;
  const password = document.getElementById('passwordLogin').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  
  if (!userAcount || !password) {
      showError('Ambos campos son requeridos');
      return;
  }
  
  try {
      let message = await dataHandler.verifyAcount(userAcount);
      if (typeof message === 'string') {
          showError(message);
          return;
      }

      const user = await dataHandler.verifyUser(message.email, password);
      if(!user){
          showError('La contraseña es incorrecta');
          return;
      }
      
      dataHandler.setSession(user);
      
      // Guardar credenciales si "Recuérdame" está marcado (SOLO PARA PRUEBAS)
      if (rememberMe) {
          localStorage.setItem('rememberedCredentials', JSON.stringify({
              userAcount: userAcount,
              password: password // Solo para pruebas, no usar en producción
          }));
      } else {
          localStorage.removeItem('rememberedCredentials');
      }
      
      if (user.role === 'admin') {
          window.location.href = 'admin.html';
      } else {
          window.location.href = 'userprincipal.html';
      }
  } catch (error) {
      showError('Error al iniciar sesión');
      console.error('Login error:', error);
  }
}

// Añade esta función para verificar credenciales guardadas al cargar la página
function checkRememberedUser() {
  const rememberedCredentials = localStorage.getItem('rememberedCredentials');
  if (rememberedCredentials) {
      try {
          const credentials = JSON.parse(rememberedCredentials);
          const userAcountInput = document.getElementById('userAcount');
          const passwordInput = document.getElementById('passwordLogin');
          const rememberCheckbox = document.getElementById('rememberMe');
          
          if (userAcountInput) userAcountInput.value = credentials.userAcount || '';
          if (passwordInput) passwordInput.value = credentials.password || '';
          if (rememberCheckbox) rememberCheckbox.checked = true;
      } catch (e) {
          console.error('Error al parsear rememberedCredentials:', e);
          localStorage.removeItem('rememberedCredentials');
      }
  }
}

async function handleRegister(e) {
    e.preventDefault();
    if(error){
        return;
    } 
    const formData = {
        name: document.getElementById('name').value,
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        password: document.getElementById('password').value
    };
    
    try {
          // Verificar si el email ya está registrado
      const emailExists = await dataHandler.findUserByEmail(formData.email);
      if (emailExists) {
          showError('El email ya está registrado');
          return;
      }
      
      // Verificar si el username ya existe
      const usernameExists = await dataHandler.findUserByUsername(formData.username);
      if (usernameExists) {
          showError('El nombre de usuario ya está en uso');
          return;
      }
      
      // Verificar si el teléfono ya existe
      const phoneExists = await dataHandler.findUserByPhone(formData.phone);
      if (phoneExists) {
          showError('El número de teléfono ya está registrado');
          return;
      }
      
      // Crear el usuario
      const created = await dataHandler.createUser(formData);
      if (created) {
          showSuccess('¡Registro completado con éxito!');
          // Redirigir después de 2 segundos para que se vea el mensaje
          setTimeout(() => {
              window.location.href = '/pages/login.html';
          }, 2000);
      }
    } catch (error) {
        showError('Error en el registro');
        console.error('Registration error:', error);
    }
}
  
// Función para mostrar mensajes de éxito
export function showSuccess(message) {
    const existingToast = document.querySelector('.toast-message.success');
    if (existingToast) existingToast.remove();
  
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-16 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-lg shadow-lg toast-message success animate-slide-in';
    successDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-check-circle mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(successDiv);
    setTimeout(() => {
      successDiv.classList.replace('animate-slide-in', 'animate-slide-out');
      setTimeout(() => successDiv.remove(), 800);
    }, 5000);
}
  
// Función para mostrar mensajes de información
export function showInfo(message) {
    const existingToast = document.querySelector('.toast-message.info');
    if (existingToast) existingToast.remove();
  
    const infoDiv = document.createElement('div');
    infoDiv.className = 'fixed top-16 right-4 z-50 bg-blue-100 border border-blue-400 text-blue-700 px-6 py-3 rounded-lg shadow-lg toast-message info animate-slide-in';
    infoDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-info-circle mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(infoDiv);
    setTimeout(() => {
      infoDiv.classList.replace('animate-slide-in', 'animate-slide-out');
      setTimeout(() => infoDiv.remove(), 800);
    }, 5000);
}
  
// Función para mostrar mensajes de error
export function showError(message) {
    const existingToast = document.querySelector('.toast-message.error');
    if (existingToast) existingToast.remove();
  
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-16 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg shadow-lg toast-message error animate-slide-in';
    errorDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    setTimeout(() => {
      errorDiv.classList.replace('animate-slide-in', 'animate-slide-out');
      setTimeout(() => errorDiv.remove(), 800);
    }, 5000);
}