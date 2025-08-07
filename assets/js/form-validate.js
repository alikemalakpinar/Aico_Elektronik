/**
 * AICO Elektronik - Contact Form Validation
 * Advanced form handling with real-time validation
 */

document.addEventListener('DOMContentLoaded', function() {
    initContactForm();
});

function initContactForm() {
    const form = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const formSuccess = document.getElementById('form-success');
    
    if (!form) return;

    // Form validation rules
    const validationRules = {
        firstName: {
            required: true,
            minLength: 2,
            pattern: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/,
            message: 'Ad en az 2 karakter olmalı ve sadece harf içermelidir.'
        },
        lastName: {
            required: true,
            minLength: 2,
            pattern: /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/,
            message: 'Soyad en az 2 karakter olmalı ve sadece harf içermelidir.'
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Geçerli bir e-posta adresi giriniz.'
        },
        phone: {
            required: false,
            pattern: /^[\+]?[0-9\s\-\(\)]{10,}$/,
            message: 'Geçerli bir telefon numarası giriniz.'
        },
        company: {
            required: false,
            maxLength: 100,
            message: 'Şirket adı 100 karakterden uzun olamaz.'
        },
        serviceType: {
            required: true,
            message: 'Lütfen bir hizmet türü seçiniz.'
        },
        budget: {
            required: false
        },
        timeline: {
            required: false
        },
        message: {
            required: true,
            minLength: 20,
            maxLength: 1000,
            message: 'Proje detayları en az 20, en fazla 1000 karakter olmalıdır.'
        },
        privacy: {
            required: true,
            type: 'checkbox',
            message: 'Gizlilik politikasını kabul etmelisiniz.'
        }
    };

    // Add real-time validation to all form fields
    Object.keys(validationRules).forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            // Add event listeners for real-time validation
            field.addEventListener('blur', () => validateField(fieldName));
            field.addEventListener('input', () => clearError(fieldName));
            
            // Special handling for email field
            if (fieldName === 'email') {
                field.addEventListener('input', debounce(() => validateField(fieldName), 500));
            }
        }
    });

    // Form submission handler
    form.addEventListener('submit', handleFormSubmit);

    function validateField(fieldName) {
        const field = document.getElementById(fieldName);
        const rules = validationRules[fieldName];
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (!field || !rules) return true;

        const value = rules.type === 'checkbox' ? field.checked : field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (rules.required) {
            if (rules.type === 'checkbox' && !value) {
                isValid = false;
                errorMessage = rules.message;
            } else if (rules.type !== 'checkbox' && !value) {
                isValid = false;
                errorMessage = `${field.labels[0]?.textContent.replace('*', '').trim()} zorunludur.`;
            }
        }

        // Skip other validations if field is empty and not required
        if (!value && !rules.required) {
            clearError(fieldName);
            return true;
        }

        // Pattern validation
        if (isValid && value && rules.pattern && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.message;
        }

        // Length validations
        if (isValid && value) {
            if (rules.minLength && value.length < rules.minLength) {
                isValid = false;
                errorMessage = `En az ${rules.minLength} karakter olmalıdır.`;
            }
            
            if (rules.maxLength && value.length > rules.maxLength) {
                isValid = false;
                errorMessage = `En fazla ${rules.maxLength} karakter olabilir.`;
            }
        }

        // Update UI
        if (isValid) {
            clearError(fieldName);
        } else {
            showError(fieldName, errorMessage);
        }

        return isValid;
    }

    function showError(fieldName, message) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (field) {
            field.classList.add('error');
        }
        
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function clearError(fieldName) {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(`${fieldName}-error`);
        
        if (field) {
            field.classList.remove('error');
        }
        
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    function validateForm() {
        let isFormValid = true;
        
        // Validate all fields
        Object.keys(validationRules).forEach(fieldName => {
            if (!validateField(fieldName)) {
                isFormValid = false;
            }
        });

        // Validate reCAPTCHA
        if (typeof grecaptcha !== 'undefined') {
            const recaptchaResponse = grecaptcha.getResponse();
            if (!recaptchaResponse) {
                showError('recaptcha', 'Lütfen robot olmadığınızı doğrulayın.');
                isFormValid = false;
            } else {
                clearError('recaptcha');
            }
        }

        return isFormValid;
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            // Scroll to first error
            const firstError = form.querySelector('.form-input.error, .form-select.error, .form-textarea.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }

        // Show loading state
        setSubmitLoading(true);

        try {
            // Collect form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Add reCAPTCHA token if available
            if (typeof grecaptcha !== 'undefined') {
                data.recaptcha = grecaptcha.getResponse();
            }

            // Submit form (replace with your actual endpoint)
            const response = await submitForm(data);
            
            if (response.success) {
                showSuccessMessage();
                form.reset();
                
                // Reset reCAPTCHA
                if (typeof grecaptcha !== 'undefined') {
                    grecaptcha.reset();
                }
                
                // Track successful form submission
                trackFormSubmission('contact_form_success', data.serviceType);
                
            } else {
                throw new Error(response.message || 'Form gönderilemedi.');
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            showErrorMessage(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
            
            // Track form submission error
            trackFormSubmission('contact_form_error', error.message);
            
        } finally {
            setSubmitLoading(false);
        }
    }

    async function submitForm(data) {
        // Simulate API call - replace with your actual endpoint
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate success/failure
                if (Math.random() > 0.1) { // 90% success rate for demo
                    resolve({
                        success: true,
                        message: 'Form başarıyla gönderildi.'
                    });
                } else {
                    reject(new Error('Sunucu hatası. Lütfen tekrar deneyin.'));
                }
            }, 2000);
        });
        
        // Real implementation would be:
        /*
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
        */
    }

    function setSubmitLoading(isLoading) {
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.style.opacity = '0';
            btnLoader.style.display = 'block';
        } else {
            submitBtn.disabled = false;
            btnText.style.opacity = '1';
            btnLoader.style.display = 'none';
        }
    }

    function showSuccessMessage() {
        form.style.display = 'none';
        formSuccess.style.display = 'flex';
        
        // Scroll to success message
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-hide success message and show form again after 10 seconds
        setTimeout(() => {
            formSuccess.style.display = 'none';
            form.style.display = 'flex';
        }, 10000);
    }

    function showErrorMessage(message) {
        // Create or update error notification
        let errorNotification = document.querySelector('.form-error-notification');
        
        if (!errorNotification) {
            errorNotification = document.createElement('div');
            errorNotification.className = 'form-error-notification';
            errorNotification.innerHTML = `
                <div class="error-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                </div>
                <div class="error-content">
                    <h4>Form Gönderilemedi</h4>
                    <p>${message}</p>
                </div>
                <button class="error-close" onclick="this.parentElement.remove()">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            
            // Add styles if not exists
            if (!document.querySelector('#error-notification-styles')) {
                const style = document.createElement('style');
                style.id = 'error-notification-styles';
                style.textContent = `
                    .form-error-notification {
                        display: flex;
                        align-items: center;
                        gap: var(--space-md);
                        padding: var(--space-lg);
                        background: var(--clr-error);
                        color: var(--clr-neutral-100);
                        border-radius: var(--radius-md);
                        margin-bottom: var(--space-lg);
                        animation: slideInDown 0.3s ease;
                    }
                    .error-icon {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 40px;
                        height: 40px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: var(--radius-full);
                        flex-shrink: 0;
                    }
                    .error-content h4 {
                        color: var(--clr-neutral-100);
                        margin-bottom: var(--space-sm);
                        font-size: 1rem;
                    }
                    .error-content p {
                        margin: 0;
                        opacity: 0.9;
                        font-size: 0.9rem;
                    }
                    .error-close {
                        background: transparent;
                        border: none;
                        color: var(--clr-neutral-100);
                        cursor: pointer;
                        padding: var(--space-xs);
                        margin-left: auto;
                        border-radius: var(--radius-sm);
                        transition: var(--transition);
                    }
                    .error-close:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                    @keyframes slideInDown {
                        from {
                            transform: translateY(-20px);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            form.insertBefore(errorNotification, form.firstChild);
        } else {
            errorNotification.querySelector('.error-content p').textContent = message;
        }
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (errorNotification && errorNotification.parentElement) {
                errorNotification.remove();
            }
        }, 8000);
        
        // Scroll to error
        errorNotification.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function trackFormSubmission(event, data) {
        // Google Analytics tracking (if available)
        if (typeof gtag !== 'undefined') {
            gtag('event', event, {
                'event_category': 'Form',
                'event_label': data,
                'value': 1
            });
        }
        
        // Facebook Pixel tracking (if available)
        if (typeof fbq !== 'undefined') {
            fbq('track', event === 'contact_form_success' ? 'Lead' : 'CustomEvent', {
                content_name: 'Contact Form',
                content_category: 'Lead Generation',
                value: event === 'contact_form_success' ? 1 : 0,
                currency: 'TRY'
            });
        }
        
        // Console log for debugging
        console.log('Form event tracked:', event, data);
    }
}

