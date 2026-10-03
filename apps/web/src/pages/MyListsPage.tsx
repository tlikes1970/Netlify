import { t as coreText, useLanguage, tPlural } from "@/lib/language";
import React, { useState } from 'react';
import TabCard from '../components/cards/TabCard';
import { useCustomLists, customListManager } from '../lib/customLists';
import { Library, useLibrary } from '../lib/storage';
import { useTranslations } from '../lib/language';
import { useSettings, getPersonalityText, DEFAULT_PERSONALITY } from '../lib/settings';
import type { ListName } from '../state/library.types';
import { shareListWithFallback } from '../lib/shareLinks';
import { getToastCallback } from '../state/actions';
import { setPrimaryStatus, setNotInterested } from '../lib/statusTransitions';

export default function MyListsPage({onBack, onNotesEdit}: {onBack?: () => void; onNotesEdit?: (item: import("../components/cards/card.types").MediaItem) => void} = {}) {
  useLanguage();
  const userLists = useCustomLists();
  const [selectedListId, setSelectedListId] = useState<string>(() => customListManager.getSelectedList?.()?.id || '');
  const translations = useTranslations();
  const settings = useSettings();

  // Get items for the selected list
  const selectedList = selectedListId ? customListManager.getListById(selectedListId) : null;
  const listName = selectedList ? `custom:${selectedListId}` as ListName : null;
  // Subscribe to changes; read the selected list synchronously so switching cannot
  // render the previous list's cards under the new heading before effects run.
  useLibrary(`custom:${selectedListId}`, { includeItemUpdates: true });
  const items = listName ? Library.getByList(listName) : [];

  // Resolve lost/deleted selections against the current list definitions.
  React.useEffect(() => {
    const storedSelection = userLists.customLists.find(list => list.id === userLists.selectedListId);
    if (storedSelection) {
      if (selectedListId !== storedSelection.id) setSelectedListId(storedSelection.id);
      return;
    }
    if (userLists.customLists.some(list => list.id === selectedListId)) return;
    const next = userLists.customLists.find(list => list.isDefault) || userLists.customLists[0];
    setSelectedListId(next?.id || '');
    if (next) customListManager.setSelectedList(next.id);
  }, [selectedListId, userLists.customLists, userLists.selectedListId]);

  // Handle deep link to select a specific list
  React.useEffect(() => {
    const handleSelectList = (e: CustomEvent<{ listId: string }>) => {
      const listId = e.detail.listId;
      const list = customListManager.getListById(listId);
      if (list) {
        setSelectedListId(listId);
        customListManager.setSelectedList(listId);
      }
    };

    // Check for share link params on mount
    try {
      const shareListId = localStorage.getItem("flicklet:shareListId");
      if (shareListId) {
        const list = customListManager.getListById(shareListId);
        if (list) {
          setSelectedListId(shareListId);
          customListManager.setSelectedList(shareListId);
        }
        localStorage.removeItem("flicklet:shareListId");
      }
    } catch (e) {
      console.warn("Failed to process share list params:", e);
    }

    window.addEventListener("flicklet:selectList", handleSelectList as EventListener);
    return () => {
      window.removeEventListener("flicklet:selectList", handleSelectList as EventListener);
    };
  }, []);

  const handleListChange = (listId: string) => {
    setSelectedListId(listId);
    customListManager.setSelectedList(listId);
  };

  const handleCreateList = () => {
    const name = prompt(translations.enterListName || 'Enter list name:');
    if (!name?.trim()) return;

    try {
      const newList = customListManager.createList(name.trim());
      handleListChange(newList.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : coreText("coreCreateFailed"));
    }
  };

  const handleDeleteList = (listId: string) => {
    const list = customListManager.getListById(listId);
    if (!list) return;

    const confirmed = window.confirm(
      coreText('coreDeleteListConfirm', {name: list.name})
    );
    
    if (confirmed) {
      try {
        if (!customListManager.deleteList(listId)) return;
        if (selectedListId === listId) {
          const remaining = customListManager.getUserLists().customLists;
          const next = remaining.find(list => list.isDefault) || remaining[0];
          setSelectedListId(next?.id || '');
          if (next) customListManager.setSelectedList(next.id);
        }
      } catch (error) {
        alert(error instanceof Error ? error.message : coreText("coreDeleteFailed"));
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
      alert(error instanceof Error ? error.message : coreText("coreRenameFailed"));
    }
  };


  // List share — pasteable text with Flicklet stamp
  const handleShareList = async (listId: string) => {
    const list = customListManager.getListById(listId);
    if (!list) return;

    const shareListName = `custom:${listId}` as ListName;
    const listItems = Library.getByList(shareListName);

    try {
      await shareListWithFallback(
        { name: list.name },
        listItems.map((item) => ({
          title: item.title,
          mediaType: item.mediaType,
          voteAverage: item.voteAverage,
        })),
        {
          onSuccess: (outcome) => {
            const toast = getToastCallback();
            toast?.(outcome === "shared" ? translations.sharingShared : translations.sharingCopied, "success");
          },
          onError: () => {
            const toast = getToastCallback();
            toast?.(translations.sharingFailed, "error");
          },
        }
      );
    } catch {
      const toast = getToastCallback();
      toast?.(translations.sharingFailed, "error");
    }
  };

  // Action handlers for cards
  const actions = {
    onNotesEdit,
    onWatching: (item: any) => setPrimaryStatus(item, "watching", { feedback: true }),
    onRatingChange: (item: any, rating: number) => Library.updateRating(item.id, item.mediaType, rating),
    onWant: (item: any) => {
      if (item.id && item.mediaType) {
        setPrimaryStatus(item, 'wishlist', { feedback: true });
      }
    },
    onWatched: (item: any) => {
      if (item.id && item.mediaType) {
        setPrimaryStatus(item, 'watched', { feedback: true });
      }
    },
    onNotInterested: (item: any) => {
      if (item.id && item.mediaType) {
        void setNotInterested(item);
      }
    },
    onDelete: (item: any) => {
      if (selectedListId && window.confirm(coreText('coreRemoveCustomConfirm', {title:item.title}))) {
        Library.removeFromCustomList(item.id, item.mediaType, selectedListId);
      }
    },
  };

  return (
    <section className="px-4 py-4 custom-lists-page">
      {onBack && <button type="button" onClick={onBack} className="mb-3 min-h-[44px]">{coreText("coreBackArrow")}</button>}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{coreText("coreCustomLists")}</h1>
        
        <div className="flex gap-2">
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
                className={`custom-list-selector rounded-lg transition-colors ${
                  selectedListId === list.id ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{
                  backgroundColor: selectedListId === list.id ? 'var(--accent)' : 'var(--btn)',
                  color: 'var(--text)'
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <button type="button" aria-pressed={selectedListId === list.id} onClick={() => handleListChange(list.id)} className="custom-list-select">
                    <span className="font-medium">{list.name}</span>{' '}
                    <span className="text-xs opacity-75">({list.itemCount})</span>
                  </button>
                  
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameList(list.id);
                      }}
                      className="custom-list-action text-xs opacity-60 hover:opacity-100"
                      aria-label={coreText('coreRenameListAria', {name:list.name})}
                      title={translations.rename || 'Rename'}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                      className="custom-list-action text-xs opacity-60 hover:opacity-100"
                      aria-label={coreText('coreDeleteListAria', {name:list.name})}
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
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0 break-words flex-1">
              <h2 className="text-lg font-medium" style={{ color: 'var(--text)' }}>
                {selectedList.name}
                {selectedList.description && (
                  <span className="text-sm font-normal ml-2" style={{ color: 'var(--muted)' }}>
                    - {selectedList.description}
                  </span>
                )}
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {tPlural({one:'coreItemOne',other:'coreItemsOther'},items.length)}
              </p>
            </div>
            <button
              onClick={() => handleShareList(selectedListId)}
              className="px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 shrink-0 min-h-[44px]"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', border: '1px solid var(--line)' }}
              title={translations.sharingAction}
            >
              <span>🔗</span>
              <span>{translations.sharingAction}</span>
            </button>
          </div>

          {items.length > 0 ? (
            <div className="custom-list-cards flex flex-col gap-3">
              {items.map(item => {
                return <TabCard key={`${item.mediaType}:${item.id}`} item={item} actions={actions} customListContext />;
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                {getPersonalityText(settings.personality || DEFAULT_PERSONALITY, 'emptyWishlist')}
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
