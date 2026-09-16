import { useMemo, useState, useEffect, useRef } from 'react';
import {
  Activity,
  BarChart3,
  CalendarDays,
  Check,
  ClipboardList,
  Clock3,
  Download,
  FileSpreadsheet,
  HeartPulse,
  Pencil,
  Plus,
  Printer,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Target,
  Trash2,
  Trophy,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { ReportDetail } from '@/components/Modals';
import type { CoachSettings, CustomTestParam, Report } from '@/lib/types';
import {
  formatDate,
  getCustomValuesFromPayload,
  getMetricsFromPayload,
  getAnalysisFromPayload,
  metricLabels,
  triggerPrint,
  BUILTIN_INDICATORS,
} from '@/lib/utils';

export function AdminDashboard({
  reports,
  onExport,
}: {
  reports: Report[];
  onExport: () => void;
}) {
  const approved = reports.filter((r) => r.status === 'approved');
  const rejected = reports.filter((r) => r.status === 'rejected');
  const avgScore = approved.length
    ? Math.round(approved.reduce((s, r) => s + (r.readiness_score ?? 0), 0) / approved.length)
    : 0;
  const physicalCount = approved.filter((r) => r.report_type === 'physical').length;

  return (
    <section className="content">
      <div className="section-heading">
        <div>
          <span className="section-label">ADMIN CONTROL CENTER</span>
          <h3>Dashboard Pelatih</h3>
        </div>
        <button className="secondary-btn" onClick={onExport}>
          <FileSpreadsheet size={16} />Export Excel
        </button>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <AdminMetricCard icon={<Users />} label="Total Laporan" value={String(reports.length)} tone="blue" />
        <AdminMetricCard icon={<HeartPulse />} label="Tes Fisik" value={String(physicalCount)} tone="gold" />
        <AdminMetricCard icon={<ShieldCheck />} label="Rata-rata Skor Fisik" value={String(avgScore)} tone="green" />
      </div>

      <div className="section-heading" style={{ marginTop: '28px' }}>
        <div>
          <span className="section-label">STATUS MODERASI</span>
          <h3>Distribusi laporan</h3>
        </div>
      </div>
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <AdminMetricCard icon={<ClipboardList />} label="Pending" value={String(reports.filter((r) => r.status === 'pending').length)} tone="gold" />
        <AdminMetricCard icon={<Check />} label="Approved" value={String(approved.length)} tone="green" />
        <AdminMetricCard icon={<X />} label="Rejected" value={String(rejected.length)} tone="red" />
      </div>
    </section>
  );
}

function AdminMetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export function AthleteAnalysisView({
  reports,
  coachName,
  customParams,
  techniqueTargets,
}: {
  reports: Report[];
  coachName: string;
  customParams: CustomTestParam[];
  techniqueTargets: Record<string, number>;
}) {
  const approved = reports.filter((r) => r.status === 'approved');
  const athletes = Array.from(new Set(approved.map((r) => r.athlete_name))).sort();
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [printCoachName, setPrintCoachName] = useState(coachName);
  const [printReport, setPrintReport] = useState<Report | null>(null);
  const [showComprehensive, setShowComprehensive] = useState(false);

  const athleteData = useMemo(() => {
    return athletes.map((name) => {
      const athleteReports = approved.filter((r) => r.athlete_name === name);
      const physicalReports = athleteReports.filter((r) => r.report_type === 'physical');
      const latestPhysical = physicalReports[0];
      const avgPhysical = physicalReports.length
        ? Math.round(physicalReports.reduce((s, r) => s + (r.readiness_score ?? 0), 0) / physicalReports.length)
        : null;

      let recs: { area: string; text: string }[] = [];
      if (latestPhysical) {
        const analysis = getAnalysisFromPayload(latestPhysical.payload);
        if (analysis?.recommendations) {
          recs = analysis.recommendations.slice(0, 3);
        }
      }

      return {
        name,
        totalReports: athleteReports.length,
        physicalReports: physicalReports.length,
        avgPhysical,
        latestPhysical,
        recommendations: recs,
      };
    });
  }, [approved, athletes]);

  const handlePrint = (report: Report) => {
    setPrintReport(report);
    setTimeout(() => {
      triggerPrint(`Laporan_Performa_${report.athlete_name.replace(/\s+/g, '_')}`);
    }, 150);
  };

  const handlePrintAll = () => {
    setShowComprehensive(true);
  };

  return (
    <section className="content">
      <div className="section-heading">
        <div>
          <span className="section-label">ANALISIS DATA ATLET</span>
          <h3>Analisis Komprehensif Per Atlet</h3>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="secondary-btn" onClick={handlePrintAll}>
            <Printer size={16} />Cetak PDF
          </button>
        </div>
      </div>

      <div className="settings-card" style={{ marginBottom: '24px' }}>
        <h3><Printer size={18} />Cetak Laporan dengan Nama Pelatih</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Masukkan nama pelatih yang akan ditampilkan di tanda tangan laporan sebelum mencetak.
        </p>
        <div className="settings-row">
          <label className="field" style={{ flex: 1 }}>
            <span>Nama Pelatih untuk Cetak</span>
            <div className="input-wrap">
               <input type="text" value={printCoachName} onChange={(e) => setPrintCoachName(e.target.value)} autoComplete="new-password" name="print_coach_name_field" />
            </div>
          </label>
        </div>
      </div>

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <AdminMetricCard icon={<Users />} label="Total Atlet" value={String(athletes.length)} tone="blue" />
        <AdminMetricCard icon={<Activity />} label="Total Laporan Fisik" value={String(approved.length)} tone="gold" />
        <AdminMetricCard icon={<HeartPulse />} label="Rata-rata Skor Fisik" value={athleteData.length ? String(Math.round(athleteData.reduce((s, a: { avgPhysical: number | null }) => s + (a.avgPhysical || 0), 0) / athleteData.filter((a: { avgPhysical: number | null }) => a.avgPhysical !== null).length)) : '—'} tone="green" />
      </div>

      {athletes.length === 0 ? (
        <div className="empty-card">
          <Activity size={28} />
          <strong>Belum ada data atlet</strong>
          <span>Data akan muncul di sini setelah ada laporan yang disetujui.</span>
        </div>
      ) : (
        <div className="manage-table">
          <table>
            <thead>
              <tr>
                <th>Atlet</th><th>Total Laporan</th><th>Tes Fisik</th><th>Rata-rata Fisik</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {athleteData.map((data) => (
                <tr key={data.name}>
                  <td><strong>{data.name}</strong></td>
                  <td>{data.totalReports}</td>
                  <td>{data.physicalReports}</td>
                  <td><span className={`score-pill ${data.avgPhysical && data.avgPhysical >= 75 ? 'good' : 'medium'}`}>{data.avgPhysical ?? '—'}</span></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-edit" onClick={() => setSelectedAthlete(data.name === selectedAthlete ? null : data.name)}>
                        {data.name === selectedAthlete ? 'Sembunyikan' : 'Detail'}
                      </button>
                      {data.latestPhysical && (
                        <button className="secondary-btn" onClick={() => handlePrint(data.latestPhysical)}><Printer size={14} />Cetak</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedAthlete && (
        <div className="analysis-detail-panel" style={{ marginTop: '24px' }}>
          {(() => {
            const data = athleteData.find((a) => a.name === selectedAthlete);
            if (!data) return null;
            return (
              <>
                <div className="section-heading">
                  <div>
                    <span className="section-label">DETAIL ATLET</span>
                    <h3>{data.name}</h3>
                  </div>
                </div>
                <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '20px' }}>
                  <AdminMetricCard icon={<HeartPulse />} label="Skor Fisik Terakhir" value={data.latestPhysical ? String(data.latestPhysical.readiness_score ?? 0) : '—'} tone="gold" />
                  <AdminMetricCard icon={<Activity />} label="Total Tes Fisik" value={String(data.physicalReports)} tone="blue" />
                </div>

                {data.recommendations.length > 0 && (
                  <div className="settings-card">
                    <h3><Target size={18} />Rekomendasi Latihan Terbaru</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      {data.recommendations.map((rec, i) => (
                        <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-base)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                          <strong style={{ color: 'var(--accent)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{rec.area}</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{rec.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.latestPhysical && (
                  <div className="settings-card" style={{ marginTop: '16px' }}>
                    <h3><HeartPulse size={18} />Detail Tes Fisik Terakhir</h3>
                    <div className="detail-grid" style={{ marginTop: '12px' }}>
                      {(['heartRate', 'beepTest', 'shuttleRun', 'pushUp', 'sitUp', 'backUp', 'verticalJump'] as const).map((key) => {
                        const val = data.latestPhysical?.payload[key];
                        if (val === undefined || val === null || String(val).trim() === '') return null;
                        return (
                          <div key={key}>
                            <span>{key === 'heartRate' ? 'Denyut Nadi' : key === 'beepTest' ? 'Beep Test' : key === 'shuttleRun' ? 'Shuttle Run' : key === 'pushUp' ? 'Push Up' : key === 'sitUp' ? 'Sit Up' : key === 'backUp' ? 'Back Up' : 'Vertical Jump'}</span>
                            <strong>{String(val)}</strong>
                          </div>
                        );
                      })}
                      {customParams.map((param) => {
                        const val = getCustomValuesFromPayload(data.latestPhysical.payload)[param.id];
                        if (val === undefined || val === null || String(val).trim() === '') return null;
                        return (
                          <div key={param.id}>
                            <span>{param.name}</span>
                            <strong>{String(val)} <small>{param.unit}</small></strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {printReport && (
        <ReportDetail
          report={printReport}
          coachName={printCoachName}
          customParams={customParams}
          techniqueTargets={techniqueTargets}
          onClose={() => setPrintReport(null)}
        />
      )}

      {showComprehensive && (
        <ComprehensiveReportModal
          reports={approved}
          athletes={athleteData}
          coachName={printCoachName}
          onClose={() => setShowComprehensive(false)}
        />
      )}
    </section>
  );
}

function ComprehensiveReportModal({
  reports,
  athletes,
  coachName,
  onClose,
}: {
  reports: Report[];
  athletes: { name: string; totalReports: number; physicalReports: number; avgPhysical: number | null; latestPhysical: Report | undefined; recommendations: { area: string; text: string }[] }[];
  coachName: string;
  onClose: () => void;
}) {
  const totalPhysical = reports.filter((r) => r.report_type === 'physical').length;
  const avgScore = reports.length
    ? Math.round(reports.reduce((s, r) => s + (r.readiness_score ?? 0), 0) / reports.length)
    : 0;

  const strongPhysical = athletes.filter((a) => (a.avgPhysical ?? 0) >= 75).length;
  const needsAttention = athletes.filter((a) => (a.avgPhysical ?? 0) < 50).length;

  const crossRecommendations = useMemo(() => {
    const map = new Map<string, { area: string; text: string }[]>();
    athletes.forEach((athlete) => {
      athlete.recommendations.forEach((rec) => {
        const list = map.get(rec.area) || [];
        list.push({ ...rec, text: `${athlete.name}: ${rec.text}` });
        map.set(rec.area, list);
      });
    });
    return Array.from(map.entries()).map(([area, items]) => ({
      area,
      count: items.length,
      text: items.map((i) => i.text).join(' | '),
    }));
  }, [athletes]);

  useEffect(() => {
    triggerPrint('Laporan_Analisis_Komprehensif');
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <article className="report-modal comprehensive-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-head">
          <div className="report-brand">
            <img src="/ABRAM.png" alt="ABRAM" />
            <div>
              <strong>ABRAM</strong>
              <span>Volleyball Performance Lab</span>
            </div>
          </div>
          <div className="modal-actions">
            <button onClick={() => triggerPrint('Laporan_Analisis_Komprehensif')} title="Cetak laporan"><Printer size={18} /></button>
            <button onClick={onClose} title="Tutup"><X size={19} /></button>
          </div>
        </div>

        <div className="print-report comprehensive-report">
          {/* KOP SURAT / HEADER RESMI CETAK */}
          <div className="print-kop" style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '2px solid var(--text-primary)', paddingBottom: '14px', marginBottom: '20px' }}>
            <img src="/ABRAM.png" alt="Logo" style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} />
            <div>
              <strong style={{ fontSize: '18px', display: 'block', letterSpacing: '-0.5px' }}>ABRAM VOLLEYBALL PERFORMANCE LAB</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Laporan Resmi Komprehensif Pengukuran Atlet</span>
            </div>
          </div>

          <div className="report-kicker">COMPREHENSIVE ATHLETE ANALYSIS REPORT</div>
          <h2>Laporan Analisis Komprehensif Atlet</h2>
          <div className="report-meta">
            <span><CalendarDays size={14} />{formatDate(new Date().toISOString().slice(0, 10))}</span>
            <span><Clock3 size={14} />Laporan publik</span>
          </div>

          <div className="report-score-banner">
            <div>
              <span>RATA-RATA KINERJA FISIK</span>
              <strong>{avgScore}<small>/ 100</small></strong>
            </div>
            <div className="score-banner-note">
              <ShieldCheck size={17} />
              <div>
                <strong>Ringkasan Umum</strong>
                <p>Total {athletes.length} atlet | {totalPhysical} laporan tes fisik | Rata-rata skor keseluruhan: {avgScore}/100</p>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3><Users size={18} />Ringkasan Semua Atlet</h3>
            <div className="manage-table" style={{ marginTop: '12px' }}>
              <table>
                <thead>
                  <tr>
                    <th>Atlet</th>
                    <th>Total Laporan</th>
                    <th>Rata-rata Fisik</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map((athlete) => (
                    <tr key={athlete.name}>
                      <td><strong>{athlete.name}</strong></td>
                      <td>{athlete.totalReports}</td>
                      <td><span className={`score-pill ${athlete.avgPhysical && athlete.avgPhysical >= 75 ? 'good' : 'medium'}`}>{athlete.avgPhysical ?? '—'}</span></td>
                      <td>
                        {athlete.avgPhysical && athlete.avgPhysical >= 75 ? 'Prima' : athlete.avgPhysical && athlete.avgPhysical >= 50 ? 'Cukup' : 'Perlu Perhatian'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="detail-section">
            <h3><Target size={18} />Ringkasan Evaluasi Umum</h3>
            <div style={{ marginTop: '12px', padding: '16px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Atlet</span>
                  <strong style={{ fontSize: '22px', color: 'var(--text-primary)', display: 'block', marginTop: '4px' }}>{athletes.length}</strong>
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rata-rata Skor</span>
                  <strong style={{ fontSize: '22px', color: 'var(--text-primary)', display: 'block', marginTop: '4px' }}>{avgScore}<small style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/100</small></strong>
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kesiapan Fisik Prima</span>
                  <strong style={{ fontSize: '22px', color: 'var(--success)', display: 'block', marginTop: '4px' }}>{strongPhysical}</strong>
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Perlu Perhatian</span>
                  <strong style={{ fontSize: '22px', color: 'var(--error)', display: 'block', marginTop: '4px' }}>{needsAttention}</strong>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Rata-rata kesiapan fisik seluruh atlet berada pada skor {avgScore}/100. 
                {strongPhysical > 0 && ` Terdapat ${strongPhysical} atlet dengan kondisi fisik prima. `}
                {needsAttention > 0 && ` ${needsAttention} atlet memerlukan program pengembangan khusus. `}
                Prioritaskan peningkatan fisik secara berkala.
              </p>
            </div>
          </div>

          <div className="detail-section">
            <h3><Target size={18} />Rekomendasi & Treatment per Atlet</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              {athletes.map((athlete) => (
                <div key={athlete.name} style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{athlete.name}</strong>
                    <span className={`score-pill ${athlete.avgPhysical && athlete.avgPhysical >= 75 ? 'good' : 'medium'}`}>
                      Fisik: {athlete.avgPhysical ?? '—'}
                    </span>
                  </div>
                  {athlete.recommendations.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {athlete.recommendations.map((rec, i) => (
                        <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <strong style={{ fontSize: '12px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{rec.area}</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{rec.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Belum ada rekomendasi spesifik untuk atlet ini.</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {crossRecommendations.length > 0 && (
            <div className="detail-section">
              <h3><TrendingUp size={18} />Rekomendasi Lintas Atlet</h3>
              <div style={{ marginTop: '12px', padding: '16px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 12px' }}>
                  Berikut adalah fokus latihan yang dapat diterapkan secara kolektif berdasarkan kebutuhan umum yang muncul pada multiple atlet.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {crossRecommendations.map((item, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-base)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                      <strong style={{ fontSize: '12px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.area} — {item.count} atlet</strong>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TANDA TANGAN PELATIH RESMI */}
          <div className="report-signature" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', pageBreakInside: 'avoid' }}>
            <div style={{ textAlign: 'center', minWidth: '220px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Dievaluasi & Disahkan oleh,</span>
              <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '50px' }}>Pelatih / Instruktur</strong>
              <span style={{ borderTop: '1px solid var(--text-primary)', paddingTop: '4px', display: 'block', fontWeight: '700', fontSize: '14px' }}>
                {coachName || 'Aldo Bramudyo, S.Pd.'}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

export function ManageView({
  reports,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onUpdateNotes,
  onExport,
}: {
  reports: Report[];
  onEdit: (report: Report) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onExport: () => void;
}) {
  const [notesId, setNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');

  const startEditNotes = (report: Report) => {
    setNotesId(report.id);
    setNotesText(report.coach_notes ?? '');
  };

  const saveNotes = () => {
    if (notesId) onUpdateNotes(notesId, notesText);
    setNotesId(null);
  };

  return (
    <section className="content">
      <div className="section-heading">
        <div>
          <span className="section-label">FULL CRUD MANAGEMENT</span>
          <h3>Kelola Semua Laporan</h3>
        </div>
        <button className="secondary-btn" onClick={onExport}>
          <FileSpreadsheet size={16} />Export Excel
        </button>
      </div>

      <div className="manage-table">
        <table>
          <thead>
            <tr>
              <th>Atlet</th><th>Jenis</th><th>Tanggal</th><th>Skor</th><th>Status</th><th>Catatan</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td><strong>{report.athlete_name}</strong></td>
                <td>{report.report_type === 'physical' ? 'Tes Fisik' : 'Pertandingan'}</td>
                <td>{formatDate(report.report_date)}</td>
                <td>{report.readiness_score ?? 0}</td>
                <td><span className={`status-badge ${report.status}`}>{report.status}</span></td>
                <td>
                  {notesId === report.id ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input
                        type="text"
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        autoComplete="new-password"
                        name={"coach_notes_" + notesId}
                        style={{ width: '120px', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                      />
                      <button className="btn-approve" onClick={saveNotes}><Check size={12} /></button>
                      <button className="btn-reject" onClick={() => setNotesId(null)}><X size={12} /></button>
                    </div>
                  ) : (
                    <button className="btn-edit" onClick={() => startEditNotes(report)}>
                      {report.coach_notes ? 'Ubah' : 'Tambah'}
                    </button>
                  )}
                </td>
                <td>
                  <div className="action-btns">
                    {report.status === 'pending' && (
                      <>
                        <button className="btn-approve" onClick={() => onApprove(report.id)}><Check size={12} /></button>
                        <button className="btn-reject" onClick={() => onReject(report.id)}><X size={12} /></button>
                      </>
                    )}
                    <button className="btn-edit" onClick={() => onEdit(report)} title="Edit Data Atlet"><Pencil size={12} /></button>
                    <button className="btn-delete" onClick={() => { if (confirm('Hapus laporan ini?')) onDelete(report.id); }}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function SettingsView({
  settings,
  onSave,
}: {
  settings: CoachSettings | null;
  onSave: (coachName: string, pin: string, customParams: CustomTestParam[], targets: Record<string, number>) => void;
}) {
  const defaultIndicators = BUILTIN_INDICATORS.map((b) => ({ id: b.id, name: b.name, unit: b.unit }));
  const [coachName, setCoachName] = useState(settings?.coach_name ?? 'Aldo Bramudyo, S.Pd.');
  const [pin, setPin] = useState('');
  const [saved, setSaved] = useState(false);
  const [customParams, setCustomParams] = useState<CustomTestParam[]>(
    settings?.custom_params && settings.custom_params.length > 0 ? settings.custom_params : defaultIndicators
  );

  useEffect(() => {
    if (settings?.custom_params && settings.custom_params.length > 0) {
      setCustomParams(settings.custom_params);
    }
  }, [settings]);

  const [newParamName, setNewParamName] = useState('');
  const [newParamUnit, setNewParamUnit] = useState('');

  const [targets, setTargets] = useState<Record<string, number>>(
    settings?.technique_targets ?? {
      Servis: 10,
      Passing: 10,
      Smash: 10,
      Block: 10,
      Dig: 10,
    }
  );

   useEffect(() => {
    if (settings?.coach_name && settings.coach_name !== coachName) {
      setCoachName(settings.coach_name);
    }
  }, [settings, coachName]);

  const addParam = () => {
    if (!newParamName.trim()) return;
    setCustomParams((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newParamName.trim(), unit: newParamUnit },
    ]);
    setNewParamName('');
    setNewParamUnit('');
  };

  const deleteParam = (id: string) => {
    setCustomParams((prev) => prev.filter((p) => p.id !== id));
  };

  const editParam = (id: string, field: keyof CustomTestParam, value: string) => {
    setCustomParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const updateTarget = (label: string, value: number) => {
    setTargets((prev) => ({ ...prev, [label]: Math.max(0, value) }));
  };

  const handleSave = () => {
    onSave(coachName, pin, customParams, targets);
    setPin('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="content">
      <div className="section-heading">
        <div>
          <span className="section-label">KONFIGURASI</span>
          <h3>Pengaturan Pelatih</h3>
        </div>
      </div>

      <div className="settings-card">
        <h3><SettingsIcon size={18} />Nama Pelatih untuk Laporan PDF</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Nama ini akan muncul di bagian tanda tangan/evaluasi setiap laporan atlet yang dicetak.
        </p>
        <div className="settings-row">
          <label className="field" style={{ flex: 1 }}>
            <span>Nama Pelatih</span>
            <div className="input-wrap">
              <input type="text" value={coachName} onChange={(e) => setCoachName(e.target.value)} autoComplete="new-password" name="coach_name_field" />
            </div>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <h3><SettingsIcon size={18} />Manajemen Indikator Tes Fisik</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Kelola semua indikator tes fisik (bawaan dan tambahan). Ubah nama, satuan, atau hapus indikator sesuai kebutuhan. Perubahan langsung tersimpan.
        </p>

        <div className="manage-table" style={{ marginBottom: '16px' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>No</th>
                <th>Nama Indikator</th>
                <th style={{ width: '180px' }}>Satuan</th>
                <th style={{ width: '80px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {customParams.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '20px' }}>
                    Belum ada indikator. Tambahkan indikator baru di bawah.
                  </td>
                </tr>
              ) : (
                customParams.map((param, index) => (
                  <tr key={param.id}>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td>
                   <input
                        type="text"
                        value={param.name}
                        onChange={(e) => editParam(param.id, 'name', e.target.value)}
                        autoComplete="off"
                        data-lpignore="true"
                        name={`random_ind_name_${param.id}`}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                    </td>
                    <td>
                   <input
                        type="text"
                        value={param.unit}
                        onChange={(e) => editParam(param.id, 'unit', e.target.value)}
                        autoComplete="off"
                        data-lpignore="true"
                        name={`random_ind_unit_${param.id}`}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '13px' }}
                      />
                    </td>
                    <td>
                      <button className="btn-delete" onClick={() => deleteParam(param.id)} style={{ padding: '6px 12px' }}>
                        <Trash2 size={13} /> Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="form-divider" style={{ margin: '12px 0' }}><span /><small>Tambah indikator baru</small><span /></div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <label className="field" style={{ flex: 1 }}>
            <span>Nama Indikator</span>
            <div className="input-wrap">
              <input type="text" value={newParamName} onChange={(e) => setNewParamName(e.target.value)} autoComplete="new-password" name="new_indicator_name" />
            </div>
          </label>
          <label className="field" style={{ flex: 1 }}>
            <span>Satuan</span>
            <div className="input-wrap">
              <input type="text" value={newParamUnit} onChange={(e) => setNewParamUnit(e.target.value)} autoComplete="new-password" name="new_indicator_unit" />
            </div>
          </label>
          <button className="secondary-btn" onClick={addParam} type="button" style={{ marginBottom: '2px' }}><Plus size={16} />Tambah Indikator</button>
        </div>
      </div>

      <div className="settings-card">
        <h3><ShieldCheck size={18} />PIN Akses Admin</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Atur PIN untuk mengakses mode pelatih. Biarkan kosong jika tidak ingin mengubah.
        </p>
        <div className="settings-row">
          <label className="field" style={{ flex: 1 }}>
            <span>PIN Baru (opsional)</span>
            <div className="input-wrap">
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={10} autoComplete="new-password" name="admin_pin_field" />
            </div>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button className="primary-btn" onClick={handleSave}>
          <Save size={17} />Simpan Pengaturan
        </button>
        {saved && <span style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={16} />Tersimpan</span>}
      </div>
    </section>
  );
}