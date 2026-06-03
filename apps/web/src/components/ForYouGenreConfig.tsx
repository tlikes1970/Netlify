import { useState, useEffect } from 'react';
import GenreRowConfig, { ForYouRow } from './GenreRowConfig';
import { useTranslations } from '../lib/language';
import { useAuth } from '../hooks/useAuth';
import { loadForYouRows, saveForYouRows } from '../lib/forYouRowsStorage';

// For You Genre Configuration Component
export default function ForYouGenreConfig() {
  const translations = useTranslations();
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [forYouRows, setForYouRows] = useState<ForYouRow[]>(() =>
    loadForYouRows(uid)
  );

  useEffect(() => {
    setForYouRows(loadForYouRows(uid));
  }, [uid]);

  const saveRows = (rows: ForYouRow[]) => {
    const saved = saveForYouRows(rows, uid);
    setForYouRows(saved);
    window.dispatchEvent(new CustomEvent('forYouRows:updated', { detail: saved }));
  };

  const handleRowUpdate = (updatedRow: ForYouRow) => {
    const newRows = forYouRows.map(row =>
      row.id === updatedRow.id ? updatedRow : row
    );
    saveRows(newRows);
  };

  const handleAddRow = () => {
    if (forYouRows.length >= 3) return;

    const newRow: ForYouRow = {
      id: String(forYouRows.length + 1),
      mainGenre: '',
      subGenre: '',
      title: ''
    };
    // Keep in UI only until genres are chosen (invalid rows must not hit storage)
    setForYouRows([...forYouRows, newRow]);
  };

  const handleRemoveRow = (rowId: string) => {
    const newRows = forYouRows.filter(row => row.id !== rowId);
    saveRows(newRows);
  };

  return (
    <div className="space-y-4">
      {forYouRows.map((row) => (
        <GenreRowConfig
          key={row.id}
          row={row}
          onUpdate={handleRowUpdate}
          onRemove={() => handleRemoveRow(row.id)}
          canRemove={forYouRows.length > 1}
        />
      ))}

      {forYouRows.length < 3 && (
      <button
        onClick={handleAddRow}
        className="w-full p-4 rounded-lg border-2 border-dashed transition-colors"
        style={{
          borderColor: 'var(--line)',
          color: 'var(--muted)',
          backgroundColor: 'transparent'
        }}
      >
        {translations.forYouAddAnotherRow} ({forYouRows.length}/3)
      </button>
      )}

      <div className="p-3 rounded-lg text-sm" style={{
        backgroundColor: 'var(--btn)',
        color: 'var(--muted)'
      }}>
        {translations.forYouTipText}
      </div>
    </div>
  );
}
