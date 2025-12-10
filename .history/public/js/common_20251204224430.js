const API = 'http://localhost:3000/api';

// 1. Kiểm tra User đã đăng nhập chưa
function checkLogin() {
    const user = JSON.parse(localStorage.getItem('user'));
    const navUser = document.getElementById('nav-user');
    
    if (navUser) {
        if (user) {
            navUser.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-dark dropdown-toggle" data-bs-toggle="dropdown">
                        👤 ${user.name}
                    </button>
                    <ul class="dropdown-menu">
                        ${user.role === 'admin' ? '<li><a class="dropdown-item" href="/admin.html">Vào trang Admin</a></li>' : ''}
                        <li><a class="dropdown-item" href="/profile.html">Lịch sử đơn hàng</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="logout()">Đăng xuất</a></li>
                    </ul>
                </div>
            `;
        } else {
            navUser.innerHTML = `<a href="/login.html" class="btn btn-danger">Đăng Nhập</a>`;
        }
    }
    updateCartBadge();
}

// 2. Cập nhật số giỏ hàng
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const badge = document.getElementById('cart-count');
    if(badge) badge.innerText = cart.reduce((sum, i) => sum + i.sl, 0);
}

// 3. Đăng xuất
function logout() {
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// 4. Format tiền Việt
function formatMoney(num) {
    return Number(num).toLocaleString('vi-VN') + ' đ';
}