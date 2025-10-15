const BRAND_ID = window.CURRENT_USER?.brand_id || null;
const USER_ID = window.CURRENT_USER?.id || null;
window.pendingCampaigns = [];
window.pendingAds = [];

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return "N/A";
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

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return 'N/A';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

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

const UI = {
    init() {
        this.setupSidebar();
        this.setupProfileDropdown();
        this.setupTabs();
        this.setupModals();
        this.setupNotificationSystem();
    },

    setupSidebar() {
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        const contentSections = document.querySelectorAll('[data-content]');
        const mobileMenuButton = document.querySelector('.md\\:hidden.text-white');
        const sidebar = document.querySelector('.sidebar-gradient');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        sidebarItems.forEach(item => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const targetId = item.getAttribute('data-target');

                contentSections.forEach(section => section.classList.remove('active'));
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    this.loadDataForTab(targetId);
                }

                sidebarItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                localStorage.setItem("activeTab", targetId);

                if (window.innerWidth < 768 && sidebar.classList.contains('open')) {
                    this.toggleMobileSidebar(false);
                }
            });
        });

        if (mobileMenuButton) {
            mobileMenuButton.addEventListener('click', () => this.toggleMobileSidebar());
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => this.toggleMobileSidebar(false));
        }

        const savedTab = localStorage.getItem("activeTab") || "dashboard";
        const targetItem = document.querySelector(`.sidebar-item[data-target="${savedTab}"]`);
        if(targetItem) targetItem.click();
    },

    toggleMobileSidebar(forceState) {
        const sidebar = document.querySelector('.sidebar-gradient');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const mobileMenuButton = document.querySelector('.md\\:hidden.text-white');
        const icon = mobileMenuButton.querySelector('i');
        const isOpen = forceState !== undefined ? forceState : sidebar.classList.contains('hidden');

        sidebar.classList.toggle('hidden', !isOpen);
        sidebar.classList.toggle('open', isOpen);
        sidebarOverlay.classList.toggle('hidden', !isOpen);
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
    },

    setupProfileDropdown() {
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');

        if(profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('hidden');
            });
        }
        document.addEventListener('click', () => {
            if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
                profileDropdown.classList.add('hidden');
            }
        });
    },

    setupTabs() {
        document.getElementById('tab-khachhang')?.addEventListener('click', () => DataLoader.loadAccount('khachhang'));
        document.getElementById('tab-brand')?.addEventListener('click', () => DataLoader.loadAccount('brand'));
        document.getElementById('tab-mall')?.addEventListener('click', () => DataLoader.loadAccount('mall'));
    },

    setupModals() {
        document.getElementById('review-form')?.addEventListener('submit', Handlers.handleCampaignReviewSubmit);
        document.getElementById('ad-review-form')?.addEventListener('submit', Handlers.handleAdReviewSubmit);
        document.getElementById('renew-form')?.addEventListener('submit', Handlers.handleContractRenewSubmit);
        document.getElementById("account-form")?.addEventListener("submit", Handlers.handleAccountFormSubmit);
        document.getElementById("rule-form")?.addEventListener("submit", Handlers.handleRuleFormSubmit);
        document.getElementById("createNotificationForm")?.addEventListener("submit", Handlers.handleCreateNotificationSubmit);
        document.getElementById("notificationTarget")?.addEventListener("change", (e) => {
             document.getElementById("brandTargetInput")?.classList.toggle("hidden", e.target.value !== "brand");
        });
    },
    
    setupNotificationSystem() {
        document.getElementById("notificationBtn")?.addEventListener("click", () => {
            const dropdown = document.getElementById("notificationDropdown");
            dropdown.classList.toggle("hidden");
            if (!dropdown.classList.contains("hidden")) {
                DataLoader.loadSystemNotifications();
            }
        });
        document.getElementById("markAllReadBtn")?.addEventListener("click", Handlers.handleMarkAllNotificationsRead);
        document.getElementById("btnOpenCreateNotification")?.addEventListener("click", () => document.getElementById("createNotificationModal")?.classList.remove("hidden"));
        document.getElementById("btnCancelCreateNotification")?.addEventListener("click", () => document.getElementById("createNotificationModal")?.classList.add("hidden"));
    },

    loadDataForTab(tabId) {
        switch(tabId) {
            case 'dashboard':
                DataLoader.loadDashboard();
                break;
            case 'advertisements':
                DataLoader.loadAds();
                DataLoader.loadPendingAds();
                break;
            case 'campaigns':
                DataLoader.loadCampaigns();
                DataLoader.loadPendingCampaigns();
                break;
            case 'contracts':
                DataLoader.loadContracts();
                break;
            case 'promotions':
                DataLoader.loadMallVouchers();
                break;
            case 'accounts':
                DataLoader.loadAccount('khachhang');
                break;
            case 'rules':
                DataLoader.loadConversionRules();
                break;
            case 'notifications-management':
                DataLoader.loadMallNotifications();
                break;
        }
    },

    openModal(modalId) { document.getElementById(modalId)?.style.display = 'flex'; },
    closeModal(modalId) { document.getElementById(modalId)?.style.display = 'none'; },
};

