const USER_ID = window.CURRENT_USER.id;
const BRAND_ID = window.CURRENT_USER.brand_id;


// Biến toàn cục để lưu trữ danh sách voucher và quảng cáo
let brandVouchers = [];
let mallVouchers = [];
let ads = [];

// Utility function to format number
function formatNumber(number) {
    if (typeof number !== 'number' || isNaN(number)) return '0';
    return number.toLocaleString('vi-VN');
}

function formatDateTime(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d)) return dateString; // fallback nếu không parse được
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Utility function to show messages
function showMessage(container, message, type = 'error') {
    container.innerHTML = `<div class="${type}-message">${message}</div>`;
}

// Fetch and render customer info
async function loadCustomerInfo() {
    const customerName = document.getElementById('customer-name-header').textContent;
    const customerTier = document.getElementById('customer-tier-dropdown').textContent;
    document.getElementById('customer-name').textContent = `Xin chào, ${customerName}!`;
    document.getElementById('customer-tier').textContent = `${customerTier} - Ưu đãi 5% trên mọi hóa đơn`;
    document.getElementById('customer-name-header').textContent = customerName;
    document.getElementById('customer-name-dropdown').textContent = customerName;
    document.getElementById('customer-tier-dropdown').textContent = customerTier;
    document.getElementById('tier-summary').textContent = customerTier;
}

