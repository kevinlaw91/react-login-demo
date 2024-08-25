import { RouterProvider } from 'react-router-dom';
import { UserSessionProvider } from '@/contexts/SessionContext';
import { PopupManagerProvider } from '@/contexts/PopupModalManagerContext.tsx';
import router from '@/router.tsx';
import { HelmetProvider } from 'react-helmet-async';
import '@/index.css';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '@/mui.theme.ts';
import { ModalOverlay } from '@/components/ModalOverlay.tsx';
import { ModalsContainer } from '@/components/ModalsContainer.tsx';

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <PopupManagerProvider>
          <UserSessionProvider>
            <RouterProvider router={router} />
            <ModalOverlay />
            <ModalsContainer />
          </UserSessionProvider>
        </PopupManagerProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
