import { createContext, useContext, useState, useCallback } from 'react';

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const [notes, setNotes] = useState([]);

  const add = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotes(n => [...n, { id, message, type }]);
    setTimeout(() => setNotes(n => n.filter(x => x.id !== id)), 4000);
  }, []);

  return (
    <NotificationsContext.Provider value={{ add }}>
      {children}
      <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notes.map(n => (
          <div key={n.id} className={`alert alert-${n.type === 'error' ? 'danger' : n.type === 'success' ? 'success' : 'info'} shadow`} style={{ minWidth: 260 }}>
            {n.message}
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
