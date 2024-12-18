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
console.log(openBtn);
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