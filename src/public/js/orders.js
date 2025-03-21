document.addEventListener('DOMContentLoaded', function () {
    const ordersContainer = document.getElementById('ordersContainer');
    const paginationContainer = document.querySelector('.pagination');

    // Handle pagination click events using event delegation
    paginationContainer.addEventListener('click', handlePaginationClick);

    function handlePaginationClick(event) {
        if (event.target.tagName === 'A' && event.target.closest('.pagination')) {
            event.preventDefault();
            const page = parseInt(event.target.getAttribute('data-page'), 10);
            if (!isNaN(page)) {
                fetchOrders(page);
            }
        }
    }

    function fetchOrders(page) {
        const queryString = new URLSearchParams({ page }).toString();
        window.history.pushState({}, '', `/orders?${queryString}`);

        showLoading();
        fetch(`/orders?page=${page}`, {
            headers: {
                'Accept': 'application/json',
            }
        })
            .then(handleFetchResponse)
            .then(updateContent)
            .catch(handleFetchError);
    }

    function handleFetchResponse(response) {
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        return response.json();
    }

    function updateContent(data) {
        renderOrders(data.orders);
        renderPagination(data.pagination);
        hideLoading();
    }

    function handleFetchError(error) {
        hideLoading();
        showAlert('error', 'Error', error.message);
    }

    function renderOrders(orders) {
        ordersContainer.innerHTML = ''; // Clear the current content
        orders.forEach(order => {
            const orderHtml = createOrderHtml(order);
            ordersContainer.insertAdjacentHTML('beforeend', orderHtml);
        });
    }

    function createOrderHtml(order) {
        return `
            <div class="order my-3 bg-light">
                <div class="row">
                    <div class="col-lg-10">
                        <div class="d-flex flex-column justify-content-between order-summary">
                            <div class="d-flex align-items-center">
                                <div class="text-uppercase flex-grow-1 text-nowrap">Order #${order.id}</div>
                            </div>
                            <div class="d-sm-flex align-items-sm-start justify-content-sm-between">
                                <div class="status">Order Status : ${order.statusName}</div>
                            </div>
                            ${order.paymentDetails ? `
                            <div class="d-sm-flex align-items-sm-start justify-content-sm-between">
                                <div class="status">Payment Status : ${order.paymentDetails.status}</div>
                            </div>` : ''}
                            <div class="d-sm-flex align-items-sm-start justify-content-sm-between">
                                <div class="status">Total: ${order.total_price}</div>
                            </div>
                            <div class="d-sm-flex align-items-sm-start justify-content-sm-between">
                                <div class="status">Amount of items: ${order.amount_of_items}</div>
                            </div>
                            ${order.status === 0 && !order.paymentDetails ? `
                            <div class="d-sm-flex align-items-sm-start justify-content-sm-between">
                                <div style="color: red;">Your order has not confirmed yet.</div>
                            </div>
                            <div class="d-sm-flex align-items-sm-start justify-content-sm-between">
                                <div style="color: red;">Please confirm before ${order.expired_at}</div>
                            </div>` : ''}
                            <div class="fs-8">Created at: ${order.created_at}</div>
                            <div class="rating d-flex align-items-center pt-1">
                                <img src="https://www.freepnglogos.com/uploads/like-png/like-png-hand-thumb-sign-vector-graphic-pixabay-39.png" alt="">
                                <span class="px-2">Rating:</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-2">
                        <div class="d-sm-flex align-items-sm-start justify-content-end">
                            ${order.status !== 4 ? `
                                ${order.status === 0 ? `
                                <a href="/orders/checkout/vnpay/continue/${order.hashOrderId}" class="ms-auto">
                                    <div class="btn btn-primary text-uppercase">continue checkout</div>
                                </a>` : `
                                <a href="/orders/confirmation?orderId=${order.hashOrderId}" class="ms-auto">
                                    <div class="btn btn-primary text-uppercase">order info</div>
                                </a>`}
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPagination(pagination) {
        paginationContainer.innerHTML = ''; // Clear existing pagination
        if (pagination.hasPrev) {
            paginationContainer.insertAdjacentHTML(
                'beforeend',
                `<li class="page-item"><a class="page-link" href="#" data-page="${pagination.prevPage}">&laquo;</a></li>`
            );
        }
        pagination.pages.forEach(page => {
            paginationContainer.insertAdjacentHTML(
                'beforeend',
                `<li class="page-item ${page.active ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${page.number}">${page.number}</a>
                </li>`
            );
        });
        if (pagination.hasNext) {
            paginationContainer.insertAdjacentHTML(
                'beforeend',
                `<li class="page-item"><a class="page-link" href="#" data-page="${pagination.nextPage}">&raquo;</a></li>`
            );
        }
    }
});