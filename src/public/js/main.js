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
