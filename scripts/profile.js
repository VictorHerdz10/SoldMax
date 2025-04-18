import { DataHandler } from "./dataHandler.js";
import { showSuccess, showError } from "./auth.js";
import { loadUserData } from "./ui.js";

const dataHandler = new DataHandler();
// En dataHandler.js o en un archivo de configuración
const cloudinaryConfig = {
  cloudName: 'dwad8nrdl',
  apiKey: '266517934682538',
  uploadPreset: 'SoldMax_Ventas',
  avatarFolder: 'user_avatars' // Nueva carpeta para avatares
};

export const profileValidations = {
  name: {
    regex: /^[A-ZÁÉÍÓÚ][a-záéíóúñ]+(\s[A-ZÁÉÍÓÚ][a-záéíóúñ]+)*$/,
    error: "Cada palabra debe comenzar con mayúscula",
    empty: "Nombre no puede estar vacío",
    maxLength: 50,
  },
  username: {
    regex: /^[A-Z][a-zA-Z0-9]{3,19}$/,
    error: "Debe comenzar con mayúscula, 4-20 caracteres alfanuméricos",
    empty: "Usuario no puede estar vacío",
    maxLength: 20,
  },
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    error: "Correo electrónico inválido",
    empty: "Email no puede estar vacío",
    maxLength: 50,
  },
  phone: {
    regex: /^[0-9]{8}$/,
    error: "Debe tener 8 dígitos numéricos",
    empty: "Teléfono no puede estar vacío",
  },
  password: {
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    error: "Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 especial",
    minLength: 8,
  },
  confirmPassword: {
    error: "Las contraseñas no coinciden"
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileSubmit);
  }

  setupProfileValidations();
});

function setupProfileValidations() {
  setupFieldValidation("profileName", profileValidations.name);
  setupFieldValidation("profileUserName", profileValidations.username);
  setupFieldValidation("profileEmail", profileValidations.email);
  setupFieldValidation("profilePhone", profileValidations.phone);
  
  // Configurar validación especial para contraseña
  const passwordInput = document.getElementById("profilePassword");
  if (passwordInput) {
    passwordInput.addEventListener("input", function() {
      const value = this.value.trim();
      
      if (value === "") {
        clearError("profilePassword");
        document.getElementById("passwordRequirements")?.classList.add("hidden");
        return;
      }

      validatePasswordRequirements(value);
      
      if (!value.match(profileValidations.password.regex)) {
        showProfileError("profilePassword", profileValidations.password.error);
      } else {
        clearError("profilePassword");
      }
      
      // Validar también confirmación de contraseña si hay valor
      const confirmPassword = document.getElementById("profileConfirmPassword").value;
      if (confirmPassword) {
        validatePasswordMatch();
      }
    });
  }
  
  // Validación especial para confirmar contraseña
  document.getElementById("profileConfirmPassword")?.addEventListener("input", validatePasswordMatch);
}

function setupFieldValidation(fieldId, validation) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  input.addEventListener("input", function() {
    const value = this.value.trim();
    
    if (value === "") {
      if (validation.empty) {
        showProfileError(fieldId, validation.empty);
      } else {
        clearError(fieldId);
      }
      return;
    }

    if (validation.maxLength && value.length > validation.maxLength) {
      this.value = value.substring(0, validation.maxLength);
      return;
    }

    if (validation.regex && !value.match(validation.regex)) {
      showProfileError(fieldId, validation.error);
    } else {
      clearError(fieldId);
    }

    // Actualizar contador si existe
    if (validation.maxLength) {
      updateCharacterCounter(fieldId, value.length, validation.maxLength);
    }
  });
}

function updateCharacterCounter(fieldId, currentLength, maxLength) {
  const counter = document.getElementById(`${fieldId}Counter`);
  if (!counter) return;
  
  const remaining = maxLength - currentLength;
  counter.textContent = `${remaining} caracteres restantes`;
  counter.classList.toggle("text-red-500", remaining < 0);
}

