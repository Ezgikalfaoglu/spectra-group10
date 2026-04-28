import { createBrowserRouter, Navigate } from 'react-router';
import { Root }                from './Root';
import { LandingPage }         from './pages/LandingPage';
import { UploadPage }          from './pages/UploadPage';
import { PreprocessingPage }   from './pages/PreprocessingPage';
import { TransformPage }       from './pages/TransformPage';
import { QuantizationPage }    from './pages/QuantizationPage';
import { EntropyPage }         from './pages/EntropyPage';
import { ProcessingPage }      from './pages/ProcessingPage';
import { ReconstructionPage }  from './pages/ReconstructionPage';
import { ResultsPage }         from './pages/ResultsPage';
import { HistoryPage }         from './pages/HistoryPage';
import { DashboardPage }       from './pages/DashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true,              Component: LandingPage         },

      /* ─── Pipeline (split screens) ─── */
      { path: 'upload',           Component: UploadPage          },
      { path: 'preprocessing',    Component: PreprocessingPage   },
      { path: 'transform',        Component: TransformPage       },
      { path: 'quantization',     Component: QuantizationPage    },
      { path: 'entropy',          Component: EntropyPage         },
      { path: 'processing',       Component: ProcessingPage      },
      { path: 'reconstruction',   Component: ReconstructionPage  },

      /* ─── Review / Analysis ─── */
      { path: 'results',          Component: ResultsPage         },
      { path: 'history',          Component: HistoryPage         },

      /* ─── Legacy integrated workspace ─── */
      { path: 'dashboard',        Component: DashboardPage       },

      /* ─── Fallback ─── */
      { path: '*',                element: <Navigate to="/" replace /> },
    ],
  },
]);
