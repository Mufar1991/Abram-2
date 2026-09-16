import type { CustomTestParam, MatchForm, PhysicalForm, PhysicalIndicator, Report, TechnicalMetric } from './types';
import * as XLSX from 'xlsx';

export const today = new Date().toISOString().slice(0, 10);

export const metricLabels = ['Servis', 'Passing', 'Smash', 'Block', 'Dig'];

export const BUILTIN_INDICATORS: PhysicalIndicator[] = [
  { id: 'heartRate', name: 'Denyut Nadi', unit: 'bpm', key: 'heartRate' },
  { id: 'beepTest', name: 'Beep Test', unit: 'level', key: 'beepTest' },
  { id: 'shuttleRun', name: 'Shuttle Run Angka 8', unit: 'detik', key: 'shuttleRun' },
  { id: 'pushUp', name: 'Push Up', unit: 'repetisi', key: 'pushUp' },
  { id: 'sitUp', name: 'Sit Up', unit: 'repetisi', key: 'sitUp' },
  { id: 'backUp', name: 'Back Up', unit: 'repetisi', key: 'backUp' },
  { id: 'verticalJump', name: 'Vertical Jump', unit: 'cm', key: 'verticalJump' },
];

export const defaultCustomParams: CustomTestParam[] = [];

export const initialPhysical: PhysicalForm = {
  athleteName: '',
  date: today,
  heartRate: '',
  beepTest: '',
  shuttleRun: '',
  pushUp: '',
  sitUp: '',
  backUp: '',
  verticalJump: '',
  customValues: {},
};

export const initialMatch: MatchForm = {
  athleteName: '',
  date: today,
  metrics: Object.fromEntries(
    metricLabels.map((label) => [label, { success: 0, error: 0 }])
  ) as Record<string, TechnicalMetric>,
  zones: [],
};

export function buildAllIndicators(customParams: CustomTestParam[]): PhysicalIndicator[] {
  if (!customParams || customParams.length === 0) {
    return [];
  }
  return customParams.map((param) => ({
    id: param.id,
    key: param.id,
    name: param.name,
    unit: param.unit,
  }));
}

export function normalizeCustomParams(params: CustomTestParam[] = []): CustomTestParam[] {
  return Array.isArray(params) ? params : [];
}

// RUMUS PENILAIAN CERDAS & PROPORSIONAL
export function scorePhysical(form: PhysicalForm, indicators: PhysicalIndicator[] = []): number {
  const scores: number[] = [];

  indicators.forEach((indicator) => {
    const value = indicator.key in form.customValues
      ? form.customValues[indicator.key]
      : form[indicator.key as keyof PhysicalForm];
    
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      const num = Number(value);
      if (isNaN(num)) return;

      const nameLower = indicator.name.toLowerCase();
      const unitLower = indicator.unit.toLowerCase();

      // Logika penilaian berdasarkan satuan atau nama indikator
      if (indicator.key === 'heartRate' || unitLower.includes('bpm')) {
        // Nadi ideal olahraga: 60 - 90 bpm
        scores.push(num >= 60 && num <= 90 ? 100 : Math.max(40, 100 - Math.abs(num - 75) * 1.5));
      } else if (indicator.key === 'beepTest' || unitLower.includes('level')) {
        // Beep test standar atlet: target 12 = 100
        scores.push(Math.min(100, (num / 12) * 100));
      } else if (indicator.key === 'shuttleRun' || unitLower.includes('detik') || unitLower.includes('s')) {
        // Waktu detik (semakin kecil semakin bagus, misal target 8 detik = 100)
        scores.push(num <= 8 ? 100 : Math.max(30, 100 - (num - 8) * 10));
      } else if (unitLower.includes('cm') || nameLower.includes('jump') || nameLower.includes('lompat')) {
        // Tinggi lompatan (misal target 70cm = 100)
        scores.push(Math.min(100, (num / 70) * 100));
      } else if (unitLower.includes('menit') || unitLower.includes('m')) {
        // Jika durasi waktu
        scores.push(Math.min(100, (num / 30) * 100));
      } else {
        // Repetisi atau parameter umum (misal target ideal 40 repetisi = 100)
        scores.push(Math.min(100, (num / 40) * 100));
      }
    }
  });

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function scoreMatch(form: MatchForm, targets: Record<string, number> = {}): number {
  const values = metricLabels.map((label) => {
    const metric = form.metrics[label];
    const target = targets[label] || 10;
    const success = metric.success > 0 ? metric.success : target;
    const error = metric.error || 0;
    if (success <= 0) return 0;
    return Math.max(0, Math.min(100, ((success - error) / success) * 100));
  });

  return values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;
}

export function formatDate(date: string): string {
  if (!date) return '—';
  try {
    const parsed = new Date(`${date}T00:00:00`);
    if (isNaN(parsed.getTime())) return date;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsed);
  } catch {
    return date;
  }
}

export function displayPayload(
  payload: Record<string, unknown>,
  key: string
): string {
  return String(payload[key] ?? '—');
}