function validatePasswordMatch() {
  const password = document.getElementById("profilePassword").value;
  const confirmPassword = document.getElementById("profileConfirmPassword").value;

  if (password && confirmPassword && password !== confirmPassword) {
    showProfileError("profileConfirmPassword", profileValidations.confirmPassword.error);
    return false;
  } else {
    clearError("profileConfirmPassword");
    return true;
  }
}

function validatePasswordRequirements(password) {
  const requirements = document.getElementById("passwordRequirements");
  if (!requirements) return;

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);

  requirements.classList.toggle("hidden", password.length === 0);

  // Actualizar cada requisito
  document.getElementById("passwordReq1")?.classList.toggle("text-red-500", !hasLength);
  document.getElementById("passwordReq1")?.classList.toggle("text-green-500", hasLength);
  document.getElementById("passwordReq2")?.classList.toggle("text-red-500", !hasUpper);
  document.getElementById("passwordReq2")?.classList.toggle("text-green-500", hasUpper);
  document.getElementById("passwordReq3")?.classList.toggle("text-red-500", !hasLower);
  document.getElementById("passwordReq3")?.classList.toggle("text-green-500", hasLower);
  document.getElementById("passwordReq4")?.classList.toggle("text-red-500", !hasNumber);
  document.getElementById("passwordReq4")?.classList.toggle("text-green-500", hasNumber);
  document.getElementById("passwordReq5")?.classList.toggle("text-red-500", !hasSpecial);
  document.getElementById("passwordReq5")?.classList.toggle("text-green-500", hasSpecial);
}

export function openProfileModal() {
  const session = dataHandler.getSession();
  if (!session) return;

  const form = document.getElementById("profileForm");
  if (!form) return;

  form.reset();

  // Limpiar errores
  clearError("profileName");
  clearError("profileUserName");
  clearError("profileEmail");
  clearError("profilePhone");
  clearError("profilePassword");
  clearError("profileConfirmPassword");

  // Ocultar requisitos de contraseña
  document.getElementById("passwordRequirements")?.classList.add("hidden");

  // Cargar datos actuales
  dataHandler.readUsers().then(users => {
    const user = users.find(u => u.id === session.user.id);
    if (user) {
      document.getElementById("profileName").value = user.name;
      document.getElementById("profileUserName").value = user.username;
      document.getElementById("profileEmail").value = user.email;
      document.getElementById("profilePhone").value = user.phone || "";
      
      // Actualizar contadores
      updateCharacterCounter("profileName", user.name?.length || 0, profileValidations.name.maxLength);
      updateCharacterCounter("profileUserName", user.username?.length || 0, profileValidations.username.maxLength);
    }
  });

  document.getElementById("profileModal").classList.remove("hidden");
}

export function closeProfileModal() {
  document.getElementById("profileModal").classList.add("hidden");
}

function updateAsterisk(fieldId, isValid) {
  const asterisk = document.querySelector(`label[for="${fieldId}"] span`);
  if (asterisk) {
    asterisk.classList.toggle("text-red-500", !isValid);
    asterisk.classList.toggle("text-black", isValid);
  }
}

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

function showProfileError(fieldId, message) {
  const errorElement = document.getElementById(`${fieldId}Error`);
  const inputElement = document.getElementById(fieldId);

  if (!errorElement || !inputElement) return;

  errorElement.textContent = message;
  errorElement.classList.remove("hidden");
  inputElement.classList.add("input-error");
  inputElement.classList.remove("input-success");
  
  updateAsterisk(fieldId, false);
}

