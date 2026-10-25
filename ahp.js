/**
 * AHP Engine - Analytic Hierarchy Process
 * Sesuai dengan rumus pada file Excel AHP_Pemilihan_Mobil
 */

// Tabel Random Index (RI) Saaty
const SAATY_RI = {
    1: 0.00,
    2: 0.00,
    3: 0.58,
    4: 0.90,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49,
    11: 1.51,
    12: 1.54,
    13: 1.56,
    14: 1.57,
    15: 1.59
};

// Data Awal sesuai Screenshot Excel Pengguna
const INITIAL_DATA = {
    criteria: [
        { id: 'style', name: 'Style (S)', icon: 'fa-palette', description: 'Desain eksterior & interior, kenyamanan estetika' },
        { id: 'keandalan', name: 'Keandalan (K)', icon: 'fa-shield-halved', description: 'Ketahanan mesin, kemudahan & biaya servis, ketersediaan sparepart' },
        { id: 'bbm', name: 'Konsumsi BBM (B)', icon: 'fa-gas-pump', description: 'Efisiensi konsumsi bahan bakar dalam & luar kota' }
    ],
    alternatives: [
        { id: 'avanza', name: 'Toyota Avanza', badge: 'MPV Populer', color: '#2563eb' },
        { id: 'xenia', name: 'Daihatsu Xenia', badge: 'Ekonomis & Praktis', color: '#059669' },
        { id: 'ertiga', name: 'Suzuki Ertiga', badge: 'Kenyamanan Kabin', color: '#d97706' },
        { id: 'livina', name: 'Grand Livina', badge: 'Riding Serasa Sedan', color: '#7c3aed' }
    ],
    // Matriks Perbandingan Berpasangan Kriteria (Persis Foto Excel Kriteria)
    // Urutan: [Style, Keandalan, BBM]
    criteriaMatrix: [
        [1.000, 0.500, 3.000],
        [2.000, 1.000, 4.000],
        [0.333333, 0.250, 1.000]
    ],
    // Matriks Perbandingan Alternatif untuk Kriteria Style (Persis Foto Excel Style)
    // Urutan: [Avanza, Xenia, Ertiga, Grand Livina]
    alternativeMatrices: {
        style: [
            [1.000, 2.000, 0.333333, 0.250],
            [0.500, 1.000, 0.500, 0.200],
            [3.000, 2.000, 1.000, 2.000],
            [4.000, 5.000, 0.500, 1.000]
        ],
        // Matriks Perbandingan Alternatif untuk Kriteria Keandalan (Persis Foto Excel Keandalan)
        // Urutan: [Avanza, Xenia, Ertiga, Grand Livina]
        keandalan: [
            [1.000, 2.000, 0.250, 0.333333],
            [0.500, 1.000, 0.200, 0.250],
            [4.000, 5.000, 1.000, 3.000],
            [3.000, 4.000, 0.333333, 1.000]
        ],
        // Matriks Perbandingan Alternatif untuk Kriteria Konsumsi BBM (Persis Foto Excel BBM)
        // Urutan: [Avanza, Xenia, Ertiga, Grand Livina]
        bbm: [
            [1.000, 2.000, 0.500, 4.000],
            [0.500, 1.000, 0.666667, 3.000],
            [2.000, 1.500, 1.000, 4.000],
            [0.250, 0.333333, 0.250, 1.000]
        ]
    }
};

class AHPCalculator {
    /**
     * Menghitung total setiap kolom dari matriks perbandingan
     */
    static getColumnTotals(matrix) {
        const n = matrix.length;
        const totals = new Array(n).fill(0);
        for (let j = 0; j < n; j++) {
            for (let i = 0; i < n; i++) {
                totals[j] += matrix[i][j];
            }
        }
        return totals;
    }

    /**
     * Melakukan normalisasi matriks (nilai / total kolom)
     */
    static normalizeMatrix(matrix, colTotals) {
        const n = matrix.length;
        const normalized = [];
        for (let i = 0; i < n; i++) {
            normalized[i] = [];
            for (let j = 0; j < n; j++) {
                normalized[i][j] = colTotals[j] === 0 ? 0 : matrix[i][j] / colTotals[j];
            }
        }
        return normalized;
    }

