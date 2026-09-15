import { useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Check,
  Clock3,
  Download,
  HeartPulse,
  Printer,
  ShieldCheck,
  Target,
  Users,
  X,
} from 'lucide-react';
import type { CustomTestParam, Report, ReportStatus, TechnicalMetric } from '@/lib/types';
import {
  displayPayload,
  formatDate,
  getCustomValuesFromPayload,
  getMetricsFromPayload,
  getZonesFromPayload,
  metricLabels,
} from '@/lib/utils';

export function PinModal({
  onSubmit,
  onClose,
  error,
}: {
  onSubmit: (pin: string) => void;
  onClose: () => void;
  error: string;
}) {
  const [pin, setPin] = useState('');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="pin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pin-logo">
          <img src="/ABRAM.png" alt="ABRAM" />
        </div>
        <h2>Akses Mode Pelatih</h2>
        <p>Masukkan PIN untuk mengakses dashboard dan alat manajemen.</p>
        <input
          className="pin-input"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(pin); }}
          placeholder="••••••"
          maxLength={10}
          autoFocus
        />
        {error && <p className="pin-error">{error}</p>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className="secondary-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Batal</button>
          <button className="primary-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onSubmit(pin)}>Masuk</button>
        </div>
        <p className="pin-hint">Default: 1234 — Ubah di Pengaturan setelah masuk.</p>
      </div>
    </div>
  );
}