export async function handleProfileSubmit(e) {
  e.preventDefault();

  const session = dataHandler.getSession();
  if (!session) return;

  const profileData = {
    name: document.getElementById("profileName").value.trim(),
    username: document.getElementById("profileUserName").value.trim(),
    email: document.getElementById("profileEmail").value.trim(),
    phone: document.getElementById("profilePhone").value.trim(),
    password: document.getElementById("profilePassword").value,
    confirmPassword: document.getElementById("profileConfirmPassword").value
  };

  // Validaciones
  if (!validateProfileForm(profileData)) return;

  try {
    const users = await dataHandler.readUsers();
    const userIndex = users.findIndex(u => u.id === session.user.id);
    console.log(userIndex)
    
    if (userIndex !== -1) {
      const updatedUser = {
        ...users[userIndex],
        name: profileData.name,
        username: profileData.username,
        email: profileData.email,
        phone: profileData.phone
      };

      if (profileData.password) {
        updatedUser.password = profileData.password;
      }

      // Verificar si el email ya existe en otro usuario
      const emailExists = users.some((u, index) => 
        index !== userIndex && u.email === profileData.email
      );
      
      if (emailExists) {
        showProfileError("profileEmail", "Este email ya está registrado");
        return;
      }

      // Verificar si el nombre de usuario ya existe en otro usuario
      const usernameExists = users.some((u, index) => 
        index !== userIndex && u.username === profileData.username
      );
      
      if (usernameExists) {
        showProfileError("profileUserName", "Este nombre de usuario ya está en uso");
        return;
      }

      users[userIndex] = updatedUser;
      await dataHandler.writeUsers(users);

      // Actualizar sesión
      session.user.name = profileData.name;
      session.user.username = profileData.username;
      session.user.email = profileData.email;
      localStorage.setItem(dataHandler.sessionKey, JSON.stringify(session));

      // Actualizar nombre en la UI
      const userNameElement = document.getElementById("userName");
      if (userNameElement) {
        userNameElement.textContent = profileData.name;
      }
     if(session.user.role ==='admin'){
      await window.loadAdminData();
    }else{
      loadUserData();
    }
      closeProfileModal();
      showSuccess("Perfil actualizado correctamente");
    }
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    showProfileError("profileEmail", "Error al actualizar el perfil");
  }
}

