import React, { useState } from 'react';
import CardV2 from '../components/cards/CardV2';
import { useCustomLists, customListManager } from '../lib/customLists';
import { Library } from '../lib/storage';
import { useTranslations } from '../lib/language';
import { useSettings, getPersonalityText } from '../lib/settings';
import type { ListName } from '../state/library.types';
import { shareListWithFallback } from '../lib/shareLinks';
import { getToastCallback } from '../state/actions';

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


  // List share entry point – uses shareListWithFallback
  const handleShareList = async (listId: string) => {
    console.log("[MyListsPage] handleShareList called with listId:", listId);
    const list = customListManager.getListById(listId);
    if (!list) {
      console.warn("[MyListsPage] List not found for listId:", listId);
      return;
    }

    console.log("[MyListsPage] Sharing list:", list.name, list.id);
    
    // Check toast availability upfront for debugging
    const toastCheck = getToastCallback();
    console.log("[MyListsPage] Toast callback available:", !!toastCheck, typeof toastCheck);

    try {
      await shareListWithFallback(
        { id: list.id, name: list.name },
        {
          onSuccess: () => {
            console.log("[MyListsPage] Share successful - entering onSuccess callback");
            // Get global toast callback (set by App.tsx) - retrieve fresh each time
            const toast = getToastCallback();
            console.log("[MyListsPage] Toast callback in onSuccess:", !!toast, typeof toast);
            if (toast) {
              console.log("[MyListsPage] Calling toast callback with message:", "Share link copied to clipboard!");
              try {
                toast("Share link copied to clipboard!", "success");
                console.log("[MyListsPage] Toast callback executed successfully");
              } catch (toastError) {
                console.error("[MyListsPage] Error calling toast:", toastError);
              }
            } else {
              console.warn("[MyListsPage] Toast callback not available - toasts won't show");
            }
          },
          onError: (error) => {
            console.error("[MyListsPage] Share failed:", error);
            // Get global toast callback (set by App.tsx) - retrieve fresh each time
            const toast = getToastCallback();
            if (toast) {
              toast("Unable to share – link copied instead", "error");
            }
          },
        }
      );
    } catch (error) {
      console.error("[MyListsPage] Unexpected error in handleShareList:", error);
      const toast = getToastCallback();
      if (toast) {
        toast("Failed to share list", "error");
      }
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
          <div className="mb-4 flex items-center justify-between">
            <div>
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
            <button
              onClick={() => handleShareList(selectedListId)}
              className="px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
              style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', border: '1px solid var(--line)' }}
              title="Share this list"
            >
              <span>🔗</span>
              <span>Share</span>
            </button>
          </div>

          {items.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(154px,1fr))] gap-3">
              {items.map(item => (
                <CardV2
                  key={`${item.mediaType}:${item.id}`}
                  item={item}
                  context="tab-watching"
                  actions={actions}
                  currentListContext={listName ?? undefined}
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
