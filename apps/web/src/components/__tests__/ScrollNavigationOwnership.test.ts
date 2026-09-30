import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

// Check the actual JSX ownership graph without booting authentication/network services.
function mounts(path: string, name: string) {
  const source = ts.createSourceFile(path, readFileSync(new URL(path, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const result: ts.Node[] = [];
  function visit(node: ts.Node) {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && node.tagName.getText(source) === name) result.push(node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return { source, result };
}

describe('page scroll-control ownership', () => {
  it.each(['home', 'library', 'discovery'])('%s uses the single App owner outside pull-to-refresh', view => {
    const { source, result } = mounts('../../App.tsx', 'ScrollToTopArrow');
    expect(result).toHaveLength(1);
    const mount = result[0];
    expect(mount.parent.parent.getText(source)).toContain('["home", "library", "discovery"].includes(view)');
    expect(mount.getText(source)).toContain('key={view}');
    let ancestor = mount.parent;
    while (ancestor) {
      if (ts.isJsxElement(ancestor)) {
        expect(ancestor.openingElement.tagName.getText(source)).not.toBe('PullToRefreshWrapper');
      }
      ancestor = ancestor.parent;
    }
    const condition = mount.parent.parent.getText(source);
    expect(condition).toContain('!searchActive');
    expect(condition).toContain('"' + view + '"');
  });

  it('has no second Home or nested Library control', () => {
    expect(mounts('../../App.tsx', 'HomeDownArrow').result).toHaveLength(0);
    expect(mounts('../../pages/ListPage.tsx', 'ScrollToTopArrow').result).toHaveLength(0);
    expect(mounts('../../pages/LibraryPage.tsx', 'ScrollToTopArrow').result).toHaveLength(0);
    expect(mounts('../../pages/DiscoveryPage.tsx', 'ScrollToTopArrow').result).toHaveLength(0);
  });
});
