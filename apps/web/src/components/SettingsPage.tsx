import React, { useState, useEffect } from 'react';
import { useSettings, settingsManager, PersonalityLevel, Theme, getPersonalityText } from '../lib/settings';
import { useTranslations, useLanguage, changeLanguage } from '../lib/language';
import { useCustomLists, customListManager } from '../lib/customLists';
import { useUsername } from '../hooks/useUsername';
import { addTestData, clearTestData, populateNextAirDates } from '../lib/testData';
import PersonalityExamples from './PersonalityExamples';
import PersonalityTest from './PersonalityTest';
import ForYouGenreConfig from './ForYouGenreConfig';
import type { Language } from '../lib/language.types';

type SettingsTab = 'general' | 'notifications' | 'layout' | 'data' | 'pro' | 'about' | 'test' | 'social' | 'community';

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
    { id: 'social' as const, label: '👥 Social' },
    { id: 'community' as const, label: '🏆 Community' },
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
                  {activeTab === 'social' && <SocialTab settings={settings} />}
                  {activeTab === 'community' && <CommunityTab settings={settings} />}
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

      {/* For You Section Configuration */}
      <div>
        <h4 className="text-lg font-medium mb-3" style={{ color: 'var(--text)' }}>
          For You Section Configuration
        </h4>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          Customize the three "For You" rows on your home page. Each row combines a main genre with a subgenre for personalized recommendations.
        </p>
        
        <ForYouGenreConfig />
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
  const translations = useTranslations();
  
  const handleAddTestData = () => {
    addTestData();
    alert('Test data added! Check your tabs to see the sample movies and TV shows.');
  };
  
  const handleClearTestData = () => {
    if (window.confirm('Are you sure you want to clear all test data? This cannot be undone.')) {
      clearTestData();
      alert('Test data cleared!');
    }
  };
  
  const handlePopulateNextAirDates = async () => {
    try {
      await populateNextAirDates();
      alert('Next air dates populated! Check the "Up Next" section on the home page.');
    } catch (error) {
      alert('Failed to populate next air dates. Check the console for details.');
      console.error('Error populating next air dates:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>{translations.data}</h3>
      
      {/* Development Tools */}
      <div>
        <h4 className="text-lg font-medium mb-3" style={{ color: 'var(--text)' }}>Development Tools</h4>
        <div className="space-y-3">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)', border: '1px solid' }}>
            <h5 className="font-medium mb-2" style={{ color: 'var(--text)' }}>Test Data</h5>
            <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
              Add sample movies and TV shows to test the app functionality.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAddTestData}
                className="px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                Add Test Data
              </button>
              <button
                onClick={handleClearTestData}
                className="px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
              >
                Clear Test Data
              </button>
              <button
                onClick={handlePopulateNextAirDates}
                className="px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ backgroundColor: 'var(--pro)', color: 'white' }}
              >
                Populate Next Air Dates
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Data Management */}
      <div>
        <h4 className="text-lg font-medium mb-3" style={{ color: 'var(--text)' }}>Data Management</h4>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {translations.dataManagementComingSoon || 'Data management features coming soon...'}
        </p>
      </div>
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
      <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>🏠 About Unique4U</h3>
      
      <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
        <p>
          We're not here to reinvent the wheel — we're here to make the wheel less squeaky. At Unique4U, our rule is simple: keep it simple. The world already has enough apps that feel like a second job to use. We'd rather give you tools that just… work.
        </p>
        
        <p>
          Everything we build has its own personality, but they all live under one roof: a people-first, all-inclusive, slightly offbeat house we call Unique4U. If it's fun, useful, and a little different from the pack — it belongs here.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>👥 About the Creators</h4>
        
        <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          <p>
            We're Pam and Travis. Think of us as casual builders with a shared allergy to overcomplication. We make things because we need them, and we figure you probably do too.
          </p>
          
          <p>
            Pam once trained dolphins (true story) and also happens to be really good with numbers. Travis studied English and Philosophy, which means he can overthink and explain it in writing, then somehow turn that into practical business know-how. Together, we're like a mash-up of "creative meets operations" — and that combo lets us build apps that are simple, useful, and not boring.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>📱 About the App</h4>
        
        <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
          <p>
            Here's the deal: you want to remember what you're watching without needing a PhD in App Navigation. We built this because we got tired of two bad options — messy notes on our phones or bloated apps that make you log your "episode 7 mid-season thoughts." (Hard pass.)
          </p>
          
          <p className="text-xs italic" style={{ color: 'var(--muted)' }}>
            Data Attribution: This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          
          <p>
            So we made this instead:
          </p>
          
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span><strong>Stupidly easy.</strong> Open it, add your show, done.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span><strong>Always free at the core.</strong> No paywalls for the basics.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5">•</span>
              <span><strong>Friend-proof sharing.</strong> Copy your list and drop it in a text when someone asks, "What should I watch?"</span>
            </li>
          </ul>
          
          <p>
            If you watch TV or movies and don't want to make it a hobby just to track them, this app's for you. Simple lists, zero drama.
          </p>
        </div>
      </div>
    </div>
  );
}

