import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { HistoryPage } from './HistoryPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <HistoryPage />
    </MemoryRouter>,
  );
}

function storedHistory(): any[] | null {
  const raw = localStorage.getItem('compressionHistory');
  return raw === null ? null : JSON.parse(raw);
}

// The delete button is the only <button> carrying the lucide trash icon.
function trashButtonsIn(scope: HTMLElement): HTMLButtonElement[] {
  return Array.from(scope.querySelectorAll('button')).filter(
    (b) => b.querySelector('.lucide-trash-2'),
  ) as HTMLButtonElement[];
}

describe('HistoryPage — delete must never persist MOCK_HISTORY (SPECTRA-001)', () => {
  beforeEach(() => localStorage.clear());

  it('deleting a demo row from an empty real history does NOT write mock rows to storage', () => {
    const { container } = renderPage();

    // Sanity: with no real history, demo rows (RUN-xxx) are shown.
    expect(screen.getAllByText(/RUN-\d+/).length).toBeGreaterThan(0);
    expect(storedHistory()).toBeNull();

    const trash = trashButtonsIn(container);
    expect(trash.length).toBeGreaterThan(0);
    fireEvent.click(trash[0]);

    const persisted = storedHistory();
    // Storage may now exist, but it must contain ZERO mock RUN- rows.
    const ids: string[] = (persisted ?? []).map((r) => r.id);
    expect(ids.some((id) => id.startsWith('RUN-'))).toBe(false);
    expect(persisted ?? []).toHaveLength(0);
  });

  it('deleting a real row removes only that row and never resurrects mock rows', () => {
    const realRow = {
      id: 'REAL-1', date: '2026-05-01T10:00:00Z', imageName: 'my_photo.png',
      method: 'JPEG2000', wavelet: 'db4', decompLevel: 2, quantType: 'scalar',
      stepSize: 18, mse: 10.5, psnr: 37.2, cr: '54.3:1', sparsity: '90%', type: 'Natural',
    };
    localStorage.setItem('compressionHistory', JSON.stringify([realRow]));

    renderPage();

    // The real row is visible alongside demo rows.
    const cell = screen.getByText('my_photo.png');
    const row = cell.closest('tr') as HTMLElement;
    expect(row).toBeTruthy();

    const trash = trashButtonsIn(row);
    expect(trash.length).toBe(1);
    fireEvent.click(trash[0]);

    const persisted = storedHistory() ?? [];
    const ids = persisted.map((r) => r.id);
    expect(ids).not.toContain('REAL-1');          // the real row is gone
    expect(ids.some((id) => id.startsWith('RUN-'))).toBe(false); // no mock leak
  });
});
