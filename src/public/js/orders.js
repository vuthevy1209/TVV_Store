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
            },
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
        renderPagination(data.currentPage, data.totalPages);
        hideLoading();
    }

    function handleFetchError(error) {
        hideLoading();
        showAlert('error','Error', error.message);
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
                    <div class="col-lg-8">
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
                                </div>` : `
                                <div class="d-sm-flex align-items-sm-start justify-content-sm-between">
                                    <div class="status">Payment Status : Haven't created payment yet</div>
                                </div>`}
                            <div class="d-sm-flex align-items-sm-start justify-content-sm-between">
                                <div class="status">Total: ${order.total_price}</div>
                            </div>
                            <div class="d-sm-flex align-items-sm-start justify-content-sm-between">
                                <div class="status">Amount of items: ${order.amount_of_items}</div>
                            </div>
                            <div class="fs-8">${order.created_at}</div>
                            <div class="rating d-flex align-items-center pt-1">
                                <img src="https://www.freepnglogos.com/uploads/like-png/like-png-hand-thumb-sign-vector-graphic-pixabay-39.png" alt="">
                                <span class="px-2">Rating:</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4">
                    
                        <div class="d-sm-flex align-items-sm-start justify-content-end">
                        ${order.paymentDetails ? `
                            <a href="/orders/confirmation?orderId=${order.hashOrderId}" class="ms-auto">
                                <div class="btn btn-primary text-uppercase">order info</div>
                            </a>
                            ` : `
                            <a href="/orders/checkout?orderId=${order.hashOrderId}" class="ms-auto"> 
                                <div class="btn btn-primary text-uppercase">checkout</div>
                            </a>
                            `}
                        </div>
                    </div>
                </div>
            </div>`;
    }

    function renderPagination(currentPage, totalPages) {
        paginationContainer.innerHTML = ''; // Clear existing pagination
        if (currentPage > 1) {
            paginationContainer.insertAdjacentHTML(
                'beforeend',
                `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage - 1}">&laquo;</a></li>`
            );
        }
        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.insertAdjacentHTML(
                'beforeend',
                `<li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>`
            );
        }
        if (currentPage < totalPages) {
            paginationContainer.insertAdjacentHTML(
                'beforeend',
                `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage + 1}">&raquo;</a></li>`
            );
        }
    }
});