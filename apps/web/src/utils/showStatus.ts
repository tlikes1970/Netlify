export type ShowStatus = 'Ended' | 'Returning Series' | 'In Production' | 'Canceled' | 'Planned';

export interface ShowStatusInfo {
  badge: string;
  color: string;
  backgroundColor: string;
  isCompleted: boolean;
}

export function getShowStatusInfo(status?: ShowStatus): ShowStatusInfo | null {
  if (!status) return null;

  switch (status) {
    case 'Ended':
      return {
        badge: 'ENDED',
        color: 'white',
        backgroundColor: 'var(--muted)',
        isCompleted: true
      };
    
    case 'Canceled':
      return {
        badge: 'CANCELLED',
        color: 'white',
        backgroundColor: '#dc2626', // red-600
        isCompleted: true
      };
    
    case 'Returning Series':
      return {
        badge: 'RETURNING',
        color: 'white',
        backgroundColor: '#16a34a', // green-600
        isCompleted: false
      };
    
    case 'In Production':
      return {
        badge: 'IN PRODUCTION',
        color: 'white',
        backgroundColor: '#ea580c', // orange-600
        isCompleted: false
      };
    
    case 'Planned':
      return {
        badge: 'PLANNED',
        color: 'white',
        backgroundColor: '#7c3aed', // violet-600
        isCompleted: false
      };
    
    default:
      return null;
  }
}

export function formatLastAirDate(lastAirDate?: string): string {
  if (!lastAirDate) return '';
  
  try {
    const date = new Date(lastAirDate);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return lastAirDate;
  }
}
