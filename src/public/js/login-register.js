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
