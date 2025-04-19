import { showSuccess, showError } from './auth.js';
import { DataHandler } from './dataHandler.js';

// Newsletter Subscription
document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterMessage = document.getElementById('newsletterMessage');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const emailInput = document.getElementById('newsletterEmail');
            const email = emailInput.value.trim();
            const submitBtn = newsletterForm.querySelector('button[type="submit"]');
            
            // Validaciones
            if (email === '') {
                showError('El campo de email no puede estar vacío', newsletterMessage);
                emailInput.focus();
                return;
            }

            if (!validateEmail(email)) {
                showError('Por favor ingresa un email válido', newsletterMessage);
                emailInput.focus();
                return;
            }
            
            // Deshabilitar el botón y mostrar animación moderna
            submitBtn.disabled = true;
            newsletterMessage.innerHTML = `
                <div class="flex flex-col items-center justify-center" id="loadingAnimation">
                    <div class="relative w-12 h-12 mb-2">
                        <div class="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <div class="absolute inset-1 border-4 border-blue-300 border-b-transparent rounded-full animate-spin-reverse"></div>
                    </div>
                    <span class="text-blue-600 font-medium">Procesando suscripción...</span>
                </div>
            `;
            newsletterMessage.className = 'mt-2';
            
            try {
                // Mostrar spinner por al menos 500ms (para feedback visual)
                const minLoadingTime = new Promise(resolve => setTimeout(resolve, 500));
                const subscriptionPromise = subscribeToNewsletter(email);
                
                await Promise.all([minLoadingTime, subscriptionPromise]);
                
                // Ocultar spinner antes de mostrar éxito
                newsletterMessage.innerHTML = '';
                showSuccess('¡Gracias por suscribirte! Pronto recibirás nuestras ofertas.', newsletterMessage);
                newsletterForm.reset();
            } catch (error) {
                // Ocultar spinner antes de mostrar error
                newsletterMessage.innerHTML = '';
                
                if (error.message === 'Este correo ya está suscrito') {
                    showError('Este correo ya está suscrito a nuestro newsletter.', newsletterMessage);
                } else {
                    showError('Error al suscribirse. Por favor intenta más tarde.', newsletterMessage);
                    console.error('Newsletter error:', error);
                }
            } finally {
                // Restaurar el botón
                submitBtn.disabled = false;
            }
        });
    }
    
    // Scroll to Top Button (mejorado con animación)
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    
    if (scrollToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
                scrollToTopBtn.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
            } else {
                scrollToTopBtn.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
                scrollToTopBtn.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
            }
        });
        
        scrollToTopBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Mostrar año actual
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

// Función para validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Función para suscripción al newsletter
async function subscribeToNewsletter(email) {
    const dataHandler = new DataHandler();
    
    try {
        await dataHandler.addSubscriber(email);
        return true;
    } catch (error) {
        throw error;
    }
}