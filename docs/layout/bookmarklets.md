# Layout Forensics Bookmarklets

One-liner bookmarklets to run layout analysis in any environment.

## Quick Analysis
```javascript
javascript:(function(){const s=document.createElement('script');s.src='data:text/javascript;base64,'+btoa(`
(function layoutForensics() {
  'use strict';
  const TARGETS = ['#group-1-your-shows','#group-2-community','#group-3-for-you','#group-4-theaters','#group-5-feedback','.home-preview-row','.section-content','.preview-row-container','.preview-row-scroll','.row-inner','#currentlyWatchingScroll','#curated-section','#curatedSections','.curated-row','.card','.card-actions','.actions','.card-container'];
  const LAYOUT_PROPS = ['display','position','boxSizing','width','maxWidth','minWidth','height','paddingLeft','paddingRight','marginLeft','marginRight','overflow','overflowX','overflowY','flex','flexWrap','flexDirection','justifyContent','alignItems','gap','gridTemplateColumns','gridAutoColumns','gridAutoRows','whiteSpace','wordBreak','overflowWrap','containerType','containerName','zIndex'];
  const $ = (sel) => [...document.querySelectorAll(sel)];
  const getRect = (el) => el?.getBoundingClientRect?.() || { width: 0, height: 0, left: 0, top: 0 };
  const getStyle = (el) => el ? getComputedStyle(el) : {};
  const round = (n) => Math.round(n || 0);
  function analyzeElement(element, selector) {
    const rect = getRect(element);
    const style = getStyle(element);
    return {
      selector,
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: element.className.split(' ').filter(Boolean),
      dimensions: { width: round(rect.width), height: round(rect.height), left: round(rect.left), top: round(rect.top) },
      boxModel: { paddingTop: round(parseFloat(style.paddingTop)), paddingRight: round(parseFloat(style.paddingRight)), paddingBottom: round(parseFloat(style.paddingBottom)), paddingLeft: round(parseFloat(style.paddingLeft)), marginTop: round(parseFloat(style.marginTop)), marginRight: round(parseFloat(style.marginRight)), marginBottom: round(parseFloat(style.marginBottom)), marginLeft: round(parseFloat(style.marginLeft)) },
      layout: { display: style.display, position: style.position, boxSizing: style.boxSizing, overflow: style.overflow, flexDirection: style.flexDirection, justifyContent: style.justifyContent, alignItems: style.alignItems, gap: style.gap },
      visible: rect.width > 0 && rect.height > 0,
      inViewport: rect.left >= 0 && rect.top >= 0 && rect.left < window.innerWidth && rect.top < window.innerHeight
    };
  }
  const results = { timestamp: new Date().toISOString(), elements: [], summary: { totalElements: 0, visibleElements: 0, sections: {}, issues: [] } };
  TARGETS.forEach(selector => {
    const elements = $(selector);
    elements.forEach((element, index) => {
      const analysis = analyzeElement(element, selector);
      analysis.index = index;
      results.elements.push(analysis);
      results.summary.totalElements++;
      if (analysis.visible) results.summary.visibleElements++;
      const sectionId = element.closest('[id^="group-"]')?.id || 'unknown';
      if (!results.summary.sections[sectionId]) results.summary.sections[sectionId] = 0;
      results.summary.sections[sectionId]++;
    });
  });
  window.__layoutForensics = results;
  console.log('🔍 Layout Forensics Complete');
  console.table(results.summary.sections);
  const elementTable = results.elements.map(el => ({ selector: el.selector, tag: el.tagName, id: el.id || '-', classes: el.classes.slice(0, 2).join(' '), size: \`\${el.dimensions.width}×\${el.dimensions.height}\`, display: el.layout.display, position: el.layout.position, visible: el.visible ? '✅' : '❌' }));
  console.table(elementTable);
  return results;
})();
`);document.head.appendChild(s);s.onload=()=>{s.remove();window.layoutForensics();}})();
```

## Full Analysis (with cascade info)
```javascript
javascript:(function(){const s=document.createElement('script');s.src='data:text/javascript;base64,'+btoa(`
(function layoutForensics() {
  'use strict';
  const TARGETS = ['#group-1-your-shows','#group-2-community','#group-3-for-you','#group-4-theaters','#group-5-feedback','.home-preview-row','.section-content','.preview-row-container','.preview-row-scroll','.row-inner','#currentlyWatchingScroll','#curated-section','#curatedSections','.curated-row','.card','.card-actions','.actions','.card-container'];
  const LAYOUT_PROPS = ['display','position','boxSizing','width','maxWidth','minWidth','height','paddingLeft','paddingRight','marginLeft','marginRight','overflow','overflowX','overflowY','flex','flexWrap','flexDirection','justifyContent','alignItems','gap','gridTemplateColumns','gridAutoColumns','gridAutoRows','whiteSpace','wordBreak','overflowWrap','containerType','containerName','zIndex'];
  const $ = (sel) => [...document.querySelectorAll(sel)];
  const getRect = (el) => el?.getBoundingClientRect?.() || { width: 0, height: 0, left: 0, top: 0 };
  const getStyle = (el) => el ? getComputedStyle(el) : {};
  const round = (n) => Math.round(n || 0);
  function getCascadeInfo(element, property) {
    if (!element) return null;
    const style = getStyle(element);
    const value = style[property];
    let specificity = 0;
    const rules = [];
    if (element.style && element.style[property]) { specificity += 1000; rules.push('inline'); }
    if (element.className) { const classCount = element.className.split(' ').length; specificity += classCount * 10; rules.push(\`classes:\${classCount}\`); }
    if (element.id) { specificity += 100; rules.push(\`id:\${element.id}\`); }
    return { value, specificity: { score: specificity, rules }, source: 'computed', important: style.getPropertyPriority(property) === 'important' };
  }
  function analyzeElement(element, selector) {
    const rect = getRect(element);
    const style = getStyle(element);
    const cascade = {};
    LAYOUT_PROPS.forEach(prop => { cascade[prop] = getCascadeInfo(element, prop); });
    return {
      selector,
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: element.className.split(' ').filter(Boolean),
      dimensions: { width: round(rect.width), height: round(rect.height), left: round(rect.left), top: round(rect.top) },
      boxModel: { paddingTop: round(parseFloat(style.paddingTop)), paddingRight: round(parseFloat(style.paddingRight)), paddingBottom: round(parseFloat(style.paddingBottom)), paddingLeft: round(parseFloat(style.paddingLeft)), marginTop: round(parseFloat(style.marginTop)), marginRight: round(parseFloat(style.marginRight)), marginBottom: round(parseFloat(style.marginBottom)), marginLeft: round(parseFloat(style.marginLeft)) },
      layout: { display: style.display, position: style.position, boxSizing: style.boxSizing, overflow: style.overflow, flexDirection: style.flexDirection, justifyContent: style.justifyContent, alignItems: style.alignItems, gap: style.gap },
      cascade,
      visible: rect.width > 0 && rect.height > 0,
      inViewport: rect.left >= 0 && rect.top >= 0 && rect.left < window.innerWidth && rect.top < window.innerHeight
    };
  }
  const results = { timestamp: new Date().toISOString(), context: { viewport: { width: window.innerWidth, height: window.innerHeight }, breakpoints: { mobile: window.innerWidth <= 480, mobileLg: window.innerWidth <= 640, tablet: window.innerWidth <= 768, desktop: window.innerWidth >= 1024 } }, elements: [], summary: { totalElements: 0, visibleElements: 0, sections: {}, issues: [] } };
  TARGETS.forEach(selector => {
    const elements = $(selector);
    elements.forEach((element, index) => {
      const analysis = analyzeElement(element, selector);
      analysis.index = index;
      results.elements.push(analysis);
      results.summary.totalElements++;
      if (analysis.visible) results.summary.visibleElements++;
      const sectionId = element.closest('[id^="group-"]')?.id || 'unknown';
      if (!results.summary.sections[sectionId]) results.summary.sections[sectionId] = 0;
      results.summary.sections[sectionId]++;
      if (analysis.dimensions.width === 0 && analysis.visible) {
        results.summary.issues.push({ type: 'zero-width', selector, element: analysis, message: 'Element has zero width but is visible' });
      }
      if (analysis.layout.display === 'none' && analysis.visible) {
        results.summary.issues.push({ type: 'hidden-visible', selector, element: analysis, message: 'Element has display:none but appears visible' });
      }
    });
  });
  window.__layoutForensics = results;
  console.log('🔍 Layout Forensics Complete');
  console.table(results.summary.sections);
  if (results.summary.issues.length > 0) {
    console.warn('⚠️  Potential Issues Found:');
    results.summary.issues.forEach(issue => { console.warn(\`- \${issue.type}: \${issue.message}\`, issue.element); });
  }
  const elementTable = results.elements.map(el => ({ selector: el.selector, tag: el.tagName, id: el.id || '-', classes: el.classes.slice(0, 2).join(' '), size: \`\${el.dimensions.width}×\${el.dimensions.height}\`, display: el.layout.display, position: el.layout.position, visible: el.visible ? '✅' : '❌' }));
  console.table(elementTable);
  return results;
})();
`);document.head.appendChild(s);s.onload=()=>{s.remove();window.layoutForensics();}})();
```

## Usage Instructions

1. **Copy** one of the bookmarklets above
2. **Create** a new bookmark in your browser
3. **Paste** the bookmarklet as the URL
4. **Click** the bookmark on any page to run the analysis
5. **Check** the browser console for results

## What You Get

- **Element dimensions** and positioning
- **CSS cascade** information for layout properties
- **Box model** calculations (padding, margins, borders)
- **Layout properties** (display, flex, grid, etc.)
- **Visibility** and viewport status
- **Potential issues** detection
- **Summary tables** in console

## Advanced Usage

After running the analysis, access detailed data:

```javascript
// Get all results
window.__layoutForensics

// Get specific section elements
window.__layoutForensics.elements.filter(el => el.selector === '#group-1-your-shows')

// Get elements with issues
window.__layoutForensics.summary.issues

// Get cascade info for specific element
const element = document.querySelector('#currentlyWatchingScroll');
const analysis = window.__layoutForensics.elements.find(el => el.id === 'currentlyWatchingScroll');
console.log(analysis.cascade.width);
```



