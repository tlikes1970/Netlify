// Check player area specific styling
const playerArea = document.querySelector('#group-2-community .community-left');
const playerSection = document.querySelector('#group-2-community #community-player');

if (playerArea) {
  const playerAreaStyles = getComputedStyle(playerArea);
  console.log('Player Area CSS:', {
    display: playerAreaStyles.display,
    height: playerAreaStyles.height,
    minHeight: playerAreaStyles.minHeight,
    flexDirection: playerAreaStyles.flexDirection,
    alignItems: playerAreaStyles.alignItems,
    justifyContent: playerAreaStyles.justifyContent
  });
}

if (playerSection) {
  const playerSectionStyles = getComputedStyle(playerSection);
  console.log('Player Section CSS:', {
    display: playerSectionStyles.display,
    height: playerSectionStyles.height,
    minHeight: playerSectionStyles.minHeight,
    width: playerSectionStyles.width,
    padding: playerSectionStyles.padding,
    margin: playerSectionStyles.margin
  });
  
  // Check if player section has content
  console.log('Player Section content:', playerSection.innerHTML.length > 0 ? 'Has content' : 'Empty');
  console.log('Player Section children:', playerSection.children.length);
}