// Fetch and render total points
async function loadTotalPoints() {
    const pointsContainer = document.getElementById('total-points');
    const pointsSummary = document.getElementById('points-summary');
    try {
        const response = await fetch(`/point/get_points/${USER_ID}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi tải điểm');
        pointsContainer.innerHTML = `${formatNumber(data[0]?.total_points)} <span class="text-lg">điểm</span>`;
        pointsSummary.innerHTML = `${formatNumber(data[0]?.total_points)} <span class="text-lg">điểm</span>`;
    } catch (error) {
        console.error('Error loading total points:', error);
        pointsContainer.innerHTML = '<span class="text-red-500">Lỗi tải</span>';
        pointsSummary.innerHTML = '<span class="text-red-500">Lỗi tải</span>';
    }
}

// Fetch and render promotions
async function loadPromotions() {
    const currentContainer = document.getElementById('current-promotions');
    const upcomingContainer = document.getElementById('upcoming-promotions');
    try {
        const response = await fetch(`/campaign/campaigns`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi tải chiến dịch');

        const current = data.filter(c => c.status === 'Đang hoạt động');
        if (current.length > 0) {
            currentContainer.innerHTML = current.map(c => `
                <div class="bg-white rounded-xl shadow-md overflow-hidden transition-all card-hover">
                    <img src="https://placehold.co/600x300/e0e7ff/3730a3?text=${encodeURIComponent(c.title)}" alt="${c.title}" class="w-full h-40 object-cover">
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="text-lg font-bold">${c.title}</h4>
                            <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Đang hoạt động</span>
                        </div>
                        <p class="text-gray-600 text-sm mb-4">${c.description}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-500"><i class="fas fa-store-alt mr-1"></i> Brand </span>
                            <button class="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-all" onclick="redeemCampaign(${c.campaign_id}, ${c.points_required})">
                                Đổi ngay (${formatNumber(c.points_required)} điểm)
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            currentContainer.innerHTML = '<div class="text-gray-600 text-center col-span-full">Không có chiến dịch đang diễn ra hiện tại.</div>';
        }

        const upcoming = data.filter(c => c.status === 'Sắp bắt đầu');
        if (upcoming.length > 0) {
            upcomingContainer.innerHTML = upcoming.map(c => `
                <div class="bg-white rounded-xl shadow-md overflow-hidden transition-all card-hover opacity-75">
                    <img src="https://placehold.co/600x300/e0e7ff/3730a3?text=${encodeURIComponent(c.title)}" alt="${c.title}" class="w-full h-40 object-cover">
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="text-lg font-bold">${c.title}</h4>
                            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Sắp diễn ra</span>
                        </div>
                        <p class="text-gray-600 text-sm mb-4">${c.description}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-500"><i class="fas fa-store-alt mr-1"></i> Brand </span>
                            <button class="bg-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg cursor-not-allowed">
                                Sắp diễn ra
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            upcomingContainer.innerHTML = '<div class="text-gray-600 text-center col-span-full">Không có ưu đãi sắp tới.</div>';
        }
    } catch (error) {
        console.error('Error loading promotions:', error);
        showMessage(currentContainer, `Lỗi tải ưu đãi: ${error.message}`);
        showMessage(upcomingContainer, `Lỗi tải ưu đãi: ${error.message}`);
    }
}

// Fetch and render rewards
async function loadRewards() {
    const rewardsContainer = document.getElementById('rewards-catalog');
    try {
        const response = await fetch(`/voucher/vouchers`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi tải quà tặng');

        if (data.length > 0) {
            rewardsContainer.innerHTML = data.map(v => `
                <div class="bg-white rounded-xl shadow-md overflow-hidden transition-all reward-card">
                    <img src="https://placehold.co/600x400/e0e7ff/3730a3?text=${encodeURIComponent(v.title)}" alt="${v.title}" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <h4 class="text-lg font-bold mb-2">${v.title}</h4>
                        <p class="text-gray-600 text-sm mb-4">${v.description}</p>
                        <div class="flex justify-between items-center">
                            <span class="text-blue-600 font-medium">${formatNumber(v.points_required)} điểm</span>
                            <button class="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-all" onclick="redeemVoucher(${v.voucher_id}, ${v.points_required}, '${v.title}')">
                                Đổi ngay
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            rewardsContainer.innerHTML = '<div class="text-gray-600 text-center col-span-full">Không có quà tặng nào.</div>';
        }
    } catch (error) {
        console.error('Error loading rewards:', error);
        showMessage(rewardsContainer, `Lỗi tải quà tặng: ${error.message}`);
    }
}

// Fetch and render brand vouchers
async function loadUserBrandVouchers() {
    const vouchersContainer = document.getElementById('brand-vouchers-list');
    try {
        const response = await fetch(`/campaign/user_brand_vouchers/${USER_ID}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi tải voucher');

        if (data.length > 0) {
            const grouped = {};
            data.forEach(v => {
                const key = v.redemption_code || v.campaign_id;
                if (!grouped[key]) {
                    grouped[key] = { ...v, quantity: 1 };
                } else {
                    grouped[key].quantity += 1;
                }
            });

            brandVouchers = Object.values(grouped);

            vouchersContainer.innerHTML = brandVouchers.map(v => `
        <div class="voucher-card bg-white rounded-xl shadow-md overflow-hidden transition-all card-hover cursor-pointer flex items-center"
                data-id="${v.campaign_id}" data-source="Brand">
            <div class="p-4 flex-1">
                <h4 class="text-md font-bold mb-1">${v.title}</h4>
                <p class="text-sm text-gray-500 mb-1"><span class="font-medium">Mã đổi:</span> ${v.redemption_code}</p>
                <p class="text-sm text-gray-500 mb-1"><span class="font-medium">Điểm đã dùng:</span> ${formatNumber(v.points_required)} điểm</p>
                <p class="text-sm text-gray-500 mb-1"><span class="font-medium">Số lượng:</span> ${v.quantity}</p>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500"><i class="fas fa-store-alt mr-1"></i> Brand ${BRAND_ID}</span>
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${v.status === 'Chưa sử dụng' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">${v.status || 'Chưa sử dụng'}</span>
                        ${v.status === 'Chưa sử dụng' ? `<button class="bg-green-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-green-700 transition-all" onclick="useVoucher(${v.campaign_id}, 'Brand', event)">Sử dụng</button>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

            // gắn sự kiện click mở modal
            document.querySelectorAll('#brand-vouchers-list .voucher-card').forEach(card => {
                card.addEventListener('click', e => {
                    e.stopPropagation();
                    const id = parseInt(card.getAttribute('data-id'));
                    showVoucherDetails(id, 'Brand');
                });
            });
        } else {
            vouchersContainer.innerHTML = '<div class="text-gray-600 text-center col-span-full">Bạn chưa có voucher nào từ Brand.</div>';
        }
    } catch (error) {
        console.error('Error loading brand vouchers:', error);
        showMessage(vouchersContainer, `Lỗi tải voucher: ${error.message}`);
    }
}


// Fetch and render mall vouchers
async function loadUserMallVouchers() {
    const vouchersContainer = document.getElementById('mall-vouchers-list');
    try {
        const response = await fetch(`/voucher/user_mall_vouchers/${USER_ID}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi tải voucher');

        if (data.length > 0) {
            const grouped = {};
            data.forEach(v => {
                const key = v.redemption_code || v.voucher_id;
                if (!grouped[key]) {
                    grouped[key] = { ...v, quantity: 1 };
                } else {
                    grouped[key].quantity += 1;
                }
            });

            mallVouchers = Object.values(grouped);

            vouchersContainer.innerHTML = mallVouchers.map(v => `
        <div class="voucher-card bg-white rounded-xl shadow-md overflow-hidden transition-all card-hover cursor-pointer flex items-center"
                data-id="${v.voucher_id}" data-source="Mall">
            <div class="p-4 flex-1">
                <h4 class="text-md font-bold mb-1">${v.title}</h4>
                <p class="text-sm text-gray-500 mb-1"><span class="font-medium">Mã đổi:</span> ${v.redemption_code}</p>
                <p class="text-sm text-gray-500 mb-1"><span class="font-medium">Điểm đã dùng:</span> ${formatNumber(v.points_required)} điểm</p>
                <p class="text-sm text-gray-500 mb-1"><span class="font-medium">Số lượng:</span> ${v.quantity}</p>
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500"><i class="fas fa-store-alt mr-1"></i> Mall</span>
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${v.status === 'Chưa sử dụng' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">${v.status || 'Chưa sử dụng'}</span>
                        ${v.status === 'Chưa sử dụng' ? `<button class="bg-green-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-green-700 transition-all" onclick="useVoucher(${v.voucher_id}, 'Mall', event)">Sử dụng</button>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

            // gắn sự kiện click mở modal
            document.querySelectorAll('#mall-vouchers-list .voucher-card').forEach(card => {
                card.addEventListener('click', e => {
                    e.stopPropagation();
                    const id = parseInt(card.getAttribute('data-id'));
                    showVoucherDetails(id, 'Mall');
                });
            });
        } else {
            vouchersContainer.innerHTML = '<div class="text-gray-600 text-center col-span-full">Bạn chưa có voucher nào từ Mall.</div>';
        }
    } catch (error) {
        console.error('Error loading mall vouchers:', error);
        showMessage(vouchersContainer, `Lỗi tải voucher: ${error.message}`);
    }
}


// Load all user vouchers
async function loadUserVouchers() {
    await Promise.all([
        loadUserBrandVouchers(),
        loadUserMallVouchers()
    ]);
}

// Show voucher details in modal
function showVoucherDetails(id, source) {
    let voucher;
    if (source === 'Brand') {
        voucher = brandVouchers.find(v => v.campaign_id === id);
    } else if (source === 'Mall') {
        voucher = mallVouchers.find(v => v.voucher_id === id);
    }

    if (!voucher) {
        console.error(`Voucher with ID ${id} not found for source ${source}`);
        return;
    }

    document.getElementById('voucherModalTitle').textContent = voucher.title;
    document.getElementById('voucherModalDescription').textContent = voucher.description;
    document.getElementById('voucherModalCode').textContent = voucher.redemption_code;
    document.getElementById('voucherModalQuantity').textContent = voucher.quantity !== undefined ? voucher.quantity : 'N/A';
    document.getElementById('voucherModalInstructions').textContent = voucher.usage_instructions || 'Không có hướng dẫn cụ thể.';
    document.getElementById('voucherModalPoints').textContent = formatNumber(voucher.points_required);
    document.getElementById('voucherModalDate').textContent = new Date(voucher.redeemed_at || voucher.created_at).toLocaleString('vi-VN');
    document.getElementById('voucherModalSource').textContent = voucher.brand_id;
    document.getElementById('voucherModalStatus').textContent = voucher.status || 'Chưa sử dụng';

    // Hiển thị thời gian áp dụng và hạn sử dụng
    document.getElementById('voucherModalStartAt').textContent = formatDateTime(voucher.start_at) || 'N/A';
    document.getElementById('voucherModalEndAt').textContent = formatDateTime(voucher.end_at) || 'N/A';

    // Hiển thị nút "Sử dụng" nếu trạng thái là "Chưa sử dụng"
    const useButtonContainer = document.getElementById('useVoucherButton');
    if (voucher.status === 'Chưa sử dụng') {
        useButtonContainer.innerHTML = `
            <button class="use-voucher-button" onclick="useVoucher(${id}, '${source}', event)">
                Sử dụng
            </button>
        `;
    } else {
        useButtonContainer.innerHTML = '';
    }

    // Ẩn thông báo "Đã sao chép" khi mở modal
    document.getElementById('copyMessage').classList.add('hidden');

    document.getElementById('voucherModal').style.display = 'flex';
}

// Close voucher modal
function closeVoucherModal() {
    document.getElementById('voucherModal').style.display = 'none';
}

// Redeem campaign
async function redeemCampaign(campaignId, pointsRequired) {
    try {
        const pointsResponse = await fetch(`/point/get_user_points/${USER_ID}`);
        const pointsData = await pointsResponse.json();
        if (!pointsResponse.ok) throw new Error(pointsData.error || 'Lỗi kiểm tra điểm');
        if (pointsData.total_points < pointsRequired) {
            alert('Bạn không đủ điểm để đổi chiến dịch này.');
            return;
        }

        const response = await fetch(`/campaign/campaigns/${campaignId}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: USER_ID })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi khi đổi chiến dịch');

        await fetch('/point/redeem_points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: USER_ID,
                campaign_id: campaignId,
                points_required: pointsRequired,
                description: `Đổi ưu đãi với mã ${data.redemption_code}`,
                redemption_code: data.redemption_code
            })
        });

        alert(`Đổi ưu đãi từ chiến dịch thành công! Mã đổi: ${data.redemption_code}`);
        loadTotalPoints();
        loadTransactionHistory();
        loadUserBrandVouchers();
    } catch (error) {
        console.error('Error redeeming campaign:', error);
        alert(`Lỗi: ${error.message}`);
    }
}

// Redeem voucher
async function redeemVoucher(voucherId, pointsRequired, voucherTitle) {
    try {
        if (!USER_ID || isNaN(USER_ID)) {
            throw new Error('USER_ID không hợp lệ hoặc không được định nghĩa!');
        }

        const pointsResponse = await fetch(`/point/get_user_points/${USER_ID}`);
        const pointsData = await pointsResponse.json();
        if (!pointsResponse.ok) throw new Error(pointsData.error || 'Lỗi kiểm tra điểm');
        if (pointsData.total_points < pointsRequired) {
            alert('Bạn không đủ điểm để đổi quà này.');
            return;
        }

        const redemptionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const response = await fetch(`/voucher/vouchers/${voucherId}/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: USER_ID,
                points_spent: pointsRequired,
                redemption_code: redemptionCode
            })
        });

        const responseText = await response.text();
        if (!response.ok) {
            console.error('Raw response:', responseText);
            throw new Error(`Lỗi khi đổi quà: ${responseText}`);
        }

        const data = JSON.parse(responseText);

        const redeemPointsResponse = await fetch('/point/redeem_points_by_voucher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: USER_ID,
                points_required: pointsRequired,
                voucher_id: voucherId,
                description: `Đổi voucher "${voucherTitle}" với mã ${redemptionCode}`,
                redemption_code: redemptionCode
            })
        });
        const redeemPointsData = await redeemPointsResponse.json();
        if (!redeemPointsResponse.ok) throw new Error(redeemPointsData.error || 'Lỗi khi trừ điểm');

        alert(`Đổi quà "${voucherTitle}" thành công! Mã đổi: ${redemptionCode}`);
        loadTotalPoints();
        loadTransactionHistory();
        loadUserMallVouchers();
    } catch (error) {
        console.error('Error redeeming voucher:', error);
        alert(`Lỗi: ${error.message}`);
    }
}



