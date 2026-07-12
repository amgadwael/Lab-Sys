// script.js
// Professional Dashboard JS (Vanilla) — Patients, Quick/Detailed Tests, Reports, Translations, Print, CSV

(() => {
  // ---- Config / Storage keys ----
  const LS_PAT = "lab_patients_v1";
  const LS_REP = "lab_reports_v1";
  const LS_LANG = "lab_lang";
  const DATE_OPTS = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };

  // ---- Utilities ----
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const fmt = iso => new Date(iso).toLocaleString(undefined, DATE_OPTS);
  const escapeHtml = s => s ? String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])) : "";

  // ---- State ----
  let state = {
    patients: JSON.parse(localStorage.getItem(LS_PAT) || "[]"),
    reports: JSON.parse(localStorage.getItem(LS_REP) || "[]"),
    lang: localStorage.getItem(LS_LANG) || "ar"
  };

  // ---- i18n strings minimal for JS-updates ----
  const i18n_simple = {
    ar: { select_patient: "اختر المريض", no_reports: "لا توجد تقارير بعد", fill_required: "من فضلك املأ الحقول المطلوبة", confirm_delete: "هل أنت متأكد من الحذف؟", logout_confirm: "تأكيد تسجيل الخروج؟", logout_done: "تم تسجيل الخروج (محليًا)" },
    en: { select_patient: "Select patient", no_reports: "No reports yet", fill_required: "Please fill required fields", confirm_delete: "Delete permanently?", logout_confirm: "Confirm logout?", logout_done: "Logged out (local data cleared)" }
  };

  // ---- Persistence ----
  function save() {
    localStorage.setItem(LS_PAT, JSON.stringify(state.patients));
    localStorage.setItem(LS_REP, JSON.stringify(state.reports));
    localStorage.setItem(LS_LANG, state.lang);
  }
  // تسجيل خروج
