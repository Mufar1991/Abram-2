import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Moon, ShieldCheck, Sun, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  initialMatch,
  initialPhysical,
  matchAnalysis,
  physicalAnalysis,
  scoreMatch,
  scorePhysical,
  simpleHash,
  exportToExcel,
  today,
} from '@/lib/utils';
import type {
  AdminTab,
  CoachSettings,
  CustomTestParam,
  MatchForm,
  PhysicalForm,
  Report,
  Tab,
  ViewMode,
} from '@/lib/types';
import { Sidebar, FloatingNav, MobileMenuButton } from '@/components/Navigation';
import { Dashboard, PhysicalFormView, MatchFormView, ArchiveView } from '@/components/StudentViews';
import { AdminDashboard, ApprovalQueue, ManageView, SettingsView } from '@/components/AdminViews';
import { PinModal, ReportDetail, EditModal } from '@/components/Modals';

const cacheKey = 'abram-volleyball-reports';
const themeKey = 'abram-volleyball-theme';

function readCache(): Report[] {
  try {
    return JSON.parse(localStorage.getItem(cacheKey) ?? '[]') as Report[];
  } catch {
    return [];
  }
}

function writeCache(reports: Report[]): void {
  localStorage.setItem(cacheKey, JSON.stringify(reports));
}

