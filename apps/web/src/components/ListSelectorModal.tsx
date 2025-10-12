import React, { useState } from 'react';
import { customListManager, useCustomLists } from '../lib/customLists';
import { Library, getListDisplayName } from '../lib/storage';
import { emit } from '../lib/events';
import type { MediaItem } from '../components/cards/card.types';
import { useTranslations } from '../lib/language';

interface ListSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaItem;
}

export default function ListSelectorModal({ isOpen, onClose, item }: ListSelectorModalProps) {
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [existingListName, setExistingListName] = useState<string>('');
  const userLists = useCustomLists();
  const translations = useTranslations();

  if (!isOpen) return null;

  const handleAddToList = () => {
    if (!selectedListId) return;

    // Check if item already exists in any list
    const currentList = Library.getCurrentList(item.id, item.mediaType);
    if (currentList) {
      const currentListName = getListDisplayName(currentList);
      setExistingListName(currentListName);
      setShowConfirmation(true);
      return;
    }

    // No existing item, proceed with adding
    addToList();
  };

  const addToList = () => {
    if (!selectedListId) return;

    const listName = `custom:${selectedListId}` as const;
    Library.upsert(item, listName);
    emit('card:holidayAdd', { id: item.id, mediaType: item.mediaType as any });
    
    // Set as selected list for future additions
    customListManager.setSelectedList(selectedListId);
    
    onClose();
  };

  const handleConfirmMove = () => {
    setShowConfirmation(false);
    addToList();
  };

  const handleCancelMove = () => {
    setShowConfirmation(false);
  };

  const handleCreateNewList = () => {
    const name = prompt(translations.enterListName || 'Enter list name:');
    if (!name?.trim()) return;

    try {
      const newList = customListManager.createList(name.trim());
      setSelectedListId(newList.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create list');
    }
  };

  return (
            <div className="fixed inset-0 z-[99999] backdrop-blur-sm flex items-start justify-center pt-48 p-4" 
                 style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-xl w-full max-w-md p-6" 
           style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {translations.addToList || 'Add to List'}
          </h3>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {translations.selectListFor || 'Select a list for'}: <strong>{item.title}</strong>
          </p>
        </div>

        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
          {userLists.customLists.map(list => (
            <label
              key={list.id}
              className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors"
              style={{ 
                backgroundColor: selectedListId === list.id ? 'var(--accent)' : 'var(--btn)',
                color: 'var(--text)'
              }}
              onMouseEnter={(e) => {
                if (selectedListId !== list.id) {
                  e.currentTarget.style.backgroundColor = 'var(--card)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedListId !== list.id) {
                  e.currentTarget.style.backgroundColor = 'var(--btn)';
                }
              }}
            >
              <input
                type="radio"
                name="list"
                value={list.id}
                checked={selectedListId === list.id}
                onChange={() => setSelectedListId(list.id)}
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium">{list.name}</div>
                {list.description && (
                  <div className="text-sm opacity-75">{list.description}</div>
                )}
                <div className="text-xs opacity-60">
                  {list.itemCount} {translations.items || 'items'}
                </div>
              </div>
            </label>
          ))}
        </div>

        {userLists.customLists.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              {translations.noListsYet || 'No lists created yet'}
            </p>
            <button
              onClick={handleCreateNewList}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              {translations.createFirstList || 'Create Your First List'}
            </button>
          </div>
        )}

        {userLists.customLists.length >= userLists.maxLists && (
          <div className="text-center py-4 mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)', border: '1px solid' }}>
            <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>
              {translations.maxListsReached || 'Maximum lists reached'}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {translations.upgradeForMoreLists || 'Upgrade to Pro for more lists'}
            </p>
            <button
              onClick={() => {
                // TODO: Open Pro upgrade modal
                alert(translations.proUpgradeComingSoon || 'Pro upgrade coming soon!');
              }}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              {translations.upgradeToPro || 'Upgrade to Pro'}
            </button>
          </div>
        )}

        <div className="flex gap-3">
          {userLists.customLists.length < userLists.maxLists && (
            <button
              onClick={handleCreateNewList}
              className="flex-1 px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {translations.createNewList || 'Create New List'}
            </button>
          )}
          
          <button
            onClick={handleAddToList}
            disabled={!selectedListId}
            className="flex-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            {translations.addToList || 'Add to List'}
          </button>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmation && (
                  <div className="fixed inset-0 z-[999999] backdrop-blur-sm flex items-start justify-center pt-48 p-4" 
                       style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <div className="rounded-xl w-full max-w-md p-6" 
                 style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
                {translations.itemAlreadyExists || 'Item Already Exists'}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                <strong>{item.title}</strong> {translations.alreadyInList || 'is already in'} <strong>{existingListName}</strong>.
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                {translations.confirmMoveToList || 'Do you want to move it to the selected list?'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelMove}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
                >
                  {translations.cancel || 'Cancel'}
                </button>
                <button
                  onClick={handleConfirmMove}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  {translations.moveToList || 'Move to List'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