// Biến toàn cục
let allTransactions = [];
let filteredTransactions = [];
let transactionCurrentPage = 1;
const transactionPerPage = 5;

// Render danh sách giao dịch theo trang
function renderTransactionsPaginated(transactions) {
    const historyContainer = document.getElementById('transaction-history');
    const transactionCount = document.getElementById('transaction-count');

    const totalPages = Math.ceil(transactions.length / transactionPerPage);
    if (transactionCurrentPage > totalPages) transactionCurrentPage = totalPages || 1;

    const start = (transactionCurrentPage - 1) * transactionPerPage;
    const paginated = transactions.slice(start, start + transactionPerPage);

    if (paginated.length > 0) {
        historyContainer.innerHTML = paginated.map(t => `
    <tr>
        <td class="px-6 py-4 text-sm text-gray-500">
            ${new Date(t.date).toLocaleString('vi-VN')}
        </td>
        <td class="px-6 py-4 text-sm font-medium text-gray-900">
            ${t.transaction_id}
        </td>
        <td class="px-6 py-4 text-sm text-gray-900">
            ${t.store}
        </td>
        <td class="px-6 py-4 text-sm text-gray-900">
            ${t.description}
        </td>
        <td class="px-6 py-4 text-sm ${t.points < 0 ? 'text-red-600' : 'text-green-600'} font-medium">
            ${t.points < 0 ? '' : '+'}${formatNumber(t.points)}
        </td>
        <td class="px-6 py-4 text-sm">
            <span class="px-2 py-1 rounded-full bg-green-100 text-green-800">${t.status}</span>
        </td>
    </tr>
`).join('');
    } else {
        historyContainer.innerHTML = `
    <tr>
        <td colspan="6" class="py-4 px-4 text-center text-gray-600">
            Không có giao dịch nào.
        </td>
    </tr>
`;
    }

    transactionCount.textContent = `Hiển thị ${paginated.length} trên tổng số ${transactions.length} giao dịch`;
    renderTransactionPagination(totalPages);
}

