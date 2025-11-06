# Marquee Component Diagnostic Report

## Root Cause

**The marquee stutters and repeats because:**
1. React re-renders update text content mid-animation, causing the browser to recalculate the animation
2. Fixed `100vw` distance doesn't match actual text width, causing misaligned loops
3. CSS animation restarts when text content changes because the DOM structure updates during animation
4. No animation state preservation when messages rotate

## File Locations

### Primary Issues:

**`apps/web/src/components/FlickletHeader.tsx` (Lines 729-741)**
- Text content updates via React re-renders while CSS animation is running
- Fixed `100vw` distance doesn't account for actual text width
- No key prop means React updates in-place, interrupting animation

**`apps/web/src/styles/header-marquee.css` (Lines 6-13, 42-46)**
- CSS animation uses `var(--marquee-distance)` which changes when text updates
- `infinite` animation restarts when CSS custom properties change mid-animation

## Detailed Analysis

### 1. Animation Implementation ✅
- **Type**: CSS `@keyframes` with `animation` property
- **Syntax**: Correct - uses `transform: translateX()` for GPU acceleration
- **Vendor prefixes**: Not needed (modern browsers)
- **Issue**: Animation restarts when CSS variables change during animation

### 2. Performance Issues ⚠️
- **`will-change: transform`**: ✅ Present (line 44 in CSS)
- **Layout thrashing**: ❌ **YES** - React updates text content during animation
- **Forced reflows**: ❌ **YES** - Text content changes trigger layout recalculation
- **Issue**: Every message rotation causes React to update DOM, forcing browser to recalculate animation

### 3. React-Specific Issues ❌
- **Animation outside render cycle**: ❌ No - animation is CSS-based but React updates interrupt it
- **Unnecessary re-renders**: ❌ **YES** - `setIdx` triggers re-render, updating span text content
- **Cleanup**: ✅ Intervals are cleaned up properly
- **Issue**: Text content updates (`msg` variable) cause React to update span elements mid-animation

### 4. Visible Symptoms
- ✅ **Stutters/janks**: Yes - when message changes
- ✅ **Repeats**: Yes - fixed `100vw` distance causes misalignment
- ❌ **Stops**: No
- ❌ **High CPU**: Not reported, but likely during message transitions

### 5. Mobile-Specific Issues ✅
- ✅ Respects `prefers-reduced-motion` (lines 54-70 in CSS)
- ⚠️ Tab suspension: Not handled (animation continues in background)
- ✅ Touch scrolling: Not affected (marquee is separate)

## Fix Code

### Fix 1: Prevent React from updating text during animation

**File**: `apps/web/src/components/FlickletHeader.tsx`

**Change lines 729-741**:

```tsx
// BEFORE (current - causes stutter):
<div
  ref={trackRef}
  className="f-marquee-track absolute inset-0 whitespace-nowrap"
  style={{
    ['--marquee-duration' as any]: `${baseDuration}s`,
    ['--marquee-distance' as any]: '100vw',
  }}
  data-testid="marquee-scroller"
  aria-hidden="true"
>
  <span className="pr-[100vw] align-middle text-sm sm:text-base md:text-lg">{msg}</span>
  <span className="pr-[100vw] align-middle text-sm sm:text-base md:text-lg" aria-hidden="true">{msg}</span>
</div>

// AFTER (fixed - smooth animation):
<div
  ref={trackRef}
  key={`marquee-track-${idx}`}
  className="f-marquee-track absolute inset-0 whitespace-nowrap"
  style={{
    ['--marquee-duration' as any]: `${baseDuration}s`,
  }}
  data-testid="marquee-scroller"
  aria-hidden="true"
>
  <span className="pr-[100vw] align-middle text-sm sm:text-base md:text-lg">{msg}</span>
  <span className="pr-[100vw] align-middle text-sm sm:text-base md:text-lg" aria-hidden="true">{msg}</span>
</div>
```

**Why**: The `key` prop forces React to create a new element when message changes, allowing the animation to start fresh instead of updating mid-animation.

### Fix 2: Calculate actual text width for proper distance

**File**: `apps/web/src/components/FlickletHeader.tsx`

**Add after line 661**:

```tsx
const trackRef = useRef<HTMLDivElement>(null);
const [textWidth, setTextWidth] = useState(0);

// Measure text width once when message changes
useEffect(() => {
  if (!trackRef.current || !msg) return;
  
  // Create temporary span to measure text width
  const tempSpan = document.createElement('span');
  tempSpan.className = 'pr-[100vw] align-middle text-sm sm:text-base md:text-lg';
  tempSpan.textContent = msg;
  tempSpan.style.visibility = 'hidden';
  tempSpan.style.position = 'absolute';
  tempSpan.style.whiteSpace = 'nowrap';
  document.body.appendChild(tempSpan);
  
  const width = tempSpan.scrollWidth;
  document.body.removeChild(tempSpan);
  
  setTextWidth(width);
}, [msg]);
```

**Update style (line 732-735)**:

