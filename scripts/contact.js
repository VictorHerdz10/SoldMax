document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // Validaciones del formulario de contacto
        document.addEventListener('DOMContentLoaded', function() {
            const contactForm = document.getElementById('contactForm');
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const subjectInput = document.getElementById('subject');
            const messageInput = document.getElementById('message');
            
            // Crear elementos de error
            const createErrorElement = (input, message) => {
                const errorId = `${input.id}Error`;
                let errorElement = document.getElementById(errorId);
                
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.id = errorId;
                    errorElement.className = 'text-red-500 text-xs mt-1';
                    input.parentNode.appendChild(errorElement);
                }
                
                errorElement.textContent = message;
                input.classList.add('border-red-500');
                input.classList.remove('border-gray-300');
            };
            
            // Limpiar errores
            const clearError = (input) => {
                const errorId = `${input.id}Error`;
                const errorElement = document.getElementById(errorId);
                
                if (errorElement) {
                    errorElement.textContent = '';
                }
                
                input.classList.remove('border-red-500');
                input.classList.add('border-gray-300');
            };
            
            // Validaciones en tiempo real
            nameInput.addEventListener('input', function() {
                if (this.value.trim().length >= 3) {
                    clearError(this);
                }
            });
            
            emailInput.addEventListener('input', function() {
                if (validateEmail(this.value.trim())) {
                    clearError(this);
                }
            });
            
            subjectInput.addEventListener('change', function() {
                if (this.value !== '') {
                    clearError(this);
                }
            });
            
            messageInput.addEventListener('input', function() {
                if (this.value.trim().length >= 10) {
                    clearError(this);
                }
            });
            
            // Validar email
            function validateEmail(email) {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return re.test(email);
            }
            
            // Enviar formulario
            if (contactForm) {
                contactForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    let isValid = true;
                    
                    // Validar nombre
                    if (nameInput.value.trim().length < 3) {
                        createErrorElement(nameInput, 'Por favor ingresa un nombre válido (mínimo 3 caracteres)');
                        isValid = false;
                    }
                    
                    // Validar email
                    if (!validateEmail(emailInput.value.trim())) {
                        createErrorElement(emailInput, 'Por favor ingresa un email válido');
                        isValid = false;
                    }
                    
                    // Validar asunto
                    if (subjectInput.value === '') {
                        createErrorElement(subjectInput, 'Por favor selecciona un asunto');
                        isValid = false;
                    }
                    
                    // Validar mensaje
                    if (messageInput.value.trim().length < 10) {
                        createErrorElement(messageInput, 'El mensaje debe tener al menos 10 caracteres');
                        isValid = false;
                    }
                    
                    if (isValid) {
                        // Simular envío
                        const submitBtn = contactForm.querySelector('button[type="submit"]');
                        const originalText = submitBtn.textContent;
                        
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enviando...';
                        
                        setTimeout(() => {
                            submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Enviado';
                            
                            // Mostrar mensaje de éxito
                            const successDiv = document.createElement('div');
                            successDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
                            successDiv.innerHTML = `
                                <div class="flex items-center">
                                    <i class="fas fa-check-circle mr-2"></i>
                                    <span>¡Gracias por tu mensaje! Nos pondremos en contacto contigo pronto.</span>
                                </div>
                            `;
                            
                            contactForm.parentNode.insertBefore(successDiv, contactForm);
                            contactForm.reset();
                            
                            // Restaurar botón después de 3 segundos
                            setTimeout(() => {
                                submitBtn.disabled = false;
                                submitBtn.textContent = originalText;
                                successDiv.remove();
                            }, 3000);
                        }, 1500);
                    } else {
                        // Scroll al primer error
                        const firstError = document.querySelector('.text-red-500');
                        if (firstError) {
                            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                });
            }
            
            // Animación para los campos del formulario
            const formInputs = contactForm.querySelectorAll('input, select, textarea');
            formInputs.forEach((input, index) => {
                input.style.opacity = '0';
                input.style.transform = 'translateY(10px)';
                input.style.transition = 'all 0.5s ease';
                input.style.transitionDelay = `${index * 0.1}s`;
                
                setTimeout(() => {
                    input.style.opacity = '1';
                    input.style.transform = 'translateY(0)';
                }, 100);
            });
        });