function validateProfileForm(profileData) {
  let isValid = true;

  if (!profileData.name) {
    showProfileError("profileName", profileValidations.name.empty);
    isValid = false;
  } else if (!profileData.name.match(profileValidations.name.regex)) {
    showProfileError("profileName", profileValidations.name.error);
    isValid = false;
  }

  if (!profileData.username) {
    showProfileError("profileUserName", profileValidations.username.empty);
    isValid = false;
  } else if (!profileData.username.match(profileValidations.username.regex)) {
    showProfileError("profileUserName", profileValidations.username.error);
    isValid = false;
  }

  if (!profileData.email) {
    showProfileError("profileEmail", profileValidations.email.empty);
    isValid = false;
  } else if (!profileData.email.match(profileValidations.email.regex)) {
    showProfileError("profileEmail", profileValidations.email.error);
    isValid = false;
  }

  if (!profileData.phone) {
    showProfileError("profilePhone", profileValidations.phone.empty);
    isValid = false;
  } else if (!profileData.phone.match(profileValidations.phone.regex)) {
    showProfileError("profilePhone", profileValidations.phone.error);
    isValid = false;
  }

  if (profileData.password) {
    if (!profileData.password.match(profileValidations.password.regex)) {
      showProfileError("profilePassword", profileValidations.password.error);
      isValid = false;
    }
    
    if (!validatePasswordMatch()) {
      isValid = false;
    }
  }

  return isValid;
}
// profile.js o en tu archivo principal
export async function setupProfileAvatar() {
  // Elementos del DOM
  const avatarIcon = document.getElementById('profileAvatar');
  const avatarContainer = document.querySelector('.relative.mb-4');
  const avatarUploadBtn = avatarContainer.querySelector('button');
  const avatarImage = document.createElement('img');
  avatarImage.className = 'w-full h-full object-cover';
  avatarImage.style.display = 'none';
  
  // Insertar la imagen dentro del contenedor
  const avatarWrapper = avatarContainer.querySelector('div');
  avatarWrapper.insertBefore(avatarImage, avatarWrapper.firstChild);

  // Obtener el usuario actual
  const session = dataHandler.getSession();
  if (!session) return;

  // Cargar avatar existente si hay uno
  const users = await dataHandler.readUsers();
  const currentUser = users.find(u => u.id === session.user.id);
  
  if (currentUser?.avatar) {
    avatarImage.src = currentUser.avatar;
    avatarImage.style.display = 'block';
    avatarIcon.style.display = 'none';
    
    // Actualizar también el avatar en el header
    const headerAvatar = document.querySelector('#userMenuBtn i');
    if (headerAvatar) {
      headerAvatar.style.display = 'none';
      const headerImg = document.createElement('img');
      headerImg.src = currentUser.avatar;
      headerImg.className = 'w-8 h-8 rounded-full object-cover';
      headerAvatar.parentNode.insertBefore(headerImg, headerAvatar);
    }
  }

  // Configurar el evento de clic para subir imagen
  avatarUploadBtn.addEventListener('click', async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Validar el archivo
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        showError('Formato de imagen no válido. Use JPG, PNG, GIF o WEBP.');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        showError('La imagen no debe exceder 2MB de tamaño.');
        return;
      }
      
      try {
        // Mostrar previsualización
        const reader = new FileReader();
        reader.onload = (event) => {
          avatarImage.src = event.target.result;
          avatarImage.style.display = 'block';
          avatarIcon.style.display = 'none';
        };
        reader.readAsDataURL(file);
        
        // Subir a Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);
        formData.append('cloud_name', cloudinaryConfig.cloudName);
        formData.append('folder', cloudinaryConfig.avatarFolder);
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) throw new Error('Error al subir la imagen');
        
        const data = await response.json();
        const optimizedUrl = data.secure_url.replace('/upload/', '/upload/w_200,h_200,c_fill,g_face,r_max/');
        
        // Actualizar el usuario con el nuevo avatar
        const updatedUsers = users.map(u => {
          if (u.id === session.user.id) {
            return { ...u, avatar: optimizedUrl };
          }
          return u;
        });
        
        await dataHandler.writeUsers(updatedUsers);
        
        // Actualizar el header
        const headerAvatar = document.querySelector('#userMenuBtn i');
        if (headerAvatar) {
          const headerImg = headerAvatar.nextElementSibling?.tagName === 'IMG' 
            ? headerAvatar.nextElementSibling 
            : document.createElement('img');
          
          headerImg.src = optimizedUrl;
          headerImg.className = 'w-8 h-8 rounded-full object-cover';
          
          if (!headerAvatar.nextElementSibling?.tagName === 'IMG') {
            headerAvatar.style.display = 'none';
            headerAvatar.parentNode.insertBefore(headerImg, headerAvatar);
          }
        }
        
        showSuccess('Avatar actualizado correctamente');
        await updateHeaderAvatar();

      } catch (error) {
        console.error('Error al subir avatar:', error);
        showError('Error al actualizar el avatar');
      }
    };
    
    input.click();
  });
}


export async function updateHeaderAvatar() {
  const session = dataHandler.getSession();
  if (!session) return;

  const users = await dataHandler.readUsers();
  const currentUser = users.find(u => u.id === session.user.id);
  const headerAvatar = document.querySelector('#userMenuBtn i');

  if (!headerAvatar) return;

  if (currentUser?.avatar) {
    // Si ya hay una imagen, actualizarla
    const existingImg = headerAvatar.nextElementSibling?.tagName === 'IMG' 
      ? headerAvatar.nextElementSibling 
      : null;
    
    if (existingImg) {
      existingImg.src = currentUser.avatar;
    } else {
      // Crear nueva imagen
      headerAvatar.style.display = 'none';
      const headerImg = document.createElement('img');
      headerImg.src = currentUser.avatar;
      headerImg.className = 'w-8 h-8 rounded-full object-cover';
      headerAvatar.parentNode.insertBefore(headerImg, headerAvatar);
    }
  } else {
    // Si no hay avatar, mostrar el icono por defecto
    headerAvatar.style.display = 'inline-block';
    const existingImg = headerAvatar.nextElementSibling?.tagName === 'IMG' 
      ? headerAvatar.nextElementSibling 
      : null;
    
    if (existingImg) {
      existingImg.remove();
    }
  }
}


// Exportar para acceso global
window.profileModule = {
  openProfileModal,
  closeProfileModal,
  handleProfileSubmit,
  setupProfileAvatar,
  updateHeaderAvatar
};