// Render pagination (Prev, số trang, Next)
function renderTransactionPagination(totalPages) {
    const container = document.getElementById('transaction-pagination');
    let html = '';

    // Prev
    html += `
<button ${transactionCurrentPage === 1 ? 'disabled' : ''} 
onclick="changeTransactionPage(${transactionCurrentPage - 1})"
class="px-3 py-1 border rounded-lg 
${transactionCurrentPage === 1 ? 'opacity-50 cursor-not-allowed bg-gray-200' : 'bg-white hover:bg-gray-50'}">
<i class="fas fa-chevron-left"></i>
</button>
`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        html += `
    <button onclick="changeTransactionPage(${i})"
    class="px-3 py-1 border rounded-lg 
    ${i === transactionCurrentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 hover:bg-gray-50'}">
    ${i}
    </button>
`;
    }

    // Next
    html += `
<button ${transactionCurrentPage === totalPages ? 'disabled' : ''} 
onclick="changeTransactionPage(${transactionCurrentPage + 1})"
class="px-3 py-1 border rounded-lg 
${transactionCurrentPage === totalPages ? 'opacity-50 cursor-not-allowed bg-gray-200' : 'bg-white hover:bg-gray-50'}">
<i class="fas fa-chevron-right"></i>
</button>
`;

    container.innerHTML = html;
}

// Đổi trang
function changeTransactionPage(page) {
    const totalPages = Math.ceil(filteredTransactions.length / transactionPerPage);
    if (page < 1 || page > totalPages) return;
    transactionCurrentPage = page;
    renderTransactionsPaginated(filteredTransactions);
}

// Load transaction history từ API
async function loadTransactionHistory() {
    const historyContainer = document.getElementById('transaction-history');
    try {
        const response = await fetch(`/point/${USER_ID}/transaction_history`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi tải lịch sử giao dịch');

        allTransactions = data.transactions || [];
        transactionCurrentPage = 1;
        filterTransactions();
    } catch (error) {
        console.error('Error loading transaction history:', error);
        historyContainer.innerHTML = `
    <tr>
        <td colspan="6" class="py-4 px-4 text-center text-red-600">
            Lỗi tải lịch sử: ${error.message}
        </td>
    </tr>
`;
    }
}

// Lọc giao dịch (có thể mở rộng thêm filter theo ngày/loại)
function filterTransactions() {
    const typeFilter = document.getElementById('transactionTypeFilter').value;
    const dateFilter = document.getElementById('transactionDateFilter').value;

    filteredTransactions = allTransactions;

    // Lọc theo loại giao dịch
    if (typeFilter !== 'all') {
        if (typeFilter === 'earn') {
            filteredTransactions = filteredTransactions.filter(t => t.points > 0);
        } else if (typeFilter === 'spend') {
            filteredTransactions = filteredTransactions.filter(t => t.points < 0);
        }
    }

    // Lọc theo ngày
    if (dateFilter) {
        const selectedDate = new Date(dateFilter);
        filteredTransactions = filteredTransactions.filter(t => {
            const transDate = new Date(t.date);
            return transDate.toDateString() === selectedDate.toDateString();
        });
    }

    transactionCurrentPage = 1;
    renderTransactionsPaginated(filteredTransactions);
}




// Use voucher
async function useVoucher(id, source, event) {
    event.stopPropagation(); // Ngăn chặn mở modal khi nhấn nút "Sử dụng"
    try {
        let endpoint;
        if (source === 'Brand') {
            endpoint = `/campaign/campaign_redemption/${id}/use`;
        } else if (source === 'Mall') {
            endpoint = `/voucher/voucher_redemption/${id}/use`;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: USER_ID })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi khi sử dụng voucher');

        alert('Sử dụng voucher thành công!');
        // Làm mới danh sách voucher
        await loadUserVouchers();

    } catch (error) {
        console.error('Error using voucher:', error);
        alert(`Lỗi: ${error.message}`);
    }
}

