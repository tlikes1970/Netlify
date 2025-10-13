import React, { useState } from 'react';
import CardV2 from '../components/cards/CardV2';
import { useCustomLists, customListManager } from '../lib/customLists';
import { Library } from '../lib/storage';
import { useTranslations } from '../lib/language';
import { useSettings, getPersonalityText } from '../lib/settings';
import type { ListName } from '../state/library.types';

export default function MyListsPage() {
  const userLists = useCustomLists();
  const [selectedListId, setSelectedListId] = useState<string>('');
  const translations = useTranslations();
  const settings = useSettings();

  // Get items for the selected list
  const selectedList = selectedListId ? customListManager.getListById(selectedListId) : null;
  const listName = selectedList ? `custom:${selectedListId}` as ListName : null;
  const items = listName ? Library.getByList(listName) : [];

  // Set default selected list if none selected
  React.useEffect(() => {
    if (!selectedListId && userLists.customLists.length > 0) {
      const defaultList = userLists.customLists.find(list => list.isDefault) || userLists.customLists[0];
      setSelectedListId(defaultList.id);
    }
  }, [selectedListId, userLists.customLists]);

  const handleListChange = (listId: string) => {
    setSelectedListId(listId);
    customListManager.setSelectedList(listId);
  };

  const handleCreateList = () => {
    const name = prompt(translations.enterListName || 'Enter list name:');
    if (!name?.trim()) return;

    try {
      const newList = customListManager.createList(name.trim());
      setSelectedListId(newList.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create list');
    }
  };

  const handleDeleteList = (listId: string) => {
    const list = customListManager.getListById(listId);
    if (!list) return;

    const confirmed = window.confirm(
      `${translations.confirmDeleteList || 'Are you sure you want to delete'} "${list.name}"? ${translations.thisActionCannotBeUndone || 'This action cannot be undone.'}`
    );
    
    if (confirmed) {
      try {
        customListManager.deleteList(listId);
        // Select another list if we deleted the current one
        if (selectedListId === listId) {
          const remainingLists = userLists.customLists.filter(l => l.id !== listId);
          if (remainingLists.length > 0) {
            setSelectedListId(remainingLists[0].id);
          }
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete list');
      }
    }
  };

  const handleRenameList = (listId: string) => {
    const list = customListManager.getListById(listId);
    if (!list) return;

    const newName = prompt(translations.enterNewName || 'Enter new name:', list.name);
    if (!newName?.trim() || newName.trim() === list.name) return;

    try {
      customListManager.updateList(listId, { name: newName.trim() });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to rename list');
    }
  };

  const handleResetCounts = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all custom list counts to zero? This will not delete the lists themselves, just reset their item counts.'
    );
    
    if (confirmed) {
      customListManager.resetAllCounts();
    }
  };

  // Action handlers for cards
  const actions = {
    onWant: (item: any) => {
      if (item.id && item.mediaType) {
        Library.move(item.id, item.mediaType, 'wishlist');
      }
    },
    onWatched: (item: any) => {
      if (item.id && item.mediaType) {
        Library.move(item.id, item.mediaType, 'watched');
      }
    },
    onNotInterested: (item: any) => {
      if (item.id && item.mediaType) {
        Library.move(item.id, item.mediaType, 'not');
      }
    },
    onDelete: (item: any) => {
      if (item.id && item.mediaType) {
        Library.remove(item.id, item.mediaType);
      }
    },
  };

  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
          {translations.myLists || 'My Lists'}
        </h1>
        
        <div className="flex gap-2">
          {userLists.customLists.length > 0 && (
            <button
              onClick={handleResetCounts}
              className="px-3 py-2 rounded-lg transition-colors text-sm"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', border: '1px solid var(--line)' }}
            >
              Reset Counts
            </button>
          )}
          
          {userLists.customLists.length < userLists.maxLists && (
            <button
              onClick={handleCreateList}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              {translations.createNewList || 'Create New List'}
            </button>
          )}
        </div>
      </div>

      {/* List Selector */}
      {userLists.customLists.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {userLists.customLists.map(list => (
              <div
                key={list.id}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedListId === list.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  backgroundColor: selectedListId === list.id ? 'var(--accent)' : 'var(--btn)',
                  color: 'var(--text)'
                }}
                onClick={() => handleListChange(list.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{list.name}</span>
                  <span className="text-xs opacity-75">({list.itemCount})</span>
                  
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameList(list.id);
                      }}
                      className="text-xs opacity-60 hover:opacity-100"
                      title={translations.rename || 'Rename'}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                      className="text-xs opacity-60 hover:opacity-100"
                      title={translations.delete || 'Delete'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items Display */}
      {selectedList ? (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-medium" style={{ color: 'var(--text)' }}>
              {selectedList.name}
              {selectedList.description && (
                <span className="text-sm font-normal ml-2" style={{ color: 'var(--muted)' }}>
                  - {selectedList.description}
                </span>
              )}
            </h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {items.length} {translations.items || 'items'}
            </p>
          </div>

          {items.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(154px,1fr))] gap-3">
              {items.map(item => (
                <CardV2
                  key={`${item.mediaType}:${item.id}`}
                  item={item}
                  context="tab-watching"
                  actions={actions}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                {getPersonalityText('emptyWishlist', settings.personalityLevel)}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {translations.addItemsFromSearchOrDiscovery || 'Add items from search or discovery'}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            {translations.noListsCreated || 'No lists created yet'}
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--muted)' }}>
            {translations.createListsToOrganize || 'Create lists to organize your favorite shows and movies'}
          </p>
          <button
            onClick={handleCreateList}
            className="px-6 py-3 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            {translations.createYourFirstList || 'Create Your First List'}
          </button>
        </div>
      )}
    </section>
  );
}
