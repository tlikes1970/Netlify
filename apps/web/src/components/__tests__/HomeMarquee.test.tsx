import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HomeMarquee from '../HomeMarquee';
import { getFlickletMarqueeMessages } from '../../lib/flickletPersonality';

describe('HomeMarquee', () => {
  it('uses authoritative personality content and advances only after a pass', () => {
    const messages = getFlickletMarqueeMessages(2);
    render(<HomeMarquee messages={messages} />);
    const first = screen.getByText(messages[0]);
    expect(first).toHaveClass('flicklet-marquee-track--moving');
    expect(screen.getAllByText(messages[0])).toHaveLength(1);
    fireEvent.animationEnd(first);
    expect(screen.getByText(messages[1])).toBeVisible();
  });
  it('supports one-message looping without duplicate accessible text', () => {
    render(<HomeMarquee messages={['Short']} />);
    expect(screen.getByText('Short')).toHaveStyle({animationIterationCount:'infinite'});
    expect(screen.queryByRole('status')).toBeNull();
  });
  it('preserves explicit static mode and empty content', () => {
    const view=render(<HomeMarquee messages={['Static']} autoRotate={false}/>);
    expect(screen.getByText('Static')).not.toHaveClass('flicklet-marquee-track--moving');
    view.rerender(<HomeMarquee messages={[]}/>);
    expect(view.container).toBeEmptyDOMElement();
  });
});