function logout() {
  alert("تم تسجيل الخروج بنجاح ✅");
  // إعادة التوجيه لصفحة تسجيل الدخول
  window.location.href = "login.html"; 
}


  // ---- Renderers ----
  function renderPatientsTable() {
    const tbody = $("#patientsTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    state.patients.forEach((p, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i+1}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.phone || "-")}</td>
        <td>${escapeHtml(p.age || "-")}</td>
        <td>${fmt(p.createdAt)}</td>
        <td><button class="btn small danger js-delete-patient" data-id="${p.id}">حذف</button></td>`;
      tbody.appendChild(tr);
    });
    if (state.patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted)">${i18n_simple[state.lang].no_reports}</td></tr>`;
    }
  }

  function renderReportsTables() {
    const quickTbody = $("#quickReportsTable tbody");
    const detailedTbody = $("#detailedReportsTable tbody");
    const allTbody = $("#allReportsTable tbody");
    if (!quickTbody || !detailedTbody || !allTbody) return;

    quickTbody.innerHTML = "";
    detailedTbody.innerHTML = "";
    allTbody.innerHTML = "";

    const quicks = state.reports.filter(r => r.type === "quick");
    const detailed = state.reports.filter(r => r.type === "detailed");

    const fillRow = (r, idx, includeActions = true) => {
      const patient = state.patients.find(p => p.id === r.patientId) || { name: "-" };
      return `<tr>
        <td>${idx+1}</td>
        <td>${escapeHtml(patient.name)}</td>
        <td>${escapeHtml(r.testName)}</td>
        <td>${escapeHtml(r.sampleType || "-")}</td>
        <td>${escapeHtml(r.doctor || "-")}</td>
        <td>${r.cost || "-"}</td>
        <td>${fmt(r.createdAt)}</td>
        ${includeActions ? `<td><button class="btn small danger js-delete-report" data-id="${r.id}">حذف</button></td>` : ""}
      </tr>`;
    };

    quicks.forEach((r, i) => quickTbody.insertAdjacentHTML("beforeend", fillRow(r, i)));
    detailed.forEach((r, i) => detailedTbody.insertAdjacentHTML("beforeend", fillRow(r, i)));
    state.reports.forEach((r, i) => {
      const patient = state.patients.find(p => p.id === r.patientId) || { name: "-" };
      allTbody.insertAdjacentHTML("beforeend", `<tr>
        <td>${i+1}</td><td>${escapeHtml(patient.name)}</td><td>${escapeHtml(r.testName)}</td><td>${escapeHtml(r.doctor||"-")}</td><td>${r.cost||"-"}</td><td>${fmt(r.createdAt)}</td>
      </tr>`);
    });

    if (quicks.length === 0) quickTbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted)">${i18n_simple[state.lang].no_reports}</td></tr>`;
    if (detailed.length === 0) detailedTbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--muted)">${i18n_simple[state.lang].no_reports}</td></tr>`;
    if (state.reports.length === 0) allTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted)">${i18n_simple[state.lang].no_reports}</td></tr>`;
  }

  function populateSelects() {
    const selects = ["#quickPatientSelect", "#detailedPatient", "#printPatientSelect", "#reportPatientSelect", "#quickPatientSelect"];
    selects.forEach(selId => {
      const el = document.querySelector(selId);
      if (!el) return;
      el.innerHTML = `<option value="">${i18n_simple[state.lang].select_patient}</option>`;
      state.patients.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.name}${p.phone ? " — " + p.phone : ""}`;
        el.appendChild(opt);
      });
    });
  }

  function updateDashboard() {
    const today = new Date().toLocaleDateString();
    const patientsToday = state.patients.filter(p => new Date(p.createdAt).toLocaleDateString() === today).length;
    const testsCount = state.reports.length;
    const revenue = state.reports.reduce((s, r) => s + (Number(r.cost) || 0), 0);

    if ($("#patientsToday")) $("#patientsToday").textContent = patientsToday;
    if ($("#testsCount")) $("#testsCount").textContent = testsCount;
    if ($("#revenueToday")) $("#revenueToday").textContent = revenue.toLocaleString() + (state.lang === "ar" ? " ج.م" : " EGP");
  }

  // ---- Actions ----
  function addPatient({ name, phone, age }) {
    const p = { id: uid(), name: name.trim(), phone: phone || "", age: age || "", createdAt: new Date().toISOString() };
    state.patients.unshift(p);
    save();
    renderAll();
  }

  function addReport({ patientId, type = "quick", testName, sampleType, doctor, cost, details = "" }) {
    const r = { id: uid(), patientId, type, testName: testName.trim(), sampleType: sampleType || "", doctor: doctor || "", cost: cost ? Number(cost) : 0, details: details || "", createdAt: new Date().toISOString() };
    state.reports.unshift(r);
    save();
    renderAll();
  }

  function deletePatient(id) {
    if (!confirm(i18n_simple[state.lang].confirm_delete)) return;
    state.patients = state.patients.filter(p => p.id !== id);
    state.reports = state.reports.filter(r => r.patientId !== id);
    save();
    renderAll();
  }

  function deleteReport(id) {
    if (!confirm(i18n_simple[state.lang].confirm_delete)) return;
    state.reports = state.reports.filter(r => r.id !== id);
    save();
    renderAll();
  }

  // ---- Print / PDF ----
  function exportCSV() {
    // export all reports to CSV
    const rows = [["Patient","Test","Doctor","Cost","Date"]];
    state.reports.forEach(r => {
      const patient = state.patients.find(p => p.id === r.patientId) || { name: "-" };
      rows.push([patient.name, r.testName, r.doctor || "-", r.cost || 0, fmt(r.createdAt)]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `lab_reports_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  async function printPatient(pid, lang = state.lang) {
    const patient = state.patients.find(p => p.id === pid);
    if (!patient) { alert(i18n_simple[state.lang].select_patient); return; }
    const reps = state.reports.filter(r => r.patientId === pid);
    if (reps.length === 0) { alert(i18n_simple[state.lang].no_reports); return; }

    if (window.jspdf && window.jspdf.jsPDF) {
      try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: "pt", format: "a4" });
        doc.setFontSize(18);
        doc.text(lang === "ar" ? "تقرير المعمل" : "Lab Report", 40, 40);
        doc.setFontSize(12);
        doc.text(`${lang === "ar" ? "المريض" : "Patient"}: ${patient.name}`, 40, 70);
        doc.text(`${lang === "ar" ? "الهاتف" : "Phone"}: ${patient.phone || "-"}`, 40, 90);
        const head = [[lang === "ar" ? "#" : "#", lang === "ar" ? "التحليل" : "Test", lang === "ar" ? "الطبيب" : "Doctor", lang === "ar" ? "السعر" : "Cost", lang === "ar" ? "التاريخ" : "Date"]];
        const body = reps.map((r, i) => [i+1, r.testName, r.doctor || "-", r.cost || 0, fmt(r.createdAt)]);
        doc.autoTable({ startY: 110, head, body, theme: "striped" });
        const total = reps.reduce((s, r) => s + (Number(r.cost) || 0), 0);
        doc.setFontSize(12);
        doc.text(`${lang === "ar" ? "الإجمالي" : "Total"}: ${total} ${lang === "ar" ? "ج.م" : "EGP"}`, 40, doc.lastAutoTable.finalY + 20);
        doc.save(`Report_${patient.name.replace(/\s+/g,'_')}.pdf`);
        return;
      } catch (err) {
        console.error("jsPDF error", err);
      }
    }

    // fallback to window.print
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`<html><head><title>Report</title><style>body{font-family:Arial;padding:20px}</style></head><body>`);
    win.document.write(`<h2>${escapeHtml(patient.name)}</h2>`);
    win.document.write(`<p>${escapeHtml(patient.phone || "")}</p>`);
    win.document.write(`<table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>#</th><th>Test</th><th>Doctor</th><th>Cost</th><th>Date</th></tr></thead><tbody>`);
    reps.forEach((r, i) => win.document.write(`<tr><td>${i+1}</td><td>${escapeHtml(r.testName)}</td><td>${escapeHtml(r.doctor || "-")}</td><td>${r.cost || 0}</td><td>${fmt(r.createdAt)}</td></tr>`));
    const total = reps.reduce((s, r) => s + (Number(r.cost) || 0), 0);
    win.document.write(`</tbody></table><p><strong>Total: ${total}</strong></p>`);
    win.document.write("</body></html>");
    win.document.close();
    win.print();
  }

  // ---- Search filter for allReports table ----
  function filterAllReports(q) {
    q = (q || "").trim().toLowerCase();
    const rows = $$("#allReportsTable tbody tr");
    rows.forEach(r => {
      r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  }

  // ---- Wire UI events ----
  function wire() {
    // Sidebar nav
    $$(".menu-item").forEach(btn => {
      btn.addEventListener("click", () => {
        $$(".menu-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const section = `section-${btn.dataset.section}`;
        showSection(section);
      });
    });

    // Quick patient form
    const qPatForm = $("#quickPatientForm");
    if (qPatForm) qPatForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = $("#quickName").value.trim();
      const phone = $("#quickPhone").value.trim();
      const age = $("#quickAge").value.trim();
      if (!name) { alert(i18n_simple[state.lang].fill_required); return; }
      addPatient({ name, phone, age });
      qPatForm.reset();
    });

    // Patient form
    const patForm = $("#patientForm");
    if (patForm) patForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = $("#patientName").value.trim();
      const phone = $("#patientPhone").value.trim();
      const age = $("#patientAge").value.trim();
      if (!name) { alert(i18n_simple[state.lang].fill_required); return; }
      addPatient({ name, phone, age });
      patForm.reset();
      // show patients section
      const btn = $$(".menu-item").find(b => b.dataset.section === "patients");
      if (btn) btn.click();
    });

    // Quick test
    const qTestForm = $("#quickTestForm");
    if (qTestForm) qTestForm.addEventListener("submit", e => {
      e.preventDefault();
      const pid = $("#quickPatientSelect").value;
      const testName = $("#quickTestName").value.trim();
      const sampleType = $("#quickSampleType").value;
      const doctor = $("#quickDoctor").value.trim();
      const cost = $("#quickCost").value.trim();
      if (!pid || !testName) { alert(i18n_simple[state.lang].fill_required); return; }
      addReport({ patientId: pid, type: "quick", testName, sampleType, doctor, cost });
      qTestForm.reset();
    });

    // Detailed add
    const addDetailBtn = $("#addDetailedReportBtn");
    if (addDetailBtn) addDetailBtn.addEventListener("click", () => {
      const pid = $("#detailedPatient").value;
      const testName = $("#analysisName").value.trim();
      const sampleType = $("#sampleType").value;
      const notes = $("#medicalNotes").value.trim();
      const doc = $("#analysisDoctor").value.trim();
      const cost = $("#analysisCost").value.trim();
      if (!pid || !testName || !doc) { alert(i18n_simple[state.lang].fill_required); return; }
      addReport({ patientId: pid, type: "detailed", testName, sampleType, doctor: doc, cost, details: notes });
      const f = $("#detailedAnalysisForm"); if (f) f.reset();
    });

    // Print
    const printBtn = $("#printBtn");
    if (printBtn) printBtn.addEventListener("click", () => {
      const pid = $("#printPatientSelect").value;
      const lang = $("#printLangSelect").value || state.lang;
      if (!pid) { alert(i18n_simple[state.lang].select_patient); return; }
      printPatient(pid, lang);
    });

    // CSV export
    const exportBtn = $("#exportCSVBtn");
    if (exportBtn) exportBtn.addEventListener("click", exportCSV);

    // Language toggles
    const langTop = $("#langBtnTop");
    const langToggle = $("#langToggle");
    [langTop, langToggle].forEach(el => {
      if (!el) return;
      el.addEventListener("click", () => {
        state.lang = state.lang === "ar" ? "en" : "ar";
        save();
        applyLang();
      });
    });

