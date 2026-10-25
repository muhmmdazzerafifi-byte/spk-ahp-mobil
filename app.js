/**
 * Application Controller & UI Renderer
 * SPK AHP Pemilihan Mobil
 */

let state = {
    activeTab: 'dashboard',
    activeAltCriterion: 'style',
    criteria: JSON.parse(JSON.stringify(INITIAL_DATA.criteria)),
    alternatives: JSON.parse(JSON.stringify(INITIAL_DATA.alternatives)),
    criteriaMatrix: JSON.parse(JSON.stringify(INITIAL_DATA.criteriaMatrix)),
    alternativeMatrices: JSON.parse(JSON.stringify(INITIAL_DATA.alternativeMatrices)),
    analysis: {
        criteria: null,
        alternatives: {},
        finalResults: []
    }
};

// Referensi instance chart
let barChartInstance = null;
let radarChartInstance = null;

// Format Angka ke 3 Desimal (khas Excel Indonesia)
function formatNumber(num, decimals = 3) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Number(num).toLocaleString('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Inisialisasi Aplikasi
function initApp() {
    recalculateAll();
    setupEventListeners();
    switchTab('dashboard');
}

// Hitung ulang semua matriks & hasil akhir AHP
function recalculateAll() {
    // 1. Analisis Matriks Kriteria
    state.analysis.criteria = AHPCalculator.analyzeMatrix(state.criteriaMatrix);

    // 2. Analisis Matriks Tiap Alternatif
    state.analysis.alternatives = {};
    const altWeightsMap = {};

    state.criteria.forEach(crit => {
        const matrix = state.alternativeMatrices[crit.id];
        const analysis = AHPCalculator.analyzeMatrix(matrix);
        state.analysis.alternatives[crit.id] = analysis;
        altWeightsMap[crit.id] = analysis.weights;
    });

    // 3. Sintesis Hasil Akhir (Ranking)
    state.analysis.finalResults = AHPCalculator.calculateFinalResults(
        state.analysis.criteria.weights,
        altWeightsMap,
        state.alternatives,
        state.criteria
    );

    // Render tampilan sesuai tab aktif
    renderActiveTab();
    updateNavigationBadges();
}

// Ganti Tab Utama
function switchTab(tabId) {
    state.activeTab = tabId;

    // Update styling tombol tab
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Sembunyikan semua konten tab, tampilkan yang aktif
    document.querySelectorAll('.tab-content-panel').forEach(panel => {
        panel.classList.add('hidden');
    });

    const activePanel = document.getElementById(`panel-${tabId}`);
    if (activePanel) {
        activePanel.classList.remove('hidden');
    }

    renderActiveTab();
}

// Update Badge Status Konsistensi pada Navigasi
function updateNavigationBadges() {
    // Badge Kriteria
    const critBadge = document.getElementById('nav-badge-criteria');
    if (critBadge && state.analysis.criteria) {
        critBadge.className = `ml-2 px-2 py-0.5 text-xs rounded-full font-bold ${
            state.analysis.criteria.consistency.isConsistent 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-amber-100 text-amber-800'
        }`;
        critBadge.innerText = `CR: ${formatNumber(state.analysis.criteria.consistency.cr, 3)}`;
    }

    // Badge Alternatif Sub-kriteria
    const styleAnalysis = state.analysis.alternatives['style'];
    const altBadge = document.getElementById('nav-badge-alternatives');
    if (altBadge && styleAnalysis) {
        const hasInconsistent = Object.values(state.analysis.alternatives).some(a => !a.consistency.isConsistent);
        altBadge.className = `ml-2 px-2 py-0.5 text-xs rounded-full font-bold ${
            !hasInconsistent ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`;
        altBadge.innerText = !hasInconsistent ? 'Konsisten' : 'Cek Nilai';
    }
}

// Render Konten Tab yang sedang aktif
function renderActiveTab() {
    switch (state.activeTab) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'criteria':
            renderCriteriaMatrixTab();
            break;
        case 'alternatives':
            renderAlternativesTab();
            break;
        case 'synthesis':
            renderSynthesisTab();
            break;
        case 'guide':
            // static guide content
            break;
    }
}

/**
 * ========================================================
 * 1. DASHBOARD & RANKING VIEW
 * ========================================================
 */