const APIService = {
    async request(url, options = {}) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định' }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            return response.json();
        } catch (error) {
            console.error(`Lỗi khi gọi API ${url}:`, error);
            throw error;
        }
    },

    get: (url) => APIService.request(url),
    post: (url, body) => APIService.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    put: (url, body) => APIService.request(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    delete: (url) => APIService.request(url, { method: 'DELETE' }),
};

const ChartModule = {
    async drawMonthlyRevenueChart() {
        try {
            const data = await APIService.get('/point/monthly_revenue_chart');
            const ctx = document.getElementById('revenueChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.months.slice().reverse(),
                    datasets: [{
                        label: 'Doanh thu (VND)',
                        data: data.totals.slice().reverse(),
                        backgroundColor: 'rgba(30, 64, 175, 0.7)'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { callback: value => value.toLocaleString('vi-VN') } } }
                }
            });
        } catch (error) {
            console.error('Lỗi khi vẽ biểu đồ doanh thu:', error);
        }
    },
    
    async drawBrandByTypeChart() {
        try {
            const data = await APIService.get('/brand/brand_by_type_chart');
            const ctx = document.getElementById('brandTypeChart').getContext('2d');
            new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: data.brand_by_type.map(item => item.name),
                    datasets: [{
                        label: 'Số lượng Brand theo loại',
                        data: data.brand_by_type.map(item => item.total),
                        backgroundColor: ['#4F46E5', '#3B82F6', '#10B981', '#FBBF24']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'top' } }
                }
            });
        } catch (error) {
            console.error('Lỗi khi vẽ biểu đồ Brand theo loại:', error);
        }
    },

    async drawTopBrandChart() {
        try {
            const data = await APIService.get('/point/top_brand_chart');
            const ctx = document.getElementById('topBrandsChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.brands,
                    datasets: [{ label: 'Doanh thu (VND)', data: data.totals, backgroundColor: 'rgba(30, 64, 175, 0.7)' }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { callback: value => value.toLocaleString('vi-VN') } } }
                }
            });
        } catch (error) {
            console.error('Lỗi khi vẽ biểu đồ Top Brand:', error);
        }
    },

    async drawTopUserChart() {
        try {
            const data = await APIService.get('/user/top_user_chart');
            const ctx = document.getElementById('pointsChart').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{ label: 'Điểm (VND)', data: data.values, backgroundColor: 'rgba(30, 64, 175, 0.7)' }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { callback: value => value.toLocaleString('vi-VN') } } }
                }
            });
        } catch (error) {
            console.error('Lỗi khi vẽ biểu đồ Top User:', error);
        }
    },
    
    drawRevenueReportChart() {
        const ctx = document.getElementById("revenueReportChart")?.getContext("2d");
        if (!ctx) return;
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Tháng 1", "Tháng 2", "Tháng 3"],
                datasets: [{
                    label: "Tổng doanh thu (triệu VND)",
                    data: [950, 1000, 1050],
                    backgroundColor: ["#3b82f6", "#10b981", "#f59e0b"],
                    borderRadius: 6,
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context) => context.parsed.y + " triệu VND" } },
                },
                scales: { y: { beginAtZero: true, title: { display: true, text: "Triệu VND" } } },
            },
        });
    }
};

