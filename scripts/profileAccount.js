import { DataHandler } from "./dataHandler.js";
import { showSuccess, showError } from "./auth.js";

const dataHandler = new DataHandler();

export function setupProfileModal() {
  // Configurar evento para abrir el modal de perfil
  document.getElementById("viewProfileBtn")?.addEventListener("click", () => {
    loadProfile();
    userModal.classList.add("hidden");

    document.getElementById("profileModalInfo").classList.remove("hidden");
  });

  // Configurar evento para cerrar el modal
  document
    .getElementById("closeProfileModal")
    ?.addEventListener("click", () => {
      document.getElementById("profileModalInfo").classList.add("hidden");
    });

  // Configurar botón de editar perfil
  document.getElementById("editProfileBtn")?.addEventListener("click", () => {
    if (window.profileModule) {
      window.profileModule.openProfileModal();
    }
  });
}

export function loadProfile() {
  const session = dataHandler.getSession();
  if (!session) return;

  // Obtener datos completos del usuario
  dataHandler
    .readUsers()
    .then((users) => {
      const user = users.find((u) => u.id === session.user.id);
      if (!user) return;

      // Actualizar la UI del modal de perfil
      updateProfileUI(user);
    })
    .catch((error) => {
      console.error("Error al cargar perfil:", error);
      showError("Error al cargar la información del perfil");
    });
}

function updateProfileUI(user) {
  // Actualizar avatar
  const avatar = document.getElementById("profileAvatar");
  if (user.avatar) {
    avatar.className = "";
    avatar.style.backgroundImage = `url(${user.avatar})`;
    avatar.style.backgroundSize = "cover";
    avatar.style.backgroundPosition = "center";
  } else {
    avatar.className = "fas fa-user-circle text-6xl text-gray-400";
    avatar.style.backgroundImage = "";
  }

  // Actualizar información básica
  document.getElementById("profileNameDisplay").textContent =
    user.name || "Usuario";
  document.getElementById("profileUsernameDisplay").textContent = `@${
    user.username || "usuario"
  }`;

  // Actualizar información detallada
  document.getElementById("profileFullName").textContent =
    user.name || "No especificado";
  document.getElementById("profileEmailDetails").textContent =
    user.email || "No especificado";
  document.getElementById("profilePhoneDetails").textContent =
    user.phone || "No especificado";
  document.getElementById("profileAddress").textContent =
    user.address || "No especificada";
}

// Agregar animaciones al hero
export function setupHeroAnimations() {
  const style = document.createElement("style");
  style.textContent = `
        @keyframes truckMovement {
            0% { transform: translateX(-100px) translateY(0); }
            30% { transform: translateX(50px) translateY(0); }
            40% { transform: translateX(50px) translateY(-5px); }
            50% { transform: translateX(50px) translateY(0); }
            100% { transform: translateX(200px) translateY(0); }
        }
        
        @keyframes packageDrop1 {
            0%, 25% { transform: translateY(0); opacity: 0; }
            30% { transform: translateY(0); opacity: 1; }
            40% { transform: translateY(40px); opacity: 1; }
            50% { transform: translateY(40px); opacity: 0; }
            100% { transform: translateY(40px); opacity: 0; }
        }
        
        @keyframes packageDrop2 {
            0%, 35% { transform: translateY(0); opacity: 0; }
            40% { transform: translateY(0); opacity: 1; }
            50% { transform: translateY(40px); opacity: 1; }
            60% { transform: translateY(40px); opacity: 0; }
            100% { transform: translateY(40px); opacity: 0; }
        }
        
        @keyframes packageDrop3 {
            0%, 45% { transform: translateY(0); opacity: 0; }
            50% { transform: translateY(0); opacity: 1; }
            60% { transform: translateY(40px); opacity: 1; }
            70% { transform: translateY(40px); opacity: 0; }
            100% { transform: translateY(40px); opacity: 0; }
        }
        
        .animate-truck {
            animation: truckMovement 8s infinite ease-in-out;
        }
        
        .animate-package-1 {
            animation: packageDrop1 8s infinite;
        }
        
        .animate-package-2 {
            animation: packageDrop2 8s infinite;
        }
        
        .animate-package-3 {
            animation: packageDrop3 8s infinite;
        }
    `;
  document.head.appendChild(style);
}
