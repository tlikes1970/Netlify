export type ListName = 'watching' | 'wishlist' | 'watched' | 'not' | `custom:${string}`;

export interface CustomList {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: number;
  itemCount: number;
  isDefault?: boolean;
}

export interface UserLists {
  customLists: CustomList[];
  selectedListId?: string;
  maxLists: number;
}
