const API_URL = 'http://localhost:3000/api';

// 1. Kiểm tra trạng thái đăng nhập
function checkLoginState() {
    const user = JSON.parse(localStorage.getItem('user'));
    const userDiv = document.getElementById('user-area');
    
    if (userDiv) {
        if (user) {
            userDiv.innerHTML = `
                <div class="dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user-circle"></i> ${user.name}
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="/cart.html">Lịch sử đơn hàng</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="logout()">Đăng xuất</a></li>
                    </ul>
                </div>
            `;
        } else {
            userDiv.innerHTML = `
                <a href="/login.html" class="btn btn-outline-danger rounded-pill px-4">Đăng Nhập</a>
            `;
        }
    }
    updateCartCount();
}

// 2. Đăng xuất
function logout() {
    localStorage.removeItem('user');
    window.location.href = '/index.html';
}

// 3. Cập nhật số lượng giỏ hàng
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + item.sl, 0);
    const badge = document.getElementById('cart-badge');
    if(badge) badge.innerText = count;
}

// 4. Thêm vào giỏ (Dùng chung cho mọi trang)
function addToCart(id, name, price, img) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let item = cart.find(i => i.id === id);
    if(item) item.sl++; else cart.push({id, name, price, img, sl:1});
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Hiệu ứng thông báo đẹp (SweetAlert2)
    Swal.fire({
        icon: 'success',
        title: 'Đã thêm!',
        text: `${name} đã vào giỏ hàng`,
        showConfirmButton: false,
        timer: 1000,
        position: 'top-end',
        toast: true
    });
}