import { useState } from 'react';
import {
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
import type { CustomTestParam, Report, TechnicalMetric } from '@/lib/types';
import {
  formatDate,
  getCustomValuesFromPayload,
  getMetricsFromPayload,
  getZonesFromPayload,
  getAnalysisFromPayload,
  metricLabels,
  triggerPrint,
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
        <div className="pin-head">
          <div className="pin-icon"><ShieldCheck size={22} /></div>
          <div>
            <h3>Akses Mode Pelatih</h3>
            <p>Masukkan PIN untuk masuk ke panel kontrol admin.</p>
          </div>
          <button onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(pin); }}>
          <div className="input-wrap">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Masukkan PIN (default: 1234)"
              maxLength={10}
              autoFocus
              required
              autoComplete="current-password"
              name="admin_access_pin"
            />
          </div>
          {error && <span className="pin-error">{error}</span>}
          <button className="primary-btn" type="submit">Masuk Admin</button>
        </form>
      </div>
    </div>
  );
}

export function ReportDetail({
  report,
  coachName,
  customParams,
  techniqueTargets,
  onClose,
}: {
  report: Report;
  coachName: string;
  customParams: CustomTestParam[];
  techniqueTargets: Record<string, number>;
  onClose: () => void;
}) {
  const isPhysical = report.report_type === 'physical';
  const analysis = getAnalysisFromPayload(report.payload);
  const customValues = getCustomValuesFromPayload(report.payload);
  const metrics = getMetricsFromPayload(report.payload);
  const zones = getZonesFromPayload(report.payload);

  const handlePrint = () => {
    triggerPrint(`Laporan_${report.report_type}_${report.athlete_name.replace(/\s+/g, '_')}`);
  };

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
            <button onClick={handlePrint} title="Cetak laporan"><Printer size={18} /></button>
            <button onClick={onClose} title="Tutup"><X size={19} /></button>
          </div>
        </div>

        <div className="print-report">
          <div className="report-kicker">
            {isPhysical ? 'PHYSICAL ASSESSMENT REPORT' : 'MATCH STATISTICS REPORT'}
          </div>
          <h2>{isPhysical ? 'Laporan Tes Fisik Atlet' : 'Laporan Statistik Perindividu'}</h2>
          <div className="report-meta">
            <span><Users size={14} />{report.athlete_name}</span>
            <span><CalendarDays size={14} />{report.report_date ? formatDate(report.report_date) : '—'}</span>
            <span><Clock3 size={14} />{report.status === 'approved' ? 'Disetujui' : 'Pending'}</span>
          </div>

          <div className="report-score-banner">
            <div>
              <span>SKOR KINERJA</span>
              <strong>{report.readiness_score ?? 0}<small>/ 100</small></strong>
            </div>
            {analysis && (
              <div className="score-banner-note">
                <ShieldCheck size={17} />
                <div>
                  <strong>{analysis.title}</strong>
                  <p>{analysis.summary}</p>
                </div>
              </div>
            )}
          </div>

          {isPhysical ? (
            <div className="detail-section">
              <h3><HeartPulse size={18} />Parameter Tes Fisik</h3>
              <div className="detail-grid" style={{ marginTop: '12px' }}>
                {customParams.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Tidak ada parameter tes fisik yang aktif.</p>
                ) : (
                  customParams.map((param) => {
                    // Ambil nilai dari customValues atau payload langsung jika itu properti bawaan lama
                    const val = customValues[param.id] ?? (report.payload as Record<string, unknown>)[param.id] ?? '—';
                    return (
                      <div key={param.id}>
                        <span>{param.name}</span>
                        <strong>{String(val)} <small>{param.unit}</small></strong>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="detail-section">
              <h3><Target size={18} />Statistik Teknis Perindividu</h3>
              <div className="manage-table" style={{ marginTop: '12px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Teknik</th>
                      <th>Berhasil (Target)</th>
                      <th>Error</th>
                      <th>Efektivitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricLabels.map((label) => {
                      const metric = metrics[label] ?? { success: 0, error: 0 };
                      const target = techniqueTargets[label] || 10;
                      const success = metric.success > 0 ? metric.success : target;
                      const error = metric.error || 0;
                      const effectiveness = success > 0 ? Math.max(0, Math.min(100, ((success - error) / success) * 100)) : 0;
                      return (
                        <tr key={label}>
                          <td><strong>{label}</strong></td>
                          <td>{success} <small>(target: {target})</small></td>
                          <td>{error}</td>
                          <td><span className={`score-pill ${effectiveness >= 75 ? 'good' : 'medium'}`}>{Math.round(effectiveness)}%</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {zones.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Zona Landing Smash Terpilih</span>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {zones.map((z) => (
                      <span key={z} style={{ padding: '6px 12px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontSize: '13px', fontWeight: 600 }}>
                        Zona {z}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {analysis && analysis.recommendations.length > 0 && (
            <div className="detail-section">
              <h3><Target size={18} />Rekomendasi Latihan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                {analysis.recommendations.map((rec, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: 'var(--accent)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{rec.area}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{rec.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.coach_notes && (
            <div className="detail-section">
              <h3><ShieldCheck size={18} />Catatan Pelatih</h3>
              <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)', padding: '12px 16px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                {report.coach_notes}
              </p>
            </div>
          )}

          <div className="report-signature">
            <div>
              <span>Dievaluasi & Disahkan oleh</span>
              <strong>{coachName}</strong>
            </div>
          </div>

          <div className="report-footer">
            <img src="/ABRAM.png" alt="ABRAM" />
            <span>Analisis Performa Bola Voli<br /><strong>{coachName}</strong></span>
            <button onClick={handlePrint}><Download size={15} />Cetak / Simpan PDF</button>
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
  const [teamGroup, setTeamGroup] = useState(report.team_group ?? '');
  const [reportDate, setReportDate] = useState(report.report_date);
  const [score, setScore] = useState(String(report.readiness_score ?? 0));
  const [status, setStatus] = useState(report.status);
  const [notes, setNotes] = useState(report.coach_notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...report,
      athlete_name: athleteName.trim(),
      team_group: teamGroup.trim(),
      report_date: reportDate,
      readiness_score: Number(score),
      status,
      coach_notes: notes.trim(),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="pin-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div className="pin-head">
          <div className="pin-icon"><Check size={22} /></div>
          <div>
            <h3>Edit Laporan Atlet</h3>
            <p>Perbarui informasi atau skor laporan atlet.</p>
          </div>
          <button onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
          <label className="field">
            <span>Nama Atlet</span>
            <div className="input-wrap">
              <input type="text" value={athleteName} onChange={(e) => setAthleteName(e.target.value)} required autoComplete="off" name="edit_athlete_name" />
            </div>
          </label>
          <div className="form-grid two" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="field">
              <span>Tanggal Laporan</span>
              <div className="input-wrap">
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required name="edit_report_date" />
              </div>
            </label>
            <label className="field">
              <span>Skor Kinerja</span>
              <div className="input-wrap">
                <input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)} required name="edit_score" />
              </div>
            </label>
          </div>
          <div className="form-grid two" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <label className="field">
              <span>Status</span>
              <div className="input-wrap">
                <select value={status} onChange={(e) => setStatus(e.target.value as Report['status'])} name="edit_status" style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '8px' }}>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </label>
            <label className="field">
              <span>Catatan Pelatih</span>
              <div className="input-wrap">
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} autoComplete="off" name="edit_coach_notes" />
              </div>
            </label>
          </div>
          <button className="primary-btn" type="submit" style={{ marginTop: '10px' }}><Check size={16} />Simpan Perubahan</button>
        </form>
      </div>
    </div>
  );
}