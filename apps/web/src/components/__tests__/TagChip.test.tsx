/**
 * Test: TagChip Component
 * Purpose: Verify tag filtering, URL sync, and click handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagChip } from '../TagChip';

// Mock window.location and history
const mockPushState = vi.fn();
const mockDispatchEvent = vi.fn();

beforeEach(() => {
  vi.spyOn(window.history, 'pushState').mockImplementation(mockPushState);
  vi.spyOn(window, 'dispatchEvent').mockImplementation(mockDispatchEvent);
  
  // Reset URL
  delete (window as any).location;
  (window as any).location = { pathname: '/', search: '' };
});

describe('TagChip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { pathname: '/', search: '' };
  });

  it('renders tag name', () => {
    render(<TagChip tag="javascript" />);
    
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('shows active state when tag is in URL', () => {
    (window as any).location = { pathname: '/', search: '?tags=javascript' };
    
    render(<TagChip tag="javascript" />);
    
    const button = screen.getByText('javascript');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('adds tag to URL on click when not active', () => {
    (window as any).location = { pathname: '/', search: '' };
    
    render(<TagChip tag="javascript" />);
    
    const button = screen.getByText('javascript');
    fireEvent.click(button);
    
    expect(mockPushState).toHaveBeenCalledWith({}, '', '/?tags=javascript');
    expect(mockDispatchEvent).toHaveBeenCalled();
  });

  it('removes tag from URL on click when active', () => {
    (window as any).location = { pathname: '/', search: '?tags=javascript' };
    
    render(<TagChip tag="javascript" />);
    
    const button = screen.getByText('javascript');
    fireEvent.click(button);
    
    expect(mockPushState).toHaveBeenCalledWith({}, '', '/');
    expect(mockDispatchEvent).toHaveBeenCalled();
  });

  it('handles multiple tags in URL', () => {
    (window as any).location = { pathname: '/', search: '?tags=javascript,react' };
    
    render(<TagChip tag="javascript" />);
    
    const button = screen.getByText('javascript');
    fireEvent.click(button);
    
    expect(mockPushState).toHaveBeenCalledWith({}, '', '/?tags=react');
  });

  it('calls custom onClick handler when provided', () => {
    const mockOnClick = vi.fn();
    
    render(<TagChip tag="javascript" onClick={mockOnClick} />);
    
    const button = screen.getByText('javascript');
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledWith('javascript');
    expect(mockPushState).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<TagChip tag="javascript" />);
    
    const button = screen.getByLabelText('Filter by javascript tag');
    expect(button).toHaveAttribute('aria-label', 'Filter by javascript tag');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });
});























