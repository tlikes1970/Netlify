import type {LanguageStrings} from '../lib/language.types';
/** Optional Help topics backed by the existing EN/ES dictionary. */
export const HELP_TOPICS: {id:string;title:keyof LanguageStrings;paragraphs:(keyof LanguageStrings)[]}[] = [
  {
    "id": "welcome",
    "title": "help_welcome_title",
    "paragraphs": [
      "help_welcome_0",
      "help_welcome_1"
    ]
  },
  {
    "id": "getting-started",
    "title": "help_getting_started_title",
    "paragraphs": [
      "help_getting_started_0",
      "help_getting_started_1"
    ]
  },
  {
    "id": "managing-library",
    "title": "help_managing_library_title",
    "paragraphs": [
      "help_managing_library_0",
      "help_managing_library_1",
      "help_managing_library_2",
      "help_managing_library_3",
      "help_managing_library_4"
    ]
  },
  {
    "id": "discovery-search",
    "title": "help_discovery_search_title",
    "paragraphs": [
      "help_discovery_search_0",
      "help_discovery_search_1"
    ]
  },
  {
    "id": "notifications",
    "title": "help_notifications_title",
    "paragraphs": [
      "help_notifications_0",
      "help_notifications_1"
    ]
  },
  {
    "id": "settings-customization",
    "title": "help_settings_customization_title",
    "paragraphs": [
      "help_settings_customization_0",
      "help_settings_customization_1",
      "help_settings_customization_2"
    ]
  },
  {
    "id": "full-access",
    "title": "help_full_access_title",
    "paragraphs": [
      "help_full_access_0",
      "help_full_access_1",
      "help_full_access_2"
    ]
  },
  {
    "id": "data-sharing",
    "title": "help_data_sharing_title",
    "paragraphs": [
      "help_data_sharing_0",
      "help_data_sharing_1",
      "help_data_sharing_2"
    ]
  },
  {
    "id": "troubleshooting",
    "title": "help_troubleshooting_title",
    "paragraphs": [
      "help_troubleshooting_0",
      "help_troubleshooting_1",
      "help_troubleshooting_2"
    ]
  },
  {
    "id": "keyboard-shortcuts",
    "title": "help_keyboard_shortcuts_title",
    "paragraphs": [
      "help_keyboard_shortcuts_0",
      "help_keyboard_shortcuts_1",
      "help_keyboard_shortcuts_2"
    ]
  },
  {
    "id": "accessibility",
    "title": "help_accessibility_title",
    "paragraphs": [
      "help_accessibility_0"
    ]
  },
  {
    "id": "about",
    "title": "help_about_title",
    "paragraphs": [
      "help_about_0"
    ]
  },
  {id:"custom-lists",title:"help_custom_lists_title",paragraphs:["help_custom_lists_0","help_custom_lists_1"]},
  {id:"account",title:"help_account_title",paragraphs:["help_account_0","help_account_1","help_account_2"]},
  {id:"support",title:"help_support_title",paragraphs:["help_support_0","help_support_1"]}
];
