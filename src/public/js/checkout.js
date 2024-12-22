document.addEventListener('DOMContentLoaded', function() {

    const modal = document.getElementById('exampleModal');

    closeChangePasswordModal = function() {
        modal.style.display = 'none';
    };
    // Confirm Purchase Button Click
    document.getElementById('confirmPurchaseBtn').onclick = function(event) {
        event.preventDefault();
        const paymentType = document.getElementById('paymentType').value;
        if (paymentType === '1') {
            modal.style.display = 'flex';
        } else if (paymentType === '2') {
            // Proceed with cash payment
            const shippingDetails = getShipmentDetails();
            const orderId = document.getElementById('orderId').value;
            confirmPurchase(orderId, shippingDetails, paymentType);
        } else {
            alert('Please select a valid payment method.');
        }
    };

    // VNPay Confirm Button Click
    document.getElementById('vnpayConfirmBtn').onclick = async function() {
        // Collect card details
        const cardDetails = {
            card_holder_name: document.getElementById('cardName').value,
            card_number: document.getElementById('cardNumber').value,
            card_expiry_month: document.getElementById('expMonth').value,
            card_expiry_year: document.getElementById('expYear').value,
            card_cvv: document.getElementById('cvv').value
        };

        const shippingDetails = getShipmentDetails();
        const orderId = document.getElementById('orderId').value;
        const paymentType = document.getElementById('paymentType').value;

        modal.style.display = 'none';

        // Send the AJAX request
        await confirmPurchase(orderId, shippingDetails, paymentType, cardDetails);
    };

    async function confirmPurchase(orderId, shippingDetails, paymentType, cardDetails = null) {
        try {
            const response = await fetch(`/orders/checkout/confirm/${orderId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shippingDetails, paymentType, cardDetails })
            });

            const data = await response.json();

            if (data.message) {
                swal("Success", data.message, "success");
            }
        } catch (error) {
            console.error('Error confirming order:', error);
            swal("Error", error.message, "error");
        }
    }

    function getShipmentDetails() {
        return {
            fullname: document.getElementById('fullname').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            district: document.getElementById('district').value,
            province: document.getElementById('province').value,
            zipcode: document.getElementById('zipcode').value
        };
    }
});