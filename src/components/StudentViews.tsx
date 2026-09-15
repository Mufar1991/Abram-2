import { FormEvent, useMemo, useState } from 'react';
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
import type { CustomTestParam, MatchForm, PhysicalForm, Report, ReportType, TechnicalMetric } from '@/lib/types';
import {
  formatDate,
  metricLabels,
  scoreMatch,
  scorePhysical,
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
        <MetricCard icon={<Trophy />} label="Pertandingan" value={String(approvedReports.filter((r) => r.report_type === 'match').length)} helper="statistik dianalisis" tone="green" />
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
        <span>{report.report_type === 'physical' ? 'Tes Fisik' : 'Statistik Pertandingan'} · {report.team_group}</span>
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

function Field({ label, value, onChange, type = 'text', placeholder, suffix }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; suffix?: string }) {
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
        />
        {suffix && <small>{suffix}</small>}
      </div>
    </label>
  );
}

function getScoreTier(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Sangat Prima', color: 'var(--success)' };
  if (score >= 75) return { label: 'Prima', color: 'var(--success)' };
  if (score >= 65) return { label: 'Cukup', color: 'var(--warning)' };
  if (score >= 50) return { label: 'Menengah', color: 'var(--warning)' };
  return { label: 'Perlu Perhatian', color: 'var(--error)' };
}

