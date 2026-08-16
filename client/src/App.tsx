import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { EditorPage } from '@/pages/EditorPage';
import { LandingPage } from '@/pages/LandingPage';

export const App = (): ReactElement => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/editor" element={<EditorPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
