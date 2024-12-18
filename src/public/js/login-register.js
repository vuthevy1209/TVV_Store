const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
});

document.querySelectorAll('.toggle-password').forEach(item => {
    item.addEventListener('click', function () {
        const password = this.previousElementSibling;
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });
});

document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.redirectUrl) {
            window.location.href = result.redirectUrl;
        } else {
            swal('Error', result.message || 'Register failed!');
        }
    } catch (error) {
        console.error('Error:', error);
        swal("Error", "An error occurred. Please try again.", "error");
    }
});

document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            // redirect: 'manual'
        });
        const result = await response.json();

        if (response.ok && result.redirectUrl) {
            window.location.href = result.redirectUrl;
        } else {
            swal("Error", result.message || 'Login failed!', "error");
        }

    } catch (error) {
        console.error('Error:', error);
        swal("Error", "An error occurred. Please try again.", "error");
    }
});


// Forgot password modal
document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeModal = document.querySelector('.modal .close');

    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        forgotPasswordModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        forgotPasswordModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) {
            forgotPasswordModal.style.display = 'none';
        }
    });

    document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotPasswordEmail').value;

        try {
            const response = await fetch('/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({email})
            });

            const result = await response.json();
            if (response.ok) {
                swal("Success", result.message, "success");
                // forgotPasswordModal.style.display = 'none';
            } else {
                swal("Error", result.message, "error");
            }
        } catch (error) {
            console.error('Error:', error);
            swal("Error", "An error occurred. Please try again.", "error");
        }
    });
});