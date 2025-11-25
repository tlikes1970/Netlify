import { useState } from 'react';
import GenreRowConfig, { ForYouRow } from './GenreRowConfig';
import { useTranslations } from '../lib/language';

// For You Genre Configuration Component
export default function ForYouGenreConfig() {
  const translations = useTranslations();
  const [forYouRows, setForYouRows] = useState<ForYouRow[]>(() => {
    // Load from localStorage or use defaults
    try {
      const saved = localStorage.getItem('flicklet:forYouRows');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load For You rows:', e);
    }
    
    // Default configuration
    return [
      { id: '1', mainGenre: 'anime', subGenre: 'action', title: 'Anime/Action' },
      { id: '2', mainGenre: 'horror', subGenre: 'psychological', title: 'Horror/Psychological' },
      { id: '3', mainGenre: 'comedy', subGenre: 'romantic', title: 'Comedy/Romantic' }
    ];
  });

  const saveRows = (rows: ForYouRow[]) => {
    setForYouRows(rows);
    localStorage.setItem('flicklet:forYouRows', JSON.stringify(rows));
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('forYouRows:updated', { detail: rows }));
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
    saveRows([...forYouRows, newRow]);
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