// Utility function for debouncing
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

// Auto-save form data to prevent data loss
function initFormAutoSave() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const STORAGE_KEY = 'aico_contact_form_draft';
    
    // Load saved data on page load
    loadFormData();
    
    // Save form data on input
    form.addEventListener('input', debounce(saveFormData, 1000));
    
    // Clear saved data on successful submission
    form.addEventListener('submit', () => {
        setTimeout(() => {
            if (document.getElementById('form-success').style.display === 'flex') {
                clearFormData();
            }
        }, 100);
    });

    function saveFormData() {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (key !== 'privacy' && key !== 'newsletter') { // Don't save checkboxes
                data[key] = value;
            }
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    function loadFormData() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                const data = JSON.parse(savedData);
                
                Object.keys(data).forEach(key => {
                    const field = document.getElementById(key);
                    if (field && data[key]) {
                        field.value = data[key];
                    }
                });
                
                // Show notification about restored data
                showRestoredDataNotification();
            }
        } catch (error) {
            console.warn('Could not load saved form data:', error);
        }
    }
    
    function clearFormData() {
        localStorage.removeItem(STORAGE_KEY);
    }
    
    function showRestoredDataNotification() {
        const notification = document.createElement('div');
        notification.className = 'form-restored-notification';
        notification.innerHTML = `
            <div class="restored-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="1,4 1,10 7,10"/>
                    <path d="M3.51,15a9,9,0,0,0,2.13,3.09,8.5,8.5,0,0,0,12-.09A9,9,0,0,0,21,12a9,9,0,0,0-.64-3.27"/>
                </svg>
            </div>
            <span>Daha önce yazdığınız bilgiler geri yüklendi.</span>
            <button onclick="this.parentElement.remove()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        
        // Add styles
        if (!document.querySelector('#restored-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'restored-notification-styles';
            style.textContent = `
                .form-restored-notification {
                    display: flex;
                    align-items: center;
                    gap: var(--space-sm);
                    padding: var(--space-md);
                    background: #e8f5e8;
                    color: var(--clr-success);
                    border-radius: var(--radius-sm);
                    margin-bottom: var(--space-lg);
                    font-size: 0.9rem;
                    border: 1px solid rgba(43, 174, 102, 0.2);
                }
                .restored-icon {
                    flex-shrink: 0;
                }
                .form-restored-notification button {
                    background: transparent;
                    border: none;
                    color: var(--clr-success);
                    cursor: pointer;
                    padding: var(--space-xs);
                    margin-left: auto;
                    border-radius: var(--radius-sm);
                    transition: var(--transition);
                }
                .form-restored-notification button:hover {
                    background: rgba(43, 174, 102, 0.1);
                }
            `;
            document.head.appendChild(style);
        }
        
        const form = document.getElementById('contact-form');
        form.insertBefore(notification, form.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification && notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize auto-save on DOM load
document.addEventListener('DOMContentLoaded', initFormAutoSave);

// Phone number formatting
function initPhoneFormatting() {
    const phoneInput = document.getElementById('phone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        // Turkish phone number formatting
        if (value.startsWith('90')) {
            value = value.slice(2);
        }
        
        if (value.startsWith('0')) {
            value = value.slice(1);
        }
        
        if (value.length >= 3) {
            value = value.slice(0, 3) + ' ' + value.slice(3);
        }
        if (value.length >= 7) {
            value = value.slice(0, 7) + ' ' + value.slice(7);
        }
        if (value.length >= 10) {
            value = value.slice(0, 10) + ' ' + value.slice(10, 12);
        }
        
        // Add country code
        if (value.length > 0) {
            value = '+90 ' + value;
        }
        
        e.target.value = value;
    });
}

// Initialize phone formatting on DOM load
document.addEventListener('DOMContentLoaded', initPhoneFormatting);

// Character count for textarea
function initCharacterCounter() {
    const messageField = document.getElementById('message');
    if (!messageField) return;
    
    const maxLength = 1000;
    
    // Create counter element
    const counter = document.createElement('div');
    counter.className = 'character-counter';
    counter.innerHTML = `<span class="current">0</span> / ${maxLength}`;
    
    // Add styles
    if (!document.querySelector('#character-counter-styles')) {
        const style = document.createElement('style');
        style.id = 'character-counter-styles';
        style.textContent = `
            .character-counter {
                text-align: right;
                font-size: 0.875rem;
                color: var(--clr-neutral-600);
                margin-top: var(--space-xs);
            }
            .character-counter.warning {
                color: var(--clr-accent);
            }
            .character-counter.danger {
                color: var(--clr-error);
            }
        `;
        document.head.appendChild(style);
    }
    
    messageField.parentElement.appendChild(counter);
    
    messageField.addEventListener('input', function() {
        const length = this.value.length;
        const currentSpan = counter.querySelector('.current');
        currentSpan.textContent = length;
        
        // Update counter color based on usage
        counter.classList.remove('warning', 'danger');
        if (length > maxLength * 0.8) {
            counter.classList.add('warning');
        }
        if (length > maxLength * 0.95) {
            counter.classList.add('danger');
        }
    });
}

// Initialize character counter on DOM load
document.addEventListener('DOMContentLoaded', initCharacterCounter);