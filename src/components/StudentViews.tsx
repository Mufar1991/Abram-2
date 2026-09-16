import { FormEvent, useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Archive,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  HeartPulse,
  Plus,
  Save,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import type { MatchForm, PhysicalForm, PhysicalIndicator, Report, ReportType, TechnicalMetric } from '@/lib/types';
import {
  formatDate,
  metricLabels,
  scoreMatch,
  scorePhysical,
  generateRichAnalysis,
  getScoreTier,
} from '@/lib/utils';

export function Dashboard({
  reports,
  averageScore,
  onNavigate,
  onSelect,
  loading,
}: {
  reports: Report[];
  averageScore: number;
  onNavigate: (tab: 'physical' | 'archive') => void;
  onSelect: (report: Report) => void;
  loading: boolean;
}) {
  const approvedReports = reports.filter((r) => r.status === 'approved');
  const latest = approvedReports.slice(0, 4);

  return (
    <section className="content">
      <div className="hero-card">
        <div className="hero-copy">
          <span className="section-label">CONTROL CENTER <span className="label-line" /></span>
          <h2>Bangun performa<br /><em>juara</em> dengan data.</h2>
          <p>Ubah setiap hasil tes dan momen pertandingan menjadi keputusan latihan yang lebih presisi.</p>
          <button className="primary-btn" onClick={() => onNavigate('physical')}>
            <Plus size={17} />Input data baru <ArrowUpRight size={17} />
          </button>
        </div>
        <div className="hero-orb">
          <div className="orb-ring ring-one" />
          <div className="orb-ring ring-two" />
          <div className="hero-stat">
            <Zap size={20} />
            <strong>{averageScore || '—'}</strong>
            <span>Rata-rata readiness</span>
          </div>
          <Target className="orb-icon" size={118} />
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard icon={<Users />} label="Total Atlet" value={String(new Set(approvedReports.map((r) => r.athlete_name)).size)} helper="dari seluruh laporan" tone="blue" />
        <MetricCard icon={<Activity />} label="Tes Fisik" value={String(approvedReports.filter((r) => r.report_type === 'physical').length)} helper="laporan tersimpan" tone="gold" />
        <MetricCard icon={<Trophy />} label="Statistik" value={String(approvedReports.filter((r) => r.report_type === 'match').length)} helper="statistik dianalisis" tone="green" />
        <MetricCard icon={<ShieldCheck />} label="Status Data" value="LIVE" helper="arsip publik aktif" tone="red" />
      </div>

      <div className="section-heading">
        <div>
          <span className="section-label">AKTIVITAS TERBARU</span>
          <h3>Snapshot performa</h3>
        </div>
        <button className="text-btn" onClick={() => onNavigate('archive')}>
          Lihat semua <ChevronRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className="empty-card">Memuat arsip performa...</div>
      ) : latest.length === 0 ? (
        <div className="empty-card">
          <Archive size={28} />
          <strong>Belum ada laporan</strong>
          <span>Mulai dari tes fisik pertama untuk mengisi dashboard.</span>
          <button className="secondary-btn" onClick={() => onNavigate('physical')}>Buat laporan pertama</button>
        </div>
      ) : (
        <div className="activity-list">
          {latest.map((report) => (
            <ReportRow key={report.id} report={report} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}

function MetricCard({ icon, label, value, helper, tone }: { icon: React.ReactNode; label: string; value: string; helper: string; tone: string }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </div>
  );
}

export function ReportRow({ report, onSelect }: { report: Report; onSelect: (report: Report) => void }) {
  return (
    <button className="report-row" onClick={() => onSelect(report)}>
      <div className={`report-type-icon ${report.report_type}`}>
        {report.report_type === 'physical' ? <HeartPulse size={18} /> : <BarChart3 size={18} />}
      </div>
      <div className="report-row-main">
        <strong>{report.athlete_name}</strong>
        <span>{report.report_type === 'physical' ? 'Tes Fisik' : 'Statistik Perindividu'}</span>
      </div>
      <div className="report-row-date">
        <CalendarDays size={14} />{formatDate(report.report_date)}
      </div>
      <div className={`score-pill ${report.readiness_score && report.readiness_score >= 75 ? 'good' : 'medium'}`}>
        {report.readiness_score ?? 0}<small>/100</small>
      </div>
      <ChevronRight size={17} className="row-arrow" />
    </button>
  );
}

function FormShell({ children, title, description, icon }: { children: React.ReactNode; title: string; description: string; icon: React.ReactNode }) {
  return (
    <section className="content">
      <div className="form-header">
        <div className="form-header-icon">{icon}</div>
        <div>
          <span className="section-label">DATA COLLECTION</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, suffix, name }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; suffix?: string; name?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={label.includes('Nama') || label.includes('Tanggal')}
          autoComplete="off"
          name={name || `field_${label.toLowerCase().replace(/\s+/g, '_')}`}
        />
        {suffix && <small>{suffix}</small>}
      </div>
    </label>
  );
}

function AthleteAutocomplete({ value, onChange, athleteNames }: { value: string; onChange: (value: string) => void; athleteNames: string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return athleteNames;
    return athleteNames.filter((n) => n.toLowerCase().includes(query.toLowerCase()));
  }, [query, athleteNames]);

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="athlete-selector">
      <span>Nama Atlet</span>
      <div className="athlete-input-wrap">
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setQuery(e.target.value); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Ketik atau pilih atlet"
          required
          autoComplete="off"
          name="athlete_name_input"
        />
        {open && (
          <div className="athlete-dropdown">
            {filtered.length === 0 ? (
              <div style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--text-faint)' }}>Ketik nama baru atau pilih dari daftar</div>
            ) : (
              filtered.map((name) => (
                <button
                  key={name}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(name); }}
                  className={`athlete-option ${value === name ? 'selected' : ''}`}
                >
                  <Users size={14} />
                  {name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PhysicalFormView({
  form,
  setForm,
  onSubmit,
  saving,
  indicators,
}: {
  form: PhysicalForm;
  setForm: React.Dispatch<React.SetStateAction<PhysicalForm>>;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
  indicators: PhysicalIndicator[];
}) {
  const score = scorePhysical(form, indicators);
  const update = (key: keyof PhysicalForm) => (value: string) =>
    setForm((c) => ({ ...c, [key]: value }));

  const updateCustom = (id: string, value: string) =>
    setForm((c) => ({ ...c, customValues: { ...c.customValues, [id]: value } }));

  const analysis = generateRichAnalysis(form, score, indicators);
  const tier = getScoreTier(score);

  return (
    <FormShell title="Tes Fisik Atlet" description="Catat indikator kebugaran untuk membaca kesiapan atlet secara menyeluruh." icon={<HeartPulse size={24} />}>
      <form onSubmit={onSubmit}>
        <div className="form-grid two">
          <Field label="Nama Atlet" value={form.athleteName} onChange={update('athleteName')} placeholder="Contoh: Budi Santoso" name="physical_athlete_name" />
          <Field label="Tanggal Tes" type="date" value={form.date} onChange={update('date')} name="physical_date" />
        </div>

        <div className="form-divider">
          <span>INDIKATOR KONDISI FISIK</span>
          <small>Masukkan hasil pengukuran terakhir</small>
        </div>

        <div className="form-grid three">
          {indicators.length === 0 ? (
            <div style={{ gridColumn: 'span 3', padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Belum ada indikator tes fisik yang diatur oleh pelatih.
            </div>
          ) : (
            indicators.map((indicator) => {
              const isBuiltin = indicator.key in form && indicator.key !== 'customValues';
              const value = isBuiltin ? form[indicator.key as keyof PhysicalForm] : form.customValues[indicator.id];
              const onChange = isBuiltin
                ? update(indicator.key as keyof PhysicalForm)
                : (v: string) => updateCustom(indicator.id, v);
              return (
                <Field
                  key={indicator.id}
                  label={indicator.name}
                  value={String(value ?? '')}
                  onChange={onChange}
                  type="number"
                  suffix={indicator.unit}
                  name={`indicator_${indicator.id}`}
                />
              );
            })
          )}
        </div>

        <div className="rich-analysis" style={{ ['--p' as string]: score } as React.CSSProperties}>
          <div className="rich-analysis-header">
            <div className="score-circle">
              <strong>{score}</strong>
              <span>/ 100</span>
            </div>
            <div className="rich-analysis-title">
              <span className="section-label">LIVE ANALYSIS</span>
              <h3>{analysis.title}</h3>
              <span className="analysis-tier" style={{ color: tier.color }}>{tier.label}</span>
            </div>
            <Activity size={54} className="analysis-wave" />
          </div>
          <p className="rich-analysis-summary">{analysis.summary}</p>
          {analysis.recommendations.length > 0 && (
            <div className="analysis-recommendations">
              <span className="section-label"><TrendingUp size={14} />REKOMENDASI LATIHAN</span>
              <div className="recommendation-list">
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} className="recommendation-item">
                    <strong>{rec.area}</strong>
                    <p>{rec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-footer">
          <span><ShieldCheck size={16} /> Data tersimpan aman di arsip performa</span>
          <button className="primary-btn" disabled={saving} type="submit">
            <Save size={17} />{saving ? 'Menyimpan...' : 'Simpan & Analisis'} <ArrowUpRight size={16} />
          </button>
        </div>
      </form>
    </FormShell>
  );
}

export function MatchFormView({
  form,
  setForm,
  onSubmit,
  saving,
  athleteNames,
  techniqueTargets,
}: {
  form: MatchForm;
  setForm: React.Dispatch<React.SetStateAction<MatchForm>>;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
  athleteNames: string[];
  techniqueTargets: Record<string, number>;
}) {
  const score = scoreMatch(form, techniqueTargets);

  useEffect(() => {
    setForm((c) => ({
      ...c,
      metrics: Object.fromEntries(
        metricLabels.map((label) => [
          label,
          {
            success: techniqueTargets[label] || c.metrics[label]?.success || 10,
            error: c.metrics[label]?.error || 0,
          },
        ])
      ) as Record<string, TechnicalMetric>,
    }));
  }, [techniqueTargets, setForm]);

  const updateMetric = (label: string, key: keyof TechnicalMetric, value: string) =>
    setForm((c) => ({
      ...c,
      metrics: {
        ...c.metrics,
        [label]: { ...c.metrics[label], [key]: Math.max(0, Number(value)) },
      },
    }));

  return (
    <FormShell title="Statistik Perindividu" description="Ukur efektivitas teknik dan petakan arah landing smash dalam satu tampilan." icon={<BarChart3 size={24} />}>
      <form onSubmit={onSubmit}>
        <div className="form-grid two">
          <AthleteAutocomplete
            value={form.athleteName}
            onChange={(v) => setForm((c) => ({ ...c, athleteName: v }))}
            athleteNames={athleteNames}
          />
          <Field label="Tanggal Tes" type="date" value={form.date} onChange={(v) => setForm((c) => ({ ...c, date: v }))} name="match_date" />
        </div>

        <div className="form-divider">
          <span>STATISTIK TEKNIS</span>
          <small>Kolom Berhasil terisi otomatis dari target admin. Error diisi manual.</small>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Teknik</th><th>Berhasil (Target)</th><th>Error</th><th>Efektivitas</th></tr>
            </thead>
            <tbody>
              {metricLabels.map((label) => {
                const metric = form.metrics[label];
                const target = techniqueTargets[label] || 10;
                const effectiveness = metric.success > 0 ? Math.max(0, Math.min(100, ((metric.success - metric.error) / metric.success) * 100)) : 0;
                return (
                  <tr key={label}>
                    <td><strong>{label}</strong></td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={metric.success}
                        onChange={(e) => updateMetric(label, 'success', e.target.value)}
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '6px', padding: '6px 10px', width: '80px' }}
                        autoComplete="off"
                        name={`metric_success_${label.toLowerCase()}`}
                      />
                      <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>Target: {target}</small>
                    </td>
                    <td>                      <input type="number" min="0" value={metric.error} onChange={(e) => updateMetric(label, 'error', e.target.value)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '6px', padding: '6px 10px', width: '80px' }} autoComplete="off" name={`metric_error_${label.toLowerCase()}`} /></td>
                    <td><span className={`efficiency ${effectiveness >= 70 ? 'high' : ''}`}>{Math.round(effectiveness)}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="form-divider">
          <span>PETA LANDING SMASH</span>
          <small>Pilih zona tempat bola paling sering mendarat</small>
        </div>

        <div className="zone-layout">
          <div className="court">
            <div className="court-net">NET</div>
            {[4, 3, 2, 5, 6, 1].map((zone) => (
              <button
                type="button"
                key={zone}
                className={`zone zone-${zone} ${form.zones.includes(zone) ? 'selected' : ''}`}
                onClick={() => setForm((c) => ({
                  ...c,
                  zones: c.zones.includes(zone)
                    ? c.zones.filter((z) => z !== zone)
                    : [...c.zones, zone],
                }))}
              >
                <span>{zone}</span>
                <small>ZONA</small>
              </button>
            ))}
          </div>
          <div className="zone-legend">
            <div className="legend-dot" />
            <strong>{form.zones.length ? `${form.zones.length} zona dipilih` : 'Belum ada zona'}</strong>
            <p>Ketuk area lapangan untuk menandai target landing smash.</p>
            <div className="zone-tip">
              <Target size={17} />
              <span>Zona 1 dan 6 adalah area belakang yang sering menjadi target serangan tajam.</span>
            </div>
          </div>
        </div>

        <div className="analysis-preview compact" style={{ ['--p' as string]: score } as React.CSSProperties}>
          <div className="score-circle">
            <strong>{score}</strong>
            <span>/ 100</span>
          </div>
          <div>
            <span className="section-label">MATCH EFFICIENCY</span>
            <h3>{score >= 75 ? 'Efektivitas kuat' : 'Ruang untuk berkembang'}</h3>
            <p>Skor dihitung dari efektivitas seluruh teknik yang dicatat.</p>
          </div>
        </div>

        <div className="form-footer">
          <span><ShieldCheck size={16} /> Data Perindividu siap dianalisis</span>
          <button className="primary-btn" disabled={saving} type="submit">
            <Save size={17} />{saving ? 'Menyimpan...' : 'Simpan Statistik'} <ArrowUpRight size={16} />
          </button>
        </div>
      </form>
    </FormShell>
  );
}

export function ArchiveView({
  reports,
  loading,
  onSelect,
}: {
  reports: Report[];
  loading: boolean;
  onSelect: (report: Report) => void;
}) {
  const approved = reports.filter((r) => r.status === 'approved');
  const [filter, setFilter] = useState<'all' | ReportType>('all');
  const visible = filter === 'all' ? approved : approved.filter((r) => r.report_type === filter);

  return (
    <section className="content">
      <div className="archive-head">
        <div>
          <span className="section-label">PUBLIC ARCHIVE</span>
          <h2>Riwayat laporan</h2>
          <p>Semua hasil yang tercatat, terorganisir untuk evaluasi berikutnya.</p>
        </div>
        <div className="archive-count">
          <strong>{approved.length}</strong>
          <span>laporan total</span>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-tabs">
          {([['all', 'Semua'], ['physical', 'Tes Fisik'], ['match', 'Statistik Perindividu']] as const).map(([id, label]) => (
            <button key={id} className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>
          ))}
        </div>
        <span className="archive-status"><span /> Terbuka untuk publik</span>
      </div>

      {loading ? (
        <div className="empty-card">Memuat laporan...</div>
      ) : visible.length === 0 ? (
        <div className="empty-card">
          <Archive size={28} />
          <strong>Belum ada laporan di kategori ini</strong>
          <span>Input data untuk menambahkan arsip baru.</span>
        </div>
      ) : (
        <div className="archive-grid">
          {visible.map((report) => (
            <button className="archive-card" key={report.id} onClick={() => onSelect(report)}>
              <div className="archive-card-top">
                <div className={`report-type-icon ${report.report_type}`}>
                  {report.report_type === 'physical' ? <HeartPulse size={18} /> : <BarChart3 size={18} />}
                </div>
                <span className="card-date"><CalendarDays size={13} />{formatDate(report.report_date)}</span>
              </div>
              <h3>{report.athlete_name}</h3>
              <p>{report.report_type === 'physical' ? 'Tes Fisik' : 'Statistik Perindividu'}</p>
              <div className="card-bottom">
                <div className={`score-pill ${report.readiness_score && report.readiness_score >= 75 ? 'good' : 'medium'}`}>
                  {report.readiness_score ?? 0}<small>/100</small>
                </div>
                <span>Detail laporan <ArrowUpRight size={14} /></span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
