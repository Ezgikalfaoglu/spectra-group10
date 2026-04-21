import { Outlet } from 'react-router';
import { Navbar } from './components/Navbar';

export function Root() {
  return (
    <div
      className="spectra-bg min-h-screen relative"
      style={{ background: 'var(--paper)', color: 'var(--ink-1)', fontFamily: 'var(--font-sans)' }}
    >
      <div className="relative z-[2]">
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
}