export function getScoreTier(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Sangat Prima', color: 'var(--success)' };
  if (score >= 75) return { label: 'Prima', color: 'var(--success)' };
  if (score >= 65) return { label: 'Cukup', color: 'var(--warning)' };
  if (score >= 50) return { label: 'Menengah', color: 'var(--warning)' };
  return { label: 'Perlu Perhatian', color: 'var(--error)' };
}

export function generateRichAnalysis(form: PhysicalForm, score: number, indicators: PhysicalIndicator[] = []) {
  const filled = indicators.filter((indicator) => {
    const value = indicator.key in form.customValues
      ? form.customValues[indicator.key]
      : form[indicator.key as keyof PhysicalForm];
    return value !== undefined && value !== null && String(value).trim() !== '';
  }).length;

  if (filled === 0) {
    return {
      title: 'Menunggu data',
      summary: 'Mulai mengisi indikator fisik di bawah untuk mendapatkan analisis kondisi dan rekomendasi latihan secara real-time.',
      recommendations: [] as { area: string; text: string }[],
    };
  }

  const recs: { area: string; text: string }[] = [];

  indicators.forEach((indicator) => {
    const value = indicator.key in form.customValues
      ? form.customValues[indicator.key]
      : form[indicator.key as keyof PhysicalForm];

    if (value === undefined || value === null || String(value).trim() === '') return;

    recs.push({ area: indicator.name, text: `Nilai ${indicator.name} tercatat (${value} ${indicator.unit}). Pertahankan konsistensi latihan dan optimalkan performa.` });
  });

  let title: string;
  let summary: string;
  if (score >= 85) {
    title = 'Kondisi Sangat Prima';
    summary = 'Atlet berada pada puncak kesiapan fisik.';
  } else if (score >= 75) {
    title = 'Kondisi Prima';
    summary = 'Atlet menunjukkan kesiapan fisik yang kuat untuk latihan intensif.';
  } else if (score >= 65) {
    title = 'Kondisi Cukup Siap';
    summary = 'Atlet memiliki fondasi fisik yang cukup untuk latihan normal.';
  } else if (score >= 50) {
    title = 'Kondisi Menengah';
    summary = 'Atlet memiliki fondasi fisik yang sedang berkembang.';
  } else {
    title = 'Perlu Perhatian Khusus';
    summary = 'Atlet memerlukan fokus pada pembangunan fondasi fisik dasar.';
  }

  return { title, summary, recommendations: recs };
}

export function generateMatchAnalysis(form: MatchForm, score: number, targets: Record<string, number> = {}): { title: string; summary: string; recommendations: { area: string; text: string }[] } {
  const recs: { area: string; text: string }[] = [];

  metricLabels.forEach((label) => {
    const metric = form.metrics[label];
    const target = targets[label] || 10;
    const success = metric.success || target;
    const error = metric.error || 0;
    const effectiveness = success > 0 ? Math.max(0, Math.min(100, ((success - error) / success) * 100)) : 0;

    recs.push({ area: label, text: `Efektivitas ${label} tercatat ${Math.round(effectiveness)}%.` });
  });

  return {
    title: score >= 75 ? 'Efektivitas Teknik Baik' : 'Perlu Evaluasi Teknik',
    summary: 'Analisis performa teknik pertandingan berdasarkan target.',
    recommendations: recs,
  };
}

export function getMetricsFromPayload(payload: Record<string, unknown>): Record<string, TechnicalMetric> {
  const metrics = payload.metrics as Record<string, TechnicalMetric> | undefined;
  return metrics ?? {};
}

export function getZonesFromPayload(payload: Record<string, unknown>): number[] {
  return (payload.zones as number[]) ?? [];
}

export function getCustomValuesFromPayload(payload: Record<string, unknown>): Record<string, string> {
  return (payload.customValues as Record<string, string>) ?? {};
}

export function getAnalysisFromPayload(payload: Record<string, unknown>): { title: string; summary: string; recommendations: { area: string; text: string }[] } | null {
  const analysis = payload.analysis;
  if (analysis && typeof analysis === 'object' && !Array.isArray(analysis)) {
    const obj = analysis as { title: string; summary: string; recommendations: { area: string; text: string }[] };
    if (obj.title && obj.summary && Array.isArray(obj.recommendations)) {
      return obj;
    }
  }
  return null;
}

export function simpleHash(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `abram_${hash}`;
}

export function exportToExcel(reports: Report[], filename: string): void {
  const headers = [
    'Nama Atlet',
    'Jenis Laporan',
    'Tanggal',
    'Skor',
    'Status',
    'Catatan Pelatih',
  ];

  const rows = reports.map((r) => [
    r.athlete_name,
    r.report_type === 'physical' ? 'Tes Fisik' : 'Pertandingan',
    r.report_date,
    String(r.readiness_score ?? 0),
    r.status,
    r.coach_notes ?? '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
  XLSX.writeFile(wb, filename);
}

export function triggerPrint(filename?: string) {
  if (filename) {
    document.title = filename;
  }
  setTimeout(() => {
    window.print();
    setTimeout(() => {
      document.title = 'Volleyball Performance Lab';
    }, 1000);
  }, 100);
}