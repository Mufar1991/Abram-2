import { useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Check,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Pencil,
  Plus,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { CoachSettings, CustomTestParam, Report, ReportStatus } from '@/lib/types';
import { exportToExcel, formatDate } from '@/lib/utils';

export function AdminDashboard({
  reports,
  onExport,
}: {
  reports: Report[];
  onExport: () => void;
}) {
  const pending = reports.filter((r) => r.status === 'pending');
  const approved = reports.filter((r) => r.status === 'approved');
  const rejected = reports.filter((r) => r.status === 'rejected');
  const avgScore = approved.length
    ? Math.round(approved.reduce((s, r) => s + (r.readiness_score ?? 0), 0) / approved.length)
    : 0;

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

      <div className="metrics-grid">
        <AdminMetricCard icon={<Users />} label="Total Laporan" value={String(reports.length)} tone="blue" />
        <AdminMetricCard icon={<ClipboardList />} label="Menunggu Persetujuan" value={String(pending.length)} tone="gold" />
        <AdminMetricCard icon={<Check />} label="Disetujui" value={String(approved.length)} tone="green" />
        <AdminMetricCard icon={<ShieldCheck />} label="Rata-rata Skor" value={String(avgScore)} tone="red" />
      </div>

      {pending.length > 0 && (
        <>
          <div className="section-heading">
            <div>
              <span className="section-label">ANTRIAN PERSETUJUAN</span>
              <h3>{pending.length} laporan menunggu</h3>
            </div>
          </div>
          <div className="activity-list">
            {pending.slice(0, 5).map((report) => (
              <PendingRow key={report.id} report={report} />
            ))}
          </div>
        </>
      )}

      <div className="section-heading" style={{ marginTop: '28px' }}>
        <div>
          <span className="section-label">STATUS MODERASI</span>
          <h3>Distribusi laporan</h3>
        </div>
      </div>
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <AdminMetricCard icon={<ClipboardList />} label="Pending" value={String(pending.length)} tone="gold" />
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

function PendingRow({ report }: { report: Report }) {
  return (
    <div className="report-row" style={{ cursor: 'default' }}>
      <div className={`report-type-icon ${report.report_type}`}>
        {report.report_type === 'physical' ? <ShieldCheck size={18} /> : <BarChart3 size={18} />}
      </div>
      <div className="report-row-main">
        <strong>{report.athlete_name}</strong>
        <span>{report.report_type === 'physical' ? 'Tes Fisik' : 'Pertandingan'} · {report.team_group}</span>
      </div>
      <div className="report-row-date"><CalendarDays size={14} />{formatDate(report.report_date)}</div>
      <span className="status-badge pending">Pending</span>
    </div>
  );
}

export function ApprovalQueue({
  reports,
  onApprove,
  onReject,
  onView,
}: {
  reports: Report[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (report: Report) => void;
}) {
  const pending = reports.filter((r) => r.status === 'pending');

  return (
    <section className="content">
      <div className="section-heading">
        <div>
          <span className="section-label">MODERATION QUEUE</span>
          <h3>Persetujuan Data Siswa</h3>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="empty-card">
          <Check size={28} />
          <strong>Tidak ada antrian</strong>
          <span>Semua laporan siswa telah ditinjau.</span>
        </div>
      ) : (
        <div className="manage-table">
          <table>
            <thead>
              <tr>
                <th>Atlet</th><th>Jenis</th><th>Tim</th><th>Tanggal</th><th>Skor</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((report) => (
                <tr key={report.id}>
                  <td><strong>{report.athlete_name}</strong></td>
                  <td>{report.report_type === 'physical' ? 'Tes Fisik' : 'Pertandingan'}</td>
                  <td>{report.team_group}</td>
                  <td>{formatDate(report.report_date)}</td>
                  <td><span className={`score-pill ${report.readiness_score && report.readiness_score >= 75 ? 'good' : 'medium'}`}>{report.readiness_score ?? 0}</span></td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-approve" onClick={() => onApprove(report.id)}><Check size={14} />Setujui</button>
                      <button className="btn-reject" onClick={() => onReject(report.id)}><X size={14} />Tolak</button>
                      <button className="btn-edit" onClick={() => onView(report)}>Lihat</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
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
          <Download size={16} />Export Excel
        </button>
      </div>

      <div className="manage-table">
        <table>
          <thead>
            <tr>
              <th>Atlet</th><th>Jenis</th><th>Tim</th><th>Tanggal</th><th>Skor</th><th>Status</th><th>Catatan</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td><strong>{report.athlete_name}</strong></td>
                <td>{report.report_type === 'physical' ? 'Tes Fisik' : 'Pertandingan'}</td>
                <td>{report.team_group}</td>
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
                    <button className="btn-edit" onClick={() => onEdit(report)}><Pencil size={12} /></button>
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
  onSave: (coachName: string, pin: string, customParams: CustomTestParam[]) => void;
}) {
  const [coachName, setCoachName] = useState(settings?.coach_name ?? 'Muhammad Farid, S.Pd.');
  const [pin, setPin] = useState('');
  const [saved, setSaved] = useState(false);
  const [customParams, setCustomParams] = useState<CustomTestParam[]>(
    settings?.custom_params ?? []
  );
  const [newParamName, setNewParamName] = useState('');
  const [newParamUnit, setNewParamUnit] = useState('repetisi');

  const addParam = () => {
    if (!newParamName.trim()) return;
    setCustomParams((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newParamName.trim(), unit: newParamUnit },
    ]);
    setNewParamName('');
    setNewParamUnit('repetisi');
  };

  const deleteParam = (id: string) => {
    setCustomParams((prev) => prev.filter((p) => p.id !== id));
  };

  const editParam = (id: string, field: keyof CustomTestParam, value: string) => {
    setCustomParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = () => {
    onSave(coachName, pin, customParams);
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
              <input type="text" value={coachName} onChange={(e) => setCoachName(e.target.value)} placeholder="Muhammad Farid, S.Pd." />
            </div>
          </label>
        </div>
      </div>

      <div className="settings-card">
        <h3><SettingsIcon size={18} />Parameter Tes Fisik Kustom</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Tambahkan metrik tes fisik sendiri. Akan otomatis muncul di formulir siswa dan laporan PDF.
        </p>

        {customParams.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {customParams.map((param) => (
              <div key={param.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={param.name}
                  onChange={(e) => editParam(param.id, 'name', e.target.value)}
                  placeholder="Nama tes"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '14px' }}
                />
                <select
                  value={param.unit}
                  onChange={(e) => editParam(param.id, 'unit', e.target.value)}
                  style={{ width: '120px', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '14px' }}
                >
                  <option value="repetisi">repetisi</option>
                  <option value="cm">cm</option>
                  <option value="detik">detik</option>
                  <option value="level">level</option>
                  <option value="bpm">bpm</option>
                  <option value="skor">skor</option>
                </select>
                <button className="btn-delete" onClick={() => deleteParam(param.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="form-divider" style={{ margin: '12px 0' }}><span /><small>Tambah parameter baru</small><span /></div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <label className="field" style={{ flex: 1 }}>
            <span>Nama Tes</span>
            <div className="input-wrap">
              <input type="text" value={newParamName} onChange={(e) => setNewParamName(e.target.value)} placeholder="Contoh: Agility Run" />
            </div>
          </label>
          <label className="field" style={{ width: '140px' }}>
            <span>Satuan</span>
            <select value={newParamUnit} onChange={(e) => setNewParamUnit(e.target.value)}>
              <option value="repetisi">repetisi</option>
              <option value="cm">cm</option>
              <option value="detik">detik</option>
              <option value="level">level</option>
              <option value="bpm">bpm</option>
              <option value="skor">skor</option>
            </select>
          </label>
          <button className="secondary-btn" onClick={addParam} type="button"><Plus size={16} />Tambah</button>
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
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••••" maxLength={10} />
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
