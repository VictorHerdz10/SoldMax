const validations = {
    name: {
      regex: /^[A-ZÁÉÍÓÚ][a-záéíóúñ]+(\s[A-ZÁÉÍÓÚ][a-záéíóúñ]+)*$/,
      error: "Cada palabra debe comenzar con mayúscula",
      empty: "Nombre no puede estar vacío",
    },
    username: {
      regex: /^[A-Z][a-zA-Z0-9]{3,}$/,
      error: "Debe comenzar con mayúscula y mínimo 4 caracteres",
      empty: "Usuario no puede estar vacío",
    },
    email: {
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      error: "Correo electrónico inválido",
      empty: "Email no puede estar vacío",
    },
    phone: {
      regex: /^[0-9]{8}$/,
      error: "Debe tener 8 dígitos numéricos",
      empty: "Teléfono no puede estar vacío",
    },
    password: {
      regex:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      error: "No cumple con los requisitos",
      empty: "Contraseña no puede estar vacía",
    },
    confirmPassword: {
      error: "Las contraseñas no coinciden",
      empty: "Confirma tu contraseña",
    },
    passwordLogin: {
      empty: "Contraseña no puede estar vacía",
    },
    userAcount:{
      empty: "Este campo no puede estar vacio", 
    },
    terms: {
      error: "Debes aceptar los términos y condiciones",
      empty: "Debes aceptar los términos y condiciones"
  }
  };
  export let error=false;
  
  // Función para actualizar asteriscos
  function updateAsterisk(field, isValid) {
    const asterisk = document.getElementById(`${field}Asterisk`);
    if (asterisk) {
      asterisk.classList.toggle("text-red-500", !isValid);
      asterisk.classList.toggle("asterisk-valid", isValid);
    }
  }
  
  // Función para validar campos
  function validateField(field, value, formData = {}) {
    const input = document.getElementById(field);
    const errorElement = document.getElementById(`${field}Error`);
  
    // Limpiar errores previos
    input?.classList?.remove("input-error", "input-success");
    errorElement?.classList?.add("hidden");
  
    // Caso especial para el checkbox de términos
    if (field === 'terms') {
      const isValid = input?.checked || false;
      input?.classList?.toggle("input-error", !isValid);
      input?.classList?.toggle("input-success", isValid);
      errorElement?.classList?.toggle("hidden", isValid);
      errorElement.textContent = isValid ? "" : validations.terms.error;
      updateAsterisk(field, isValid);
      return isValid;
    }
  
    // Validar campo vacío para otros tipos de inputs
    if (input && (value === "" || value === null || value === undefined)) {
      errorElement.textContent = validations[field].empty;
      input.classList.add("input-error");
      errorElement.classList.remove("hidden");
      updateAsterisk(field, false);
      return false;
    }
  
    // Validación especial para confirmar contraseña
    if (field === "confirmPassword") {
      const password = document.getElementById("password")?.value;
      if (value !== password) {
        errorElement.textContent = validations.confirmPassword.error;
        input.classList.add("input-error");
        errorElement.classList.remove("hidden");
        updateAsterisk(field, false);
        return false;
      }
    }
  
    // Validar regex para otros campos
    if (validations[field].regex && !validations[field].regex.test(value)) {
      errorElement.textContent = validations[field].error;
      input.classList.add("input-error");
      errorElement.classList.remove("hidden");
      updateAsterisk(field, false);
      return false;
    }
  
    // Si pasa todas las validaciones
    input.classList.add("input-success");
    errorElement.classList.add("hidden");
    updateAsterisk(field, true);
    return true;
  }
  
  // Validar requisitos de contraseña
  function validatePasswordRequirements(password) {
    const requirements = document.getElementById("passwordRequirements");
    const req1 = document.getElementById("passwordReq1");
    const req2 = document.getElementById("passwordReq2");
    const req3 = document.getElementById("passwordReq3");
    const req4 = document.getElementById("passwordReq4");
    const req5 = document.getElementById("passwordReq5");
  
    const hasLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
  
    const allValid = hasLength && hasUpper && hasNumber && hasSpecial && hasLower;
    requirements.classList.toggle("hidden", allValid);
  
    req1.classList.toggle("text-red-500", !hasLength);
    req1.classList.toggle("text-green-500", hasLength);
    req2.classList.toggle("text-red-500", !hasUpper);
    req2.classList.toggle("text-green-500", hasUpper);
    req3.classList.toggle("text-red-500", !hasNumber);
    req3.classList.toggle("text-green-500", hasNumber);
    req4.classList.toggle("text-red-500", !hasSpecial);
    req4.classList.toggle("text-green-500", hasSpecial);
    req5.classList.toggle("text-red-500", !hasLower);
    req5.classList.toggle("text-green-500", hasLower);
  }
  
  // Actualizar contador de caracteres
  function updateCharacterCounter(field) {
    const input = document.getElementById(field);
    const counter = document.getElementById(`${field}Counter`);
    if (input && counter && input.dataset.counter) {
      const max = parseInt(input.dataset.counter);
      const remaining = max - input.value.length;
      counter.textContent = `${remaining} caracteres restantes`;
      counter.classList.toggle("text-red-500", remaining < 0);
    }
  }
  
  // Inicializar contadores y eventos
  document.addEventListener("DOMContentLoaded", () => {
    // Validación en tiempo real
    Object.keys(validations).forEach((field) => {
      const input = document.getElementById(field);
      if (input) {
        // Limitar caracteres según maxlength
        input.addEventListener("input", function () {
          if (input.maxLength > 0 && input.value.length > input.maxLength) {
            input.value = input.value.slice(0, input.maxLength);
          }
  
          // Actualizar contador
          if (input.dataset.counter) {
            updateCharacterCounter(field);
          }
  
          // Validar campo
          const formData = {
            password: document.getElementById("password")?.value,
          };
          validateField(field, input.value, formData);
  
          // Validación especial para contraseña
          if (field === "password") {
            validatePasswordRequirements(input.value);
            // Validar también confirmPassword si existe
            const confirmPassword = document.getElementById("confirmPassword");
            if (confirmPassword && confirmPassword.value) {
              validateField("confirmPassword", confirmPassword.value, formData);
            }
          }
        });
  
        // Validar al perder foco
        input.addEventListener("blur", function () {
          const formData = {
            password: document.getElementById("password")?.value,
          };
          validateField(field, input.value, formData);
        });
      }
    });
  
    // Validación de mayúsculas en nombre mientras se escribe
    document.getElementById("name")?.addEventListener("input", function (e) {
      const cursorPos = e.target.selectionStart;
      const words = e.target.value.split(" ");
      const newWords = words.map((word) => {
        if (word.length > 0) {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word;
      });
      e.target.value = newWords.join(" ");
      e.target.setSelectionRange(cursorPos, cursorPos);
      validateField("name", e.target.value);
      updateCharacterCounter("name");
    });
  
    // Manejar envío del formulario
    document.getElementById("registerForm")?.addEventListener("submit", function(e) {
      e.preventDefault();
      e.stopPropagation();
      let isValid = true;
      const formData = {
          password: document.getElementById("password")?.value,
      };
  
      // Validar todos los campos incluyendo términos
      Object.keys(validations).forEach((field) => {
          const input = document.getElementById(field);
          if (input) {
              let value;
              if (input.type === 'checkbox') {
                  value = input.checked;
              } else {
                  value = input.value;
              }
              
              if (!validateField(field, value, formData)) {
                  isValid = false;
                  error = true;
              }
          }
      });
  
      if (!isValid) {
          error = true;
          return; // Detener el proceso si hay errores
      } else {
          error = false;
          // Disparar un evento personalizado para que auth.js maneje el envío
          const event = new CustomEvent('validFormSubmit', { detail: formData });
          document.dispatchEvent(event);
      }
  });
  });
  