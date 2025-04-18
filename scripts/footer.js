import { showSuccess, showError } from './auth.js';

// Newsletter Subscription
document.addEventListener('DOMContentLoaded', function() {
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterMessage = document.getElementById('newsletterMessage');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value.trim();

            if (email==='') {
                showError('El campo de email no puede estas vacio');
                return;
            }

            if (!validateEmail(email)) {
                showError('Por favor ingresa un email válido');
                return;
            }
            
            // Mostrar mensaje de carga
            newsletterMessage.textContent = 'Suscribiendo...';
            newsletterMessage.className = 'mt-2 text-sm text-blue-400';
            
            // Simular envío al servidor
            subscribeToNewsletter(email)
                .then(() => {
                    showSuccess('¡Gracias por suscribirte! Pronto recibirás nuestras ofertas.');
                    newsletterForm.reset();
                    localStorage.setItem('subscribedToNewsletter', 'true');
                })
                .catch(error => {
                    showError('Error al suscribirse. Por favor intenta más tarde.');
                    console.error('Newsletter error:', error);
                });
        });
    }
    
    // Scroll to Top Button
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.remove('opacity-0', 'invisible');
            scrollToTopBtn.classList.add('opacity-100', 'visible');
        } else {
            scrollToTopBtn.classList.add('opacity-0', 'invisible');
            scrollToTopBtn.classList.remove('opacity-100', 'visible');
        }
    });
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Mostrar año actual
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Verificar si ya está suscrito al newsletter
    if (localStorage.getItem('subscribedToNewsletter') === 'true' && newsletterForm) {
        newsletterForm.style.display = 'none';
        newsletterMessage.textContent = '¡Ya estás suscrito a nuestro newsletter!';
        newsletterMessage.className = 'mt-2 text-sm text-green-400';
    }
});

// Función para validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Función simulada para suscripción al newsletter
function subscribeToNewsletter(email) {
    return new Promise((resolve, reject) => {
        // Simular llamada a API
        setTimeout(() => {
            // En producción, aquí harías una llamada fetch a tu backend
            const success = true; // Simular éxito
            if (success) {
                resolve();
            } else {
                reject(new Error('Error en el servidor'));
            }
        }, 1000);
    });
}