function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem(themeKey) as 'dark' | 'light') || 'dark'
  );
  const [viewMode, setViewMode] = useState<ViewMode>('student');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [adminTab, setAdminTab] = useState<AdminTab>('admin-dashboard');
  const [reports, setReports] = useState<Report[]>([]);
  const [settings, setSettings] = useState<CoachSettings | null>(null);
  const [physical, setPhysical] = useState<PhysicalForm>(initialPhysical);
  const [match, setMatch] = useState<MatchForm>(initialMatch);
  const [selected, setSelected] = useState<Report | null>(null);
  const [editReport, setEditReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(themeKey, theme);
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#060b1f' : '#f0f4f8');
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [{ data: reportData, error: reportError }, { data: settingsData }] = await Promise.all([
        supabase.from('volleyball_reports').select('*').order('report_date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('coach_settings').select('*').maybeSingle(),
      ]);

      if (!mounted) return;

      if (reportError || !reportData) {
        setReports(readCache());
      } else {
        setReports(reportData as Report[]);
        writeCache(reportData as Report[]);
      }

      setSettings(settingsData as CoachSettings | null);
      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  const pendingCount = useMemo(
    () => reports.filter((r) => r.status === 'pending').length,
    [reports]
  );
  const approvedReports = useMemo(
    () => reports.filter((r) => r.status === 'approved'),
    [reports]
  );
  const averageScore = approvedReports.length
    ? Math.round(approvedReports.reduce((s, r) => s + (r.readiness_score ?? 0), 0) / approvedReports.length)
    : 0;

  const customParams: CustomTestParam[] = settings?.custom_params ?? [];
  const coachName = settings?.coach_name ?? 'Muhammad Farid, S.Pd.';
  const athleteNames = useMemo(
    () => Array.from(new Set(reports.map((r) => r.athlete_name))).sort(),
    [reports]
  );

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  const saveReport = async (report: Omit<Report, 'id' | 'created_at'>) => {
    setSaving(true);
    setNotice('');
    const { data, error } = await supabase.from('volleyball_reports').insert(report).select().maybeSingle();
    const localReport: Report = { ...report, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    if (error || !data) {
      const next = [localReport, ...reports];
      setReports(next);
      writeCache(next);
      showNotice('Tersimpan di perangkat. Arsip bersama akan tersinkron saat koneksi tersedia.');
    } else {
      const next = [data as Report, ...reports];
      setReports(next);
      writeCache(next);
      showNotice('Laporan berhasil masuk ke arsip. Menunggu persetujuan pelatih.');
    }
    setSaving(false);
    setTab('archive');
  };

  const submitPhysical = async (event: FormEvent) => {
    event.preventDefault();
    if (!physical.athleteName.trim() || !physical.date) return;
    const score = scorePhysical(physical);
    await saveReport({
      report_type: 'physical',
      athlete_name: physical.athleteName.trim(),
      team_group: physical.teamGroup,
      report_date: physical.date,
      readiness_score: score,
      status: 'pending',
      coach_notes: '',
      payload: { ...physical, analysis: physicalAnalysis(score), score },
    });
    setPhysical({ ...initialPhysical, customValues: {} });
  };

  const submitMatch = async (event: FormEvent) => {
    event.preventDefault();
    if (!match.athleteName.trim() || !match.date) return;
    const score = scoreMatch(match);
    await saveReport({
      report_type: 'match',
      athlete_name: match.athleteName.trim(),
      team_group: match.teamGroup,
      report_date: match.date,
      readiness_score: score,
      status: 'pending',
      coach_notes: '',
      payload: { ...match, analysis: matchAnalysis(score), score },
    });
    setMatch(initialMatch);
  };

  const updateReportStatus = async (id: string, status: Report['status']) => {
    const { error } = await supabase.from('volleyball_reports').update({ status }).eq('id', id);
    if (!error) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } else {
      setReports((prev) => {
        const next = prev.map((r) => (r.id === id ? { ...r, status } : r));
        writeCache(next);
        return next;
      });
    }
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase.from('volleyball_reports').delete().eq('id', id);
    if (!error) {
      setReports((prev) => {
        const next = prev.filter((r) => r.id !== id);
        writeCache(next);
        return next;
      });
    }
  };

  const updateReport = async (report: Report) => {
    const { error } = await supabase
      .from('volleyball_reports')
      .update({
        athlete_name: report.athlete_name,
        team_group: report.team_group,
        report_date: report.report_date,
        readiness_score: report.readiness_score,
        status: report.status,
        coach_notes: report.coach_notes,
      })
      .eq('id', report.id);
    if (!error) {
      setReports((prev) => prev.map((r) => (r.id === report.id ? report : r)));
    } else {
      setReports((prev) => {
        const next = prev.map((r) => (r.id === report.id ? report : r));
        writeCache(next);
        return next;
      });
    }
    setEditReport(null);
    showNotice('Laporan berhasil diperbarui.');
  };

  const updateCoachNotes = async (id: string, notes: string) => {
    const { error } = await supabase.from('volleyball_reports').update({ coach_notes: notes }).eq('id', id);
    if (!error) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, coach_notes: notes } : r)));
    }
  };

  const saveSettings = async (coachNameVal: string, pin: string, params: CustomTestParam[]) => {
    const updateData: Record<string, unknown> = {
      coach_name: coachNameVal,
      custom_params: params,
      updated_at: new Date().toISOString(),
    };
    if (pin) updateData.pin_hash = simpleHash(pin);

    const { data, error } = await supabase.from('coach_settings').update(updateData).eq('id', settings?.id).select().maybeSingle();
    if (!error && data) {
      setSettings(data as CoachSettings);
    } else {
      setSettings((prev) => prev
        ? { ...prev, coach_name: coachNameVal, custom_params: params, pin_hash: pin ? simpleHash(pin) : prev.pin_hash }
        : prev
      );
    }
  };

  const handlePinSubmit = (pin: string) => {
    const storedHash = settings?.pin_hash || simpleHash('1234');
    if (simpleHash(pin) === storedHash) {
      setViewMode('admin');
      setAdminTab('admin-dashboard');
      setPinModal(false);
      setPinError('');
    } else {
      setPinError('PIN salah. Coba lagi.');
    }
  };

  const exitAdmin = () => {
    setViewMode('student');
    setTab('dashboard');
  };

  const handleExport = () => {
    exportToExcel(reports, `ABRAM_laporan_${today}.csv`);
  };

  const handleFooterDoubleClick = () => {
    if (viewMode === 'student') setPinModal(true);
  };

  const navigateStudent = (newTab: Tab) => {
    if (viewMode === 'admin') setViewMode('student');
    setTab(newTab);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <Sidebar
        tab={tab}
        viewMode={viewMode}
        adminTab={adminTab}
        pendingCount={pendingCount}
        reportCount={reports.length}
        theme={theme}
        mobileNav={mobileNav}
        onNavigate={navigateStudent}
        onNavigateAdmin={setAdminTab}
        onToggleTheme={toggleTheme}
        onCloseMobile={() => setMobileNav(false)}
        onExitAdmin={exitAdmin}
      />
      {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Tutup menu" />}

      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-bg" />
          <MobileMenuButton onClick={() => setMobileNav(true)} />
          <div>
            <p className="top-kicker">Performance intelligence / 2026</p>
            <h1>
              {viewMode === 'admin'
                ? adminTab === 'admin-dashboard' ? 'Dashboard Pelatih'
                  : adminTab === 'admin-approval' ? 'Antrian Persetujuan'
                  : adminTab === 'admin-manage' ? 'Kelola Laporan'
                  : 'Pengaturan'
                : tab === 'dashboard' ? 'Ringkasan'
                : tab === 'physical' ? 'Tes Fisik'
                : tab === 'match' ? 'Statistik Pertandingan'
                : 'Riwayat Laporan'}
            </h1>
          </div>
          <div className="top-actions">
            <div className="live-indicator"><span /> Sistem aktif</div>
            <button className="theme-btn" onClick={toggleTheme} aria-label="Ganti tema">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>

        {notice && (
          <div className="notice">
            <ShieldCheck size={17} />{notice}
            <button onClick={() => setNotice('')}><X size={15} /></button>
          </div>
        )}

        {viewMode === 'student' && (
          <>
            {tab === 'dashboard' && (
              <Dashboard
                reports={reports}
                averageScore={averageScore}
                onNavigate={(t) => setTab(t)}
                onSelect={setSelected}
                loading={loading}
              />
            )}
            {tab === 'physical' && (
              <PhysicalFormView
                form={physical}
                setForm={setPhysical}
                onSubmit={submitPhysical}
                saving={saving}
                customParams={customParams}
              />
            )}
            {tab === 'match' && (
              <MatchFormView
                form={match}
                setForm={setMatch}
                onSubmit={submitMatch}
                saving={saving}
                athleteNames={athleteNames}
              />
            )}
            {tab === 'archive' && (
              <ArchiveView
                reports={reports}
                loading={loading}
                onSelect={setSelected}
              />
            )}
          </>
        )}

        {viewMode === 'admin' && (
          <>
            {adminTab === 'admin-dashboard' && <AdminDashboard reports={reports} onExport={handleExport} />}
            {adminTab === 'admin-approval' && (
              <ApprovalQueue
                reports={reports}
                onApprove={(id) => updateReportStatus(id, 'approved')}
                onReject={(id) => updateReportStatus(id, 'rejected')}
                onView={setSelected}
              />
            )}
            {adminTab === 'admin-manage' && (
              <ManageView
                reports={reports}
                onEdit={setEditReport}
                onDelete={deleteReport}
                onApprove={(id) => updateReportStatus(id, 'approved')}
                onReject={(id) => updateReportStatus(id, 'rejected')}
                onUpdateNotes={updateCoachNotes}
                onExport={handleExport}
              />
            )}
            {adminTab === 'admin-settings' && (
              <SettingsView settings={settings} onSave={saveSettings} />
            )}
          </>
        )}

        <footer className="app-footer">
          <p onDoubleClick={handleFooterDoubleClick}>
            &copy; 2026 &bull; Muhammad Farid, S.Pd. | MF Digitalisasi
          </p>
        </footer>
      </main>

      <FloatingNav
        viewMode={viewMode}
        tab={tab}
        adminTab={adminTab}
        pendingCount={pendingCount}
        onNavigate={setTab}
        onNavigateAdmin={setAdminTab}
      />

      {pinModal && (
        <PinModal
          onSubmit={handlePinSubmit}
          onClose={() => { setPinModal(false); setPinError(''); }}
          error={pinError}
        />
      )}

      {selected && (
        <ReportDetail
          report={selected}
          coachName={coachName}
          customParams={customParams}
          onClose={() => setSelected(null)}
        />
      )}

      {editReport && (
        <EditModal
          report={editReport}
          onSave={updateReport}
          onClose={() => setEditReport(null)}
        />
      )}
    </div>
  );
}

export default App;