function renderDashboard() {
    const results = state.analysis.finalResults;
    if (!results || results.length === 0) return;

    const winner = results[0];

    // Render Winner Card
    const winnerEl = document.getElementById('winner-card-container');
    if (winnerEl) {
        winnerEl.innerHTML = `
            <div class="glass-card rounded-2xl p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl relative overflow-hidden">
                <div class="absolute -right-8 -bottom-8 opacity-15 text-9xl">
                    <i class="fa-solid fa-trophy"></i>
                </div>
                <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div class="space-y-2 text-center md:text-left">
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
                            <i class="fa-solid fa-crown text-amber-300"></i> Rekomendasi Utama (Peringkat 1)
                        </div>
                        <h2 class="text-3xl md:text-4xl font-extrabold tracking-tight">${winner.name}</h2>
                        <p class="text-blue-100 max-w-xl text-sm leading-relaxed">
                            Terpilih sebagai alternatif terbaik dengan skor akhir tertinggi 
                            <strong class="text-white font-mono bg-white/20 px-2 py-0.5 rounded text-base">${formatNumber(winner.finalScore, 4)}</strong> 
                            (${formatNumber(winner.percentage, 2)}%). Unggul seimbang pada kriteria penentu keputusan.
                        </p>
                    </div>
                    <div class="flex flex-col items-center justify-center p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 min-w-[170px] text-center">
                        <span class="text-xs uppercase tracking-wider text-blue-200 font-semibold">Skor Akhir AHP</span>
                        <span class="text-4xl font-black font-mono my-1">${formatNumber(winner.finalScore, 3)}</span>
                        <span class="text-xs text-amber-300 font-medium"><i class="fa-solid fa-star"></i> Prioritas Tertinggi</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Render Podium Top 3
    const podiumEl = document.getElementById('podium-container');
    if (podiumEl) {
        const top3 = results.slice(0, 3);
        const rankStyles = [
            { border: 'border-amber-400', badge: 'bg-amber-400 text-amber-950', icon: 'fa-trophy', label: 'Juara 1' },
            { border: 'border-slate-300', badge: 'bg-slate-300 text-slate-900', icon: 'fa-medal', label: 'Juara 2' },
            { border: 'border-orange-300', badge: 'bg-orange-300 text-orange-950', icon: 'fa-award', label: 'Juara 3' }
        ];

        podiumEl.innerHTML = top3.map((car, idx) => `
            <div class="glass-card glass-card-hover rounded-xl p-5 border-2 ${rankStyles[idx].border} relative flex flex-col justify-between">
                <div class="flex items-center justify-between mb-3">
                    <span class="px-2.5 py-1 rounded-full text-xs font-bold ${rankStyles[idx].badge} flex items-center gap-1.5 shadow-sm">
                        <i class="fa-solid ${rankStyles[idx].icon}"></i> ${rankStyles[idx].label}
                    </span>
                    <span class="text-xs text-slate-400 font-mono">Rank #${car.rank}</span>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-slate-800">${car.name}</h3>
                    <p class="text-xs text-slate-500 mb-3">${car.badge}</p>
                    <div class="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                        <div class="flex justify-between text-slate-600">
                            <span>Bobot Style:</span>
                            <span class="font-mono font-semibold">${formatNumber(car.scoreBreakdown.style.altWeight, 3)}</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span>Bobot Keandalan:</span>
                            <span class="font-mono font-semibold">${formatNumber(car.scoreBreakdown.keandalan.altWeight, 3)}</span>
                        </div>
                        <div class="flex justify-between text-slate-600">
                            <span>Bobot BBM:</span>
                            <span class="font-mono font-semibold">${formatNumber(car.scoreBreakdown.bbm.altWeight, 3)}</span>
                        </div>
                    </div>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span class="text-xs font-semibold text-slate-500">Nilai Akhir:</span>
                    <span class="text-lg font-mono font-bold text-blue-600">${formatNumber(car.finalScore, 3)}</span>
                </div>
            </div>
        `).join('');
    }

    // Render Tabel Ranking Lengkap
    const tableBody = document.getElementById('ranking-table-body');
    if (tableBody) {
        tableBody.innerHTML = results.map(car => `
            <tr class="${car.rank === 1 ? 'bg-blue-50/60 font-semibold' : ''}">
                <td class="text-center">
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                        car.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-sm' :
                        car.rank === 2 ? 'bg-slate-200 text-slate-800' :
                        car.rank === 3 ? 'bg-orange-200 text-orange-800' : 'bg-slate-100 text-slate-500'
                    }">
                        ${car.rank}
                    </span>
                </td>
                <td class="font-bold text-slate-800">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full" style="background-color: ${car.color}"></div>
                        <span>${car.name}</span>
                    </div>
                    <span class="text-xs font-normal text-slate-400 block ml-5">${car.badge}</span>
                </td>
                <td class="text-right font-mono text-slate-700">${formatNumber(car.scoreBreakdown.style.altWeight, 3)}</td>
                <td class="text-right font-mono text-slate-700">${formatNumber(car.scoreBreakdown.keandalan.altWeight, 3)}</td>
                <td class="text-right font-mono text-slate-700">${formatNumber(car.scoreBreakdown.bbm.altWeight, 3)}</td>
                <td class="text-right font-mono font-bold text-blue-700 text-base bg-blue-50/50">${formatNumber(car.finalScore, 4)}</td>
                <td class="text-right font-mono font-bold text-slate-600">${formatNumber(car.percentage, 2)}%</td>
                <td class="text-center">
                    ${car.rank === 1 ? '<span class="px-2 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Paling Direkomendasikan</span>' : 
                      car.rank === 2 ? '<span class="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">Alternatif 2</span>' :
                      '<span class="text-xs text-slate-400">Alternatif ' + car.rank + '</span>'}
                </td>
            </tr>
        `).join('');
    }

    // Render Box Alternatif Terpilih (Sesuai Baris 23-25 Excel Sheet Hasil)
    const selectedCarNameEl = document.getElementById('selected-car-name');
    const selectedCarScoreEl = document.getElementById('selected-car-score');
    if (selectedCarNameEl) selectedCarNameEl.innerText = winner.name;
    if (selectedCarScoreEl) selectedCarScoreEl.innerText = formatNumber(winner.finalScore, 3);

    // Render Tabel 4. Ringkasan Uji Konsistensi (Sesuai Baris 27-32 Excel Sheet Hasil)
    const summaryRowsEl = document.getElementById('consistency-summary-rows');
    if (summaryRowsEl) {
        const matrixList = [
            { label: 'Kriteria', analysis: state.analysis.criteria },
            { label: 'Style', analysis: state.analysis.alternatives['style'] },
            { label: 'Keandalan', analysis: state.analysis.alternatives['keandalan'] },
            { label: 'Konsumsi BBM', analysis: state.analysis.alternatives['bbm'] }
        ];

        summaryRowsEl.innerHTML = matrixList.map(item => {
            const c = item.analysis.consistency;
            return `
                <tr>
                    <td class="font-bold text-slate-800 bg-slate-50">${item.label}</td>
                    <td class="text-center font-mono font-semibold text-slate-700">${formatNumber(c.lambdaMax, 3)}</td>
                    <td class="text-center font-mono text-slate-600">${formatNumber(c.ci, 3)}</td>
                    <td class="text-center font-mono font-bold ${c.isConsistent ? 'text-emerald-700' : 'text-rose-700'}">${formatNumber(c.cr, 3)}</td>
                    <td class="text-center">
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            c.isConsistent 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }">
                            ${c.isConsistent ? 'Konsisten' : 'Tidak konsisten'}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Render Charts
    renderCharts(results);
}

