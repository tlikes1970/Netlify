// Minimal Firebase Firestore module - tree-shaken
export function getFirestore(app) {
  return {
    app: app,
    _deleted: false
  };
}

export function collection(firestore, path) {
  return {
    id: path,
    path: path,
    firestore: firestore
  };
}

export function doc(firestore, path, ...pathSegments) {
  return {
    id: pathSegments[pathSegments.length - 1] || path,
    path: path,
    firestore: firestore
  };
}

export function getDoc(docRef) {
  return Promise.resolve({
    exists: () => false,
    data: () => undefined,
    id: docRef.id,
    ref: docRef
  });
}

export function setDoc(docRef, data) {
  return Promise.resolve();
}

export function updateDoc(docRef, data) {
  return Promise.resolve();
}

export function deleteDoc(docRef) {
  return Promise.resolve();
}

export function addDoc(collectionRef, data) {
  return Promise.resolve({
    id: 'mock-doc-id',
    path: collectionRef.path + '/mock-doc-id'
  });
}

export function query(collectionRef, ...queryConstraints) {
  return {
    _query: {
      collection: collectionRef,
      constraints: queryConstraints
    }
  };
}

export function getDocs(query) {
  return Promise.resolve({
    docs: [],
    empty: true,
    size: 0
  });
}

export function where(field, op, value) {
  return { field, op, value };
}

export function orderBy(field, direction) {
  return { field, direction };
}

export function limit(count) {
  return { count };
}
