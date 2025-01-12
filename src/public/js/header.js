document.addEventListener('DOMContentLoaded', function () {
    const navItems = {
        '/home': 'nav-home',
        '/products': 'nav-products',
        '/contact': 'nav-contact',
        '/carts': 'nav-carts'
    };

    const currentPath = window.location.pathname;
    const activeNavItem = navItems[currentPath];

    if (activeNavItem) {
        document.getElementById(activeNavItem).classList.add('active');
    }
});


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
const openBtn = document.getElementById("open-profile-modal");
const closeBtn = document.getElementById("close-modal");

const profileModal = document.getElementById('profile-modal');
const avatarImg = document.getElementById('avatar-img');
const usernameText = document.querySelector('.username');
const emailText = document.querySelector('.user-info p');
const firstNameInput = document.getElementById('first-name');
const lastNameInput = document.getElementById('last-name');

async function fetchUserData() {
    showLoading();
    try {
        const response = await fetch('/user/profile');
        const userData = await response.json();
        hideLoading();
        if (response.ok) {
            avatarImg.src = userData.avatarUrl || '/img/avatar_place_holder.png';
            usernameText.textContent = `${userData.firstName} ${userData.lastName}`;
            emailText.textContent = `Email: ${userData.email}`;
            firstNameInput.value = userData.firstName;
            lastNameInput.value = userData.lastName;
        } else {
            console.error('Failed to fetch user data:', userData.message);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Open Modal
openBtn.addEventListener("click", async () => {
    await fetchUserData();
    profileModal.classList.add("show");
});

// Close Modal
closeBtn.addEventListener("click", () => {
    profileModal.classList.remove("show");
});

window.addEventListener("click", (e) => {
    if (e.target === profileModal) {
        profileModal.classList.remove("show");
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

document.querySelector('.update-profile form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('firstName', document.getElementById('first-name').value);
    formData.append('lastName', document.getElementById('last-name').value);
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput.files[0]) {
        formData.append('avatar', avatarInput.files[0]);
    }

    showLoading();

    try {
        const response = await fetch('/user/update-profile', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        hideLoading();
        if (response.ok) {
            document.getElementById('firstName').textContent = formData.get('firstName'); // Update the first name
            document.querySelector('.username').textContent = `${formData.get('firstName')} ${formData.get('lastName')}`; // Update the username
            document.getElementById('dropdownAvatar').src = result.avatarUrl || '/img/avatar_place_holder.png'; // Update the avatar
            showAlert("success", "Success", result.message);
        } else {
            showAlert("error", "Error", result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert("error", "Error", "An error occurred. Please try again.");
    }
});


document.addEventListener('DOMContentLoaded', async function () {

});

const changePasswordModal = document.getElementById('change-password-modal');

// change password js
function openChangePasswordModal() {
    changePasswordModal.classList.add("show");
}

function closeChangePasswordModal() {
    changePasswordModal.classList.remove("show");
}

window.addEventListener("click", (e) => {
    if (e.target === changePasswordModal) {
        changePasswordModal.classList.remove("show");
    }
});

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

    showLoading();
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
            showAlert('success', 'Success', result.message);
        } else {
            showAlert('error', 'Error', result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('error', 'Error', 'An error occurred. Please try again.');
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