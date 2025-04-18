import { showSuccess, showError } from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    const stars = document.querySelectorAll('#ratingStars i');
    const ratingInput = document.getElementById('rating');
    const testimonialForm = document.getElementById('testimonialForm');
    const errorElements = {
        name: document.getElementById('nameError'),
        email: document.getElementById('emailError'),
        rating: document.getElementById('ratingError'),
        message: document.getElementById('messageError')
    };

    // Resetear mensajes de error
    function resetErrors() {
        Object.values(errorElements).forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
    }

    // Mostrar error específico
    function showFieldError(field, message) {
        errorElements[field].textContent = message;
        errorElements[field].classList.add('show');
        
        // Resaltar campo con error
        const input = document.getElementById(field);
        if (input) {
            input.classList.add('border-red-500');
            input.classList.remove('border-gray-300');
            
            // Scroll al primer error
            if (document.querySelector('.form-error.show') === errorElements[field]) {
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // Manejar clic en estrellas con animación
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            ratingInput.value = rating;
            
            // Animación de las estrellas
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas', 'text-yellow-400');
                    // Animación de rebote
                    s.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        s.style.transform = 'scale(1)';
                    }, 200);
                } else {
                    s.classList.remove('fas', 'text-yellow-400');
                    s.classList.add('far', 'text-gray-400');
                }
            });
            
            // Limpiar error de rating si existe
            if (errorElements.rating.classList.contains('show')) {
                errorElements.rating.classList.remove('show');
                errorElements.rating.textContent = '';
            }
        });
        
        // Efecto hover mejorado
        star.addEventListener('mouseover', function() {
            const hoverRating = parseInt(this.getAttribute('data-rating'));
            
            stars.forEach((s, index) => {
                if (index < hoverRating) {
                    s.classList.add('text-yellow-300');
                    s.style.transform = 'scale(1.1)';
                }
            });
        });
        
        star.addEventListener('mouseout', function() {
            const currentRating = parseInt(ratingInput.value);
            
            stars.forEach((s, index) => {
                s.classList.remove('text-yellow-300');
                s.style.transform = 'scale(1)';
                
                // Restaurar estrellas seleccionadas
                if (index >= currentRating) {
                    s.classList.remove('fas', 'text-yellow-400');
                    s.classList.add('far', 'text-gray-400');
                }
            });
        });
    });
    
    // Validación en tiempo real
    document.getElementById('name').addEventListener('input', function() {
        if (this.value.trim().length > 0) {
            this.classList.remove('border-red-500');
            this.classList.add('border-gray-300');
            errorElements.name.classList.remove('show');
        }
    });
    
    document.getElementById('email').addEventListener('input', function() {
        if (validateEmail(this.value.trim())) {
            this.classList.remove('border-red-500');
            this.classList.add('border-gray-300');
            errorElements.email.classList.remove('show');
        }
    });
    
    document.getElementById('message').addEventListener('input', function() {
        if (this.value.trim().length >= 10) {
            this.classList.remove('border-red-500');
            this.classList.add('border-gray-300');
            errorElements.message.classList.remove('show');
        }
    });
    
    // Validación del formulario
    if (testimonialForm) {
        testimonialForm.addEventListener('submit', function(e) {
            e.preventDefault();
            resetErrors();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const rating = ratingInput.value;
            const message = document.getElementById('message').value.trim();
            
            let isValid = true;
            
            // Validar nombre
            if (!name) {
                showFieldError('name', 'Por favor ingresa tu nombre');
                isValid = false;
            } else if (name.length < 3) {
                showFieldError('name', 'El nombre debe tener al menos 3 caracteres');
                isValid = false;
            }
            
            // Validar email
            if (!email) {
                showFieldError('email', 'Por favor ingresa tu email');
                isValid = false;
            } else if (!validateEmail(email)) {
                showFieldError('email', 'Por favor ingresa un email válido');
                isValid = false;
            }
            
            // Validar rating
            if (rating === '0') {
                showFieldError('rating', 'Por favor selecciona una calificación');
                isValid = false;
            }
            
            // Validar mensaje
            if (!message) {
                showFieldError('message', 'Por favor escribe tu testimonio');
                isValid = false;
            } else if (message.length < 10) {
                showFieldError('message', 'El testimonio debe tener al menos 10 caracteres');
                isValid = false;
            }
            
            if (!isValid) return;
            
            // Simular envío a servidor
            submitTestimonial({ name, email, rating, message })
                .then(() => {
                    showSuccess('¡Gracias por tu testimonio! Será revisado antes de publicarse.');
                    testimonialForm.reset();
                    resetStars();
                })
                .catch(error => {
                    showError('Error al enviar el testimonio. Por favor intenta más tarde.');
                    console.error('Testimonial error:', error);
                });
        });
    }
    
    // Función para validar email
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Función simulada para enviar testimonio
    function submitTestimonial(data) {
        return new Promise((resolve) => {
            // Simular llamada a API
            setTimeout(() => {
                console.log('Testimonio enviado:', data);
                // Aquí guardarías en tu base de datos
                localStorage.setItem('testimonial_' + Date.now(), JSON.stringify(data));
                resolve();
            }, 1000);
        });
    }
    
    // Resetear estrellas
    function resetStars() {
        stars.forEach(s => {
            s.classList.remove('fas', 'text-yellow-400');
            s.classList.add('far', 'text-gray-400');
            s.style.transform = 'scale(1)';
        });
        ratingInput.value = '0';
    }
});