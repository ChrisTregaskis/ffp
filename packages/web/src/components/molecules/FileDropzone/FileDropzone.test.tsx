import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FileDropzone } from './FileDropzone';

const renderDropzone = (): { onFileSelect: ReturnType<typeof vi.fn> } => {
  const onFileSelect = vi.fn();
  render(
    <FileDropzone
      onFileSelect={onFileSelect}
      accept="video/mp4"
      title="Drag and drop your video here"
      dropTitle="Drop your video here"
      aria-label="Select video file"
    />
  );

  return { onFileSelect };
};

const video = new File(['frames'], 'stretch.mp4', { type: 'video/mp4' });

describe('FileDropzone', () => {
  it('hands over a dropped file', () => {
    const { onFileSelect } = renderDropzone();
    const zone = screen.getByRole('button', { name: 'Select video file' });

    fireEvent.dragOver(zone, { dataTransfer: { files: [video] } });
    expect(screen.getByText('Drop your video here')).toBeTruthy();

    fireEvent.drop(zone, { dataTransfer: { files: [video] } });
    expect(onFileSelect).toHaveBeenCalledExactlyOnceWith(video);
    expect(screen.getByText('Drag and drop your video here')).toBeTruthy();
  });

  it('opens the picker on click and hands over the browsed file', async () => {
    const { onFileSelect } = renderDropzone();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('No file input rendered');
    const pickerOpened = vi.spyOn(input, 'click');

    await userEvent.click(screen.getByRole('button', { name: 'Select video file' }));
    expect(pickerOpened).toHaveBeenCalledTimes(1);

    await userEvent.upload(input, video);
    expect(onFileSelect).toHaveBeenCalledExactlyOnceWith(video);
  });
});
