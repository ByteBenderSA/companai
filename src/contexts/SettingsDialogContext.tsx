import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { SettingsDialog } from '@/components/SettingsDialog';

const SettingsDialogContext = createContext<(() => void) | undefined>(undefined);

/** Returns a function that opens the API-key settings dialog from anywhere. */
// eslint-disable-next-line react-refresh/only-export-components
export const useOpenSettings = () => {
  const open = useContext(SettingsDialogContext);
  if (!open) throw new Error('useOpenSettings must be used within SettingsDialogProvider');
  return open;
};

export const SettingsDialogProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  return (
    <SettingsDialogContext.Provider value={open}>
      {children}
      <SettingsDialog open={isOpen} onOpenChange={setIsOpen} />
    </SettingsDialogContext.Provider>
  );
};
