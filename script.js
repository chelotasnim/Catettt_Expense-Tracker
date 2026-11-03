// Ganti dengan URL deployment Web App dari Apps Script Anda
const API_URL = "https://script.google.com/macros/s/AKfycbxksciOUsKtfjHsAPFfSkDOUfVu112dCU-VGM29_EdWxtugnXwHI8vl0pyd0vlrVdkG2g/exec";

document.addEventListener("DOMContentLoaded", () => {
    // Set tanggal default form ke hari ini
    document.getElementById("inputTanggal").valueAsDate = new Date();

    updateOptionBoxActiveState();

    // Event listener saat pilihan jenis (radio) berubah
    const radioButtons = document.querySelectorAll('input[name="type"]');
    radioButtons.forEach(radio => {
        radio.addEventListener("change", updateOptionBoxActiveState);
    });

    document.getElementById("addThousand").addEventListener("click", () => { addZero(1000) });
    document.getElementById("addHundred").addEventListener("click", () => { addZero(100) });

    // Load data awal
    fetchExpenses();

    // Event listener submit form
    document.getElementById("expenseForm").addEventListener("submit", handleAddExpense);
});

function addZero(amount) {
    const field = document.getElementById('inputNominal');
    field.value = field.value * amount;
    field.focus();
}

// Format Angka ke IDR
function formatRupiah(number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(number);
}

// Format Tanggal (e.g., 2026-09-09 -> 09 September 2026)
function formatDate(dateString) {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// 1. Dapatkan Data (Read)
async function fetchExpenses() {
    const table = document.getElementById("dataTable");
    table.innerHTML = "<tr><td colspan='2' style='text-align:center;'>Memuat data...</td></tr>";

    try {
        const response = await fetch(`${API_URL}?action=read`);
        const data = await response.json();
        renderTable(data);
    } catch (error) {
        console.error("Gagal mengambil data:", error);
        table.innerHTML = "<tr><td colspan='2' style='text-align:center;'>Gagal memuat data.</td></tr>";
    }
}

// Render data ke tabel dan kelompokkan berdasarkan tanggal
function renderTable(expenses) {
    const table = document.getElementById("dataTable");
    table.innerHTML = "";

    if (expenses.length === 0) {
        table.innerHTML = "<tr><td colspan='2' style='text-align:center;'>Belum ada pengeluaran.</td></tr>";
        return;
    }

    // Urutkan data dari tanggal terbaru
    expenses.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    // Kelompokkan pengeluaran berdasarkan tanggal
    const grouped = {};
    expenses.forEach(item => {
        const key = item.tanggal;
        if (!grouped[key]) {
            grouped[key] = { items: [], total: 0 };
        }
        grouped[key].items.push(item);
        grouped[key].total += Number(item.nominal);
    });

    // Render baris header tanggal & item pengeluaran
    Object.keys(grouped).forEach(date => {
        const gapRow = document.createElement("tr");
        gapRow.innerHTML = `
            <td class="gap-td"></td>
            <td class="gap-td"></td>
        `
        table.appendChild(gapRow);

        // Marker Tanggal & Total Pengeluaran
        const markerRow = document.createElement("tr");
        markerRow.innerHTML = `
            <td class="marker">${formatDate(date)}</td>
            <td class="marker">${formatRupiah(grouped[date].total)}</td>
        `;
        table.appendChild(markerRow);

        // Baris Item Pengeluaran
        grouped[date].items.forEach(item => {
            const itemRow = document.createElement("tr");
            itemRow.innerHTML = `
                <td>
                    <button onclick="handleDeleteExpense('${item.id}')">x</button>
                    ${Number(item.nominal).toLocaleString('id-ID')}
                </td>
                <td>
                    <span class="badge">${item.jenis}</span>
                    ${item.keterangan}
                </td>
            `;
            table.appendChild(itemRow);
        });
    });
}

// 2. Tambah Data (Create)
async function handleAddExpense(e) {
    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerText = "Menyimpan...";

    const payload = {
        action: "create",
        tanggal: document.getElementById("inputTanggal").value,
        jenis: document.querySelector('input[name="type"]:checked').value,
        nominal: document.getElementById("inputNominal").value,
        keterangan: document.getElementById("inputKeterangan").value
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify(payload),
            redirect: "follow"
        });

        document.getElementById("inputNominal").value = "";
        document.getElementById("inputKeterangan").value = "";

        await fetchExpenses();
    } catch (error) {
        console.error("Gagal menambah data:", error);
        alert("Gagal menambahkan pengeluaran.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Catettt!";
    }
}

// 3. Hapus Data (Delete)
async function handleDeleteExpense(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan ini?")) return;

    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action: "delete", id: id }),
            redirect: "follow"
        });

        await fetchExpenses();
    } catch (error) {
        console.error("Gagal menghapus data:", error);
        alert("Gagal menghapus pengeluaran.");
    }
}

function updateOptionBoxActiveState() {
    const radioButtons = document.querySelectorAll('input[name="type"]');

    radioButtons.forEach(radio => {
        const optionBox = radio.closest('.option-box');
        if (radio.checked) {
            optionBox.classList.add('active');
        } else {
            optionBox.classList.remove('active');
        }
    });
}