// Social Features Tab
function SocialTab({ settings }: { settings: any }) {
  const translations = useTranslations();
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>👥 Social Features</h3>
      
      {/* Coming Soon Notice */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Coming Soon!</h4>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            Social features are in development. Here's what we're planning:
          </p>
        </div>
      </div>

      {/* Planned Features */}
      <div className="space-y-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)', border: '1px solid' }}>
          <h5 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>👥 Friend Connections</h5>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Connect with friends and see what they're watching
          </p>
        </div>
        
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)', border: '1px solid' }}>
          <h5 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>📋 Shared Watchlists</h5>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Create collaborative watchlists with friends and family
          </p>
        </div>
        
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)', border: '1px solid' }}>
          <h5 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>💬 Activity Feed</h5>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            See what your friends are watching and their ratings
          </p>
        </div>
        
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)', border: '1px solid' }}>
          <h5 className="font-semibold mb-2" style={{ color: 'var(--text)' }}>🎯 Recommendations</h5>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Get personalized recommendations based on your friends' tastes
          </p>
        </div>
      </div>

      {/* Pro Features */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(77, 163, 255, 0.1)', borderColor: 'var(--accent)', border: '1px solid' }}>
        <h5 className="font-semibold mb-2" style={{ color: 'var(--accent)' }}>🔒 Pro Features</h5>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Advanced social features like private groups, custom recommendations, and priority support will be available with Pro.
        </p>
      </div>
    </div>
  );
}

// Community Stats Tab
function CommunityTab({ settings }: { settings: any }) {
  const translations = useTranslations();
  
  // Mock stats - in a real app, these would come from the backend
  const userStats = {
    games: {
      flickword: { played: 12, won: 8, lost: 4, streak: 3, bestStreak: 7 },
      trivia: { played: 25, won: 18, lost: 7, correct: 89, total: 125 }
    },
    media: {
      movies: { watching: 5, wishlist: 12, watched: 47 },
      tv: { watching: 8, wishlist: 15, watched: 23 }
    },
    community: {
      friends: 0,
      sharedLists: 0,
      recommendationsGiven: 0,
      recommendationsReceived: 0
    }
  };

  const getWinRate = (won: number, played: number) => {
    return played > 0 ? Math.round((won / played) * 100) : 0;
  };

  const getAccuracy = (correct: number, total: number) => {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>🏆 Community Stats</h3>
      
      {/* Game Statistics */}
      <div>
        <h4 className="text-lg font-medium mb-3" style={{ color: 'var(--text)' }}>🎮 Game Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FlickWord Stats */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
            <h5 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>🎯 FlickWord</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Games Played:</span>
                <span style={{ color: 'var(--text)' }}>{userStats.games.flickword.played}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Win Rate:</span>
                <span style={{ color: 'var(--text)' }}>{getWinRate(userStats.games.flickword.won, userStats.games.flickword.played)}%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Current Streak:</span>
                <span style={{ color: 'var(--text)' }}>{userStats.games.flickword.streak}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Best Streak:</span>
                <span style={{ color: 'var(--text)' }}>{userStats.games.flickword.bestStreak}</span>
              </div>
            </div>
          </div>

          {/* Trivia Stats */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
            <h5 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>🧠 Trivia</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Games Played:</span>
                <span style={{ color: 'var(--text)' }}>{userStats.games.trivia.played}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Win Rate:</span>
                <span style={{ color: 'var(--text)' }}>{getWinRate(userStats.games.trivia.won, userStats.games.trivia.played)}%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Accuracy:</span>
                <span style={{ color: 'var(--text)' }}>{getAccuracy(userStats.games.trivia.correct, userStats.games.trivia.total)}%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Questions Correct:</span>
                <span style={{ color: 'var(--text)' }}>{userStats.games.trivia.correct}/{userStats.games.trivia.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Statistics */}
      <div>
        <h4 className="text-lg font-medium mb-3" style={{ color: 'var(--text)' }}>📺 Media Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Movies */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
            <h5 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>🎬 Movies</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Currently Watching:</span>
                <span style={{ color: 'var(--text)' }}>{userStats.media.movies.watching}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Want to Watch:</span>
                <span style={{ color: 'var(--text)' }}>{userStats.media.movies.wishlist}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Watched:</span>
                <span style={{ color: 'var(--text)' }}>{userStats.media.movies.watched}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span style={{ color: 'var(--text)' }}>Total:</span>
                <span style={{ color: 'var(--text)' }}>
                  {userStats.media.movies.watching + userStats.media.movies.wishlist + userStats.media.movies.watched}
                </span>
              </div>
            </div>
          </div>

          {/* TV Shows */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
            <h5 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>📺 TV Shows</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Currently Watching:</span>
                <span style={{ color: 'var(--text)' }}>{userStats.media.tv.watching}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Want to Watch:</span>
                <span style={{ color: 'var(--text)' }}>{userStats.media.tv.wishlist}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Watched:</span>
                <span style={{ color: 'var(--text)' }}>{userStats.media.tv.watched}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span style={{ color: 'var(--text)' }}>Total:</span>
                <span style={{ color: 'var(--text)' }}>
                  {userStats.media.tv.watching + userStats.media.tv.wishlist + userStats.media.tv.watched}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Engagement */}
      <div>
        <h4 className="text-lg font-medium mb-3" style={{ color: 'var(--text)' }}>👥 Community Engagement</h4>
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--line)', border: '1px solid' }}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Friends Connected:</span>
              <span style={{ color: 'var(--text)' }}>{userStats.community.friends}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Shared Lists:</span>
              <span style={{ color: 'var(--text)' }}>{userStats.community.sharedLists}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Recommendations Given:</span>
              <span style={{ color: 'var(--text)' }}>{userStats.community.recommendationsGiven}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Recommendations Received:</span>
              <span style={{ color: 'var(--text)' }}>{userStats.community.recommendationsReceived}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboards Coming Soon */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)', border: '1px solid' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Leaderboards Coming Soon!</h4>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Compete with friends and the community in weekly challenges and leaderboards.
          </p>
        </div>
      </div>
    </div>
  );
}
