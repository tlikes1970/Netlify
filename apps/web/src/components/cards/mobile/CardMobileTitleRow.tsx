import { CompactOverflowMenu } from '../../../features/compact/CompactOverflowMenu';
import type { ActionItem, ActionContext } from '../../../features/compact/actionsMap';
import type { CardActionHandlers } from '../card.types';
type CardMobileTitleRowProps = {
  title: string;
  item: ActionItem;
  context: ActionContext;
  actions?: CardActionHandlers;
};

/** Title + overflow button row — prevents long titles from overlapping the menu tap target. */
export function CardMobileTitleRow({
  title,
  item,
  context,
  actions,
}: CardMobileTitleRowProps) {
  return (
    <div className="card-mobile-title-row">
      <h3 className="card-mobile-title" title={title}>
        {title}
      </h3>
      <div className="card-mobile-overflow-slot">
        <CompactOverflowMenu
          item={item}
          context={context}
          actions={actions}
          showText={false}
        />
      </div>
    </div>
  );
}
