import { DataHandler } from "./dataHandler.js";
import { setupMobileMenu } from './mobileMenu.js';
import { setupActiveSectionHighlight } from './navigation.js';

const dataHandler = new DataHandler();

export function loadUserData() {
    const session = dataHandler.getSession();
    if (session) {
        document.getElementById('userName').textContent = session.user.name;
        document.getElementById('welcomeName').textContent = `Bienvenido, ${session.user.name}`;
    }
}

export function setupUI() {
    // Configurar año actual en el footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Cargar datos del usuario
    loadUserData();
    
    // Configurar menú móvil
    setupMobileMenu();
    
    // Configurar eventos de scroll para resaltar sección activa
    setupActiveSectionHighlight();
}