#!/usr/bin/env node
/**
 * Layout Forensics Analyzer
 * 
 * Analyzes home page card layouts and gutters by examining:
 * - Element dimensions and computed styles
 * - CSS cascade for layout properties
 * - Runtime style mutations
 * - Container and media query contexts
 * 
 * Usage:
 * - Browser: Copy-paste into console or use bookmarklet
 * - Node: node scripts/dev/layoutForensics.js
 */

(function layoutForensics() {
  'use strict';
  
  // Target selectors for analysis
  const TARGETS = [
    // Home page sections
    '#group-1-your-shows', '#group-2-community', '#group-3-for-you', 
    '#group-4-theaters', '#group-5-feedback',
    
    // Row/rail containers
    '.home-preview-row', '.section-content', '.preview-row-container', 
    '.preview-row-scroll', '.row-inner', '#currentlyWatchingScroll', 
    '#curated-section', '#curatedSections', '.curated-row',
    
    // Card components
    '.card', '.card-actions', '.actions', '.card-container'
  ];
  
  // Layout properties to analyze
  const LAYOUT_PROPS = [
    'display', 'position', 'boxSizing', 'width', 'maxWidth', 'minWidth', 
    'height', 'paddingLeft', 'paddingRight', 'marginLeft', 'marginRight', 
    'overflow', 'overflowX', 'overflowY', 'flex', 'flexWrap', 'flexDirection',
    'justifyContent', 'alignItems', 'gap', 'gridTemplateColumns', 
    'gridAutoColumns', 'gridAutoRows', 'whiteSpace', 'wordBreak', 
    'overflowWrap', 'containerType', 'containerName', 'zIndex'
  ];
  
  // Utility functions
  const $ = (sel) => [...document.querySelectorAll(sel)];
  const getRect = (el) => el?.getBoundingClientRect?.() || { width: 0, height: 0, left: 0, top: 0 };
  const getStyle = (el) => el ? getComputedStyle(el) : {};
  const round = (n) => Math.round(n || 0);
  
  // Get cascade information for a property
  function getCascadeInfo(element, property) {
    if (!element) return null;
    
    const style = getStyle(element);
    const value = style[property];
    const specificity = getSpecificity(element, property);
    
    return {
      value,
      specificity,
      source: 'computed',
      important: style.getPropertyPriority(property) === 'important'
    };
  }
  
  // Calculate CSS specificity (simplified)
  function getSpecificity(element, property) {
    let specificity = 0;
    const rules = [];
    
    // Check inline styles
    if (element.style && element.style[property]) {
      specificity += 1000;
      rules.push('inline');
    }
    
    // Check classes
    if (element.className) {
      const classCount = element.className.split(' ').length;
      specificity += classCount * 10;
      rules.push(`classes:${classCount}`);
    }
    
    // Check ID
    if (element.id) {
      specificity += 100;
      rules.push(`id:${element.id}`);
    }
    
    return { score: specificity, rules };
  }
  
  // Get media query context
  function getMediaContext() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      viewport: { width, height },
      breakpoints: {
        mobile: width <= 480,
        mobileLg: width <= 640,
        tablet: width <= 768,
        desktop: width >= 1024
      }
    };
  }
  
  // Analyze element layout
  function analyzeElement(element, selector) {
    const rect = getRect(element);
    const style = getStyle(element);
    const cascade = {};
    
    // Get cascade info for key layout properties
    LAYOUT_PROPS.forEach(prop => {
      cascade[prop] = getCascadeInfo(element, prop);
    });
    
    return {
      selector,
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: element.className.split(' ').filter(Boolean),
      dimensions: {
        width: round(rect.width),
        height: round(rect.height),
        left: round(rect.left),
        top: round(rect.top)
      },
      boxModel: {
        paddingTop: round(parseFloat(style.paddingTop)),
        paddingRight: round(parseFloat(style.paddingRight)),
        paddingBottom: round(parseFloat(style.paddingBottom)),
        paddingLeft: round(parseFloat(style.paddingLeft)),
        marginTop: round(parseFloat(style.marginTop)),
        marginRight: round(parseFloat(style.marginRight)),
        marginBottom: round(parseFloat(style.marginBottom)),
        marginLeft: round(parseFloat(style.marginLeft)),
        borderTop: round(parseFloat(style.borderTopWidth)),
        borderRight: round(parseFloat(style.borderRightWidth)),
        borderBottom: round(parseFloat(style.borderBottomWidth)),
        borderLeft: round(parseFloat(style.borderLeftWidth))
      },
      layout: {
        display: style.display,
        position: style.position,
        boxSizing: style.boxSizing,
        overflow: style.overflow,
        flexDirection: style.flexDirection,
        justifyContent: style.justifyContent,
        alignItems: style.alignItems,
        gap: style.gap
      },
      cascade,
      visible: rect.width > 0 && rect.height > 0,
      inViewport: rect.left >= 0 && rect.top >= 0 && 
                  rect.left < window.innerWidth && rect.top < window.innerHeight
    };
  }
  
  // Main analysis function
  function runAnalysis() {
    console.log('🔍 Starting Layout Forensics Analysis...');
    
    const results = {
      timestamp: new Date().toISOString(),
      context: getMediaContext(),
      elements: [],
      summary: {
        totalElements: 0,
        visibleElements: 0,
        sections: {},
        issues: []
      }
    };
    
    // Analyze each target selector
    TARGETS.forEach(selector => {
      const elements = $(selector);
      console.log(`📊 Analyzing ${selector}: ${elements.length} elements`);
      
      elements.forEach((element, index) => {
        const analysis = analyzeElement(element, selector);
        analysis.index = index;
        results.elements.push(analysis);
        
        // Update summary
        results.summary.totalElements++;
        if (analysis.visible) results.summary.visibleElements++;
        
        // Group by section
        const sectionId = element.closest('[id^="group-"]')?.id || 'unknown';
        if (!results.summary.sections[sectionId]) {
          results.summary.sections[sectionId] = 0;
        }
        results.summary.sections[sectionId]++;
        
        // Detect potential issues
        if (analysis.dimensions.width === 0 && analysis.visible) {
          results.summary.issues.push({
            type: 'zero-width',
            selector,
            element: analysis,
            message: 'Element has zero width but is visible'
          });
        }
        
        if (analysis.layout.display === 'none' && analysis.visible) {
          results.summary.issues.push({
            type: 'hidden-visible',
            selector,
            element: analysis,
            message: 'Element has display:none but appears visible'
          });
        }
      });
    });
    
    // Store results globally
    window.__layoutForensics = results;
    
    // Console output
    console.log('\n📋 Layout Forensics Summary:');
    console.table(results.summary.sections);
    
    if (results.summary.issues.length > 0) {
      console.warn('\n⚠️  Potential Issues Found:');
      results.summary.issues.forEach(issue => {
        console.warn(`- ${issue.type}: ${issue.message}`, issue.element);
      });
    }
    
    // Detailed element table
    console.log('\n📊 Element Analysis:');
    const elementTable = results.elements.map(el => ({
      selector: el.selector,
      tag: el.tagName,
      id: el.id || '-',
      classes: el.classes.slice(0, 2).join(' '),
      size: `${el.dimensions.width}×${el.dimensions.height}`,
      display: el.layout.display,
      position: el.layout.position,
      visible: el.visible ? '✅' : '❌'
    }));
    console.table(elementTable);
    
    console.log('\n💾 Full results stored in window.__layoutForensics');
    console.log('🔧 Use window.__layoutForensics.elements for detailed analysis');
    
    return results;
  }
  
  // Export for different environments
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = { runAnalysis, TARGETS, LAYOUT_PROPS };
  } else if (typeof window !== 'undefined') {
    // Browser environment
    window.layoutForensics = runAnalysis;
    console.log('🚀 Layout Forensics loaded. Run layoutForensics() to analyze.');
  }
  
  // Auto-run in browser
  if (typeof window !== 'undefined' && document.readyState === 'complete') {
    runAnalysis();
  }
  
})();



