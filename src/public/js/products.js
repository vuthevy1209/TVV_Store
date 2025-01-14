document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('searchForm').addEventListener('submit', function (event) {
        event.preventDefault();
        fetchProducts(1);
    });

    document.querySelector('.pagination').addEventListener('click', function (event) {
        if (event.target.tagName === 'A') {
            event.preventDefault();
            const page = event.target.getAttribute('data-page');
            fetchProducts(page);
        }
    });

    function fetchProducts(page) {
        showLoading();
        const formData = new FormData(document.getElementById('searchForm'));
        formData.append('page', page);
        const queryString = new URLSearchParams(formData).toString();

        window.history.pushState({}, '', `/products/search?${queryString}`);
        fetch(`/products/search?${queryString}`, {
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                hideLoading()
                const productList = document.getElementById('productList');
                productList.innerHTML = '';
                data.productList.forEach(product => {

                    const formattedPrice = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(product.price);

                    const productHtml = `
                        <div class="col-lg-3 col-md-6 mb-4">
                    
                            <a href="/products/${product.id}" style="text-decoration: none;">
                                <div class="card">
                                    <div class="brand">${product.productBrand.name}</div>
                                    <div class="product-image">
                                        <img src="${product.image_urls[0]}" alt="Product" />
                                    </div>
                                    <div class="card-body">
<!--                                        ${product.discount > 0 ? `<span class="discount">${product.discount}% off</span>` : ''}-->
                                        <h5 class="card-title text-center">${product.name}</h5>
                                        <h6 class="card-price text-center">${formattedPrice}</h6>
                                    </div>
                                </div>
                            </a>
                        </div>
                    `;
                    productList.insertAdjacentHTML('beforeend', productHtml);
                });

                const pagination = document.querySelector('.pagination');
                pagination.innerHTML = '';

                // Function to determine visible pages
                function getVisiblePages(pages, currentPage, maxVisiblePages) {
                    const totalPages = pages.length;
                    const startPage = Math.max(1, Math.floor((currentPage - 1) / maxVisiblePages) * maxVisiblePages + 1);
                    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                    return pages.filter(page => page.number >= startPage && page.number <= endPage);
                }

                // Get the current page from the data or set a default
                const currentPage = data.pagination.currentPage || 1;
                const maxVisiblePages = 3; // Number of pages to display at a time
                const visiblePages = getVisiblePages(data.pagination.pages, currentPage, maxVisiblePages);

                // Previous Button
                if (data.pagination.hasPrev) {
                    pagination.insertAdjacentHTML('beforeend', `<li class="page-item"><a class="page-link" href="#" data-page="${data.pagination.prevPage}">Previous</a></li>`);
                } else {
                    pagination.insertAdjacentHTML('beforeend', `<li class="page-item disabled"><a class="page-link" href="#">Previous</a></li>`);
                }

                // Page Numbers
                visiblePages.forEach(page => {
                    pagination.insertAdjacentHTML('beforeend', `<li class="page-item ${page.active ? 'active' : ''}"><a class="page-link" href="#" data-page="${page.number}">${page.number}</a></li>`);
                });

                // Next Button
                if (data.pagination.hasNext) {
                    pagination.insertAdjacentHTML('beforeend', `<li class="page-item"><a class="page-link" href="#" data-page="${data.pagination.nextPage}">Next</a></li>`);
                } else {
                    pagination.insertAdjacentHTML('beforeend', `<li class="page-item disabled"><a class="page-link" href="#">Next</a></li>`);
                }

            })
            .catch(error => console.error('Error fetching products:', error));
    }
});