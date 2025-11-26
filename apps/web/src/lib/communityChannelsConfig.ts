/**
 * Process: Community Channels Firestore Config
 * Purpose: Global config for community player channels, backed by Firestore with static fallback
 * Data Source: Firestore appConfig/communityChannels, fallback to communityChannels.ts
 * Update Path: Admin UI writes to Firestore, all users read from Firestore (or fallback)
 * Dependencies: firebaseBootstrap (db), communityChannels.ts (defaults)
 * 
 * SECURITY EXPECTATIONS (implement in Firestore rules):
 * - Reads: Allowed for all authenticated users (or all users if app allows anonymous)
 * - Writes: Restricted to users with admin role (custom claims: role === "admin")
 */

import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebaseBootstrap";
import { 
  COMMUNITY_CHANNELS, 
  type CommunityChannel 
} from "../data/communityChannels";

/**
 * Firestore document shape for community channels config
 * Collection: appConfig
 * Document: communityChannels
 */
export interface CommunityChannelsConfig {
  /** Array of channel configurations */
  channels: CommunityChannel[];
  /** When the config was last updated */
  updatedAt: Timestamp | null;
  /** User ID or email of admin who last updated */
  updatedBy?: string;
}

/** Firestore collection and document paths */
const CONFIG_COLLECTION = "appConfig";
const CONFIG_DOC = "communityChannels";

/**
 * Load community channels config from Firestore
 * Falls back to static defaults if Firestore is unavailable or doc doesn't exist
 * 
 * @returns Promise resolving to channels array
 */
export async function loadCommunityChannelsConfig(): Promise<CommunityChannel[]> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as CommunityChannelsConfig;
      console.log("🎬 [ChannelsConfig] Loaded from Firestore:", data.channels?.length, "channels");
      
      // Validate we got an array
      if (Array.isArray(data.channels) && data.channels.length > 0) {
        return data.channels;
      }
      
      console.warn("🎬 [ChannelsConfig] Firestore doc exists but channels invalid, using defaults");
      return [...COMMUNITY_CHANNELS];
    }

    console.log("🎬 [ChannelsConfig] No Firestore doc found, using static defaults");
    return [...COMMUNITY_CHANNELS];
  } catch (error) {
    console.error("🎬 [ChannelsConfig] Error loading from Firestore, using defaults:", error);
    return [...COMMUNITY_CHANNELS];
  }
}

/**
 * Load full config including metadata (for admin display)
 * 
 * @returns Promise resolving to full config or null if not found
 */
export async function loadCommunityChannelsConfigWithMeta(): Promise<CommunityChannelsConfig | null> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as CommunityChannelsConfig;
      return data;
    }

    return null;
  } catch (error) {
    console.error("🎬 [ChannelsConfig] Error loading config with meta:", error);
    return null;
  }
}

/**
 * Save community channels config to Firestore
 * Should only be called by admins - enforce this in calling code and Firestore rules
 * 
 * @param channels - Array of channel configurations to save
 * @param updatedBy - User ID or email of the admin making the change
 * @returns Promise resolving to success boolean
 */
export async function saveCommunityChannelsConfig(
  channels: CommunityChannel[],
  updatedBy: string
): Promise<boolean> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC);
    
    const config: CommunityChannelsConfig = {
      channels,
      updatedAt: serverTimestamp() as Timestamp,
      updatedBy,
    };

    await setDoc(docRef, config);
    console.log("🎬 [ChannelsConfig] Saved to Firestore:", channels.length, "channels by", updatedBy);
    return true;
  } catch (error) {
    console.error("🎬 [ChannelsConfig] Error saving to Firestore:", error);
    return false;
  }
}

/**
 * Reset config to static defaults and save to Firestore
 * This writes the defaults to Firestore so all users see the reset
 * 
 * @param updatedBy - User ID or email of the admin making the change
 * @returns Promise resolving to success boolean
 */
export async function resetCommunityChannelsToDefaults(
  updatedBy: string
): Promise<boolean> {
  return saveCommunityChannelsConfig([...COMMUNITY_CHANNELS], updatedBy);
}

/**
 * Get static default channels (for comparison or initial seed)
 */
export function getDefaultChannels(): CommunityChannel[] {
  return [...COMMUNITY_CHANNELS];
}

