type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();

export const onSessionExpired = (listener: SessionExpiredListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const emitSessionExpired = (): void => {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('[Session] expiry listener error:', e);
    }
  });
};
