// Minimal Firebase App module - tree-shaken
export function initializeApp(config) {
  return {
    name: config.projectId || 'flicklet-app',
    options: config,
    _deleted: false
  };
}

export function getApp(name) {
  return {
    name: name || 'flicklet-app',
    options: {},
    _deleted: false
  };
}

export function getApps() {
  return [];
}