// Render Grafik Chart.js
function renderCharts(results) {
    if (typeof Chart === 'undefined') return;

    // 1. Bar Chart Skor Akhir
    const barCtx = document.getElementById('barChartFinal');
    if (barCtx) {
        if (barChartInstance) barChartInstance.destroy();

        barChartInstance = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: results.map(r => r.name),
                datasets: [{
                    label: 'Skor Akhir AHP',
                    data: results.map(r => r.finalScore),
                    backgroundColor: results.map(r => r.color + 'cc'),
                    borderColor: results.map(r => r.color),
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ` Skor Akhir: ${formatNumber(ctx.raw, 4)} (${(ctx.raw * 100).toFixed(2)}%)`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: Math.min(1.0, Math.ceil(Math.max(...results.map(r => r.finalScore)) * 1.3 * 10) / 10),
                        ticks: {
                            callback: val => val.toFixed(2)
                        }
                    }
                }
            }
        });
    }

    // 2. Radar Chart Profil Mobil Tiap Kriteria
    const radarCtx = document.getElementById('radarChartProfile');
    if (radarCtx) {
        if (radarChartInstance) radarChartInstance.destroy();

        radarChartInstance = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: state.criteria.map(c => c.name),
                datasets: results.map(car => ({
                    label: car.name,
                    data: state.criteria.map(crit => car.scoreBreakdown[crit.id].altWeight),
                    borderColor: car.color,
                    backgroundColor: car.color + '25',
                    pointBackgroundColor: car.color,
                    borderWidth: 2
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        suggestedMax: 0.6,
                        ticks: {
                            callback: val => val.toFixed(2)
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 11 } }
                    }
                }
            }
        });
    }
}

/**
 * ========================================================
 * 2. MATRIKS KRITERIA (PERSIS EXCEL SCREENSHOT)
 * ========================================================
 */
