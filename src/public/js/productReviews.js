// src/js/productReviews.js
document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('.pagination').addEventListener('click', function (event) {
        if (event.target.tagName === 'A') {
            event.preventDefault();
            const page = event.target.getAttribute('data-page');
            fetchReviews(page);
        }
    });

    function fetchReviews(page) {
        showLoading();
        const productId = document.getElementById('productId').value; // Assuming productId is available in a hidden input
        fetch(`/products/${productId}?page=${page}`, {
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                hideLoading();
                const reviewList = document.getElementById('reviewList');
                reviewList.innerHTML = '';
                data.reviews.forEach(review => {
                    const reviewHtml = `
                        <div class="col-12 mb-4">
                            <div class="card">
                                <div class="card-body">
                                    <h5 class="card-title">${review.user.first_name} ${review.user.last_name}</h5>
                                    <p class="card-text">${review.comment}</p>
                                    <p class="card-text"><small class="text-muted">Reviewed on ${review.created_at}</small></p>
                                </div>
                            </div>
                        </div>
                    `;
                    reviewList.insertAdjacentHTML('beforeend', reviewHtml);
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
            .catch(error => {
                hideLoading();
                console.error('Error fetching reviews:', error);
                showAlert('error', 'Error' , error.message);
            });
    }

    // Handle review submission
    document.getElementById('submitReview').addEventListener('click', async function () {
        const productId = document.getElementById('productId').value;
        const comment = document.getElementById('reviewComment').value;

        showLoading();
        try {
            const response = await fetch(`/products/${productId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ product_id: productId, comment })
            });

            const result = await response.json();
            if (response.ok) {
                showAlert('success', 'Success', result.message);
                fetchReviews(1);
            } else {
                showAlert('error', 'Error', result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('error', 'Error', error.message);
        }
    });

    // Open and close modal functions
    const addReviewBtn = document.getElementById('addReviewBtn');
    console.log('addReviewBtn', addReviewBtn);
    addReviewBtn.addEventListener('click', function (event) {
        if (!isLoggedIn) {
            event.preventDefault();
            $('#loginModal').modal('show');
            return;
        }
        document.getElementById('addReviewModal').style.display = 'block';
    });

    document.getElementById('closeAddReviewModalBtn').addEventListener('click', function () {
        document.getElementById('addReviewModal').style.display = 'none';
    });

    document.getElementById('closeAddReviewModal').addEventListener('click', function () {
        document.getElementById('addReviewModal').style.display = 'none';
    });

    // Close the modal when the user clicks outside of the modal
    window.addEventListener('click', function (event) {
        if (event.target === document.getElementById('addReviewModal')) {
            document.getElementById('addReviewModal').style.display = 'none';
        }
    });

    document.getElementById('closeAddReviewModalBtn').addEventListener('click', function () {
    document.getElementById('addReviewModal').style.display = 'none';
});

});