// Copy redemption code to clipboard
function copyCode() {
    const code = document.getElementById('voucherModalCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const copyMessage = document.getElementById('copyMessage');
        copyMessage.classList.remove('hidden');
        copyMessage.classList.add('show');
        setTimeout(() => {
            copyMessage.classList.remove('show');
            copyMessage.classList.add('hidden');
        }, 2000); // Ẩn thông báo sau 2 giây
    }).catch(err => {
        console.error('Failed to copy code:', err);
        alert('Không thể sao chép mã. Vui lòng thử lại!');
    });
}

// Fetch and render ads
// Biến toàn cục để lưu trữ trạng thái quảng cáo đã tắt
let dismissedAds = JSON.parse(localStorage.getItem('dismissedAds')) || [];

// Fetch and render ads
async function loadAds() {
    await cleanUpDismissedAds();
    const adContainer = document.getElementById('ad-list');
    try {
        const response = await fetch(`/ad/get_ads`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi tải quảng cáo');

        ads = Array.isArray(data) ? data : data.ads || [];
        if (ads.length > 0) {
            // Lọc các quảng cáo chưa bị tắt
            const visibleAds = ads.filter(ad => !dismissedAds.includes(ad.ad_id));
            if (visibleAds.length > 0) {
                adContainer.innerHTML = visibleAds.map(ad => `
                    <div class="bg-white rounded-xl shadow-md overflow-hidden transition-all card-hover cursor-pointer ad-card relative" data-id="${ad.ad_id}">
                        <img src="https://placehold.co/600x300/e0e7ff/3730a3?text=${encodeURIComponent(ad.title)}" alt="${ad.title}" class="w-full h-40 object-cover">
                        <div class="p-6">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="text-lg font-bold">${ad.title}</h4>
                                <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Đang hoạt động</span>
                            </div>
                            <p class="text-gray-600 text-sm mb-4">${ad.description}</p>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-500"><i class="fas fa-store-alt mr-1"></i> Brand ${ad.brand_id}</span>
                                <button class="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-all" onclick="viewAd(${ad.ad_id}, event)">
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                        <!-- Nút Tắt bên ngoài -->
                        <button class="absolute top-2 right-2 bg-gray-200 text-gray-600 p-2 rounded-full hover:bg-gray-300 transition-all dismiss-ad-btn" onclick="dismissAd(${ad.ad_id}, event)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('');

                // Gắn sự kiện click cho các thẻ quảng cáo
                document.querySelectorAll('.ad-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const adId = parseInt(card.getAttribute('data-id'));
                        showAdDetails(adId);
                    });
                });
            } else {
                adContainer.innerHTML = '<div class="text-gray-600 text-center col-span-full">Không có quảng cáo nào đang hoạt động.</div>';
            }
        } else {
            adContainer.innerHTML = '<div class="text-gray-600 text-center col-span-full">Không có quảng cáo nào đang hoạt động.</div>';
        }
    } catch (error) {
        console.error('Error loading ads:', error);
        showMessage(adContainer, `Lỗi tải quảng cáo: ${error.message}`);
    }
}

// Hàm xử lý khi người dùng nhấn nút "Tắt" bên ngoài quảng cáo
async function dismissAd(adId, event) {
    event.stopPropagation(); // Ngăn mở modal khi nhấn nút "Tắt"

    try {
        // Ghi lại hành động DISMISS
        const response = await fetch('/ad/interaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ad_id: adId,
                user_id: USER_ID,
                action: 'DISMISS'
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi ghi lại hành động');
        console.log('Ad dismissed:', data.message);

        // Ẩn quảng cáo
        const adCard = document.querySelector(`.ad-card[data-id="${adId}"]`);
        if (adCard) {
            adCard.style.display = 'none';
        }

        // Lưu trạng thái tắt vào localStorage
        if (!dismissedAds.includes(adId)) {
            dismissedAds.push(adId);
            localStorage.setItem('dismissedAds', JSON.stringify(dismissedAds));
        }

        // Kiểm tra nếu không còn quảng cáo nào hiển thị
        const visibleAds = document.querySelectorAll('.ad-card:not([style*="display: none"])');
        if (visibleAds.length === 0) {
            const adContainer = document.getElementById('ad-list');
            adContainer.innerHTML = '<div class="text-gray-600 text-center col-span-full">Không có quảng cáo nào đang hoạt động.</div>';
        }
    } catch (error) {
        console.error('Error dismissing ad:', error);
        alert(`Lỗi: ${error.message}`);
    }
    alert('Quảng cáo đã được tắt.');
}

// Hiển thị chi tiết quảng cáo trong modal
async function showAdDetails(adId) {
    const ad = ads.find(ad => ad.ad_id === adId);
    if (!ad) {
        console.error(`Ad with ID ${adId} not found`);
        return;
    }

    // Lưu adId vào modal để sử dụng khi đóng
    const modalContent = document.querySelector('#adDetailModal .modal-content');
    modalContent.setAttribute('data-id', adId);

    document.getElementById('adDetailTitle').textContent = ad.title;
    document.getElementById('adDetailDescription').textContent = ad.description;
    document.getElementById('adDetailStartAt').textContent = new Date(ad.start_at).toLocaleString('vi-VN');
    document.getElementById('adDetailEndAt').textContent = new Date(ad.end_at).toLocaleString('vi-VN');

    // Thêm nút "Tắt" vào nội dung modal
    const adDetailContent = document.getElementById('adDetailContent');
    adDetailContent.innerHTML = `
        <h3 class="text-xl font-bold mb-2" id="adDetailTitle">${ad.title}</h3>
        <p class="text-gray-600 mb-4" id="adDetailDescription">${ad.description}</p>
        <p class="text-sm text-gray-500 mb-2"><strong>Thời gian áp dụng:</strong> <span id="adDetailStartAt">${new Date(ad.start_at).toLocaleString('vi-VN')}</span></p>
        <p class="text-sm text-gray-500 mb-4"><strong>Hạn sử dụng:</strong> <span id="adDetailEndAt">${new Date(ad.end_at).toLocaleString('vi-VN')}</span></p>
    `;

    document.getElementById('adDetailModal').style.display = 'flex';

    // Ghi lại hành động xem quảng cáo
    try {
        const response = await fetch('/ad/interaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ad_id: adId,
                user_id: USER_ID,
                action: 'VIEW'
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi ghi lại hành động');
        console.log('Ad viewed:', data.message);
    } catch (error) {
        console.error('Error recording view:', error);
    }
}

// Đóng modal chi tiết quảng cáo (không ghi nhận "DISMISS" và không ẩn quảng cáo)
async function closeAdDetailModal() {
    // Đóng modal mà không ghi nhận "DISMISS"
    document.getElementById('adDetailModal').style.display = 'none';
}

// Hàm xử lý khi người dùng nhấn nút "Tắt" trong modal (không ẩn quảng cáo, không ghi nhận "DISMISS")
function dismissAdInModal(adId, event) {
    event.stopPropagation(); // Ngăn chặn các sự kiện khác

    // Không ẩn quảng cáo, không ghi nhận "DISMISS", chỉ đóng modal
    closeAdDetailModal();
}

async function cleanUpDismissedAds() {
    const response = await fetch(`/ad/active`);
    const data = await response.json();
    if (!response.ok) return;

    // Nếu API trả về object { ads: [...] }
    const ads = Array.isArray(data) ? data : data.ads || [];

    const activeAdIds = ads.map(ad => ad.ad_id);
    dismissedAds = dismissedAds.filter(adId => activeAdIds.includes(adId));
    localStorage.setItem('dismissedAds', JSON.stringify(dismissedAds));
}


// Biến toàn cục để lưu trữ lịch sử voucher đã sử dụng
let usedBrandVouchers = [];
let usedMallVouchers = [];

// Fetch danh sách voucher đã sử dụng từ Brand
async function loadUsedBrandVouchers() {
    try {
        const response = await fetch(`/campaign/user_brand_used_vouchers/${USER_ID}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi tải lịch sử voucher từ Brand');
        usedBrandVouchers = data.map(v => ({ ...v, source: 'Brand' }));
    } catch (error) {
        console.error('Error loading used brand vouchers:', error);
        usedBrandVouchers = [];
    }
}

// Fetch danh sách voucher đã sử dụng từ Mall
async function loadUsedMallVouchers() {
    try {
        const response = await fetch(`/voucher/user_mall_used_vouchers/${USER_ID}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi tải lịch sử voucher từ Mall');
        usedMallVouchers = data.map(v => ({ ...v, source: 'Mall' }));
    } catch (error) {
        console.error('Error loading used mall vouchers:', error);
        usedMallVouchers = [];
    }
}

// Load tất cả lịch sử voucher đã sử dụng
// ==================== VOUCHER HISTORY WITH PAGINATION ====================

// Biến toàn cục
let allVoucherHistory = [];
let filteredVouchers = [];
let voucherCurrentPage = 1;
const voucherPerPage = 5;

// Render danh sách voucher theo trang
function renderVoucherHistoryPaginated(vouchers) {
    const historyContainer = document.getElementById('voucher-history-list');
    const countContainer = document.getElementById('voucher-history-count');

    const totalPages = Math.ceil(vouchers.length / voucherPerPage);
    if (voucherCurrentPage > totalPages) voucherCurrentPage = totalPages || 1;

    const start = (voucherCurrentPage - 1) * voucherPerPage;
    const paginated = vouchers.slice(start, start + voucherPerPage);

    if (paginated.length > 0) {
        historyContainer.innerHTML = paginated.map(v => `
    <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${new Date(v.used_at).toLocaleString('vi-VN')}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            ${v.redemption_code}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${v.title}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            ${v.source === 'Brand' ? `Brand ${v.brand_id}` : 'Mall'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
            ${formatNumber(v.points_required)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                ${v.status}
            </span>
        </td>
    </tr>
`).join('');
    } else {
        historyContainer.innerHTML = `
    <tr>
        <td colspan="6" class="py-4 px-4 text-center text-gray-600">
            Không có voucher nào đã sử dụng.
        </td>
    </tr>
`;
    }

    countContainer.textContent = `Hiển thị ${paginated.length} trên tổng số ${vouchers.length} voucher`;
    renderVoucherPagination(totalPages);
}

// Render pagination (Prev, page numbers, Next)
function renderVoucherPagination(totalPages) {
    const paginationContainer = document.getElementById('voucher-pagination');
    let html = '';

    // Prev
    html += `
<button ${voucherCurrentPage === 1 ? 'disabled' : ''}
onclick="changeVoucherPage(${voucherCurrentPage - 1})"
class="px-3 py-1 border rounded-lg 
${voucherCurrentPage === 1 ? 'opacity-50 cursor-not-allowed bg-gray-200' : 'bg-white hover:bg-gray-50'}">
<i class="fas fa-chevron-left"></i>
</button>
`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        html += `
    <button onclick="changeVoucherPage(${i})"
    class="px-3 py-1 border rounded-lg 
    ${i === voucherCurrentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 hover:bg-gray-50'}">
    ${i}
    </button>
`;
    }

    // Next
    html += `
<button ${voucherCurrentPage === totalPages ? 'disabled' : ''}
onclick="changeVoucherPage(${voucherCurrentPage + 1})"
class="px-3 py-1 border rounded-lg 
${voucherCurrentPage === totalPages ? 'opacity-50 cursor-not-allowed bg-gray-200' : 'bg-white hover:bg-gray-50'}">
<i class="fas fa-chevron-right"></i>
</button>
`;

    paginationContainer.innerHTML = html;
}

// Đổi trang
function changeVoucherPage(page) {
    const totalPages = Math.ceil(filteredVouchers.length / voucherPerPage);
    if (page < 1 || page > totalPages) return;
    voucherCurrentPage = page;
    renderVoucherHistoryPaginated(filteredVouchers);
}

function renderVoucherHistory() {
    const sourceFilter = document.getElementById('voucherSourceFilter').value;
    const dateFilter = document.getElementById('voucherDateFilter').value;

    // Gộp danh sách Brand + Mall
    allVoucherHistory = [...usedBrandVouchers, ...usedMallVouchers];

    filteredVouchers = allVoucherHistory;

    // Lọc theo nguồn
    if (sourceFilter !== 'all') {
        filteredVouchers = filteredVouchers.filter(v => v.source === sourceFilter);
    }

    // Lọc theo ngày
    if (dateFilter) {
        const selectedDate = new Date(dateFilter);
        filteredVouchers = filteredVouchers.filter(v => {
            const usedDate = new Date(v.used_at);
            return usedDate.toDateString() === selectedDate.toDateString();
        });
    }

    voucherCurrentPage = 1;
    renderVoucherHistoryPaginated(filteredVouchers);
}

async function loadUsedVouchers() {
    await Promise.allSettled([
        loadUsedBrandVouchers(),
        loadUsedMallVouchers()
    ]);
    renderVoucherHistory();
}

async function loadProfile() {
    try {
        const res = await fetch(`/user/profile/${USER_ID}`);
        const data = await res.json();
        console.log("Profile API trả về:", data);

        if (!res.ok) throw new Error(data.message || "Lỗi tải hồ sơ");

        const profile = data.profile;

        // Avatar = chữ cái đầu
        const name = profile.fullname || "User";
        const initial = name.trim().charAt(0).toUpperCase();

        const avatarDiv = document.getElementById("avatar");
        if (avatarDiv) {
            avatarDiv.textContent = initial;
            const colors = ["bg-blue-600", "bg-purple-600", "bg-pink-600", "bg-green-600", "bg-yellow-600"];
            const randomColor = colors[profile.user_id % colors.length];
            avatarDiv.className =
                "w-32 h-32 rounded-full border-4 border-blue-100 shadow-md flex items-center justify-center " +
                "text-4xl font-bold text-white select-none " + randomColor;
        }

        // Form dữ liệu cá nhân
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val ?? "";
        };

        setVal("fullname", profile.fullname);
        setVal("email", profile.email);
        setVal("date_of_birth", profile.date_of_birth ? new Date(profile.date_of_birth).toISOString().split("T")[0] : "");
        setVal("gender", profile.gender == 1 ? "1" : "0");
        setVal("phone", profile.phone);
        setVal("address", profile.address);

        // Điểm hiện có
        const pointRes = await fetch(`/point/wallet/${USER_ID}`);
        const pointData = await pointRes.json();
        const pointsEl = document.getElementById("profile-points");
        if (pointsEl) pointsEl.textContent = pointData.total_points ?? 0;

        // Mã giới thiệu + số lần giới thiệu
        const referralRes = await fetch(`/user/referrals/info/${USER_ID}`);
        const referralData = await referralRes.json();
        const codeEl = document.getElementById("referral-code");
        if (codeEl) codeEl.textContent = referralData.code || "N/A";
        const countEl = document.getElementById("referral-count");
        if (countEl) countEl.textContent = referralData.count ?? 0;

        // Ngày đăng ký
        const regDateEl = document.getElementById("register-date");
        if (regDateEl) regDateEl.textContent = profile.created_at
            ? new Date(profile.created_at).toLocaleDateString("vi-VN")
            : "--/--/----";

        // Chiến dịch đã tham gia
        const campaignRes = await fetch(`/campaign/joined/${USER_ID}`);
        const campaigns = await campaignRes.json();
        const ul = document.getElementById("joined-campaigns");
        if (ul) {
            ul.innerHTML = "";
            if (!campaigns || campaigns.length === 0) {
                ul.innerHTML = "<li class='text-gray-500'>Chưa tham gia chiến dịch nào</li>";
            } else {
                campaigns.forEach(c => {
                    const li = document.createElement("li");
                    li.className = "text-gray-700";
                    li.textContent = `• ${c.title} (Điểm đã dùng: ${c.points_spent})`;
                    ul.appendChild(li);
                });
            }
        }

    } catch (err) {
        console.error("Lỗi load hồ sơ:", err);
    }
}


document.getElementById("btnUpdate").addEventListener("click", async () => {
    try {
        const payload = {
            date_of_birth: document.getElementById("date_of_birth").value,
            gender: document.getElementById("gender").value,
            phone: document.getElementById("phone").value,
            address: document.getElementById("address").value
        };

        const response = await fetch(`/user/profile/${USER_ID}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Cập nhật thất bại");

        alert("Cập nhật thành công!");
        loadProfile(); // reload lại form sau khi cập nhật
    } catch (err) {
        console.error("Lỗi updateProfile:", err);
        alert("Cập nhật thất bại!");
    }
});
function copyReferralCode() {
    const code = document.getElementById("referral-code").textContent;
    navigator.clipboard.writeText(code).then(() => {
        alert("Đã sao chép mã: " + code);
    }).catch(err => {
        console.error("Không thể copy mã:", err);
    });
}



// Initialize
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('tab-active'));
            document.querySelectorAll('[data-content]').forEach(c => c.classList.remove('active'));
            btn.classList.add('tab-active');
            const target = btn.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
        });
    });

    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('hidden');
    });

    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        notificationDropdown.classList.add('hidden');
        profileDropdown.classList.add('hidden');
        closeVoucherModal();
        closeAdDetailModal();
    });

    notificationDropdown.addEventListener('click', (e) => e.stopPropagation());
    profileDropdown.addEventListener('click', (e) => e.stopPropagation());
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', (e) => e.stopPropagation());
    });

    // Gắn sự kiện lọc cho phần lịch sử giao dịch
    document.getElementById('transactionTypeFilter').addEventListener('change', filterTransactions);
    document.getElementById('transactionDateFilter').addEventListener('change', filterTransactions);

    // Gắn sự kiện lọc cho phần lịch sử sử dụng voucher
    document.getElementById('voucherSourceFilter').addEventListener('change', renderVoucherHistory);
    document.getElementById('voucherDateFilter').addEventListener('change', renderVoucherHistory);


    // Gắn lại sự kiện click cho các voucher-card nếu bị mất
    document.querySelectorAll('.voucher-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = card.getAttribute('data-id');
            const source = card.getAttribute('data-source');
            showVoucherDetails(Number(id), source);
        });
    });

    Promise.allSettled([
        loadCustomerInfo(),
        loadTotalPoints(),
        loadPromotions(),
        loadRewards(),
        loadUserVouchers(),
        loadTransactionHistory(),
        loadAds(),
        loadUsedVouchers(),
        loadProfile()
    ]).then(results => {
        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                console.error(`Load failed for task ${index}:`, result.reason);
            }
        });
    });
});
document.addEventListener('DOMContentLoaded', loadProfile);

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("notificationBtn");
    const dropdown = document.getElementById("notificationDropdown");
    const list = document.getElementById("notificationList");
    const badge = document.getElementById("notificationBadge");

    if (!btn || !dropdown || !list || !badge) return;

    // 1) Badge khi vào trang
    updateBadge();

    // 2) Click chuông: mở dropdown -> hiển thị "Đang tải..." -> fetch rồi render
    btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (dropdown.classList.contains("hidden")) {
            dropdown.classList.remove("hidden");
            list.innerHTML = `<div class="p-4 text-center text-gray-500">Đang tải...</div>`;
            await loadNotifications();
        } else {
            dropdown.classList.add("hidden");
        }
    });

    // 3) Click ra ngoài mới ẩn (outside click)
    document.addEventListener("click", (e) => {
        if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add("hidden");
        }
    });

    async function loadNotifications() {
        try {
            const res = await fetch(`/notification/list/customer/${USER_ID}`);
            const data = await res.json();

            if (!res.ok || !data.success) throw new Error(data.message || "Lỗi tải thông báo");

            const items = data.notifications || [];
            if (items.length === 0) {
                list.innerHTML = `<div class="p-4 text-center text-gray-500">Không có thông báo</div>`;
                badge.classList.add("hidden");
            } else {
                list.innerHTML = items.map(n => `
    <div class="px-4 py-3 hover:bg-gray-50 border-b">
    <p class="text-sm font-medium text-gray-800">${n.title}</p>
    <p class="text-xs text-gray-600">${n.message || ""}</p>
    <p class="text-xs text-gray-400">${new Date(n.created_at).toLocaleString('vi-VN')}</p>
    </div>
`).join("");
                badge.textContent = items.length;
                badge.classList.remove("hidden");
            }
        } catch (err) {
            console.error("Lỗi load thông báo:", err);
            list.innerHTML = `<div class="p-4 text-center text-red-500">Không tải được thông báo</div>`;
            badge.classList.add("hidden");
        }
    }

    async function updateBadge() {
        try {
            const res = await fetch(`/notification/list/customer/${USER_ID}`);
            const data = await res.json();
            const items = (res.ok && data.success && data.notifications) ? data.notifications : [];
            if (items.length > 0) {
                badge.textContent = items.length;
                badge.classList.remove("hidden");
            } else {
                badge.classList.add("hidden");
            }
        } catch (err) {
            console.error("Badge error:", err);
        }
    }
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
        if (!dropdown.classList.contains('hidden')) {
            loadNotifications();
        }
    })
});