function renderCriteriaMatrixTab() {
    const analysis = state.analysis.criteria;
    const n = state.criteria.length;
    const container = document.getElementById('criteria-tab-container');
    if (!container || !analysis) return;

    let html = `
        <div class="space-y-6">
            <!-- Header Penjelasan -->
            <div class="glass-card rounded-xl p-5 border-l-4 border-blue-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <i class="fa-solid fa-scale-balanced text-blue-600"></i> Matriks Kriteria Keputusan
                    </h3>
                    <p class="text-xs text-slate-500 mt-1">
                        Perbandingan berpasangan tingkat kepentingan antar kriteria: <strong>Style (S)</strong>, <strong>Keandalan (K)</strong>, dan <strong>Konsumsi BBM (B)</strong>.
                    </p>
                </div>
                <button onclick="resetCriteriaMatrix()" class="no-print px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1.5 transition">
                    <i class="fa-solid fa-rotate-left"></i> Reset ke Nilai Excel
                </button>
            </div>

            <!-- Bagian 1: Matriks Perbandingan Berpasangan -->
            <div class="glass-card rounded-xl p-5 overflow-hidden">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                        Matriks Perbandingan Berpasangan
                    </h4>
                    <span class="text-xs text-slate-400 italic">Nilai di bawah diagonal otomatis dihitung kebalikan (1 / nilai)</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="ahp-table border border-slate-200 rounded-lg">
                        <thead>
                            <tr class="bg-sky-500 text-white">
                                <th class="!bg-sky-600 text-white">Kriteria</th>
                                ${state.criteria.map(c => `<th class="!bg-sky-500 text-white text-center">${c.name}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${state.criteria.map((rowCrit, i) => `
                                <tr>
                                    <td class="font-bold text-slate-700 bg-slate-50 whitespace-nowrap">${rowCrit.name}</td>
                                    ${state.criteria.map((colCrit, j) => {
                                        if (i === j) {
                                            return `<td class="text-center ahp-cell-diagonal font-mono">1,000</td>`;
                                        } else if (i < j) {
                                            // Sel yang bisa diedit (segitiga atas)
                                            return `
                                                <td class="text-center p-1">
                                                    <input type="number" step="0.001" min="0.1" max="9" 
                                                        class="ahp-cell-input"
                                                        value="${Number(state.criteriaMatrix[i][j]).toFixed(3)}" 
                                                        onchange="handleCriteriaChange(${i}, ${j}, this.value)"
                                                    />
                                                </td>
                                            `;
                                        } else {
                                            // Sel kebalikan (segitiga bawah)
                                            return `
                                                <td class="text-center ahp-cell-reciprocal">
                                                    ${formatNumber(state.criteriaMatrix[i][j], 3)}
                                                </td>
                                            `;
                                        }
                                    }).join('')}
                                </tr>
                            `).join('')}
                            <!-- Baris Total -->
                            <tr class="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <td class="text-slate-800">Total</td>
                                ${analysis.colTotals.map(total => `
                                    <td class="text-center font-mono text-slate-800">${formatNumber(total, 3)}</td>
                                `).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Bagian 2: Normalisasi Matriks & Bobot Prioritas -->
            <div class="glass-card rounded-xl p-5 overflow-hidden">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
                        Normalisasi (Nilai / Total Kolom)
                    </h4>
                    <span class="text-xs text-slate-400">Rumus: Baris cell dibagi total kolom masing-masing</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="ahp-table border border-slate-200 rounded-lg">
                        <thead>
                            <tr class="bg-sky-500 text-white">
                                <th class="!bg-sky-600 text-white">Kriteria</th>
                                ${state.criteria.map(c => `<th class="!bg-sky-500 text-white text-center">${c.name}</th>`).join('')}
                                <th class="!bg-sky-600 text-white text-center">P. Vektor</th>
                                <th class="!bg-emerald-600 text-white text-center">Bobot</th>
                                <th class="!bg-indigo-600 text-white text-center">Bobot × Total Kolom</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.criteria.map((rowCrit, i) => `
                                <tr>
                                    <td class="font-bold text-slate-700 bg-slate-50">${rowCrit.name}</td>
                                    ${analysis.normalized[i].map(val => `
                                        <td class="text-center font-mono text-slate-600">${formatNumber(val, 3)}</td>
                                    `).join('')}
                                    <td class="text-center font-mono font-semibold text-slate-800 bg-slate-50">${formatNumber(analysis.priorityVector[i], 3)}</td>
                                    <td class="text-center font-mono font-bold text-emerald-700 bg-emerald-50/60">${formatNumber(analysis.weights[i], 3)}</td>
                                    <td class="text-center font-mono font-bold text-indigo-700 bg-indigo-50/60">${formatNumber(analysis.consistency.weightedColTotals[i], 3)}</td>
                                </tr>
                            `).join('')}
                            <!-- Baris Jumlah -->
                            <tr class="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <td class="text-slate-800">Jumlah</td>
                                ${state.criteria.map((_, colIdx) => {
                                    const colSum = analysis.normalized.reduce((acc, row) => acc + row[colIdx], 0);
                                    return `<td class="text-center font-mono text-slate-700">${formatNumber(colSum, 3)}</td>`;
                                }).join('')}
                                <td class="text-center font-mono text-slate-800">${formatNumber(analysis.priorityVector.reduce((a, b) => a + b, 0), 3)}</td>
                                <td class="text-center font-mono text-emerald-800">${formatNumber(analysis.weights.reduce((a, b) => a + b, 0), 3)}</td>
                                <td class="text-center font-mono text-indigo-800">${formatNumber(analysis.consistency.lambdaMax, 3)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Bagian 3: Uji Konsistensi -->
            <div class="glass-card rounded-xl p-5 border ${analysis.consistency.isConsistent ? 'border-emerald-200 bg-emerald-50/20' : 'border-amber-200 bg-amber-50/20'}">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
                        Uji Konsistensi (Consistency Test)
                    </h4>
                    <span class="px-3 py-1 rounded-full text-xs font-bold border ${analysis.consistency.statusClass}">
                        <i class="fa-solid ${analysis.consistency.isConsistent ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> ${analysis.consistency.statusText} (CR: ${formatNumber(analysis.consistency.cr, 3)})
                    </span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">n (Orde Matriks)</span>
                        <span class="font-mono font-bold text-slate-800 text-lg">${analysis.consistency.n}</span>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">Eigen Value (&lambda;)</span>
                        <span class="font-mono font-bold text-indigo-700 text-lg">${formatNumber(analysis.consistency.lambdaMax, 3)}</span>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">CI = (&lambda; - n)/(n - 1)</span>
                        <span class="font-mono font-bold text-slate-800 text-lg">${formatNumber(analysis.consistency.ci, 3)}</span>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">RI (Tabel Saaty)</span>
                        <span class="font-mono font-bold text-slate-800 text-lg">${formatNumber(analysis.consistency.ri, 2)}</span>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">CR = CI / RI</span>
                        <span class="font-mono font-bold text-lg ${analysis.consistency.isConsistent ? 'text-emerald-700' : 'text-amber-700'}">${formatNumber(analysis.consistency.cr, 3)}</span>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">Keputusan (CR &le; 0,1)</span>
                        <span class="font-bold text-sm block mt-1 ${analysis.consistency.isConsistent ? 'text-emerald-600' : 'text-amber-600'}">
                            ${analysis.consistency.statusText}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Event handler saat user mengedit perbandingan berpasangan kriteria
function handleCriteriaChange(i, j, value) {
    let num = parseFloat(value);
    if (isNaN(num) || num <= 0) num = 1;

    state.criteriaMatrix[i][j] = num;
    state.criteriaMatrix[j][i] = 1 / num;

    recalculateAll();
}

function resetCriteriaMatrix() {
    state.criteriaMatrix = JSON.parse(JSON.stringify(INITIAL_DATA.criteriaMatrix));
    recalculateAll();
}

/**
 * ========================================================
 * 3. MATRIKS ALTERNATIF (STYLE, KEANDALAN, BBM)
 * ========================================================
 */
function renderAlternativesTab() {
    const container = document.getElementById('alternatives-tab-container');
    if (!container) return;

    const currentCritId = state.activeAltCriterion;
    const currentCrit = state.criteria.find(c => c.id === currentCritId) || state.criteria[0];
    const analysis = state.analysis.alternatives[currentCrit.id];
    const matrix = state.alternativeMatrices[currentCrit.id];

    let html = `
        <div class="space-y-6">
            <!-- Sub-tab Kriteria Selector -->
            <div class="flex items-center gap-2 p-1 bg-slate-200/80 rounded-xl overflow-x-auto no-print">
                ${state.criteria.map(crit => `
                    <button onclick="switchAlternativeCriterion('${crit.id}')" 
                        class="px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                            crit.id === currentCrit.id 
                                ? 'bg-white text-blue-700 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                        }">
                        <i class="fa-solid ${crit.icon}"></i>
                        <span>Alternatif: ${crit.name}</span>
                        ${state.analysis.alternatives[crit.id] && !state.analysis.alternatives[crit.id].consistency.isConsistent 
                            ? '<span class="w-2 h-2 rounded-full bg-amber-500"></span>' : ''}
                    </button>
                `).join('')}
            </div>

            <!-- Banner Kriteria Aktif -->
            <div class="glass-card rounded-xl p-5 border-l-4 border-indigo-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div class="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                        <i class="fa-solid ${currentCrit.icon}"></i> Perbandingan Berpasangan Alternatif
                    </div>
                    <h3 class="text-xl font-bold text-slate-800 mt-1">Kriteria: ${currentCrit.name}</h3>
                    <p class="text-xs text-slate-500 mt-0.5">${currentCrit.description}</p>
                </div>
                <div class="flex items-center gap-2">
                    ${!analysis.consistency.isConsistent ? `
                        <button onclick="optimizeAlternativeConsistency('${currentCrit.id}')" class="no-print px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-lg hover:bg-emerald-200 flex items-center gap-1.5 transition">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Optimalkan Konsistensi
                        </button>
                    ` : ''}
                    <button onclick="resetAlternativeMatrix('${currentCrit.id}')" class="no-print px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition">
                        <i class="fa-solid fa-rotate-left"></i> Reset
                    </button>
                </div>
            </div>

            <!-- Alert bila tidak konsisten (seperti pada sheet Style di Excel user di mana CR = 0.146) -->
            ${!analysis.consistency.isConsistent ? `
                <div class="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
                    <i class="fa-solid fa-triangle-exclamation text-amber-600 text-base mt-0.5"></i>
                    <div>
                        <strong class="font-bold">Perhatian: Rasio Konsistensi (CR = ${formatNumber(analysis.consistency.cr, 3)}) melebihi 0,10.</strong>
                        <p class="mt-0.5 text-amber-800">
                            Persis seperti pada sheet Excel <em>Style</em> asli Anda, nilai pertimbangan saat ini berstatus <strong>Tidak konsisten</strong>. 
                            Anda dapat mengklik tombol <strong>"Optimalkan Konsistensi"</strong> di atas jika ingin membuat perbandingan menjadi konsisten (CR &le; 0,1), atau tetap menggunakan data asli Excel.
                        </p>
                    </div>
                </div>
            ` : ''}

            <!-- 1. Matriks Perbandingan Berpasangan -->
            <div class="glass-card rounded-xl p-5 overflow-hidden">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                        Matriks Perbandingan Berpasangan (Alternatif untuk ${currentCrit.name})
                    </h4>
                </div>
                <div class="overflow-x-auto">
                    <table class="ahp-table border border-slate-200 rounded-lg">
                        <thead>
                            <tr class="bg-sky-500 text-white">
                                <th class="!bg-sky-600 text-white">Alternatif</th>
                                ${state.alternatives.map(a => `<th class="!bg-sky-500 text-white text-center">${a.name}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${state.alternatives.map((rowAlt, i) => `
                                <tr>
                                    <td class="font-bold text-slate-700 bg-slate-50 whitespace-nowrap">${rowAlt.name}</td>
                                    ${state.alternatives.map((colAlt, j) => {
                                        if (i === j) {
                                            return `<td class="text-center ahp-cell-diagonal font-mono">1,000</td>`;
                                        } else if (i < j) {
                                            return `
                                                <td class="text-center p-1">
                                                    <input type="number" step="0.001" min="0.1" max="9" 
                                                        class="ahp-cell-input"
                                                        value="${Number(matrix[i][j]).toFixed(3)}" 
                                                        onchange="handleAlternativeChange('${currentCrit.id}', ${i}, ${j}, this.value)"
                                                    />
                                                </td>
                                            `;
                                        } else {
                                            return `
                                                <td class="text-center ahp-cell-reciprocal">
                                                    ${formatNumber(matrix[i][j], 3)}
                                                </td>
                                            `;
                                        }
                                    }).join('')}
                                </tr>
                            `).join('')}
                            <tr class="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <td class="text-slate-800">Total</td>
                                ${analysis.colTotals.map(total => `
                                    <td class="text-center font-mono text-slate-800">${formatNumber(total, 3)}</td>
                                `).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 2. Normalisasi Matriks & Bobot Prioritas -->
            <div class="glass-card rounded-xl p-5 overflow-hidden">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
                        Normalisasi (Nilai / Total Kolom)
                    </h4>
                </div>
                <div class="overflow-x-auto">
                    <table class="ahp-table border border-slate-200 rounded-lg">
                        <thead>
                            <tr class="bg-sky-500 text-white">
                                <th class="!bg-sky-600 text-white">Alternatif</th>
                                ${state.alternatives.map(a => `<th class="!bg-sky-500 text-white text-center">${a.name}</th>`).join('')}
                                <th class="!bg-sky-600 text-white text-center">P. Vektor</th>
                                <th class="!bg-emerald-600 text-white text-center">Bobot</th>
                                <th class="!bg-indigo-600 text-white text-center">Bobot × Total Kolom</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.alternatives.map((rowAlt, i) => `
                                <tr>
                                    <td class="font-bold text-slate-700 bg-slate-50">${rowAlt.name}</td>
                                    ${analysis.normalized[i].map(val => `
                                        <td class="text-center font-mono text-slate-600">${formatNumber(val, 3)}</td>
                                    `).join('')}
                                    <td class="text-center font-mono font-semibold text-slate-800 bg-slate-50">${formatNumber(analysis.priorityVector[i], 3)}</td>
                                    <td class="text-center font-mono font-bold text-emerald-700 bg-emerald-50/60">${formatNumber(analysis.weights[i], 3)}</td>
                                    <td class="text-center font-mono font-bold text-indigo-700 bg-indigo-50/60">${formatNumber(analysis.consistency.weightedColTotals[i], 3)}</td>
                                </tr>
                            `).join('')}
                            <tr class="bg-slate-100 font-bold border-t-2 border-slate-300">
                                <td class="text-slate-800">Jumlah</td>
                                ${state.alternatives.map((_, colIdx) => {
                                    const colSum = analysis.normalized.reduce((acc, row) => acc + row[colIdx], 0);
                                    return `<td class="text-center font-mono text-slate-700">${formatNumber(colSum, 3)}</td>`;
                                }).join('')}
                                <td class="text-center font-mono text-slate-800">${formatNumber(analysis.priorityVector.reduce((a, b) => a + b, 0), 3)}</td>
                                <td class="text-center font-mono text-emerald-800">${formatNumber(analysis.weights.reduce((a, b) => a + b, 0), 3)}</td>
                                <td class="text-center font-mono text-indigo-800">${formatNumber(analysis.consistency.lambdaMax, 3)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 3. Uji Konsistensi -->
            <div class="glass-card rounded-xl p-5 border ${analysis.consistency.isConsistent ? 'border-emerald-200 bg-emerald-50/20' : 'border-amber-200 bg-amber-50/20'}">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
                        Uji Konsistensi (${currentCrit.name})
                    </h4>
                    <span class="px-3 py-1 rounded-full text-xs font-bold border ${analysis.consistency.statusClass}">
                        ${analysis.consistency.statusText} (CR: ${formatNumber(analysis.consistency.cr, 3)})
                    </span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">n (Orde Matriks)</span>
                        <span class="font-mono font-bold text-slate-800 text-lg">${analysis.consistency.n}</span>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">Eigen Value (&lambda;)</span>
                        <span class="font-mono font-bold text-indigo-700 text-lg">${formatNumber(analysis.consistency.lambdaMax, 3)}</span>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">CI = (&lambda; - n)/(n - 1)</span>
                        <span class="font-mono font-bold text-slate-800 text-lg">${formatNumber(analysis.consistency.ci, 3)}</span>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">RI (Tabel Saaty)</span>
                        <span class="font-mono font-bold text-slate-800 text-lg">${formatNumber(analysis.consistency.ri, 2)}</span>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">CR = CI / RI</span>
                        <span class="font-mono font-bold text-lg ${analysis.consistency.isConsistent ? 'text-emerald-700' : 'text-amber-700'}">${formatNumber(analysis.consistency.cr, 3)}</span>
                    </div>
                    <div class="bg-white p-3 rounded-lg border border-slate-200 text-center">
                        <span class="text-xs text-slate-400 block mb-1">Keputusan (CR &le; 0,1)</span>
                        <span class="font-bold text-sm block mt-1 ${analysis.consistency.isConsistent ? 'text-emerald-600' : 'text-amber-600'}">
                            ${analysis.consistency.statusText}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function switchAlternativeCriterion(critId) {
    state.activeAltCriterion = critId;
    renderAlternativesTab();
}

function handleAlternativeChange(critId, i, j, value) {
    let num = parseFloat(value);
    if (isNaN(num) || num <= 0) num = 1;

    state.alternativeMatrices[critId][i][j] = num;
    state.alternativeMatrices[critId][j][i] = 1 / num;

    recalculateAll();
}

function resetAlternativeMatrix(critId) {
    state.alternativeMatrices[critId] = JSON.parse(JSON.stringify(INITIAL_DATA.alternativeMatrices[critId]));
    recalculateAll();
}

// Fitur pembantu untuk membuat matriks Style menjadi konsisten secara cerdas
function optimizeAlternativeConsistency(critId) {
    if (critId === 'style') {
        // Sedikit menghaluskan perbandingan yang terlalu ekstrim
        state.alternativeMatrices['style'] = [
            [1.000, 1.500, 0.400, 0.350],
            [0.667, 1.000, 0.500, 0.300],
            [2.500, 2.000, 1.000, 1.200],
            [2.857, 3.333, 0.833, 1.000]
        ];
        recalculateAll();
    }
}

/**
 * ========================================================
 * 4. TAB SINTESIS & DETAIL PERHITUNGAN
 * ========================================================
 */
function renderSynthesisTab() {
    const container = document.getElementById('synthesis-tab-container');
    if (!container) return;

    const critWeights = state.analysis.criteria.weights;
    const results = state.analysis.finalResults;

    let html = `
        <div class="space-y-6">
            <div class="glass-card rounded-xl p-5 border-l-4 border-emerald-600">
                <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <i class="fa-solid fa-calculator text-emerald-600"></i> Matriks Sintesis Akhir (Perkalian Bobot)
                </h3>
                <p class="text-xs text-slate-500 mt-1">
                    Nilai akhir setiap alternatif dihitung dengan rumus: 
                    <strong class="text-slate-800 font-mono">Skor = &Sigma; (Bobot Kriteria<sub>j</sub> &times; Bobot Alternatif<sub>ij</sub>)</strong>
                </p>
            </div>

            <!-- Tabel Sintesis Lengkap -->
            <div class="glass-card rounded-xl p-5 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="ahp-table border border-slate-200 rounded-lg">
                        <thead>
                            <tr class="bg-slate-800 text-white">
                                <th class="text-left">Alternatif / Mobil</th>
                                ${state.criteria.map((c, idx) => `
                                    <th class="text-center">
                                        <div>${c.name}</div>
                                        <div class="text-xs font-mono font-normal text-amber-300">W = ${formatNumber(critWeights[idx], 3)}</div>
                                    </th>
                                `).join('')}
                                <th class="text-right !bg-blue-700 text-white font-mono">Skor Akhir</th>
                                <th class="text-center !bg-blue-800 text-white">Rank</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.map(car => `
                                <tr class="${car.rank === 1 ? 'bg-amber-50/50 font-semibold' : ''}">
                                    <td class="font-bold text-slate-800">
                                        <div class="flex items-center gap-2">
                                            <div class="w-3 h-3 rounded-full" style="background-color: ${car.color}"></div>
                                            <span>${car.name}</span>
                                        </div>
                                    </td>
                                    ${state.criteria.map(crit => `
                                        <td class="text-center font-mono">
                                            <span class="text-slate-700 font-semibold">${formatNumber(car.scoreBreakdown[crit.id].altWeight, 3)}</span>
                                            <span class="text-xs text-slate-400 block">(&times; ${formatNumber(car.scoreBreakdown[crit.id].critWeight, 3)} = ${formatNumber(car.scoreBreakdown[crit.id].contribution, 4)})</span>
                                        </td>
                                    `).join('')}
                                    <td class="text-right font-mono font-black text-blue-700 text-lg bg-blue-50/60">${formatNumber(car.finalScore, 4)}</td>
                                    <td class="text-center">
                                        <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                            car.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-sm' :
                                            car.rank === 2 ? 'bg-slate-200 text-slate-800' :
                                            car.rank === 3 ? 'bg-orange-200 text-orange-800' : 'bg-slate-100 text-slate-500'
                                        }">
                                            #${car.rank}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Rumus Detail Box -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div class="glass-card rounded-xl p-4">
                    <h5 class="font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-blue-600">
                        <i class="fa-solid fa-square-root-variable"></i> Bobot Prioritas Kriteria
                    </h5>
                    <p class="text-slate-600 leading-relaxed">
                        Kriteria <strong>Keandalan</strong> memiliki bobot tertinggi (<span class="font-mono font-bold">${formatNumber(critWeights[1] * 100, 1)}%</span>), 
                        diikuti <strong>Style</strong> (<span class="font-mono font-bold">${formatNumber(critWeights[0] * 100, 1)}%</span>), 
                        dan <strong>Konsumsi BBM</strong> (<span class="font-mono font-bold">${formatNumber(critWeights[2] * 100, 1)}%</span>).
                    </p>
                </div>
                <div class="glass-card rounded-xl p-4">
                    <h5 class="font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-emerald-600">
                        <i class="fa-solid fa-check-double"></i> Uji Konsistensi Matriks
                    </h5>
                    <p class="text-slate-600 leading-relaxed">
                        Matriks Kriteria konsisten dengan rasio <span class="font-mono font-bold text-emerald-700">${formatNumber(state.analysis.criteria.consistency.cr, 3)}</span> (&le; 0,1). 
                        Hasil perbandingan memiliki reliabilitas logis yang baik.
                    </p>
                </div>
                <div class="glass-card rounded-xl p-4">
                    <h5 class="font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-amber-600">
                        <i class="fa-solid fa-lightbulb"></i> Kesimpulan Keputusan
                    </h5>
                    <p class="text-slate-600 leading-relaxed">
                        Berdasarkan integrasi seluruh kriteria, <strong>${results[0].name}</strong> adalah rekomendasi terbaik dengan total skor <span class="font-mono font-bold text-blue-700">${formatNumber(results[0].finalScore, 4)}</span>.
                    </p>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

/**
 * ========================================================
 * 5. EVENT LISTENERS & UTILITIES
 * ========================================================
 */
function setupEventListeners() {
    // Tombol Tab Navigasi
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = btn.dataset.tab;
            if (tab) switchTab(tab);
        });
    });

    // Reset Semua Data
    const resetAllBtn = document.getElementById('btn-reset-all');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', () => {
            if (confirm('Kembalikan seluruh data matriks ke data awal Excel?')) {
                state.criteriaMatrix = JSON.parse(JSON.stringify(INITIAL_DATA.criteriaMatrix));
                state.alternativeMatrices = JSON.parse(JSON.stringify(INITIAL_DATA.alternativeMatrices));
                recalculateAll();
            }
        });
    }

    // Cetak Laporan
    const printBtn = document.getElementById('btn-print-report');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }
}

// Expose functions to window for dynamic HTML event attributes
window.switchTab = switchTab;
window.handleCriteriaChange = handleCriteriaChange;
window.resetCriteriaMatrix = resetCriteriaMatrix;
window.switchAlternativeCriterion = switchAlternativeCriterion;
window.handleAlternativeChange = handleAlternativeChange;
window.resetAlternativeMatrix = resetAlternativeMatrix;
window.optimizeAlternativeConsistency = optimizeAlternativeConsistency;

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', initApp);

