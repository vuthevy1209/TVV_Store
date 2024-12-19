
document.addEventListener('DOMContentLoaded', function () {
    let debounceTimer;
    let accumulatedQuantities = {};

    document.querySelectorAll('.increase-quantity').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const productId = row.getAttribute('data-id');
            const quantityInput = row.querySelector('.input-number');
            const maxQuantity = parseInt(quantityInput.max);
            const errorMessage = row.querySelector('.error-message');

            let newQuantity = (accumulatedQuantities[productId] || parseInt(quantityInput.value)) + 1;

            if (newQuantity > maxQuantity) {
                errorMessage.style.display = 'block';
                return;
            } else {
                errorMessage.style.display = 'none';
            }

            accumulatedQuantities[productId] = newQuantity;
            quantityInput.value = newQuantity;
            debounceUpdateCart();
        });
    });

    document.querySelectorAll('.decrease-quantity').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const productId = row.getAttribute('data-id');
            const quantityInput = row.querySelector('.input-number');
            const errorMessage = row.querySelector('.error-message');

            let newQuantity = Math.max(0, (accumulatedQuantities[productId] || parseInt(quantityInput.value)) - 1);

            if (newQuantity <= parseInt(quantityInput.max)) {
                errorMessage.style.display = 'none';
            }

            accumulatedQuantities[productId] = newQuantity;
            quantityInput.value = newQuantity;
            debounceUpdateCart();
        });
    });

    document.querySelectorAll('.remove-product').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const productId = row.getAttribute('data-id');
            accumulatedQuantities[productId] = 0;
            debounceUpdateCart();
        });
    });

    document.querySelector('.checkout_btn').addEventListener('click', function () {
        fetch('/orders/checkout', {
            method: 'POST'
        }).then(response => response.json())
            .then(data => {
                console.log('Checkout response:', data);
                window.location.href = '/orders';
            }).catch(error => {
                console.error('Error:', error);
                alert('An error occurred while checking out.');
            });
    });

    function debounceUpdateCart() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            updateCart();
        }, 500); // Adjust the delay as needed
    }

    async function updateCart() {
        const currentQuantities = { ...accumulatedQuantities };

        try {
            const response = await fetch('/carts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ products: currentQuantities })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data.message) {
                swal("Success", data.message, "success");
            }

            for (const productId in currentQuantities) {
                const productRow = document.querySelector(`tr[data-id="${productId}"]`);
                if (productRow) {
                    productRow.querySelector('.currPrice').innerText = `$${data.result.newItemsTotalPrice[productId]}`;
                    if (currentQuantities[productId] === 0) {
                        productRow.remove();
                    }
                }
            }
            document.getElementById('cartTotalPrice').innerText = `$${data.result.cartTotalPrice}`;
            document.getElementById('cartQuantityIcon').setAttribute('value', data.result.cartAmountOfItems);
        } catch (error) {
            console.error('Error:', error);
            swal("Error", error.message, "error");
        } finally {
            accumulatedQuantities = {};

        }
    }

    async function fetchCartQuantity() {
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
});

