import { createBrowserRouter, Navigate } from 'react-router';
import { Root }              from './Root';
import { LandingPage }       from './pages/LandingPage';
import { UploadPage }        from './pages/UploadPage';
import { TransformPage }     from './pages/TransformPage';
import { QuantizationPage }  from './pages/QuantizationPage';
import { ProcessingPage }    from './pages/ProcessingPage';
import { ResultsPage }       from './pages/ResultsPage';
import { HistoryPage }       from './pages/HistoryPage';
import { DashboardPage }     from './pages/DashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true,              Component: LandingPage       },

      /* ─── Pipeline (split screens) ─── */
      { path: 'upload',           Component: UploadPage        },
      { path: 'transform',        Component: TransformPage     },
      { path: 'quantization',     Component: QuantizationPage  },
      { path: 'processing',       Component: ProcessingPage    },

      /* ─── Review / Analysis ─── */
      { path: 'results',          Component: ResultsPage       },
      { path: 'history',          Component: HistoryPage       },

      /* ─── Legacy integrated workspace ─── */
      { path: 'dashboard',        Component: DashboardPage     },

      /* ─── Fallback ─── */
      { path: '*',                element: <Navigate to="/" replace /> },
    ],
  },
]);
