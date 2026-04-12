import { useState, useCallback } from 'react';

/**
 * Prosta alternatywa dla window.confirm — zwraca Promise<boolean>.
 * Używa natywnego window.confirm ale można łatwo podmienić na modal.
 * 
 * Użycie:
 *   const confirm = useConfirm();
 *   if (await confirm('Czy usunąć?')) { ... }
 */
export function useConfirm() {
  return useCallback((message) => {
    return Promise.resolve(window.confirm(message));
  }, []);
}

export default useConfirm;