function generateRichAnalysis(form: PhysicalForm, score: number) {
  const filled = [
    form.heartRate, form.beepTest, form.shuttleRun, form.pushUp, form.sitUp, form.backUp, form.verticalJump,
  ].filter((v) => v !== '').length;

  if (filled === 0) {
    return {
      title: 'Menunggu data',
      summary: 'Mulai mengisi indikator fisik di bawah untuk mendapatkan analisis kondisi dan rekomendasi latihan secara real-time.',
      recommendations: [] as { area: string; text: string }[],
    };
  }

  const tier = getScoreTier(score);
  const recs: { area: string; text: string }[] = [];

  if (form.heartRate) {
    const hr = Number(form.heartRate);
    if (hr > 90) {
      recs.push({ area: 'Denyut Nadi', text: 'Denyut nadi istirahat tinggi — tingkatkan latihan kardio intensitas rendah dan pastikan pemulihan optimal antar sesi.' });
    } else if (hr < 55) {
      recs.push({ area: 'Denyut Nadi', text: 'Denyut nadi istirahat rendah menandakan efisiensi jantung baik. Pertahankan dengan latihan aerobik konsisten.' });
    } else {
      recs.push({ area: 'Denyut Nadi', text: 'Denyut nadi dalam zona ideal. Pertahankan ritme latihan saat ini dan pantau secara berkala.' });
    }
  }

  if (form.beepTest) {
    const bt = Number(form.beepTest);
    if (bt >= 12) {
      recs.push({ area: 'Daya Tahan Aerobik', text: 'Kapasitas aerobik sangat baik. Siap untuk latihan intensitas tinggi dengan interval pendek.' });
    } else if (bt >= 9) {
      recs.push({ area: 'Daya Tahan Aerobik', text: 'Kapasitas aerobik cukup baik. Tambahkan 1-2 sesi lari interval 30:30 per minggu untuk meningkatkan VO2max.' });
    } else {
      recs.push({ area: 'Daya Tahan Aerobik', text: 'Kapasitas aerobik perlu peningkatan. Fokus pada lari kontinu 20-30 menit, 3x per minggu sebelum latihan intens.' });
    }
  }

  if (form.shuttleRun) {
    const sr = Number(form.shuttleRun);
    if (sr <= 10) {
      recs.push({ area: 'Agilitas', text: 'Agilitas sangat baik. Pertahankan dengan drill zig-zag dan cone drill 2x per minggu.' });
    } else if (sr <= 12) {
      recs.push({ area: 'Agilitas', text: 'Agilitas cukup baik. Tambahkan latihan perubahan arah (T-drill, L-drill) untuk meningkatkan kecepatan reaksi.' });
    } else {
      recs.push({ area: 'Agilitas', text: 'Agilitas perlu peningkatan. Prioritaskan ladder drill dan latihan perubahan arah 3x per minggu.' });
    }
  }

  if (form.pushUp) {
    const pu = Number(form.pushUp);
    if (pu >= 40) {
      recs.push({ area: 'Kekuatan Otot Lengan', text: 'Kekuatan lengan sangat baik. Cocok untuk latihan blocking dan smash dengan beban tambahan.' });
    } else if (pu >= 25) {
      recs.push({ area: 'Kekuatan Otot Lengan', text: 'Kekuatan lengan cukup. Tambahkan push-up variasi (diamond, wide) dan latihan dumbbell press 2x per minggu.' });
    } else {
      recs.push({ area: 'Kekuatan Otot Lengan', text: 'Kekuatan lengan perlu peningkatan. Mulai dengan 3 set push-up 10-15 repetisi setiap sesi latihan.' });
    }
  }

  if (form.sitUp) {
    const su = Number(form.sitUp);
    if (su >= 40) {
      recs.push({ area: 'Kekuatan Otot Perut', text: 'Kekuatan inti sangat baik. Sangat mendukung stabilisasi tubuh saat melakukan teknik blocking dan landing.' });
    } else if (su >= 25) {
      recs.push({ area: 'Kekuatan Otot Perut', text: 'Kekuatan inti cukup. Tambahkan plank 30-45 detik dan Russian twist 3x per minggu.' });
    } else {
      recs.push({ area: 'Kekuatan Otot Perut', text: 'Kekuatan inti lemah. Fokus pada sit-up 3x15, plank 20 detik, dan dead bug setiap latihan.' });
    }
  }

  if (form.backUp) {
    const bu = Number(form.backUp);
    if (bu >= 35) {
      recs.push({ area: 'Kekuatan Otot Punggung', text: 'Kekuatan punggung sangat baik. Mendukung postur tubuh ideal untuk teknik servis dan smash.' });
    } else if (bu >= 20) {
      recs.push({ area: 'Kekuatan Otot Punggung', text: 'Kekuatan punggung cukup. Tambahkan back extension dan superman hold 3x per minggu.' });
    } else {
      recs.push({ area: 'Kekuatan Otot Punggung', text: 'Kekuatan punggung perlu peningkatan. Mulai dengan back-up 3x12 dan latihan bird-dog setiap sesi.' });
    }
  }

  if (form.verticalJump) {
    const vj = Number(form.verticalJump);
    if (vj >= 60) {
      recs.push({ area: 'Daya Ledak', text: 'Daya ledak sangat baik. Siap untuk latihan plyometric lanjutan seperti box jump dan depth jump.' });
    } else if (vj >= 45) {
      recs.push({ area: 'Daya Ledak', text: 'Daya ledak cukup baik. Tambahkan jump squat dan tuck jump 2x per minggu untuk meningkatkan tinggi lompatan.' });
    } else {
      recs.push({ area: 'Daya Ledak', text: 'Daya ledak perlu peningkatan. Fokus pada latihan plyometric dasar: jump squat 3x15, lunge jump 3x10.' });
    }
  }

  let title: string;
  let summary: string;
  if (score >= 85) {
    title = 'Kondisi Sangat Prima';
    summary = 'Atlet berada pada puncak kesiapan fisik. Fondasi aerobik, kekuatan, dan daya ledak semuanya berada pada level sangat baik. Aman untuk memasuki fase latihan intensitas tinggi dengan volume penuh.';
  } else if (score >= 75) {
    title = 'Kondisi Prima';
    summary = 'Atlet menunjukkan kesiapan fisik yang kuat untuk latihan intensif. Sebagian besar indikator berada pada level yang baik. Pertahankan konsistensi dan fokus pada area yang masih bisa dioptimalkan.';
  } else if (score >= 65) {
    title = 'Kondisi Cukup Siap';
    summary = 'Atlet memiliki fondasi fisik yang cukup untuk latihan normal. Beberapa area memerlukan perhatian khusus sebelum meningkatkan intensitas. Prioritaskan pemulihan dan konsistensi latihan.';
  } else if (score >= 50) {
    title = 'Kondisi Menengah';
    summary = 'Atlet memiliki fondasi fisik yang sedang berkembang. Fokus pada penguatan area yang masih lemah sebelum memasuki fase latihan kompetitif. Tingkatkan volume latihan secara bertahap.';
  } else {
    title = 'Perlu Perhatian Khusus';
    summary = 'Atlet memerlukan fokus pada pembangunan fondasi fisik dasar sebelum melanjutkan ke latihan intensitas tinggi. Konsultasikan dengan pelatih untuk program pengembangan yang terstruktur.';
  }

  return { title, summary, recommendations: recs };
}