    /**
     * Menghitung Prioritas Vektor (Jumlah baris ternormalisasi) & Bobot (Rata-rata baris)
     */
    static calculateWeights(normalizedMatrix) {
        const n = normalizedMatrix.length;
        const priorityVector = new Array(n).fill(0);
        const weights = new Array(n).fill(0);

        for (let i = 0; i < n; i++) {
            let rowSum = 0;
            for (let j = 0; j < n; j++) {
                rowSum += normalizedMatrix[i][j];
            }
            priorityVector[i] = rowSum;
            weights[i] = rowSum / n;
        }

        return { priorityVector, weights };
    }

    /**
     * Menghitung Eigen Value (lambda max), Bobot x Total Kolom, CI, dan CR
     */
    static evaluateConsistency(weights, colTotals) {
        const n = weights.length;
        const weightedColTotals = [];
        let lambdaMax = 0;

        for (let i = 0; i < n; i++) {
            const val = weights[i] * colTotals[i];
            weightedColTotals.push(val);
            lambdaMax += val;
        }

        // CI = (lambda_max - n) / (n - 1)
        const ci = n <= 1 ? 0 : (lambdaMax - n) / (n - 1);
        
        // RI dari tabel Saaty
        const ri = SAATY_RI[n] || 1.59;
        
        // CR = CI / RI
        const cr = ri === 0 ? 0 : ci / ri;
        const isConsistent = cr <= 0.1001; // toleransi floating point

        return {
            n,
            weightedColTotals,
            lambdaMax,
            ci,
            ri,
            cr,
            isConsistent,
            statusText: isConsistent ? 'Konsisten' : 'Tidak konsisten',
            statusClass: isConsistent ? 'text-emerald-700 bg-emerald-100 border-emerald-300' : 'text-amber-800 bg-amber-100 border-amber-300'
        };
    }

    /**
     * Menjalankan analisis lengkap untuk sebuah matriks perbandingan
     */
    static analyzeMatrix(matrix) {
        const colTotals = this.getColumnTotals(matrix);
        const normalized = this.normalizeMatrix(matrix, colTotals);
        const { priorityVector, weights } = this.calculateWeights(normalized);
        const consistency = this.evaluateConsistency(weights, colTotals);

        return {
            matrix,
            colTotals,
            normalized,
            priorityVector,
            weights,
            consistency
        };
    }

    /**
     * Sintesis Hasil Akhir (Perkalian Bobot Kriteria dengan Bobot Tiap Alternatif)
     */
    static calculateFinalResults(criteriaWeights, alternativeWeightsMap, alternatives, criteria) {
        const results = alternatives.map((alt, altIndex) => {
            let finalScore = 0;
            const scoreBreakdown = {};

            criteria.forEach((crit, critIndex) => {
                const critWeight = criteriaWeights[critIndex];
                const altWeight = alternativeWeightsMap[crit.id][altIndex];
                const contribution = critWeight * altWeight;
                finalScore += contribution;

                scoreBreakdown[crit.id] = {
                    altWeight,
                    critWeight,
                    contribution
                };
            });

            return {
                id: alt.id,
                name: alt.name,
                badge: alt.badge,
                color: alt.color,
                finalScore,
                percentage: (finalScore * 100),
                scoreBreakdown
            };
        });

        // Urutkan dari nilai tertinggi ke terendah (Ranking)
        results.sort((a, b) => b.finalScore - a.finalScore);

        // Tambahkan ranking (1, 2, 3, ...)
        results.forEach((item, index) => {
            item.rank = index + 1;
        });

        return results;
    }
}

// Export jika di lingkungan modul, tetap tersedia di window jika browser biasa
if (typeof window !== 'undefined') {
    window.SAATY_RI = SAATY_RI;
    window.INITIAL_DATA = INITIAL_DATA;
    window.AHPCalculator = AHPCalculator;
}
