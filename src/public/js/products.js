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
                    const productHtml = `
                        <div class="col-lg-3 col-md-6 mb-4">
                            <a href="/products/${product.id}" style="text-decoration: none;">
                                <div class="card">
                                    <div class="brand">${product.productBrand.name}</div>
                                    <div class="product-image">
                                        <img src="${product.image_urls[0]}" alt="Product" />
                                    </div>
                                    <div class="card-body">
                                        ${product.discount > 0 ? `<span class="discount">${product.discount}% off</span>` : ''}
                                        <h5 class="card-title text-center">${product.name}</h5>
                                        <h6 class="card-price text-center">$${product.price}</h6>
                                    </div>
                                </div>
                            </a>
                        </div>
                    `;
                    productList.insertAdjacentHTML('beforeend', productHtml);
                });

                const pagination = document.querySelector('.pagination');
                pagination.innerHTML = '';
                if (data.pagination.hasPrev) {
                    pagination.insertAdjacentHTML('beforeend', `<li class="page-item"><a class="page-link" href="#" data-page="${data.pagination.prevPage}">Previous</a></li>`);
                } else {
                    pagination.insertAdjacentHTML('beforeend', `<li class="page-item disabled"><a class="page-link" href="#">Previous</a></li>`);
                }
                data.pagination.pages.forEach(page => {
                    pagination.insertAdjacentHTML('beforeend', `<li class="page-item ${page.active ? 'active' : ''}"><a class="page-link" href="#" data-page="${page.number}">${page.number}</a></li>`);
                });
                if (data.pagination.hasNext) {
                    pagination.insertAdjacentHTML('beforeend', `<li class="page-item"><a class="page-link" href="#" data-page="${data.pagination.nextPage}">Next</a></li>`);
                } else {
                    pagination.insertAdjacentHTML('beforeend', `<li class="page-item disabled"><a class="page-link" href="#">Next</a></li>`);
                }
            })
            .catch(error => console.error('Error fetching products:', error));
    }
});