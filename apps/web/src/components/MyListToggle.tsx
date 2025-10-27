import { useState } from 'react';
import ListSelectorModal from './ListSelectorModal';
import type { MediaItem } from './cards/card.types';

interface MyListToggleProps {
  item: MediaItem;
}

export default function MyListToggle({ item }: MyListToggleProps) {
  const [showModal, setShowModal] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent triggering parent poster click
    setIsPressed(true);
    // Always show modal for list selection
    setShowModal(true);
    setTimeout(() => setIsPressed(false), 200);
  };

  const handleLongPress = () => {
    setShowModal(true);
  };

  const getButtonText = () => {
    return 'My List +';
  };

  return (
    <>
      <button
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation(); // Prevent triggering parent poster click
          handleLongPress();
        }}
        className={`absolute right-1.5 top-1.5 rounded-full border bg-background/80 px-2 py-0.5 text-[11px] leading-none backdrop-blur transition hover:bg-accent hover:text-accent-foreground ${
          isPressed ? 'scale-95 opacity-80' : 'hover:scale-105 hover:opacity-90'
        } cursor-pointer`}
        style={{ 
          backgroundColor: isPressed ? 'var(--accent)' : 'rgba(0,0,0,0.8)', 
          color: 'white', 
          borderColor: 'rgba(255,255,255,0.15)', 
          border: '1px solid' 
        }}
        disabled={isPressed}
        title="Right-click to choose list"
        data-testid="cardv2-mylist"
      >
        {getButtonText()}
      </button>

      <ListSelectorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        item={item}
      />
    </>
  );
}
