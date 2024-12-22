function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.body.classList.add('prevent-pointer');
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.body.classList.remove('prevent-pointer');
}
function showAlert(type, title, message) {
    hideLoading();
    swal(title, message, type);
}

document.getElementById('directToLoginBtn').addEventListener('click', function (event) {
    event.preventDefault();
    const returnTo = window.location.href; // Get the current URL
    const loginUrl = new URL('/auth/login-register', window.location.origin);
    loginUrl.searchParams.append('returnTo', returnTo); // Append the returnTo query parameter

    // Redirect to the login URL with the returnTo parameter
    window.location.href = loginUrl.toString();
});