import type React from 'react';

/** Upload a file to S3 via XHR PUT, returning a Promise for async orchestration */
export const uploadToS3 = (
  file: File,
  presignedUrl: string,
  contentType: string,
  options: {
    onProgress: (percent: number) => void;
    xhrRef: React.MutableRefObject<XMLHttpRequest | null>;
  }
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    options.xhrRef.current = xhr;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      options.xhrRef.current = null;

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${String(xhr.status)}. Please try again.`));
      }
    });

    xhr.addEventListener('error', () => {
      options.xhrRef.current = null;
      reject(new Error('Network error during upload. Please check your connection and try again.'));
    });

    xhr.addEventListener('abort', () => {
      options.xhrRef.current = null;
      reject(new Error('Upload cancelled.'));
    });

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.send(file);
  });
};
