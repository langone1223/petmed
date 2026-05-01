document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loaderIcon = submitBtn.querySelector('.loader-icon');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle Password Visibility
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle icon
        if (type === 'text') {
            togglePassword.classList.remove('bx-hide');
            togglePassword.classList.add('bx-show');
        } else {
            togglePassword.classList.remove('bx-show');
            togglePassword.classList.add('bx-hide');
        }
    });

    // Handle Form Submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Simulate loading state
        submitBtn.disabled = true;
        btnText.textContent = 'Iniciando sesión...';
        loaderIcon.style.display = 'inline-block';
        submitBtn.style.opacity = '0.8';
        submitBtn.style.cursor = 'not-allowed';

        // Simulate API call delay
        setTimeout(() => {
            // Reset state
            submitBtn.disabled = false;
            btnText.textContent = 'Inicio de Sesión Exitoso';
            loaderIcon.style.display = 'none';
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
            submitBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)'; // Success green

            // Reset form after a brief moment
            setTimeout(() => {
                loginForm.reset();
                btnText.textContent = 'Iniciar Sesión';
                submitBtn.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
                
                // Trigger focus out styling manually by blurring active element
                if (document.activeElement) {
                    document.activeElement.blur();
                }
            }, 2000);
            
        }, 1500);
    });
});
