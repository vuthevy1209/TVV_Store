function fetchCartQuantity() {
    fetch('/carts/amount-of-items', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            document.getElementById('cartQuantityIcon').setAttribute('value', data.amountOfItems);
            console.log('Cart quantity:', data.amountOfItems);
        })
        .catch(error => {
            console.error('Error fetching cart quantity:', error);
        });
}

// Fetch cart quantity on page load
fetchCartQuantity();

// Update Profile js
// Modal Elements
const modal = document.getElementById("profile-modal");
const openBtn = document.getElementById("open-profile-modal");
const closeBtn = document.getElementById("close-modal");

// Open Modal
openBtn.addEventListener("click", () => {
    modal.style.display = "flex";
});

// Close Modal
closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

// Avatar Upload Preview
document.getElementById("avatar-input").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("avatar-img").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});


// change password js
function openChangePasswordModal() {
    document.getElementById('change-password-modal').style.display = 'flex';
}

function closeChangePasswordModal() {
    document.getElementById('change-password-modal').style.display = 'none';
}

const changePasswordForm = document.querySelector('#change-password-modal form');

changePasswordForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        swal('Error', 'New password and confirm password do not match.', 'error');
        return; // Add return statement to stop execution
    }

    try {
        const response = await fetch('/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });

        const result = await response.json();
        if (response.ok) {
            swal("Success", result.message, "success");
        } else {
            swal("Error", result.message, "error");
        }
    } catch (error) {
        console.error('Error:', error);
        swal("Error", "An error occurred. Please try again.", "error");
    }
});

function togglePasswordVisibility(id) {
    const passwordInput = document.getElementById(id);
    const icon = passwordInput.nextElementSibling;
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}