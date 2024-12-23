document.addEventListener('DOMContentLoaded', function () {

    // Confirm Purchase Button Click
    document.getElementById('confirmPurchaseBtn').onclick = async function (event) {
        event.preventDefault();

        
        const paymentType = document.getElementById('paymentType').value;
        const shippingDetails = getShipmentDetails();
        const orderId = document.getElementById('orderId').value;

        if (paymentType === '1') { // VNPay selected
            vnpayModal.style.display = 'flex';

            document.getElementById('vnpayRedirectBtn').onclick = async function (event) {
                event.preventDefault();
                vnpayModal.style.display = 'none';

                const form = document.getElementById('vnpayForm');
                const formData = new FormData(form);
                const formDataJson = Object.fromEntries(formData.entries());

                payWithVnpay(orderId, shippingDetails, paymentType, formDataJson);
            };
        } else if (paymentType === '2') { // Cash selected
            await confirmPurchase(orderId, shippingDetails, paymentType);
        } else {
            showAlert('error', 'Error', 'Invalid payment type');
        }
    };

    // Confirm Purchase (Cash Payment)
    async function confirmPurchase(orderId, shippingDetails, paymentType) {
        try {
            showLoading();
            const response = await fetch(`/orders/checkout/cash/${orderId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shippingDetails, paymentType })
            });

            const data = await response.json();
            if(response.ok && data.redirectUrl) {
                hideLoading();
                window.location.href = data.redirectUrl;
            }
            else {
                hideLoading();
                showAlert('error', 'Error', data.message);
            }
            hideLoading();
        } catch (error) {
            console.error('Error confirming order:', error);
            showAlert('error', 'Error', error.message);
        }
    }

    async function payWithVnpay(orderId, shippingDetails, paymentType, formDataJson) {
        try {
            showLoading();
            const response = await fetch(`/orders/checkout/vnpay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, shippingDetails, paymentType, formDataJson })
            });

            const data = await response.json();

            if (response.ok && data.paymentUrl) {
                hideLoading();
                window.location.href = data.paymentUrl;
            } else {
                hideLoading();
                showAlert('error', 'Error', data.message);
            }
            hideLoading();
        } catch (error) {
            console.error('Error redirecting to VNPay:', error);
            showAlert('error', 'Error', error.message);
        }
    }

    // Retrieve Shipment Details
    function getShipmentDetails() {
        return {
            fullname: document.getElementById('fullname').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            district: document.getElementById('district').value,
            province: document.getElementById('province').value,
            shipping_fee: document.getElementById('shippingFeeValue').value
        };
    }
});
