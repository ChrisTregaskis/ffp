/** Detect video duration by loading file metadata in a temporary video element */
export const detectVideoDuration = (file: File): Promise<number | null> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      const duration = Math.round(video.duration);
      resolve(isFinite(duration) && duration > 0 ? duration : null);
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(null);
    });

    video.src = url;
  });
};
