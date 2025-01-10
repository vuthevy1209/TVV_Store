document.addEventListener('DOMContentLoaded', function () {
    const orderDataElement = document.getElementById('order-data');
    const order = JSON.parse(orderDataElement.textContent);


    // Confirm Purchase Button Click
    document.getElementById('confirmPurchaseBtn').onclick = async function (event) {
        event.preventDefault();


        const paymentType = document.getElementById('paymentType').value;
        const shippingDetails = getShipmentDetails();

        if (paymentType === '1') { // VNPay selected
            vnpayModal.style.display = 'flex';

            document.getElementById('vnpayRedirectBtn').onclick = async function (event) {
                event.preventDefault();
                vnpayModal.style.display = 'none';

                const form = document.getElementById('vnpayForm');
                const formData = new FormData(form);
                const formDataJson = Object.fromEntries(formData.entries());

                getClientIpAddress().then(ipAddress => {
                    formDataJson.ipAddress = ipAddress;
                    formDataJson.amount = order.total_price; // Dynamically set the amount
                    payWithVnpay(shippingDetails, paymentType, formDataJson);
                });
            };
        } else if (paymentType === '2') { // Cash selected
            await confirmPurchase(shippingDetails, paymentType);
        } else {
            showAlert('error', 'Error', 'Invalid payment type');
        }
    };

    function getClientIpAddress() {
        return fetch('https://ipinfo.io/json?token=9daf21248f63ac')
            .then(response => response.json())
            .then(data => data.ip)
            .catch(() =>   '8.8.8.8'); // Fallback IP address
    }

    // Confirm Purchase (Cash Payment)
    async function confirmPurchase(shippingDetails, paymentType) {
        try {
            showLoading();

            const response = await fetch(`/orders/checkout/cash`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order, shippingDetails, paymentType })
            });

            const data = await response.json();
            if (response.ok && data.redirectUrl) {
                hideLoading();
                window.location.href = data.redirectUrl;
            }
            else {
                hideLoading();
                showAlert('error', 'Error', data.message);
                if(data.redirectUrl){
                    window.location.href = data.redirectUrl;
                }
            }
            hideLoading();
        } catch (error) {
            console.error('Error confirming order:', error);
            showAlert('error', 'Error', error.message);
        }
    }

    async function payWithVnpay(shippingDetails, paymentType, formDataJson) {
        try {
            showLoading();

            const response = await fetch(`/orders/checkout/vnpay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order, shippingDetails, paymentType, formDataJson })
            });

            const data = await response.json();

            hideLoading();
            if (response.ok && data.paymentUrl) {
                window.location.href = data.paymentUrl;
            } else {
                showAlert('error', 'Error', data.message);
                if(data.redirectUrl){
                    window.location.href = data.redirectUrl;
                }
            }

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