const DataLoader = {
    loadDashboard() {
        this.fetchDashboardStats();
        ChartModule.drawMonthlyRevenueChart();
        ChartModule.drawBrandByTypeChart();
        ChartModule.drawTopBrandChart();
        ChartModule.drawTopUserChart();
        ChartModule.drawRevenueReportChart();
    },

    async fetchDashboardStats() {
        const stats = {
            '#brand-count': '/brand/count_brand',
            '#campaign-count': '/campaign/count_campaigns',
            '#user_count': '/user/count_user',
            '#total-account': '/user/count_total',
            '#total-admin': '/user/count_admin',
            '#total-user': '/user/count_user',
            '#monthly-revenue': '/point/monthly_revenue'
        };

        for (const [elementId, url] of Object.entries(stats)) {
            const el = document.querySelector(elementId);
            if (el) {
                try {
                    const data = await APIService.get(url);
                    el.textContent = data.total ?? data.count ?? 0;
                } catch (error) {
                    el.textContent = 'Lỗi';
                }
            }
        }
    },

    async loadBrands() {
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
                const statusColor = brand.status === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

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
    },

    async loadPendingCampaigns() {
        const container = document.getElementById('pending-campaigns-container');
        container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;
        try {
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
    },
    
    async loadCampaigns() {
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
    },
    
    async loadContracts() {
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
    },
    
    async loadPendingAds() {
        const container = document.getElementById('pending-ads-container');
        container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;

        try {
            const response = await fetch('/ad/ads/pending');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Lỗi khi tải quảng cáo chờ duyệt');
            }

            window.pendingAds = data.ads;
            container.innerHTML = '';

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
    },

    async loadAds() {
        const tbody = document.getElementById('ad-table-body');
        const activeCountEl = document.getElementById('active-ads-count');
        const pendingCountEl = document.getElementById('pending-ads-count');
        const endedCountEl = document.getElementById('ended-ads-count');

        tbody.innerHTML = '<tr><td colspan="8" class="py-4 px-4 text-center"><div class="loading-overlay"><div class="spinner"></div></div></td></tr>';
        activeCountEl.textContent = '...';
        pendingCountEl.textContent = '...';
        endedCountEl.textContent = '...';

        try {
            const response = await fetch('/ad/ads/get_all');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Lỗi khi tải danh sách quảng cáo');
            }

            const ads = data.ads;
            tbody.innerHTML = '';

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
                let effectiveStatus = statusInfo;

                if (ad.status === 'APPROVED') {
                    const start = ad.start_at ? new Date(ad.start_at) : null;
                    const end = ad.end_at ? new Date(ad.end_at) : null;

                    if (start && end) {
                        if (now >= start && now <= end) {
                            effectiveStatus = { text: 'Đang chạy', color: 'bg-green-100 text-green-800' };
                            activeCount++;
                        } else if (now < start) {
                            effectiveStatus = { text: 'Sắp chạy', color: 'bg-blue-100 text-blue-800' };
                        } else if (now > end) {
                            effectiveStatus = { text: 'Đã kết thúc', color: 'bg-gray-100 text-gray-800' };
                            endedCount++;
                        }
                    } else {
                        activeCount++;
                    }
                } else if (ad.status === 'PENDING') {
                    pendingCount++;
                } else if (ad.status === 'ENDED' || ad.status === 'REJECTED') {
                    endedCount++;
                }

                const row = `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">AD-${ad.ad_id}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">${ad.title}</div>
                        <div class="text-xs text-gray-500">${ad.description.substring(0, 50)}${ad.description.length > 50 ? '...' : ''}</div>
                    </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ad.brand_id || 'N/A'}</td>
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
                        <a href="/ad/export_invoice/${ad.ad_id}" target="_blank" class="text-purple-600 hover:text-purple-900">Xuất hoá đơn</a>
                    </td>
                </tr>
                `;
                tbody.insertAdjacentHTML('beforeend', row);
            });

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
    },
    
    async loadMallVouchers() {
        const container = document.getElementById('voucher-list');
        container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div></div>`;

        try {
            const response = await fetch('/voucher/vouchers');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Lỗi khi tải danh sách ưu đãi');
            }

            const vouchers = data;
            container.innerHTML = '';

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
    },

    async loadAccount(type) {
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
    },

    async loadConversionRules() {
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
    },
    
    async loadSystemNotifications() {
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

            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.classList.remove("hidden");
            } else {
                badge.classList.add("hidden");
            }
        } catch (err) {
            console.error("loadSystemNotifications()", err);
        }
    },
    
    async loadMallNotifications() {
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
};

const Handlers = {
    async handleCampaignReviewSubmit(e) {
        e.preventDefault();
        const campaignId = this.getAttribute('data-campaign-id');
        const decision = document.getElementById('decision').value;
        const messageDiv = document.getElementById('modal-message');
        messageDiv.classList.add('hidden');

        if (!decision) {
            messageDiv.textContent = 'Vui lòng chọn quyết định!';
            messageDiv.classList.remove('hidden', 'success-message');
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
                    UI.closeModal('review-modal');
                    DataLoader.loadPendingCampaigns();
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
    },
    async handleAdReviewSubmit(event) {
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
                body: JSON.stringify({ decision: decision })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.textContent = data.message || 'Duyệt quảng cáo thành công!';
                messageDiv.classList.remove('hidden', 'error-message');
                messageDiv.classList.add('success-message');
                DataLoader.loadPendingAds();
                DataLoader.loadAds();
                setTimeout(closeAdModal, 1500);
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
    },
    async handleContractRenewSubmit(e) {
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
            DataLoader.loadContracts();
        } catch (err) {
            console.error(err);
            alert("Có lỗi khi gia hạn hợp đồng");
        }
    },
    async handleAccountFormSubmit(e) {
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
            DataLoader.loadAccount("khachhang");
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra!");
        }
    },
    async handleRuleFormSubmit(e) {
        e.preventDefault();
        const id = document.getElementById("rule-id").value;

        const payload = {
            rule_name: document.getElementById("rule-name").value.trim(),
            rate: parseFloat(document.getElementById("rate").value),
            effective_from: document.getElementById("effective-from").value,
            effective_to: document.getElementById("effective-to").value || null,
            status: parseInt(document.getElementById("status").value, 10)
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
                DataLoader.loadConversionRules();
            } else {
                alert("❌ " + data.message);
            }
        } catch (err) {
            console.error("Lỗi khi lưu chính sách:", err);
            alert("Có lỗi khi lưu chính sách");
        }
    },
    async handleCreateNotificationSubmit(e) {
        e.preventDefault();

        const title = document.getElementById("notificationTitle")?.value || "";
        const message = document.getElementById("notificationMessage")?.value || "";
        const end_at = document.getElementById("notificationEndAt")?.value || "";
        const noti_type = document.getElementById("notificationType")?.value || "marketing";
        const target_type = document.getElementById("notificationTarget") ? document.getElementById("notificationTarget").value : "all";
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
                document.getElementById("createNotificationModal").classList.add("hidden");
                e.target.reset();
                document.getElementById("brandTargetInput")?.classList.add("hidden");
            } else {
                alert("❌ Lỗi: " + (data.message || "Không thể tạo thông báo"));
            }
        } catch (err) {
            console.error("Lỗi tạo thông báo:", err);
            alert("❌ Có lỗi xảy ra khi gửi thông báo");
        }
    },
    async handleMarkAllNotificationsRead() {
        await APIService.post("/notification/mark_all_read");
        if (document.getElementById("notificationList")) DataLoader.loadSystemNotifications();
        if (document.getElementById("notification-list")) DataLoader.loadMallNotifications();
    },
    async checkExpiringContracts() {
        await APIService.post("/brand/check_expiring");
        DataLoader.loadSystemNotifications();
    }
};

document.addEventListener('DOMContentLoaded', function () {
    UI.init();
    DataLoader.loadDashboard();
    Handlers.checkExpiringContracts();
    setInterval(Handlers.checkExpiringContracts, 10 * 60 * 1000);
});

window.openReviewModal = (campaignId) => {
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
    UI.openModal('review-modal');
    document.getElementById('review-form').setAttribute('data-campaign-id', campaignId);
};

window.closeModal = () => {
    UI.closeModal('review-modal');
};

window.openAdReviewModal = (adId) => {
    const ad = window.pendingAds.find(a => a.ad_id === adId);
    if (!ad) {
        alert(`Không tìm thấy chi tiết cho quảng cáo ID ${adId}.`);
        return;
    }

    document.getElementById('modal-ad-id').textContent = `AD-${ad.ad_id}`;
    document.getElementById('modal-ad-title').textContent = ad.title;
    document.getElementById('modal-ad-description').textContent = ad.description || 'N/A';
    document.getElementById('modal-ad-brand').textContent = ad.brand_id || 'N/A';
    document.getElementById('modal-ad-time').textContent = `${ad.start_at ? formatDate(ad.start_at) : 'N/A'} - ${ad.end_at ? formatDate(ad.end_at) : 'N/A'}`;
    document.getElementById('modal-ad-cost').textContent = ad.ad_cost ? formatCurrency(ad.ad_cost) : 'N/A';

    const form = document.getElementById('ad-review-form');
    form.reset();
    form.setAttribute('data-ad-id', adId);
    document.getElementById('ad-modal-message').classList.add('hidden');
    UI.openModal('ad-review-modal');
};

window.closeAdModal = () => {
    UI.closeModal('ad-review-modal');
};

window.viewContract = async (id) => {
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
};

window.closeContractModal = () => {
    document.getElementById("contract-modal").classList.add("hidden");
};

window.toggleRenew = (show) => {
    document.getElementById("renew-section").classList.toggle("hidden", !show);
    document.getElementById("contract-actions").classList.toggle("hidden", show);
};

window.editAccount = async (id) => {
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
};

window.deleteAccount = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
    try {
        const res = await fetch(`/user/delete_account/${id}`, { method: "DELETE" });
        const result = await res.json();
        alert(result.message || "Đã xóa!");
        DataLoader.loadAccount("khachhang");
    } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi xóa!");
    }
};

window.openAccountModal = (user = null) => {
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
};

window.closeAccountModal = () => {
    document.getElementById("account-modal").classList.add("hidden");
};

window.viewRule = async (id) => {
    try {
        const res = await fetch(`/point/conversion_rule/${id}`);
        const data = await res.json();
        if (data.success) {
            const rule = data.rule;
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
        } else {
            alert("Không tìm thấy chính sách");
        }
    } catch (err) {
        console.error("Lỗi khi xem chi tiết:", err);
    }
};

window.editRule = async (id) => {
    try {
        const res = await fetch(`/point/conversion_rule/${id}`);
        const data = await res.json();
        if (!data.success) return alert("Không tìm thấy chính sách");
        openRuleModal(true, data.rule);
    } catch (e) {
        console.error("Lỗi khi mở form chỉnh sửa:", e);
        alert("Lỗi khi mở form chỉnh sửa");
    }
};

window.deleteRule = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa chính sách này?")) return;

    try {
        const res = await fetch(`/point/conversion_rule/${id}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
            alert(data.message);
            DataLoader.loadConversionRules();
        } else {
            alert("❌ " + data.message);
        }
    } catch (err) {
        console.error("Lỗi khi xóa rule:", err);
        alert("Có lỗi khi xóa chính sách");
    }
};

