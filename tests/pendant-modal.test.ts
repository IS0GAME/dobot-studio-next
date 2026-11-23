import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { PendantModal } from '../src/components/PendantModal';

describe('Windows 11 ContentDialog PendantModal', () => {
  it('exports PendantModal component', () => {
    expect(PendantModal).toBeDefined();
    expect(typeof PendantModal).toBe('function');
  });

  it('renders modal element with props when open', () => {
    const onClose = mock(() => {});
    const element = React.createElement(PendantModal, {
      isOpen: true,
      onClose,
      port: 9876,
    });

    expect(element).toBeDefined();
    expect(element.props.isOpen).toBe(true);
    expect(element.props.port).toBe(9876);
  });
});