export function ReportDetail({
  report,
  coachName,
  customParams,
  onClose,
}: {
  report: Report;
  coachName: string;
  customParams: CustomTestParam[];
  onClose: () => void;
}) {
  const payload = report.payload;
  const metrics = getMetricsFromPayload(payload);
  const zones = getZonesFromPayload(payload);
  const customValues = getCustomValuesFromPayload(payload);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <article className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-head">
          <div className="report-brand">
            <img src="/ABRAM.png" alt="ABRAM" />
            <div>
              <strong>ABRAM</strong>
              <span>Volleyball Performance Lab</span>
            </div>
          </div>
          <div className="modal-actions">
            <button onClick={() => window.print()} title="Cetak laporan"><Printer size={18} /></button>
            <button onClick={onClose} title="Tutup"><X size={19} /></button>
          </div>
        </div>

        <div className="print-report">
          <div className="report-kicker">
            {report.report_type === 'physical' ? 'PHYSICAL ASSESSMENT' : 'MATCH PERFORMANCE REPORT'}
          </div>
          <h2>{report.athlete_name}</h2>
          <div className="report-meta">
            <span><Users size={14} />{report.team_group}</span>
            <span><CalendarDays size={14} />{formatDate(report.report_date)}</span>
            <span><Clock3 size={14} />Laporan publik</span>
          </div>

          <div className="report-score-banner">
            <div>
              <span>PERFORMANCE SCORE</span>
              <strong>{report.readiness_score ?? 0}<small>/ 100</small></strong>
            </div>
            <div className="score-banner-note">
              <ShieldCheck size={17} />{displayPayload(payload, 'analysis')}
            </div>
          </div>

          {report.report_type === 'physical' ? (
            <div className="detail-section">
              <h3><HeartPulse size={18} />Breakdown tes fisik</h3>
              <div className="detail-grid">
                {([
                  ['Denyut Nadi', 'heartRate', 'bpm'],
                  ['Beep Test', 'beepTest', 'level'],
                  ['Shuttle Run Angka 8', 'shuttleRun', 'detik'],
                  ['Push Up', 'pushUp', 'repetisi'],
                  ['Sit Up', 'sitUp', 'repetisi'],
                  ['Back Up', 'backUp', 'repetisi'],
                  ['Vertical Jump', 'verticalJump', 'cm'],
                ] as const).map(([label, key, unit]) => (
                  <div key={key}>
                    <span>{label}</span>
                    <strong>{displayPayload(payload, key)} <small>{unit}</small></strong>
                  </div>
                ))}
              </div>

              {customParams.length > 0 && (
                <>
                  <h3 style={{ marginTop: '20px' }}><HeartPulse size={18} />Parameter tambahan</h3>
                  <div className="detail-grid">
                    {customParams.map((param) => (
                      <div key={param.id}>
                        <span>{param.name}</span>
                        <strong>{customValues[param.id] ?? '—'} <small>{param.unit}</small></strong>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="detail-section">
              <h3><BarChart3 size={18} />Breakdown statistik teknik</h3>
              <div className="detail-grid">
                {metricLabels.map((label) => {
                  const metric = metrics[label] ?? { success: 0, error: 0 };
                  return (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{metric.success} <small>berhasil</small> / {metric.error} <small>error</small></strong>
                    </div>
                  );
                })}
              </div>
              <h3 className="zone-detail-title"><Target size={18} />Zona landing smash</h3>
              <div className="selected-zones">
                {zones.length ? zones.map((zone) => <span key={zone}>Zona {zone}</span>) : <span>Belum ada zona yang dipilih</span>}
              </div>
            </div>
          )}

          {report.coach_notes && (
            <div className="detail-section">
              <h3><ShieldCheck size={18} />Catatan Pelatih</h3>
              <div className="coach-notes-box">
                <p>{report.coach_notes}</p>
              </div>
            </div>
          )}

          <div className="report-signature">
            <img src="/ABRAM.png" alt="ABRAM" />
            <div>
              <span>Dievaluasi & Disahkan oleh</span>
              <strong>{coachName}</strong>
            </div>
          </div>

          <div className="report-footer">
            <img src="/ABRAM.png" alt="ABRAM" />
            <span>Analisis Tes & Pertandingan Bola Voli<br /><strong>{coachName}</strong></span>
            <button onClick={() => window.print()}><Download size={15} />Cetak / Simpan PDF</button>
          </div>
        </div>
      </article>
    </div>
  );
}

export function EditModal({
  report,
  onSave,
  onClose,
}: {
  report: Report;
  onSave: (report: Report) => void;
  onClose: () => void;
}) {
  const [athleteName, setAthleteName] = useState(report.athlete_name);
  const [teamGroup, setTeamGroup] = useState(report.team_group);
  const [reportDate, setReportDate] = useState(report.report_date);
  const [score, setScore] = useState(String(report.readiness_score ?? 0));
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [coachNotes, setCoachNotes] = useState(report.coach_notes ?? '');

  const handleSave = () => {
    onSave({
      ...report,
      athlete_name: athleteName,
      team_group: teamGroup,
      report_date: reportDate,
      readiness_score: Number(score),
      status,
      coach_notes: coachNotes,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="report-modal-head">
          <div className="report-brand">
            <strong>Edit Laporan</strong>
          </div>
          <div className="modal-actions">
            <button onClick={onClose}><X size={19} /></button>
          </div>
        </div>

        <div style={{ padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label className="field">
            <span>Nama Atlet</span>
            <div className="input-wrap">
              <input type="text" value={athleteName} onChange={(e) => setAthleteName(e.target.value)} />
            </div>
          </label>

          <div className="form-grid two">
            <label className="field">
              <span>Kelompok Tim</span>
              <select value={teamGroup} onChange={(e) => setTeamGroup(e.target.value)}>
                <option>Tim A</option><option>Tim B</option><option>Putra</option><option>Putri</option><option>Umum</option>
              </select>
            </label>
            <label className="field">
              <span>Tanggal</span>
              <div className="input-wrap">
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
              </div>
            </label>
          </div>

          <div className="form-grid two">
            <label className="field">
              <span>Skor (0-100)</span>
              <div className="input-wrap">
                <input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} />
              </div>
            </label>
            <label className="field">
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as ReportStatus)}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Catatan Pelatih</span>
            <textarea value={coachNotes} onChange={(e) => setCoachNotes(e.target.value)} placeholder="Tambahkan catatan evaluasi untuk atlet ini..." />
          </label>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button className="secondary-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Batal</button>
            <button className="primary-btn" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave}>
              <Check size={17} />Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