export function PhysicalFormView({
  form,
  setForm,
  onSubmit,
  saving,
  customParams,
}: {
  form: PhysicalForm;
  setForm: React.Dispatch<React.SetStateAction<PhysicalForm>>;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
  customParams: CustomTestParam[];
}) {
  const score = scorePhysical(form);
  const update = (key: keyof PhysicalForm) => (value: string) =>
    setForm((c) => ({ ...c, [key]: value }));

  const updateCustom = (id: string, value: string) =>
    setForm((c) => ({ ...c, customValues: { ...c.customValues, [id]: value } }));

  const analysis = generateRichAnalysis(form, score);
  const tier = getScoreTier(score);

  return (
    <FormShell title="Tes Fisik Atlet" description="Catat indikator kebugaran untuk membaca kesiapan atlet secara menyeluruh." icon={<HeartPulse size={24} />}>
      <form onSubmit={onSubmit}>
        <div className="form-grid two">
          <Field label="Nama Atlet" value={form.athleteName} onChange={update('athleteName')} placeholder="Contoh: Budi Santoso" />
          <label className="field">
            <span>Kelompok Tim</span>
            <select value={form.teamGroup} onChange={(e) => update('teamGroup')(e.target.value)}>
              <option>Tim A</option><option>Tim B</option><option>Putra</option><option>Putri</option><option>Umum</option>
            </select>
          </label>
          <Field label="Tanggal Tes" type="date" value={form.date} onChange={update('date')} />
        </div>

        <div className="form-divider">
          <span>INDIKATOR KONDISI FISIK</span>
          <small>Masukkan hasil pengukuran terakhir</small>
        </div>

        <div className="form-grid three">
          <Field label="Denyut Nadi" value={form.heartRate} onChange={update('heartRate')} type="number" suffix="bpm" />
          <Field label="Beep Test" value={form.beepTest} onChange={update('beepTest')} type="number" suffix="level" />
          <Field label="Shuttle Run Angka 8" value={form.shuttleRun} onChange={update('shuttleRun')} type="number" suffix="detik" />
          <Field label="Push Up" value={form.pushUp} onChange={update('pushUp')} type="number" suffix="repetisi" />
          <Field label="Sit Up" value={form.sitUp} onChange={update('sitUp')} type="number" suffix="repetisi" />
          <Field label="Back Up" value={form.backUp} onChange={update('backUp')} type="number" suffix="repetisi" />
          <Field label="Vertical Jump" value={form.verticalJump} onChange={update('verticalJump')} type="number" suffix="cm" />
        </div>

        {customParams.length > 0 && (
          <>
            <div className="form-divider">
              <span>PARAMETER TAMBAHAN</span>
              <small>Ditambahkan oleh pelatih</small>
            </div>
            <div className="form-grid three">
              {customParams.map((param) => (
                <Field
                  key={param.id}
                  label={param.name}
                  value={form.customValues[param.id] ?? ''}
                  onChange={(v) => updateCustom(param.id, v)}
                  type="number"
                  suffix={param.unit}
                />
              ))}
            </div>
          </>
        )}

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

function AthleteSelector({
  value,
  onChange,
  athleteNames,
}: {
  value: string;
  onChange: (value: string) => void;
  athleteNames: string[];
}) {
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
      <span>Nama Atlet / Tim</span>
      <div className="athlete-input-wrap">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Ketik atau pilih atlet"
          required
        />
        {open && filtered.length > 0 && (
          <div className="athlete-dropdown">
            {filtered.map((name) => (
              <button
                key={name}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(name); }}
                className={`athlete-option ${value === name ? 'selected' : ''}`}
              >
                <Users size={14} />
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function MatchFormView({
  form,
  setForm,
  onSubmit,
  saving,
  athleteNames,
}: {
  form: MatchForm;
  setForm: React.Dispatch<React.SetStateAction<MatchForm>>;
  onSubmit: (event: FormEvent) => void;
  saving: boolean;
  athleteNames: string[];
}) {
  const score = scoreMatch(form);

  const updateMetric = (label: string, key: keyof TechnicalMetric, value: string) =>
    setForm((c) => ({
      ...c,
      metrics: {
        ...c.metrics,
        [label]: { ...c.metrics[label], [key]: Math.max(0, Number(value)) },
      },
    }));

  return (
    <FormShell title="Statistik Pertandingan" description="Ukur efektivitas teknik dan petakan arah landing smash dalam satu tampilan." icon={<BarChart3 size={24} />}>
      <form onSubmit={onSubmit}>
        <div className="form-grid three">
          <AthleteSelector
            value={form.athleteName}
            onChange={(v) => setForm((c) => ({ ...c, athleteName: v }))}
            athleteNames={athleteNames}
          />
          <label className="field">
            <span>Kelompok Tim</span>
            <select value={form.teamGroup} onChange={(e) => setForm((c) => ({ ...c, teamGroup: e.target.value }))}>
              <option>Tim A</option><option>Tim B</option><option>Putra</option><option>Putri</option><option>Umum</option>
            </select>
          </label>
          <Field label="Tanggal Pertandingan" type="date" value={form.date} onChange={(v) => setForm((c) => ({ ...c, date: v }))} />
        </div>

        <div className="form-divider">
          <span>STATISTIK TEKNIS</span>
          <small>Masukkan jumlah sukses dan error</small>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Teknik</th><th>Berhasil</th><th>Error</th><th>Efektivitas</th></tr>
            </thead>
            <tbody>
              {metricLabels.map((label) => {
                const metric = form.metrics[label];
                const total = metric.success + metric.error;
                return (
                  <tr key={label}>
                    <td><strong>{label}</strong></td>
                    <td><input type="number" min="0" value={metric.success} onChange={(e) => updateMetric(label, 'success', e.target.value)} /></td>
                    <td><input type="number" min="0" value={metric.error} onChange={(e) => updateMetric(label, 'error', e.target.value)} /></td>
                    <td><span className={`efficiency ${total && metric.success / total >= 0.7 ? 'high' : ''}`}>{total ? `${Math.round((metric.success / total) * 100)}%` : '—'}</span></td>
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
            <p>Skor dihitung dari rasio keberhasilan seluruh teknik yang dicatat.</p>
          </div>
        </div>

        <div className="form-footer">
          <span><ShieldCheck size={16} /> Data pertandingan siap dianalisis</span>
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
          {([['all', 'Semua'], ['physical', 'Tes Fisik'], ['match', 'Pertandingan']] as const).map(([id, label]) => (
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
              <p>{report.team_group} <span>·</span> {report.report_type === 'physical' ? 'Tes Fisik' : 'Pertandingan'}</p>
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
