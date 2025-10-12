import React, { useState, useEffect } from 'react';
import { useSettings, settingsManager, PersonalityLevel, Theme, getPersonalityText } from '../lib/settings';
import { useTranslations, useLanguage, changeLanguage } from '../lib/language';
import { useCustomLists, customListManager } from '../lib/customLists';
import { useUsername } from '../hooks/useUsername';
import PersonalityExamples from './PersonalityExamples';
import PersonalityTest from './PersonalityTest';
import type { Language } from '../lib/language.types';

type SettingsTab = 'general' | 'notifications' | 'layout' | 'data' | 'pro' | 'about' | 'test';

export default function SettingsPage({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const settings = useSettings();
  const translations = useTranslations();
  const currentLanguage = useLanguage();

  const tabs = [
    { id: 'general' as const, label: translations.general },
    { id: 'notifications' as const, label: translations.notifications },
    { id: 'layout' as const, label: translations.layout },
    { id: 'data' as const, label: translations.data },
    { id: 'pro' as const, label: translations.pro },
    { id: 'about' as const, label: translations.about },
    { id: 'test' as const, label: 'Personality Test' },
  ];

  return (
    <div className="fixed inset-0 z-[99999] backdrop-blur-sm flex items-start justify-center pt-24 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-xl w-full max-w-4xl h-[80vh] flex overflow-hidden" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
        {/* Left sidebar - Tabs */}
        <div className="w-48 p-4" style={{ backgroundColor: 'var(--btn)', borderRightColor: 'var(--line)', borderRight: '1px solid' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{translations.settings}</h2>
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'var(--muted)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
              aria-label="Close Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  backgroundColor: activeTab === tab.id ? 'var(--card)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text)' : 'var(--muted)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'var(--card)';
                    e.currentTarget.style.opacity = '0.5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

                {/* Right content area */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {activeTab === 'general' && <GeneralTab settings={settings} translations={translations} currentLanguage={currentLanguage} />}
                  {activeTab === 'notifications' && <NotificationsTab settings={settings} />}
                  {activeTab === 'layout' && <LayoutTab settings={settings} />}
                  {activeTab === 'data' && <DataTab settings={settings} />}
                  {activeTab === 'pro' && <ProTab settings={settings} />}
                  {activeTab === 'about' && <AboutTab />}
                  {activeTab === 'test' && <PersonalityTest personalityLevel={settings.personalityLevel} />}
                </div>
      </div>
    </div>
  );
}

// General Tab Component
function GeneralTab({ settings, translations, currentLanguage }: { settings: any; translations: any; currentLanguage: Language }) {
  const { username, updateUsername } = useUsername();
  const [displayName, setDisplayName] = useState(username);
  const [showWarning, setShowWarning] = useState(false);

  // Update local state when username changes
  useEffect(() => {
    setDisplayName(username);
  }, [username]);

  const handleDisplayNameChange = (newName: string) => {
    setDisplayName(newName);
    if (newName !== username) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  const saveDisplayName = async () => {
    if (showWarning) {
      const confirmed = window.confirm('Are you sure you want to change your username? This will update your profile.');
      if (confirmed) {
        try {
          await updateUsername(displayName);
          setShowWarning(false);
        } catch (error) {
          console.error('Failed to update username:', error);
          alert('Failed to update username. Please try again.');
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{translations.general}</h3>
      
      {/* Language Selection */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
          {translations.language} / Idioma
        </label>
        <div className="space-y-2">
          {[
            { lang: 'en' as Language, label: translations.english, flag: '🇺🇸' },
            { lang: 'es' as Language, label: translations.spanish, flag: '🇪🇸' },
          ].map(({ lang, label, flag }) => (
            <label key={lang} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="language"
                value={lang}
                checked={currentLanguage === lang}
                onChange={() => changeLanguage(lang)}
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium" style={{ color: 'var(--text)' }}>
                  {flag} {label}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
      
      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
          {translations.username}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={displayName}
            onChange={(e) => handleDisplayNameChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--line)', 
              color: 'var(--text)',
              border: '1px solid'
            }}
            placeholder={translations.username}
          />
          {showWarning && (
            <button
              onClick={saveDisplayName}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              {translations.save}
            </button>
          )}
        </div>
        {showWarning && (
          <p className="mt-1 text-sm text-yellow-400">
            ⚠️ Changing your display name will update your profile
          </p>
        )}
      </div>

      {/* My Statistics */}
      <div>
        <h4 className="text-lg font-medium mb-3" style={{ color: 'var(--text)' }}>My Statistics</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
            <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>TV Shows</h5>
            <div className="space-y-1 text-sm" style={{ color: 'var(--muted)' }}>
              <div>Currently Watching: 0</div>
              <div>Want to Watch: 0</div>
              <div>Watched: 0</div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
            <h5 className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Movies</h5>
            <div className="space-y-1 text-sm" style={{ color: 'var(--muted)' }}>
              <div>Currently Watching: 0</div>
              <div>Want to Watch: 0</div>
              <div>Watched: 0</div>
            </div>
          </div>
        </div>
      </div>

      {/* Not Interested Management */}
      <div>
        <h4 className="text-lg font-medium mb-3" style={{ color: 'var(--text)' }}>Not Interested Management</h4>
        <button 
          className="px-4 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: 'var(--btn)', color: 'var(--text)' }}
        >
          Manage Not Interested List
        </button>
      </div>

      {/* Personality Level */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
          {translations.personalityLevel}
        </label>
        <div className="space-y-2">
          {[
            { level: 1 as PersonalityLevel, label: translations.regular, description: translations.friendlyAndHelpful },
            { level: 2 as PersonalityLevel, label: translations.semiSarcastic, description: translations.aBitCheeky },
            { level: 3 as PersonalityLevel, label: translations.severelySarcastic, description: translations.maximumSass },
          ].map(({ level, label, description }) => (
            <label key={level} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="personality"
                value={level}
                checked={settings.personalityLevel === level}
                onChange={() => settingsManager.updatePersonalityLevel(level)}
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium" style={{ color: 'var(--text)' }}>{label}</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>{description}</div>
              </div>
            </label>
          ))}
        </div>
        <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            {translations.preview}: {getPersonalityText('welcome', settings.personalityLevel)}
          </p>
        </div>
        
        {/* Personality Examples */}
        <div className="mt-4">
          <PersonalityExamples personalityLevel={settings.personalityLevel} />
        </div>
      </div>

      {/* Reset to Defaults */}
      <div>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
              settingsManager.resetToDefaults();
            }
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Reset System to Defaults
        </button>
      </div>
    </div>
  );
}

// Placeholder tabs
function NotificationsTab({ settings }: { settings: any }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Notifications</h3>
      <p className="text-neutral-400">Notification settings coming soon...</p>
    </div>
  );
}

function LayoutTab({ settings }: { settings: any }) {
  const translations = useTranslations();
  const userLists = useCustomLists();
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleCreateList = () => {
    const name = prompt(translations.enterListName || 'Enter list name:');
    if (!name?.trim()) return;

    try {
      customListManager.createList(name.trim());
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create list');
    }
  };

  const handleEditList = (listId: string) => {
    const list = customListManager.getListById(listId);
    if (!list) return;

    setEditingListId(listId);
    setEditName(list.name);
    setEditDescription(list.description || '');
  };

  const handleSaveEdit = () => {
    if (!editingListId || !editName.trim()) return;

    try {
      customListManager.updateList(editingListId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditingListId(null);
      setEditName('');
      setEditDescription('');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update list');
    }
  };

  const handleCancelEdit = () => {
    setEditingListId(null);
    setEditName('');
    setEditDescription('');
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
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to delete list');
      }
    }
  };

  const handleSetDefault = (listId: string) => {
    try {
      customListManager.setSelectedList(listId);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to set default list');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{translations.layout}</h3>
      
      {/* Theme Preference */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
          {translations.themePreference}
        </label>
        <div className="space-y-2">
          {[
            { theme: 'dark' as const, label: translations.dark, description: translations.darkThemeDescription },
            { theme: 'light' as const, label: translations.light, description: translations.lightThemeDescription },
          ].map(({ theme, label, description }) => (
            <label key={theme} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={settings.layout.theme === theme}
                onChange={() => settingsManager.updateTheme(theme)}
                className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium" style={{ color: 'var(--text)' }}>{label}</div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>{description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* My Lists Management */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-medium" style={{ color: 'var(--text)' }}>
            {translations.myLists || 'My Lists'}
          </h4>
          {userLists.customLists.length < userLists.maxLists && (
            <button
              onClick={handleCreateList}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              {translations.createNewList || 'Create New List'}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {userLists.customLists.map(list => (
            <div
              key={list.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}
            >
              {editingListId === list.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--btn)', 
                      borderColor: 'var(--line)', 
                      color: 'var(--text)',
                      border: '1px solid'
                    }}
                    placeholder={translations.listName || 'List name'}
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ 
                      backgroundColor: 'var(--btn)', 
                      borderColor: 'var(--line)', 
                      color: 'var(--text)',
                      border: '1px solid'
                    }}
                    placeholder={translations.listDescription || 'List description (optional)'}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                      style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                    >
                      {translations.save || 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                      style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
                    >
                      {translations.cancel || 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium" style={{ color: 'var(--text)' }}>{list.name}</h5>
                      {list.isDefault && (
                        <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                          {translations.default || 'Default'}
                        </span>
                      )}
                    </div>
                    {list.description && (
                      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{list.description}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      {list.itemCount} {translations.items || 'items'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditList(list.id)}
                      className="px-2 py-1 rounded text-xs transition-colors"
                      style={{ backgroundColor: 'var(--btn)', color: 'var(--text)' }}
                      title={translations.edit || 'Edit'}
                    >
                      ✏️
                    </button>
                    {!list.isDefault && (
                      <button
                        onClick={() => handleSetDefault(list.id)}
                        className="px-2 py-1 rounded text-xs transition-colors"
                        style={{ backgroundColor: 'var(--btn)', color: 'var(--text)' }}
                        title={translations.setAsDefault || 'Set as Default'}
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="px-2 py-1 rounded text-xs transition-colors"
                      style={{ backgroundColor: 'var(--btn)', color: 'var(--text)' }}
                      title={translations.delete || 'Delete'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {userLists.customLists.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                {translations.noListsCreated || 'No lists created yet'}
              </p>
              <button
                onClick={handleCreateList}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                {translations.createYourFirstList || 'Create Your First List'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
          {translations.listsUsed || 'Lists used'}: {userLists.customLists.length}/{userLists.maxLists}
        </div>
      </div>

      {/* Other Layout Settings */}
      <div>
        <h4 className="text-lg font-medium mb-3" style={{ color: 'var(--text)' }}>{translations.basicCustomization}</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.layout.condensedView}
              onChange={(e) => settingsManager.updateSettings({
                layout: { ...settings.layout, condensedView: e.target.checked }
              })}
              className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
            />
            <span style={{ color: 'var(--text)' }}>{translations.condensedView}</span>
          </label>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.layout.episodeTracking}
              onChange={() => settingsManager.toggleEpisodeTracking()}
              className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-600 rounded focus:ring-blue-500"
            />
            <span style={{ color: 'var(--text)' }}>{translations.enableEpisodeTracking}</span>
          </label>
        </div>
      </div>

      {/* Pro Features */}
      {settings.pro.isPro && (
        <div>
          <h4 className="text-lg font-medium mb-3" style={{ color: 'var(--text)' }}>{translations.proFeatures}</h4>
          <p style={{ color: 'var(--muted)' }}>{translations.themePacksComingSoon}</p>
        </div>
      )}
    </div>
  );
}

function DataTab({ settings }: { settings: any }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Data</h3>
      <p className="text-neutral-400">Data management coming soon...</p>
    </div>
  );
}

function ProTab({ settings }: { settings: any }) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Pro</h3>
      <p className="text-neutral-400">Pro features coming soon...</p>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">About</h3>
      <p className="text-neutral-400">About information coming soon...</p>
    </div>
  );
}
