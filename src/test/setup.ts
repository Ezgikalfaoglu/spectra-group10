import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Reset DOM + localStorage between tests so storage-flow tests stay isolated.
afterEach(() => {
  cleanup();
  localStorage.clear();
});
