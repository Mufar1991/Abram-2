import {
  BarChart3,
  ClipboardList,
  HeartPulse,
  History,
  LayoutDashboard,
  Menu,
  Moon,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import type { AdminTab, Tab, ViewMode } from '@/lib/types';

type StudentNavConfig = {
  id: Tab;
  label: string;
  icon: typeof LayoutDashboard;
};

const studentNav: StudentNavConfig[] = [
  { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'physical', label: 'Tes Fisik', icon: HeartPulse },
  { id: 'match', label: 'Statistik Perindividu', icon: BarChart3 },
  { id: 'archive', label: 'Riwayat Laporan', icon: History },
];

type AdminNavConfig = {
  id: AdminTab;
  label: string;
  icon: typeof LayoutDashboard;
};

const adminNav: AdminNavConfig[] = [
  { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'admin-analysis', label: 'Analisis Data Atlet', icon: ClipboardList },
  { id: 'admin-manage', label: 'Kelola Laporan', icon: BarChart3 },
  { id: 'admin-settings', label: 'Pengaturan', icon: SettingsIcon },
];

type SidebarProps = {
  tab: Tab;
  viewMode: ViewMode;
  adminTab: AdminTab;
  pendingCount: number;
  reportCount: number;
  theme: 'dark' | 'light';
  mobileNav: boolean;
  onNavigate: (tab: Tab) => void;
  onNavigateAdmin: (tab: AdminTab) => void;
  onToggleTheme: () => void;
  onCloseMobile: () => void;
  onExitAdmin: () => void;
};

export function Sidebar({
  tab,
  viewMode,
  adminTab,
  pendingCount,
  reportCount,
  theme,
  mobileNav,
  onNavigate,
  onNavigateAdmin,
  onToggleTheme,
  onCloseMobile,
  onExitAdmin,
}: SidebarProps) {
  const isAdmin = viewMode === 'admin';

  return (
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <img src="/ABRAM.png" alt="ABRAM" />
        </div>
        <div>
          <p className="brand-name">ABRAM</p>
        </div>
        <button className="mobile-close" onClick={onCloseMobile} aria-label="Tutup menu">
          <X size={20} />
        </button>
      </div>

      <div className="lab-title">
        <span>VOLLEYBALL</span>
        <strong>PERFORMANCE LAB</strong>
      </div>

      {isAdmin && (
        <div className="admin-banner" style={{ marginBottom: '12px' }}>
          <ShieldCheck size={16} />
          <span>Mode Pelatih</span>
          <button className="text-btn" onClick={onExitAdmin} style={{ color: 'inherit' }}>
            Keluar
          </button>
        </div>
      )}

      <nav className="nav-list">
        {isAdmin
          ? adminNav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onNavigateAdmin(id)}
                className={`nav-item ${adminTab === id ? 'active' : ''}`}
              >
                <Icon size={19} />
                <span>{label}</span>
                {id === 'admin-analysis' && pendingCount > 0 && (
                  <span className="nav-badge">{pendingCount}</span>
                )}
              </button>
            ))
          : studentNav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`nav-item ${tab === id ? 'active' : ''}`}
              >
                <Icon size={19} />
                <span>{label}</span>
                {id === 'archive' && reportCount > 0 && <small>{reportCount}</small>}
              </button>
            ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="theme-toggle-side" onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        </button>
        <div className="pro-card">
          <ShieldCheck size={18} />
          <div>
            <strong>Analisis lebih tajam</strong>
            <span>Data berbicara untuk progres atlet.</span>
          </div>
        </div>
        <p className="sidebar-credit">
          Dikembangkan oleh<br />
          <strong>Aldo Bramudyo, S.Pd.<br />Muhammad Farid, S.Pd.</strong>
        </p>
      </div>
    </aside>
  );
}

type MobileMenuButtonProps = {
  onClick: () => void;
};

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button className="mobile-menu-btn" onClick={onClick} aria-label="Buka menu">
      <Menu size={20} />
    </button>
  );
}

type FloatingNavProps = {
  viewMode: ViewMode;
  tab: Tab;
  adminTab: AdminTab;
  pendingCount: number;
  onNavigate: (tab: Tab) => void;
  onNavigateAdmin: (tab: AdminTab) => void;
};

export function FloatingNav({ viewMode, tab, adminTab, pendingCount, onNavigate, onNavigateAdmin }: FloatingNavProps) {
  const isAdmin = viewMode === 'admin';
  const items = isAdmin
    ? adminNav.map((n) => ({
        id: n.id,
        label: n.label === 'Analisis Data Atlet' ? 'Analisis' : n.label === 'Kelola Laporan' ? 'Kelola' : n.label,
        icon: n.icon,
      }))
    : [
        { id: 'dashboard' as const, label: 'Beranda', icon: LayoutDashboard },
        { id: 'physical' as const, label: 'Tes Fisik', icon: HeartPulse },
        { id: 'match' as const, label: 'Statistik', icon: BarChart3 },
        { id: 'archive' as const, label: 'Riwayat', icon: History },
      ];

  return (
    <nav className="floating-nav" style={{ padding: '6px 10px', gap: '4px' }}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = isAdmin ? adminTab === item.id : tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => isAdmin ? onNavigateAdmin(item.id as AdminTab) : onNavigate(item.id as Tab)}
            className={`floating-nav-item ${isActive ? 'active' : ''}`}
            style={{ padding: '4px 8px', minWidth: '55px' }}
          >
            <Icon size={18} />
            <span style={{ fontSize: '10px', marginTop: '2px' }}>{item.label}</span>
            {isAdmin && item.id === 'admin-analysis' && pendingCount > 0 && (
              <span className="floating-nav-badge">{pendingCount}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
