
const BRAND_ID = window.CURRENT_USER?.brand_id || null;
const USER_ID = window.CURRENT_USER?.id || null;
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return "N/A";

    // ép kiểu sang số
    const num = Number(amount);
    if (isNaN(num)) return "N/A";

    if (num === 0) return "0";

    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}
document.addEventListener('DOMContentLoaded', function () {
    // Lấy các phần tử
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const contentSections = document.querySelectorAll('[data-content]');
    const mobileMenuButton = document.querySelector('.md\\:hidden.text-white');
    const sidebar = document.querySelector('.sidebar-gradient');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    // Xử lý nhấp chuột vào sidebar items
    sidebarItems.forEach(item => {
        item.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.getAttribute('data-target');

            // Xóa lớp active khỏi tất cả các phần nội dung
            contentSections.forEach(section => {
                section.classList.remove('active');
            });

            // Thêm lớp active cho phần nội dung được chọn
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Cập nhật trạng thái active cho sidebar item
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Đóng sidebar trên mobile sau khi chọn
            if (window.innerWidth < 768 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                sidebar.classList.add('hidden');
                sidebarOverlay.classList.add('hidden');
                const icon = mobileMenuButton.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // Xử lý nút menu mobile
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function () {
            if (sidebar.classList.contains('hidden')) {
                sidebar.classList.remove('hidden');
                sidebar.classList.add('open');
                sidebarOverlay.classList.remove('hidden');
                const icon = this.querySelector('i');
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                sidebar.classList.remove('open');
                sidebar.classList.add('hidden');
                sidebarOverlay.classList.add('hidden');
                const icon = this.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Đóng sidebar khi nhấp vào overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            sidebar.classList.add('hidden');
            this.classList.add('hidden');
            const icon = mobileMenuButton.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    }

    // Khởi tạo biểu đồ trong phần báo cáo

});

const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');

profileBtn.addEventListener('click', function (e) {
    e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài
    profileDropdown.classList.toggle('hidden');
});

document.addEventListener('click', function (e) {
    if (!profileDropdown.classList.contains('hidden')) {
        profileDropdown.classList.add('hidden');
    }
});

async function fetchBrandCount() {
    try {
        // Gọi API
        const response = await fetch('/brand/count_brand');
        const data = await response.json();

        const brandCountElement = document.getElementById('brand-count');
        brandCountElement.textContent = data.total;

    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

async function fetchRunningCampaigns() {
    try {
        const response = await fetch('/campaign/count_campaigns');
        const data = await response.json();
        const campaignCountElement = document.getElementById('campaign-count');
        campaignCountElement.textContent = data.total;
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

async function fetchCountUsers() {
    try {
        const response = await fetch('/user/count_user');
        const data = await response.json();

        const campaignCountElement = document.getElementById('user_count');
        campaignCountElement.textContent = data.count;
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

async function fetchCountTotalUser() {
    try {
        const response = await fetch('/user/count_total');
        const data = await response.json();
        const el = document.getElementById('total-account');
        if (el) el.textContent = data.count || 0;
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

async function fetchCountAdmin() {
    try {
        const response = await fetch('/user/count_admin');
        const data = await response.json();
        const el = document.getElementById('total-admin');
        if (el) el.textContent = data.count || 0;
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

async function fetchCountUser() {
    try {
        const response = await fetch('/user/count_user');
        const data = await response.json();
        const el = document.getElementById('total-user');
        if (el) el.textContent = data.count || 0;
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

async function monthlyRevenue() {
    try {
        const response = await fetch('/point/monthly_revenue');
        const data = await response.json();
        const revenueCountElement = document.getElementById('monthly-revenue');
        revenueCountElement.textContent = data.total;
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
    }
}

async function loadBrands() {
    try {
        const response = await fetch('/brand/get_brand');
        const brand = await response.json();
        const brands = brand.brands;

        const tbody = document.getElementById('brand-table-body');
        tbody.innerHTML = '';

        brands.forEach(brand => {

            if (brand.status !== 1) {
                return;
            }
            const statusColor = getStatusColor(brand.status);

            const startDate = brand.start_at ? formatDate(brand.start_at) : '';
            const endDate = brand.end_at ? formatDate(brand.end_at) : '';

            const row = `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                <div class=" items-left">
                    <div class="flex-shrink-0 h-10 w-10">
                    </div>
                    <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${brand.brandname}</div>
                    </div>
                </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${brand.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    2
                </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${startDate} - ${endDate}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                    ${brand.status}
                </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <a href="#" class="text-blue-600 hover:text-blue-900 mr-3">Chi tiết</a>
                <a href="#" class="text-red-600 hover:text-red-900">Xóa</a>
                </td>
            </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });

    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
    }
}

function getStatusColor(status) {
    switch (status) {
        case '1':
            return 'bg-green-100 text-green-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}
async function drawMonthlyRevenueChart() {
    try {
        const response = await fetch('/point/monthly_revenue_chart');
        const data = await response.json();
        const ctx = document.getElementById('revenueChart').getContext('2d');
        // Đảo ngược để tháng cũ lên trước
        const months = data.months.slice().reverse();
        const totals = data.totals.slice().reverse();
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Doanh thu (VND)',
                    data: totals,
                    backgroundColor: 'rgba(30, 64, 175, 0.7)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => value.toLocaleString('vi-VN')
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Lỗi khi vẽ biểu đồ doanh thu:', error);
    }
}

async function drawBrandbyTypeChart() {
    try {
        const response = await fetch('/brand/brand_by_type_chart');
        const data = await response.json();
        // Chuyển đổi dữ liệu trả về thành labels và values
        const labels = data.brand_by_type.map(item => item.name);
        const values = data.brand_by_type.map(item => item.total);

        const ctx = document.getElementById('brandTypeChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số lượng Brand theo loại',
                    data: values,
                    backgroundColor: ['#4F46E5', '#3B82F6', '#10B981', '#FBBF24']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    } catch (error) {
        console.error('Lỗi khi vẽ biểu đồ Brand theo loại:', error);
    }
}

async function drawTopBrandChart() {
    try {
        const response = await fetch('/point/top_brand_chart');
        const data = await response.json();
        const ctx = document.getElementById('topBrandsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.brands,
                datasets: [{
                    label: 'Doanh thu (VND)',
                    data: data.totals,
                    backgroundColor: 'rgba(30, 64, 175, 0.7)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => value.toLocaleString('vi-VN')
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Lỗi khi vẽ biểu đồ Top Brand:', error);
    }
}

async function drawTopUserChart() {
    try {
        const response = await fetch('/user/top_user_chart');
        const data = await response.json();
        const ctx = document.getElementById('pointsChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Điểm (VND)',
                    data: data.values,
                    backgroundColor: 'rgba(30, 64, 175, 0.7)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => value.toLocaleString('vi-VN')
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Lỗi khi vẽ biểu đồ Top User:', error);
    }
}

async function loadPendingCampaigns() {
    const container = document.getElementById('pending-campaigns-container');
    container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
    try {
        // Gọi API lấy danh sách chiến dịch chờ duyệt
        const response = await fetch('/campaign/campaigns/pending');
        const data = await response.json();

        if (!data.campaigns || data.campaigns.length === 0) {
            container.innerHTML = `<div class="text-center text-gray-500 py-8">Không có chiến dịch chờ duyệt.</div>`;
            return;
        }

        window.pendingCampaigns = data.campaigns;

        container.innerHTML = '';
        data.campaigns.forEach(campaign => {
            const card = `
            <div class="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between">
                <div>
                    <h4 class="font-bold text-lg mb-2">${campaign.title}</h4>
                    <p class="text-gray-600 mb-1">${campaign.description || ''}</p>
                    <p class="text-sm text-gray-500 mb-1"><strong>Điểm yêu cầu:</strong> ${campaign.points_required}</p>
                    <p class="text-sm text-gray-500 mb-1"><strong>Phần thưởng:</strong> ${campaign.reward}</p>
                    <p class="text-sm text-gray-500 mb-1"><strong>Thời gian:</strong> ${campaign.start_at} - ${campaign.end_at}</p>
                    <p class="text-sm text-gray-500 mb-1"><strong>Tổng tiền chiến dịch:</strong> ${formatCurrency(campaign.campaign_cost)}</p>
                    <p class="text-sm text-gray-500 mb-1"><strong>Tỷ lệ chi phí:</strong> Brand ${campaign.brand_ratio}% - Mall ${campaign.mall_ratio}%</p>
                </div>
                <div class="mt-4 flex justify-end">
                    <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all" onclick="openReviewModal(${campaign.campaign_id})">
                        Duyệt
                    </button>
                </div>
            </div>
        `;
            container.insertAdjacentHTML('beforeend', card);
        });
    } catch (error) {
        container.innerHTML = `<div class="error-message">Lỗi khi tải chiến dịch chờ duyệt.</div>`;
        console.error('Lỗi khi tải chiến dịch chờ duyệt:', error);
    }
}

function openReviewModal(campaignId) {
    const campaign = window.pendingCampaigns.find(c => c.campaign_id === campaignId);
    if (!campaign) return;

    document.getElementById('modal-campaign-title').textContent = campaign.title;
    document.getElementById('modal-campaign-description').textContent = campaign.description || '';
    document.getElementById('modal-campaign-points').textContent = campaign.points_required;
    document.getElementById('modal-campaign-reward').textContent = campaign.reward;
    document.getElementById('modal-campaign-time').textContent = `${campaign.start_at} - ${campaign.end_at}`;
    document.getElementById('modal-campaign-cost').textContent = formatCurrency(campaign.campaign_cost);
    document.getElementById('modal-brand-ratio').textContent = campaign.brand_ratio;
    document.getElementById('modal-mall-ratio').textContent = campaign.mall_ratio;
    document.getElementById('modal-message').classList.add('hidden');
    document.getElementById('review-modal').style.display = 'flex';
    document.getElementById('review-form').setAttribute('data-campaign-id', campaignId);
}
function closeModal() {
    document.getElementById('review-modal').style.display = 'none';
}

document.getElementById('review-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const campaignId = this.getAttribute('data-campaign-id');
    const decision = document.getElementById('decision').value;
    const messageDiv = document.getElementById('modal-message');
    messageDiv.classList.add('hidden');

    if (!decision) {
        messageDiv.textContent = 'Vui lòng chọn quyết định!';
        messageDiv.classList.remove('hidden');
        messageDiv.classList.remove('success-message');
        messageDiv.classList.add('error-message');
        return;
    }

    try {
        const response = await fetch(`/campaign/campaigns/${campaignId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision })
        });
        const data = await response.json();
        if (response.ok) {
            messageDiv.textContent = 'Cập nhật thành công!';
            messageDiv.classList.remove('hidden', 'error-message');
            messageDiv.classList.add('success-message');
            setTimeout(() => {
                closeModal();
                loadPendingCampaigns();
            }, 1000);
        } else {
            messageDiv.textContent = data.error || 'Có lỗi xảy ra!';
            messageDiv.classList.remove('hidden', 'success-message');
            messageDiv.classList.add('error-message');
        }
    } catch (error) {
        messageDiv.textContent = 'Lỗi khi duyệt chiến dịch!';
        messageDiv.classList.remove('hidden', 'success-message');
        messageDiv.classList.add('error-message');
    }
});
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // tháng bắt đầu từ 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Load hợp đồng
async function loadContracts() {
    const tbody = document.getElementById('contract-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="py-4 px-4 text-center"><div class="loading-overlay"><div class="spinner"></div></div></td></tr>';

    try {
        const response = await fetch('/brand/get_contracts');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi tải hợp đồng');

        const contracts = data.contracts;

        if (contracts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="py-4 px-4 text-center text-gray-600">Không có hợp đồng nào.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        contracts.forEach(contract => {
            const status = contract.status === 1 ? 'Đang hoạt động' : 'Hết hạn';
            const statusColor = contract.status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

            const row = `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#CON${contract.contract_id}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${contract.brandname || 'Không xác định'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(contract.start_at)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(contract.end_at)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(contract.total_amount)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${status}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="javascript:void(0)" onclick="viewContract(${contract.contract_id})" class="text-blue-600">Xem</a>
                    <a href="/brand/export_contract/${contract.contract_id}" target="_blank" class="text-purple-600">Xuất PDF</a>
                </td>
            </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error loading contracts:', error);
        tbody.innerHTML = `<tr><td colspan="7" class="py-4 px-4 text-center text-gray-600">Lỗi tải hợp đồng: ${error.message}</td></tr>`;
    }
}
// Load chiến dịch
async function loadCampaigns() {
    const tbody = document.getElementById('campaign-table-body');
    tbody.innerHTML = '<tr><td colspan="10" class="py-4 px-4 text-center"><div class="loading-overlay"><div class="spinner"></div></div></td></tr>';

    try {
        const response = await fetch('/campaign/get_campaigns');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Lỗi tải chiến dịch');

        const campaigns = data.campaigns;
        const brandResponse = await fetch('/brand/get_brand');
        const brandData = await brandResponse.json();
        const brands = brandData.brands;

        if (campaigns.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="py-4 px-4 text-center text-gray-600">Không có chiến dịch nào.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        campaigns.forEach(campaign => {
            const brand = brands.find(b => b.brand_id === campaign.brand_id);
            const statusColor = campaign.status === 'Đang chạy' ? 'bg-green-100 text-green-800' : campaign.status === 'Sắp diễn ra' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800';

            const row = `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${campaign.title}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">Brand ${campaign.brand_id}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(campaign.start_at)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(campaign.end_at)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${formatCurrency(campaign.campaign_cost)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${campaign.brand_ratio}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${campaign.mall_ratio}%</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${campaign.status}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">-</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="#" class="text-blue-600 hover:text-blue-900 mr-3">Chi tiết</a>
                    <a href="#" class="text-yellow-600 hover:text-yellow-900 mr-3">Chỉnh sửa</a>
                    <!-- Nút Xuất hóa đơn -->
                    <a href="/campaign/export_invoice/${campaign.campaign_id}" target="_blank" class="text-purple-600 hover:text-purple-900">Xuất hoá đơn</a>
                </td>
            </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error loading campaigns:', error);
        tbody.innerHTML = `<tr><td colspan="10" class="py-4 px-4 text-center text-gray-600">Lỗi tải chiến dịch: ${error.message}</td></tr>`;
    }
}

window.pendingAds = [];

// Function to get status text and color for Ads
function getAdStatusInfo(status) {
    switch (status) {
        case 'DRAFT':
            return { text: 'Bản nháp', color: 'bg-gray-100 text-gray-800' };
        case 'PENDING':
            return { text: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800' };
        case 'APPROVED':
            return { text: 'Đã duyệt', color: 'bg-blue-100 text-blue-800' };
        case 'REJECTED':
            return { text: 'Bị từ chối', color: 'bg-red-100 text-red-800' };
        case 'ENDED':
            return { text: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800' };
        default:
            return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
}

// Fetch and render ads
// Load All Ads into the main table
async function loadAds() {
    const tbody = document.getElementById('ad-table-body');
    const activeCountEl = document.getElementById('active-ads-count');
    const pendingCountEl = document.getElementById('pending-ads-count');
    const endedCountEl = document.getElementById('ended-ads-count');

    tbody.innerHTML = '<tr><td colspan="8" class="py-4 px-4 text-center"><div class="loading-overlay"><div class="spinner"></div></div></td></tr>';
    activeCountEl.textContent = '...';
    pendingCountEl.textContent = '...';
    endedCountEl.textContent = '...';

    try {
        const response = await fetch('/ad/ads/get_all'); // Use the new endpoint
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Lỗi khi tải danh sách quảng cáo');
        }

        const ads = data.ads;
        tbody.innerHTML = ''; // Clear loading spinner

        if (!ads || ads.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="py-4 px-4 text-center text-gray-500">Không có quảng cáo nào.</td></tr>';
            activeCountEl.textContent = '0';
            pendingCountEl.textContent = '0';
            endedCountEl.textContent = '0';
            return;
        }

        let activeCount = 0;
        let pendingCount = 0;
        let endedCount = 0;
        const now = new Date();

        ads.forEach(ad => {
            const statusInfo = getAdStatusInfo(ad.status);
            let effectiveStatus = statusInfo; // Default status

            // Refine status based on dates if APPROVED
            if (ad.status === 'APPROVED') {
                const start = ad.start_at ? new Date(ad.start_at) : null;
                const end = ad.end_at ? new Date(ad.end_at) : null;

                if (start && end) {
                    if (now >= start && now <= end) {
                        effectiveStatus = { text: 'Đang chạy', color: 'bg-green-100 text-green-800' };
                        activeCount++;
                    } else if (now < start) {
                        effectiveStatus = { text: 'Sắp chạy', color: 'bg-blue-100 text-blue-800' };
                        // Decide if upcoming counts as 'active' stat or separate
                    } else if (now > end) {
                        effectiveStatus = { text: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800' };
                        endedCount++;
                    }
                } else {
                    // If dates are missing but approved, count as active? Or needs check?
                    // For now, keep 'Đã duyệt'
                    activeCount++; // Count as active if approved and dates ok or missing
                }
            } else if (ad.status === 'PENDING') {
                pendingCount++;
            } else if (ad.status === 'ENDED' || ad.status === 'REJECTED') { // Count REJECTED as 'ended' for stats? Adjust as needed
                endedCount++;
            }


            const row = `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">AD-${ad.ad_id}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${ad.title}</div>
                    <div class="text-xs text-gray-500">${ad.description.substring(0, 50)}${ad.description.length > 50 ? '...' : ''}</div>
                </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ad.brand_id || 'N/A'}</td> <!-- Add Brand Name if available -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ad.start_at ? formatDate(ad.start_at) : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${ad.end_at ? formatDate(ad.end_at) : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ad.ad_cost ? formatCurrency(ad.ad_cost) : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${effectiveStatus.color}">
                        ${effectiveStatus.text}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="#" class="text-blue-600 hover:text-blue-900 mr-3">Xem</a>
                    ${ad.status === 'PENDING' ? `<button onclick="openAdReviewModal(${ad.ad_id})" class="text-yellow-600 hover:text-yellow-900">Duyệt</button>` : ''}
                    ${ad.status === 'DRAFT' ? `<a href="#" class="text-green-600 hover:text-green-900">Gửi</a>` : ''}
                        <!-- Add Edit/Delete based on status if needed -->
                    <a href="/ad/export_invoice/${ad.ad_id}" target="_blank" class="text-purple-600 hover:text-purple-900">Xuất hoá đơn</a>
                </td>
            </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });

        // Update counts in the stat cards
        activeCountEl.textContent = activeCount;
        pendingCountEl.textContent = pendingCount;
        endedCountEl.textContent = endedCount;


    } catch (error) {
        console.error('Error loading ads:', error);
        tbody.innerHTML = `<tr><td colspan="8" class="py-4 px-4 text-center text-red-600">Lỗi tải danh sách quảng cáo: ${error.message}</td></tr>`;
        activeCountEl.textContent = 'Lỗi';
        pendingCountEl.textContent = 'Lỗi';
        endedCountEl.textContent = 'Lỗi';
    }
}

// Load Pending Ads into the review section
async function loadPendingAds() {
    const container = document.getElementById('pending-ads-container');
    container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`; // Show spinner

    try {
        const response = await fetch('/ad/ads/pending'); // Use the new endpoint
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Lỗi khi tải quảng cáo chờ duyệt');
        }

        window.pendingAds = data.ads; // Store globally for modal use
        container.innerHTML = ''; // Clear spinner

        if (!window.pendingAds || window.pendingAds.length === 0) {
            container.innerHTML = `<div class="col-span-1 md:col-span-2 lg:col-span-3 text-center text-gray-500 py-8">Không có quảng cáo nào đang chờ duyệt.</div>`;
            return;
        }

        window.pendingAds.forEach(ad => {
            const card = `
            <div class="bg-white rounded-xl shadow-md p-4 flex flex-col justify-between border border-yellow-200">
                <div>
                    <h4 class="font-bold text-lg mb-2">${ad.title} (AD-${ad.ad_id})</h4>
                    <p class="text-gray-600 text-sm mb-1">${ad.description || 'Không có mô tả'}</p>
                    <p class="text-sm text-gray-500 mb-1"><strong>Brand ID:</strong> ${ad.brand_id || 'N/A'}</p>
                    <p class="text-sm text-gray-500 mb-1"><strong>Thời gian:</strong> ${ad.start_at ? formatDate(ad.start_at) : 'N/A'} - ${ad.end_at ? formatDate(ad.end_at) : 'N/A'}</p>
                    <p class="text-sm text-gray-500 mb-1"><strong>Chi phí:</strong> ${ad.ad_cost ? formatCurrency(ad.ad_cost) : 'N/A'}</p>
                </div>
                <div class="mt-4 flex justify-end">
                    <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all text-sm" onclick="openAdReviewModal(${ad.ad_id})">
                        <i class="fas fa-search-plus mr-1"></i> Duyệt
                    </button>
                </div>
            </div>
        `;
            container.insertAdjacentHTML('beforeend', card);
        });
    } catch (error) {
        console.error('Error loading pending ads:', error);
        container.innerHTML = `<div class="col-span-1 md:col-span-2 lg:col-span-3 error-message">Lỗi khi tải quảng cáo chờ duyệt: ${error.message}</div>`;
    }
}

// Open the Ad Review Modal
function openAdReviewModal(adId) {
    const ad = window.pendingAds.find(a => a.ad_id === adId);
    // If not found in pending list, maybe fetch details directly? For now, rely on window.pendingAds
    if (!ad) {
        console.error(`Ad with ID ${adId} not found in pending list.`);
        alert(`Không tìm thấy chi tiết cho quảng cáo ID ${adId}.`);
        return;
    }

    document.getElementById('modal-ad-id').textContent = `AD-${ad.ad_id}`;
    document.getElementById('modal-ad-title').textContent = ad.title;
    document.getElementById('modal-ad-description').textContent = ad.description || 'N/A';
    document.getElementById('modal-ad-brand').textContent = ad.brand_id || 'N/A'; // Add Brand Name if available
    document.getElementById('modal-ad-time').textContent = `${ad.start_at ? formatDate(ad.start_at) : 'N/A'} - ${ad.end_at ? formatDate(ad.end_at) : 'N/A'}`;
    document.getElementById('modal-ad-cost').textContent = ad.ad_cost ? formatCurrency(ad.ad_cost) : 'N/A';

    // Reset form and message
    const form = document.getElementById('ad-review-form');
    form.reset();
    form.setAttribute('data-ad-id', adId); // Store adId for submission
    const messageDiv = document.getElementById('ad-modal-message');
    messageDiv.classList.add('hidden');
    messageDiv.textContent = '';

    // Show modal
    document.getElementById('ad-review-modal').style.display = 'flex';
}

// Close the Ad Review Modal
function closeAdModal() {
    document.getElementById('ad-review-modal').style.display = 'none';
}

// Handle Ad Review Form Submission
async function handleAdReviewSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const adId = form.getAttribute('data-ad-id');
    const decision = document.getElementById('ad-decision').value;
    const messageDiv = document.getElementById('ad-modal-message');
    const submitButton = form.querySelector('button[type="submit"]');

    messageDiv.classList.add('hidden');
    messageDiv.textContent = '';

    if (!adId) {
        messageDiv.textContent = 'Lỗi: Không tìm thấy ID quảng cáo.';
        messageDiv.classList.remove('hidden', 'success-message');
        messageDiv.classList.add('error-message');
        return;
    }
    if (!decision) {
        messageDiv.textContent = 'Vui lòng chọn quyết định (Chấp thuận/Từ chối).';
        messageDiv.classList.remove('hidden', 'success-message');
        messageDiv.classList.add('error-message');
        return;
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Đang gửi...';

    try {
        const response = await fetch(`/ad/ads/${adId}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision: decision }) // Send decision in body
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.textContent = data.message || 'Duyệt quảng cáo thành công!';
            messageDiv.classList.remove('hidden', 'error-message');
            messageDiv.classList.add('success-message');
            // Refresh lists after successful review
            loadPendingAds(); // Refresh pending list
            loadAds(); // Refresh main table to update status
            setTimeout(closeAdModal, 1500); // Close modal after delay
        } else {
            messageDiv.textContent = data.error || 'Có lỗi xảy ra khi duyệt quảng cáo.';
            messageDiv.classList.remove('hidden', 'success-message');
            messageDiv.classList.add('error-message');
        }
    } catch (error) {
        console.error('Error submitting ad review:', error);
        messageDiv.textContent = 'Lỗi mạng hoặc lỗi máy chủ khi gửi quyết định.';
        messageDiv.classList.remove('hidden', 'success-message');
        messageDiv.classList.add('error-message');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-check mr-2"></i> Gửi quyết định';
    }
}

// Attach event listener for the ad review form
document.getElementById('ad-review-form').addEventListener('submit', handleAdReviewSubmit);

// Fetch and display mall vouchers
async function loadMallVouchers() {
    const container = document.getElementById('voucher-list');
    container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`; // Show spinner

    try {
        // Fetch mall-wide vouchers (brand_id IS NULL)
        const response = await fetch('/voucher/vouchers');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Lỗi khi tải danh sách ưu đãi');
        }

        const vouchers = data;
        container.innerHTML = ''; // Clear spinner

        if (!vouchers || vouchers.length === 0) {
            container.innerHTML = `<div class="col-span-1 md:col-span-2 text-center text-gray-500 py-8">Không có ưu đãi nào từ Mall.</div>`;
            return;
        }

        vouchers.forEach(voucher => {
            const status = (new Date(voucher.start_at) <= new Date() && new Date(voucher.end_at) >= new Date())
                ? 'Đang hoạt động'
                : 'Hết hạn';
            const statusColor = status === 'Đang hoạt động' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

            const card = `
                <div class="border rounded-lg p-4 transition-all hover:shadow-md">
                    <h4 class="font-bold text-lg">${voucher.title}</h4>
                    <p class="text-gray-600">${voucher.description || 'Không có mô tả'}</p>
                    <p class="text-sm text-gray-500"><strong>Điểm yêu cầu:</strong> ${voucher.points_required} điểm</p>
                    <p class="text-sm text-gray-500"><strong>Giảm giá:</strong> ${formatCurrency(voucher.discount_amount)}</p>
                    <p class="text-sm text-gray-500">Từ ${formatDate(voucher.start_at)} đến ${formatDate(voucher.end_at)}</p>
                    <div class="mt-2">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">${status}</span>
                    </div>
                    <div class="mt-4 flex space-x-2">
                        <button class="text-blue-600 hover:text-blue-800">Chi tiết</button>
                        <button class="text-yellow-600 hover:text-yellow-800">Chỉnh sửa</button>
                        <button class="text-red-600 hover:text-red-800">Xóa</button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', card);
        });
    } catch (error) {
        console.error('Error loading mall vouchers:', error);
        container.innerHTML = `<div class="col-span-1 md:col-span-2 error-message">Lỗi khi tải danh sách ưu đãi: ${error.message}</div>`;
    }
}
// Gọi hàm khi trang được tải
document.addEventListener('DOMContentLoaded', function () {
    fetchRunningCampaigns();
    drawMonthlyRevenueChart();
    drawBrandbyTypeChart();
    drawTopBrandChart();
    drawTopUserChart();
    monthlyRevenue();
    fetchBrandCount();
    fetchCountUsers();
    fetchCountTotalUser();
    fetchCountAdmin();
    fetchCountUser();
    loadBrands();
    loadPendingCampaigns();
    loadContracts();
    loadCampaigns();
    loadAds();
    loadPendingAds();
    loadMallVouchers();
    loadNotifications()

    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function (event) {
            event.preventDefault();
            const targetId = this.getAttribute('data-target');

            // Deactivate all content sections
            document.querySelectorAll('[data-content]').forEach(section => {
                section.classList.remove('active');
            });

            // Activate the target content section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                // If switching to Ads tab, reload its data
                if (targetId === 'advertisements') {
                    loadAds();
                    loadPendingAds();
                }
                // Add similar reloads for other sections if needed
                if (targetId === 'campaigns') {
                    loadCampaigns();
                    loadPendingCampaigns();
                }
                if (targetId === 'contracts') {
                    loadContracts();
                }
                if (targetId === 'promotions') {
                    loadMallVouchers(); // Reload vouchers when switching to Promotions tab
                }
                // etc.
            }

            // Update active state for sidebar items
            sidebarItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Close mobile sidebar if open
            // ... (your existing mobile sidebar closing logic)
        });
    });

    // Ensure the default active tab loads its data correctly initially
    const initialActiveSidebarItem = document.querySelector('.sidebar-item.active');
    if (initialActiveSidebarItem) {
        const initialTargetId = initialActiveSidebarItem.getAttribute('data-target');
        if (initialTargetId === 'advertisements') {
            // Already called loadAds() and loadPendingAds()
        } else if (initialTargetId === 'campaigns') {
            // Already called loadCampaigns() and loadPendingCampaigns()
        } else if (initialTargetId === 'promotions') {
            loadMallVouchers();
        }
    }

});

const revenueMonthlyCtx = document.getElementById("revenueReportChart").getContext("2d");
const revenueMonthlyChart = new Chart(revenueMonthlyCtx, {
    type: "bar",
    data: {
        labels: ["Tháng 1", "Tháng 2", "Tháng 3"],
        datasets: [{
            label: "Tổng doanh thu (triệu VND)",
            data: [
                400 + 300 + 250, // Tháng 1
                350 + 350 + 300, // Tháng 2
                450 + 350 + 250  // Tháng 3
            ],
            backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"], // Màu khác nhau cho từng cột
            borderRadius: 6,
        }],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: false, // Ẩn chú thích vì đã rõ
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        return context.parsed.y + " triệu VND";
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: "Triệu VND",
                },
            },
        },
    },
});

async function editUser(userId) {
    const email = prompt("Nhập email mới:");
    const phone = prompt("Nhập số điện thoại mới:");
    const status = confirm("Có muốn kích hoạt tài khoản này không?") ? 1 : 0;

    if (!email || !phone) {
        alert("Thông tin không hợp lệ!");
        return;
    }

    const res = await fetch(`/user/update_account/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone, status })
    });
    const data = await res.json();
    alert(data.message);
    loadAccounts("khachhang"); // refresh lại
}

async function deleteUser(userId) {
    if (confirm("Bạn có chắc muốn xoá user ID " + userId + "?")) {
        const res = await fetch(`/user/delete_account/${userId}`, { method: "DELETE" });
        const data = await res.json();
        alert(data.message);
        loadAccounts("khachhang");
    }
}

async function viewContract(id) {
    try {
        const res = await fetch(`/brand/contract/${id}`);
        const data = await res.json();
        if (!data.success) {
            alert("Không tìm thấy hợp đồng");
            return;
        }
        const c = data.contract;
        document.getElementById("contract-detail").innerHTML = `
        <p><b>Mã hợp đồng:</b> #CON${c.contract_id}</p>
        <p><b>Brand:</b> ${c.brandname}</p>
        <p><b>Ngày bắt đầu:</b> ${formatDate(c.start_at)}</p>
        <p><b>Ngày kết thúc:</b> ${formatDate(c.end_at)}</p>
        <p><b>Giá trị:</b> ${formatCurrency(c.total_amount)}</p>
        <p><b>Trạng thái:</b> ${c.status == 1
                ? '<span class="text-green-600">Đang hoạt động</span>'
                : '<span class="text-red-600">Hết hạn</span>'}</p>
        `;
        document.getElementById("renew-id").value = c.contract_id;
        document.getElementById("contract-modal").classList.remove("hidden");
        toggleRenew(false);
    } catch (err) {
        console.error(err);
    }
}


function closeContractModal() {
    document.getElementById("contract-modal").classList.add("hidden");
}

function toggleRenew(show) {
    document.getElementById("renew-section").classList.toggle("hidden", !show);
    document.getElementById("contract-actions").classList.toggle("hidden", show);
}

document.getElementById("renew-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("renew-id").value;
    const newDate = document.getElementById("renew-date").value;
    try {
        const res = await fetch(`/brand/contract/renew/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ end_date: newDate })
        });
        const data = await res.json();
        if (!data.success) {
            alert("❌ " + data.message);
            return;
        }
        alert("✅ " + data.message);
        closeContractModal();
        loadContracts(); // reload bảng hợp đồng
    } catch (err) {
        console.error(err);
        alert("Có lỗi khi gia hạn hợp đồng");
    }
});

async function loadAccount(type) {
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('error-message');
    const headersRow = document.getElementById('table-headers');
    const tbody = document.getElementById('table-body');

    loading.classList.remove('hidden');
    errorMsg.classList.add('hidden');
    headersRow.innerHTML = '';
    tbody.innerHTML = '';

    let url = '';
    if (type === 'khachhang') url = '/user/account_customer';
    if (type === 'brand') url = '/user/account_brand';
    if (type === 'mall') url = '/user/account_mall';

    try {
        const res = await fetch(url);
        const data = await res.json();
        loading.classList.add('hidden');

        if (!data.user || data.user.length === 0) {
            errorMsg.textContent = "Không có dữ liệu";
            errorMsg.classList.remove('hidden');
            return;
        }

        const headers = ["Tên đăng nhập", "Họ tên", "Email", "SĐT", "Vai trò", "Trạng thái", "Hành động"];
        headersRow.innerHTML = headers.map(h =>
            `<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">${h}</th>`
        ).join("");

        tbody.innerHTML = "";
        data.user.forEach(u => {
            const roleMap = { customer: "Khách hàng", brand: "Thương hiệu", mall: "Quản trị Mall" };
            const statusBadge = u.status == 1
                ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span>`
                : `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Khóa</span>`;

            let row = `
                    <tr>
                    <td class="px-6 py-4 text-sm font-medium text-gray-900">${u.username || ""}</td>
                    <td class="px-6 py-4 text-sm">${u.fullname || ""}</td>
                    <td class="px-6 py-4 text-sm">${u.email || ""}</td>
                    <td class="px-6 py-4 text-sm">${u.phone || ""}</td>
                    <td class="px-6 py-4 text-sm">${roleMap[u.role] || "-"}</td>
                    <td class="px-6 py-4 text-sm">${statusBadge}</td>
                    <td class="px-6 py-4 text-sm">
                        <a href="javascript:void(0)" onclick="editAccount(${u.user_id})" class="text-blue-600 hover:underline mr-3">Chi tiết</a>
                        <a href="javascript:void(0)" onclick="deleteAccount(${u.user_id})" class="text-red-600 hover:underline">Xóa</a>
                    </td>
                    </tr>`;
            tbody.innerHTML += row;
        });

    } catch (err) {
        console.error(err);
        loading.classList.add('hidden');
        errorMsg.textContent = "Lỗi tải dữ liệu";
        errorMsg.classList.remove('hidden');
    }
}

async function editAccount(id) {
    try {
        const res = await fetch(`/user/get_account/${id}`);
        const result = await res.json();
        if (!result.success) {
            alert(result.message || "Không tìm thấy tài khoản");
            return;
        }
        const user = result.account;
        openAccountModal(user);
    } catch (err) {
        console.error(err);
        alert("Có lỗi khi tải tài khoản!");
    }
}

function openAccountModal(user = null) {
    const modal = document.getElementById("account-modal");
    const form = document.getElementById("account-form");
    const title = document.getElementById("modal-title");
    modal.classList.remove("hidden");

    if (user) {
        title.textContent = "Chỉnh sửa tài khoản";
        document.getElementById("account-id").value = user.user_id;
        document.getElementById("username").value = user.username || "";
        document.getElementById("email").value = user.email || "";
        document.getElementById("phone").value = user.phone || "";
        document.getElementById("address").value = user.address || "";
        document.getElementById("role").value = user.role || "customer";
        document.getElementById("status").value = user.status;
    } else {
        title.textContent = "Thêm tài khoản";
        form.reset();
        document.getElementById("account-id").value = "";
    }
}

function closeAccountModal() {
    document.getElementById("account-modal").classList.add("hidden");
}

document.getElementById("account-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = document.getElementById("account-id").value;
    const data = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
        status: parseInt(document.getElementById("status").value),
        role: document.getElementById("role").value
    };

    try {
        let url, method;
        if (id) {
            url = `/user/update_account/${id}`;
            method = "PUT";
        } else {
            url = "/user/create_account";
            method = "POST";
        }

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        alert(result.message || "Lưu thành công!");
        closeAccountModal();
        loadAccount("khachhang");
    } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra!");
    }
});

async function deleteAccount(id) {
    if (!confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
    try {
        const res = await fetch(`/user/delete_account/${id}`, { method: "DELETE" });
        const result = await res.json();
        alert(result.message || "Đã xóa!");
        loadAccount("khachhang");
    } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi xóa!");
    }
}

// Tab events
document.getElementById('tab-khachhang').addEventListener('click', () => loadAccount('khachhang'));
document.getElementById('tab-brand').addEventListener('click', () => loadAccount('brand'));
document.getElementById('tab-mall').addEventListener('click', () => loadAccount('mall'));

// Load mặc định
loadAccount('khachhang');

// ------------------ LOAD DANH SÁCH ------------------
async function loadConversionRules() {
    try {
        const res = await fetch("/point/conversion_rule");
        const data = await res.json();

        if (!data.success) {
            console.error(data.message);
            return;
        }

        const tbody = document.getElementById("rule-table-body");
        tbody.innerHTML = "";

        data.rules.forEach(rule => {
            const tr = document.createElement("tr");

            const statusBadge = rule.status == 1
                ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đang áp dụng</span>`
                : `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Đã kết thúc</span>`;

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${rule.rule_name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${formatCurrency(rule.rate)} = 1 điểm
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatDate(rule.effective_from)} - ${rule.effective_to ? formatDate(rule.effective_to) : "Vô thời hạn"}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">${statusBadge}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="javascript:viewRule(${rule.conversion_rule_id})" class="text-blue-600 hover:text-blue-900 mr-3">Chi tiết</a>
                    <a href="javascript:editRule(${rule.conversion_rule_id})" class="text-yellow-600 hover:text-yellow-900">Chỉnh sửa</a>
                    <a href="javascript:deleteRule(${rule.conversion_rule_id})" class="text-red-600 hover:text-red-900">Xóa</a>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Lỗi load dữ liệu:", err);
    }
}

// ------------------ MODAL CHI TIẾT ------------------
function openRuleDetailModal(rule) {
    const content = document.getElementById("rule-detail-content");

    const statusText = rule.status == 1
        ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đang áp dụng</span>`
        : `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Đã kết thúc</span>`;

    content.innerHTML = `
        <p><strong>Tên chính sách:</strong> ${rule.rule_name}</p>
        <p><strong>Tỷ lệ quy đổi:</strong> ${formatCurrency(rule.rate)} = 1 điểm</p>
        <p><strong>Ngày hiệu lực:</strong> ${formatDate(rule.effective_from)} - ${rule.effective_to ? formatDate(rule.effective_to) : "Vô thời hạn"}</p>
        <p><strong>Trạng thái:</strong> ${statusText}</p>
        <p><strong>Ngày tạo:</strong> ${formatDate(rule.created_at)}</p>
        <p><strong>Cập nhật lần cuối:</strong> ${formatDate(rule.updated_at)}</p>
    `;

    document.getElementById("rule-detail-modal").classList.remove("hidden");
}

function closeRuleDetailModal() {
    document.getElementById("rule-detail-modal").classList.add("hidden");
}

async function viewRule(id) {
    try {
        const res = await fetch(`/point/conversion_rule/${id}`);
        const data = await res.json();
        if (data.success) {
            openRuleDetailModal(data.rule);
        } else {
            alert("Không tìm thấy chính sách");
        }
    } catch (err) {
        console.error("Lỗi khi xem chi tiết:", err);
    }
}

// ------------------ MODAL THÊM / SỬA ------------------
function openRuleModal(isEdit = false, rule = null) {
    const modal = document.getElementById("rule-modal");
    const title = document.getElementById("rule-modal-title");
    const form = document.getElementById("rule-form");

    // reset form trước
    form.reset();
    document.getElementById("rule-id").value = "";

    if (isEdit && rule) {
        title.textContent = "Chỉnh sửa chính sách";
        document.getElementById("rule-id").value = rule.conversion_rule_id;
        document.getElementById("rule-name").value = rule.rule_name || "";
        document.getElementById("rate").value = rule.rate || "";

        if (rule.effective_from) {
            document.getElementById("effective-from").value =
                new Date(rule.effective_from).toISOString().split("T")[0];
        }
        if (rule.effective_to) {
            document.getElementById("effective-to").value =
                new Date(rule.effective_to).toISOString().split("T")[0];
        }

        // ✅ set đúng trạng thái
        const statusSelect = document.getElementById("status");
        if (rule.status == 1) {
            statusSelect.value = "1";
        } else {
            statusSelect.value = "0";
        }
    } else {
        title.textContent = "Thêm chính sách";
    }

    modal.classList.remove("hidden");
}


function closeRuleModal() {
    document.getElementById("rule-modal").classList.add("hidden");
}

async function editRule(id) {
    try {
        const res = await fetch(`/point/conversion_rule/${id}`);
        const data = await res.json();
        if (!data.success) return alert("Không tìm thấy chính sách");
        openRuleModal(true, data.rule);
    } catch (e) {
        console.error("Lỗi khi mở form chỉnh sửa:", e);
        alert("Lỗi khi mở form chỉnh sửa");
    }
}

// ------------------ SUBMIT FORM ------------------
document.getElementById("rule-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("rule-id").value;

    const payload = {
        rule_name: document.getElementById("rule-name").value.trim(),
        rate: parseFloat(document.getElementById("rate").value),            // ép về số
        effective_from: document.getElementById("effective-from").value,
        effective_to: document.getElementById("effective-to").value || null,
        status: parseInt(document.getElementById("status").value, 10)       // ép về int
    };

    let url = "/point/conversion_rule";
    let method = "POST";
    if (id) {
        url = `/point/conversion_rule/${id}`;
        method = "PUT";
    }

    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            alert(data.message);
            closeRuleModal();
            loadConversionRules();
        } else {
            console.error("❌ API lỗi:", data);
            alert("❌ " + data.message);
        }
    } catch (err) {
        console.error("Lỗi khi lưu chính sách:", err);
        alert("Có lỗi khi lưu chính sách");
    }
});

async function deleteRule(id) {
    if (!confirm("Bạn có chắc muốn xóa chính sách này?")) return;

    try {
        const res = await fetch(`/point/conversion_rule/${id}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
            alert(data.message);
            loadConversionRules(); // reload danh sách
        } else {
            alert("❌ " + data.message);
        }
    } catch (err) {
        console.error("Lỗi khi xóa rule:", err);
        alert("Có lỗi khi xóa chính sách");
    }
}

// expose global để inline onclick gọi được
window.deleteRule = deleteRule;
window.viewRule = viewRule;
window.editRule = editRule;
window.openRuleModal = openRuleModal;
window.closeRuleModal = closeRuleModal;
window.closeRuleDetailModal = closeRuleDetailModal;

// ------------------ AUTO LOAD ------------------
document.addEventListener("DOMContentLoaded", loadConversionRules);


document.addEventListener("DOMContentLoaded", function () {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    const contentSections = document.querySelectorAll('[data-content]');

    // Lấy tab đã lưu trong localStorage
    const savedTab = localStorage.getItem("activeTab") || "dashboard";

    // Ẩn tất cả, chỉ hiển thị tab đã lưu
    contentSections.forEach(section => section.classList.remove("active"));
    document.getElementById(savedTab).classList.add("active");

    // Cập nhật trạng thái active trên sidebar
    sidebarItems.forEach(item => {
        item.classList.remove("active");
        if (item.getAttribute("data-target") === savedTab) {
            item.classList.add("active");
        }
    });

    // Gán sự kiện click cho từng sidebar item
    sidebarItems.forEach(item => {
        item.addEventListener("click", function (event) {
            event.preventDefault();
            const targetId = this.getAttribute("data-target");

            // Ẩn tất cả, hiện tab được chọn
            contentSections.forEach(section => section.classList.remove("active"));
            document.getElementById(targetId).classList.add("active");

            // Cập nhật sidebar
            sidebarItems.forEach(i => i.classList.remove("active"));
            this.classList.add("active");

            // Lưu tab vào localStorage
            localStorage.setItem("activeTab", targetId);
        });
    });
});


async function checkContracts() {
    await fetch("/brand/check_expiring", { method: "POST" });
    loadSystemNotifications(); // reload chuông thông báo
}

async function loadNotifications() {
    try {
        const res = await fetch("/notification/list");
        const data = await res.json();
        const list = document.getElementById("notificationList");
        list.innerHTML = "";

        if (!data.success || !data.notifications || data.notifications.length === 0) {
            list.innerHTML = "<p class='text-gray-500'>Không có thông báo</p>";
            return;
        }

        data.notifications.forEach(n => {
            const wrapper = document.createElement("div");
            wrapper.className = "flex items-start space-x-3 border-b pb-4";

            // icon tùy theo loại status (chưa đọc / đã đọc)
            const iconClass = n.status === 1
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-400";

            wrapper.innerHTML = `
    <div class="${iconClass} p-2 rounded-full">
        <i class="fas fa-info-circle"></i>
    </div>
    <div>
        <p class="font-medium">${n.title}</p>
        <p class="text-sm text-gray-500">${n.message}</p>
        <p class="text-xs text-gray-400">${new Date(n.created_at).toLocaleString("vi-VN")}</p>
    </div>
    <button class="ml-auto text-blue-600 hover:text-blue-800 mark-read-btn" data-id="${n.notification_id}">
        <i class="fas fa-check"></i> Đánh dấu đã đọc
    </button>
    `;

            list.appendChild(wrapper);
        });

        // Gắn sự kiện cho nút "Đánh dấu đã đọc"
        document.querySelectorAll(".mark-read-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                await fetch(`/notification/mark_read/${id}`, { method: "POST" });
                loadNotifications(); // reload lại
            });
        });

    } catch (err) {
        console.error("loadNotifications()", err);
    }
}


// Đánh dấu tất cả đã đọc
document.getElementById("markAllReadBtn").addEventListener("click", async () => {
    await fetch("/notification/mark_all_read", { method: "POST" });
    loadNotifications();
});


// Gọi khi mở trang + định kỳ
document.addEventListener('DOMContentLoaded', () => {
    checkContracts();
    setInterval(checkContracts, 10 * 60 * 1000);
});
document.getElementById('notificationBtn').addEventListener('click', loadNotifications);

document.addEventListener("DOMContentLoaded", () => {
    const btnOpen = document.getElementById("btnOpenCreateNotification");
    const btnCancel = document.getElementById("btnCancelCreateNotification");
    const modal = document.getElementById("createNotificationModal");
    const form = document.getElementById("createNotificationForm");
    const targetSelect = document.getElementById("notificationTarget");
    const brandInputWrap = document.getElementById("brandTargetInput");

    // Mở modal
    if (btnOpen && modal) {
        btnOpen.addEventListener("click", () => {
            modal.classList.remove("hidden");
        });
    }

    // Đóng modal
    if (btnCancel && modal) {
        btnCancel.addEventListener("click", () => {
            modal.classList.add("hidden");
        });
    }

    // Submit form
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const title = document.getElementById("notificationTitle")?.value || "";
            const message = document.getElementById("notificationMessage")?.value || "";
            const end_at = document.getElementById("notificationEndAt")?.value || "";
            const noti_type = document.getElementById("notificationType")?.value || "marketing";
            const target_type = targetSelect ? targetSelect.value : "all";
            const target_id = (target_type === "brand")
                ? (document.getElementById("notificationTargetId")?.value || null)
                : null;

            try {
                const res = await fetch("/notification/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title, message, end_at,
                        status: 1,
                        noti_type,
                        target_type, target_id
                    })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    alert("✅ Tạo thông báo thành công!");
                    modal.classList.add("hidden");
                    form.reset();
                    if (brandInputWrap) brandInputWrap.classList.add("hidden");
                } else {
                    alert("❌ Lỗi: " + (data.message || "Không thể tạo thông báo"));
                }
            } catch (err) {
                console.error("Lỗi tạo thông báo:", err);
                alert("❌ Có lỗi xảy ra khi gửi thông báo");
            }
        });
    }

    // Toggle input Brand ID
    if (targetSelect && brandInputWrap) {
        targetSelect.addEventListener("change", (e) => {
            if (e.target.value === "brand") {
                brandInputWrap.classList.remove("hidden");
            } else {
                brandInputWrap.classList.add("hidden");
            }
        });
    }
});

async function loadSystemNotifications() {
    try {
        const res = await fetch("/notification/list/system");
        const data = await res.json();

        const list = document.getElementById("notificationList");
        const badge = document.getElementById("notificationBadge");

        list.innerHTML = "";

        if (!data.success || !data.notifications || data.notifications.length === 0) {
            list.innerHTML = "<p class='p-3 text-gray-500'>Không có thông báo</p>";
            badge.classList.add("hidden");
            return;
        }

        // render danh sách
        let unreadCount = 0;
        data.notifications.forEach(n => {
            if (n.status === 1) unreadCount++;
            const item = document.createElement("div");
            item.className = "p-3 border-b hover:bg-gray-50";
            item.innerHTML = `
    <p class="font-medium text-gray-800">${n.title}</p>
    <p class="text-sm text-gray-600">${n.message}</p>
    <p class="text-xs text-gray-400">${new Date(n.created_at).toLocaleString("vi-VN")}</p>
    `;
            list.appendChild(item);
        });

        // badge số chưa đọc
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove("hidden");
        } else {
            badge.classList.add("hidden");
        }
    } catch (err) {
        console.error("loadSystemNotifications()", err);
    }
}

// Toggle dropdown khi click chuông
document.getElementById("notificationBtn").addEventListener("click", () => {
    const dropdown = document.getElementById("notificationDropdown");
    dropdown.classList.toggle("hidden");
    if (!dropdown.classList.contains("hidden")) {
        loadSystemNotifications();
    }
});

// Đánh dấu tất cả đã đọc
document.getElementById("markAllReadBtn").addEventListener("click", async () => {
    await fetch("/notification/mark_all_read", { method: "POST" });
    loadSystemNotifications();
});

// Gọi khi load trang để cập nhật badge
document.addEventListener("DOMContentLoaded", loadSystemNotifications);

async function loadMallNotifications() {
    try {
        const res = await fetch("/notification/list/mall");
        const data = await res.json();
        const list = document.getElementById("notification-list");
        list.innerHTML = "";

        if (!data.success || !data.notifications || data.notifications.length === 0) {
            list.innerHTML = `<p class="text-gray-500 text-center p-4">Không có thông báo</p>`;
            return;
        }

        data.notifications.forEach(n => {
            const wrapper = document.createElement("div");
            wrapper.className = "flex items-start gap-3 p-4 hover:bg-gray-50 transition";

            // icon màu theo trạng thái (chưa đọc = xanh, đã đọc = xám)
            const iconClass = n.status === 1
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-400";

            wrapper.innerHTML = `
            <div class="flex-shrink-0">
                <div class="${iconClass} p-2 rounded-full">
                <i class="fas fa-bell"></i>
                </div>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold text-gray-800">${n.title}</h4>
                <p class="text-gray-600 text-sm mb-1">${n.message}</p>
                <span class="text-xs text-gray-400">${new Date(n.created_at).toLocaleString()}</span>
            </div>
            <button onclick="markRead(${n.notification_id})"
                    class="text-xs text-blue-600 hover:underline ml-2">
                Đã đọc
            </button>
        `;
            list.appendChild(wrapper);
        });
    } catch (err) {
        console.error("❌ Lỗi loadMallNotifications:", err);
        document.getElementById("notification-list").innerHTML =
            `<p class="text-red-500 text-center p-4">Không tải được thông báo</p>`;
    }
}

async function markRead(notiId) {
    try {
        await fetch(`/notification/mark_read/${notiId}`, { method: "POST" });
        loadMallNotifications();
    } catch (err) {
        console.error("❌ Lỗi markRead:", err);
    }
}

async function markAllRead() {
    try {
        await fetch("/notification/mark_all_read", { method: "POST" });
        loadMallNotifications();
    } catch (err) {
        console.error("❌ Lỗi markAllRead:", err);
    }
}

// Gắn event khi DOM ready
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("notification-list")) {
        loadMallNotifications();
        document.getElementById("markAllReadBtn").addEventListener("click", markAllRead);
    }
});
