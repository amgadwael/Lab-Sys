function updateFullReportsTable(filteredReports = window.reports) {
    const tableBody = document.querySelector('#fullReportsTable tbody');
    tableBody.innerHTML = '';
    
    if (!window.reports || window.reports.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">لا توجد تقارير متاحة.</td></tr>';
        return;
    }
    
    filteredReports.forEach(report => {
        const row = document.createElement('tr');
        const reportDate = new Date(report.id);
        
        row.innerHTML = `
            <td>${reportDate.toLocaleDateString()}</td>
            <td>${reportDate.toLocaleTimeString()}</td>
            <td>${report.patient.name}</td>
            <td>${report.testName}</td>
            <td>${report.testResult}</td>
            <td>${report.cost} ج.م</td>
            <td>${report.doctorName || 'غير محدد'}</td>
        `;
        tableBody.appendChild(row);
    });
}

function filterReports() {
    const searchTerm = reportSearchInput.value.toLowerCase();
    const dateFilter = reportDateFilter.value;

    let filtered = window.reports;

    if (searchTerm) {
        filtered = filtered.filter(report =>
            report.patient.name.toLowerCase().includes(searchTerm) ||
            report.testName.toLowerCase().includes(searchTerm)
        );
    }

    if (dateFilter) {
        filtered = filtered.filter(report => {
            const reportDate = new Date(report.id).toISOString().slice(0, 10);
            return reportDate === dateFilter;
        });
    }

    updateFullReportsTable(filtered);
}

const reportSearchInput = document.getElementById('reportSearchInput');
const reportDateFilter = document.getElementById('reportDateFilter');

if (reportSearchInput) {
    reportSearchInput.addEventListener('input', filterReports);
}
if (reportDateFilter) {
    reportDateFilter.addEventListener('change', filterReports);
}

function updateAdminDashboard() {
    const today = new Date().toDateString();
    const todayPatients = window.patients ? window.patients.filter(p => new Date(p.date).toDateString() === today).length : 0;
    const totalRevenue = window.reports ? window.reports.reduce((sum, report) => sum + report.cost, 0) : 0;
    const totalReports = window.reports ? window.reports.length : 0;

    document.getElementById('todayPatients').textContent = todayPatients;
    document.getElementById('totalRevenue').textContent = totalRevenue + ' ج.م';
    document.getElementById('totalReports').textContent = totalReports;

    updateFullReportsTable();
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(updateAdminDashboard, 500); 
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
}