// ...existing code...
// Logout
const logout = $("#logoutBtn");
if (logout) logout.addEventListener("click", () => {
  if (!confirm(i18n_simple[state.lang].logout_confirm || "Confirm?")) return;
  localStorage.removeItem(LS_PAT);
  localStorage.removeItem(LS_REP);
  state.patients = []; state.reports = [];
  save();
  renderAll();
  alert(i18n_simple[state.lang].logout_done);
  window.location.href = "login.html"; // إعادة التوجيه لصفحة تسجيل الدخول
});
// ...existing code...
    // Delegated delete handlers
    document.addEventListener("click", e => {
      const dp = e.target.closest(".js-delete-patient");
      if (dp) deletePatient(dp.dataset.id);
      const dr = e.target.closest(".js-delete-report");
      if (dr) deleteReport(dr.dataset.id);
    });

    // Global search
    const gs = $("#globalSearch");
    if (gs) gs.addEventListener("input", e => filterAllReports(e.target.value));
  }

  // ---- Helpers ----
  function showSection(sectionId) {
    $$(".section").forEach(s => s.classList.remove("active-section"));
    const sec = document.getElementById(sectionId);
    if (sec) sec.classList.add("active-section");
    // update topbar title
    const title = sec ? sec.querySelector("h3, h2, h1") : null;
    if (title) $("#appTitle").textContent = title.textContent;
  }

  function addPatient({ name, phone, age }) {
    const p = { id: uid(), name, phone, age, createdAt: new Date().toISOString() };
    state.patients.unshift(p);
    save();
    renderAll();
  }

  // ---- Render all ----
  function renderAll() {
    renderPatientsTable();
    renderReportsTables();
    populateSelects();
    updateDashboard();
    // year
    if ($("#year")) $("#year").textContent = new Date().getFullYear();
  }

  // ---- Language / UI texts from HTML data-i18n (basic) ----
  function applyLangToDOM() {
    // minimal translations mapping (expandable)
    const map = {
      app_title: { ar: "نظام إدارة المعمل", en: "Lab Management" },
      dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
      patients: { ar: "المرضى", en: "Patients" },
      quickTests: { ar: "التحاليل السريعة", en: "Quick Tests" },
      detailedAnalysis: { ar: "تحليل مفصل", en: "Detailed Analysis" },
      reports: { ar: "التقارير", en: "Reports" },
      settings: { ar: "الإعدادات", en: "Settings" },
      logout: { ar: "تسجيل خروج", en: "Logout" },
      add_patient: { ar: "إضافة مريض", en: "Add patient" },
      add_test: { ar: "إضافة تحليل", en: "Add test" },
      quickPatientTitle: { ar: "إضافة مريض سريع", en: "Quick Add Patient" },
      quickTestTitle: { ar: "إضافة تحليل سريع", en: "Quick Add Test" },
      detailedAnalysis: { ar: "تحليل مفصل", en: "Detailed Analysis" },
      print: { ar: "طباعة", en: "Print" },
      language_setting: { ar: "اللغة", en: "Language" }
    };
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (map[key]) el.textContent = map[key][state.lang] || el.textContent;
    });
    // update select placeholders like printPatientSelect
    $$("#printPatientSelect, #quickPatientSelect, #detailedPatient, #reportPatientSelect").forEach(sel => {
      if (!sel) return;
      const opt = sel.querySelector("option");
      if (opt) opt.textContent = i18n_simple[state.lang].select_patient;
    });
    // update lang buttons text
    if ($("#langToggleText")) $("#langToggleText").textContent = state.lang === "ar" ? "EN" : "AR";
    if ($("#langBtnTop")) $("#langBtnTop").textContent = state.lang === "ar" ? "EN" : "AR";
  }

  function applyLang() {
    applyLangToDOM();
    renderAll();
  }

  // ---- Init ----
  function init() {
    wire();
    applyLang();
    renderAll();
  }

  // run
  init();

})();