```tsx
style={{
  ['--marquee-duration' as any]: `${baseDuration}s`,
  ['--marquee-distance' as any]: textWidth > 0 ? `${textWidth}px` : '100vw',
}}
```

**Why**: Actual text width ensures seamless looping without repeats or gaps.

### Fix 3: Add transition delay to prevent stutter

**File**: `apps/web/src/styles/header-marquee.css`

**Update line 42-46**:

```css
.f-marquee-track {
  animation: flicklet-scroll-x var(--marquee-duration, var(--marquee-base-duration)) linear infinite;
  will-change: transform;
  display: flex;
  /* Prevent animation restart jank */
  animation-fill-mode: both;
}
```

**Why**: `animation-fill-mode: both` ensures smooth transitions when animation restarts.

## Complete Fixed Component

```tsx
function MarqueeBar({
  messages,
  speedSec = 30,
  changeEveryMs = 20000,
  pauseOnHover = true,
}: {
  messages: string[];
  speedSec?: number;
  changeEveryMs?: number;
  pauseOnHover?: boolean;
}) {
  const translations = useTranslations();
  const [idx, setIdx] = useState(0);
  const [apiMessages, setApiMessages] = useState<string[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [textWidth, setTextWidth] = useState(0);

  // Load API content when component mounts
  useEffect(() => {
    const loadApiContent = async () => {
      try {
        const content = await fetchMarqueeContent();
        const texts = content.map(item => item.text);
        setApiMessages(texts);
      } catch (error) {
        console.warn('Failed to load marquee content from API:', error);
        setApiMessages(messages);
      }
    };
    loadApiContent();
  }, [messages]);

  // Preload content for better performance
  useEffect(() => {
    preloadMarqueeContent();
  }, []);

  // Rotate messages
  useEffect(() => {
    const currentMessages = apiMessages.length > 0 ? apiMessages : messages;
    if (!currentMessages?.length) return;
    
    const t = setInterval(() => {
      setIdx(i => (i + 1) % currentMessages.length);
    }, Math.max(4000, changeEveryMs));
    return () => clearInterval(t);
  }, [apiMessages, messages, changeEveryMs]);

  const currentMessages = apiMessages.length > 0 ? apiMessages : messages;
  const msg = currentMessages[idx] || "";

  // Measure text width when message changes
  useEffect(() => {
    if (!msg) return;
    
    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(() => {
      if (!trackRef.current) return;
      
      const firstSpan = trackRef.current.querySelector('span:first-child') as HTMLElement;
      if (firstSpan) {
        // Force layout calculation
        const width = firstSpan.offsetWidth;
        setTextWidth(width);
      }
    });
  }, [msg]);

  // Check for dev speed override
  const containerRef = useRef<HTMLDivElement>(null);
  const [devSpeed, setDevSpeed] = useState<'fast' | 'normal' | 'slow' | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const speedAttr = containerRef.current.getAttribute('data-marquee-speed');
    if (speedAttr === 'fast' || speedAttr === 'normal' || speedAttr === 'slow') {
      setDevSpeed(speedAttr);
    }
  }, []);

  const baseDuration = devSpeed === 'fast' ? 10 : devSpeed === 'slow' ? 20 : 14;

  return (
    <div
      ref={containerRef}
      className="marquee-rail f-marquee-rail w-full border-t bg-muted/60 text-muted-foreground"
      data-testid="marquee-rail"
      data-pause-on-hover={pauseOnHover ? 'true' : 'false'}
      style={{
        ['--marquee-base-duration' as any]: `${baseDuration}s`,
      }}
    >
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-4">
        <div className="relative h-9 sm:h-10 overflow-hidden">
          <div className="sr-only" aria-live="polite">
            {msg}
          </div>
          <div
            ref={trackRef}
            key={`marquee-${idx}`}
            className="f-marquee-track absolute inset-0 whitespace-nowrap"
            style={{
              ['--marquee-duration' as any]: `${baseDuration}s`,
              ['--marquee-distance' as any]: textWidth > 0 ? `${textWidth}px` : '100vw',
            }}
            data-testid="marquee-scroller"
            aria-hidden="true"
          >
            <span className="pr-[100vw] align-middle text-sm sm:text-base md:text-lg">{msg}</span>
            <span className="pr-[100vw] align-middle text-sm sm:text-base md:text-lg" aria-hidden="true">{msg}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Performance Impact

### Fix 1 (Key prop): 
- **Impact**: Low - React creates new element but old one is cleaned up immediately
- **Benefit**: Eliminates stutter from mid-animation updates

### Fix 2 (Text width measurement):
- **Impact**: Low - Measurement happens once per message change, uses `requestAnimationFrame` to avoid blocking
- **Benefit**: Eliminates repeating/gaps in animation

### Fix 3 (Animation fill mode):
- **Impact**: None - CSS-only change
- **Benefit**: Smoother animation transitions

## Summary

**Root Cause**: React updates text content during CSS animation, causing browser to recalculate and restart animation mid-cycle.

**Solution**: Use `key` prop to force fresh animation start, measure actual text width for proper distance, and add CSS animation fill mode.

**Performance**: All fixes are low-impact and improve rather than degrade performance.

