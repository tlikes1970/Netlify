/**
 * Boot Collector - Defers emission until both dict and locale are ready
 * 
 * Prevents initialization burst by collecting dict and locale separately
 * and emitting only once when both are available.
 */

import { queueUpdate, type Dict } from './translationStore';

type BootState = { dict?: Dict; locale?: string; ready: boolean };

const boot: BootState = { ready: false };

export function stageBootDict(dict: Dict) {
  boot.dict = dict;
  tryEmitBoot();
}

export function stageBootLocale(locale: string) {
  boot.locale = locale;
  tryEmitBoot();
}

function tryEmitBoot() {
  if (!boot.ready && boot.dict && boot.locale) {
    boot.ready = true;
    queueUpdate({ type: 'dict', dict: boot.dict });
    queueUpdate({ type: 'locale', locale: boot.locale });
  }
}

/**
 * Reset boot state (for testing or re-initialization)
 */
export function resetBootState() {
  boot.dict = undefined;
  boot.locale = undefined;
  boot.ready = false;
}

