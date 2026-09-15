import type { CustomTestParam, MatchForm, PhysicalForm, Report, TechnicalMetric } from './types';

export const today = new Date().toISOString().slice(0, 10);

export const metricLabels = ['Servis', 'Passing', 'Smash', 'Block', 'Dig'];

export const defaultCustomParams: CustomTestParam[] = [];

export const initialPhysical: PhysicalForm = {
  athleteName: '',
  teamGroup: 'Tim A',
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
  teamGroup: 'Tim A',
  date: today,
  metrics: Object.fromEntries(
    metricLabels.map((label) => [label, { success: 0, error: 0 }])
  ) as Record<string, TechnicalMetric>,
  zones: [],
};

export function scorePhysical(form: PhysicalForm): number {
  const values = [
    Number(form.beepTest) * 5,
    Math.max(0, 100 - (Number(form.shuttleRun) - 8) * 8),
    Number(form.pushUp) * 1.8,
    Number(form.sitUp) * 1.6,
    Number(form.backUp) * 1.6,
    Number(form.verticalJump) / 1.5,
  ];
  const heartScore =
    Number(form.heartRate) >= 55 && Number(form.heartRate) <= 90 ? 100 : 76;
  return Math.round(
    Math.min(100, Math.max(0, values.reduce((a, b) => a + b, 0) / values.length * 0.82 + heartScore * 0.18))
  );
}

export function scoreMatch(form: MatchForm): number {
  const totals = Object.values(form.metrics).reduce(
    (sum, metric) => sum + metric.success + metric.error,
    0
  );
  const successes = Object.values(form.metrics).reduce(
    (sum, metric) => sum + metric.success,
    0
  );
  return totals ? Math.round((successes / totals) * 100) : 0;
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

export function displayPayload(
  payload: Record<string, unknown>,
  key: string
): string {
  return String(payload[key] ?? '—');
}

export function physicalAnalysis(score: number): string {
  if (score >= 85)
    return 'Kondisi sangat prima. Atlet berada pada puncak kesiapan fisik — aman untuk latihan intensitas tinggi dengan volume penuh.';
  if (score >= 75)
    return 'Kondisi prima. Kesiapan fisik kuat untuk latihan intensif. Pertahankan konsistensi dan optimalkan area yang masih berkembang.';
  if (score >= 65)
    return 'Kondisi cukup siap. Fondasi fisik memadai untuk latihan normal. Prioritaskan pemulihan dan konsistensi.';
  if (score >= 50)
    return 'Kondisi menengah. Fokus pada penguatan area lemah sebelum meningkatkan intensitas. Tingkatkan volume bertahap.';
  return 'Perlu perhatian khusus. Bangun fondasi fisik dasar terlebih dahulu sebelum latihan intensitas tinggi.';
}

export function matchAnalysis(score: number): string {
  return score >= 75
    ? 'Efektivitas teknis pertandingan berada pada level kuat.'
    : 'Gunakan data ini untuk menyusun fokus latihan teknik berikutnya.';
}

export function getMetricsFromPayload(
  payload: Record<string, unknown>
): Record<string, TechnicalMetric> {
  const metrics = payload.metrics as
    | Record<string, TechnicalMetric>
    | undefined;
  return metrics ?? {};
}

export function getZonesFromPayload(payload: Record<string, unknown>): number[] {
  return (payload.zones as number[]) ?? [];
}

export function getCustomValuesFromPayload(
  payload: Record<string, unknown>
): Record<string, string> {
  return (payload.customValues as Record<string, string>) ?? {};
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
    'Kelompok',
    'Jenis Laporan',
    'Tanggal',
    'Skor',
    'Status',
    'Catatan Pelatih',
  ];

  const rows = reports.map((r) => [
    r.athlete_name,
    r.team_group,
    r.report_type === 'physical' ? 'Tes Fisik' : 'Pertandingan',
    r.report_date,
    String(r.readiness_score ?? 0),
    r.status,
    r.coach_notes ?? '',
  ]);

  let csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  csv = '\uFEFF' + csv;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