window.openRuleModal = (isEdit = false, rule = null) => {
    const modal = document.getElementById("rule-modal");
    const title = document.getElementById("rule-modal-title");
    const form = document.getElementById("rule-form");

    form.reset();
    document.getElementById("rule-id").value = "";

    if (isEdit && rule) {
        title.textContent = "Chỉnh sửa chính sách";
        document.getElementById("rule-id").value = rule.conversion_rule_id;
        document.getElementById("rule-name").value = rule.rule_name || "";
        document.getElementById("rate").value = rule.rate || "";
        if (rule.effective_from) {
            document.getElementById("effective-from").value = new Date(rule.effective_from).toISOString().split("T")[0];
        }
        if (rule.effective_to) {
            document.getElementById("effective-to").value = new Date(rule.effective_to).toISOString().split("T")[0];
        }
        document.getElementById("status").value = rule.status;
    } else {
        title.textContent = "Thêm chính sách";
    }

    modal.classList.remove("hidden");
};

window.closeRuleModal = () => {
    document.getElementById("rule-modal").classList.add("hidden");
};

window.closeRuleDetailModal = () => {
    document.getElementById("rule-detail-modal").classList.add("hidden");
};

window.markRead = async (id) => {
    try {
        await APIService.post(`/notification/mark_read/${id}`);
        DataLoader.loadMallNotifications();
    } catch (err) {
        console.error("❌ Lỗi markRead:", err);
    }
};