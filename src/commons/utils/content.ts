/**
 * @fileoverview 컨텐츠 관련 유틸리티 함수
 * @description 파일 크기, 파일 형식 검증 등 컨텐츠 관련 유틸리티 함수
 */

/**
 * 파일 크기를 사용자 친화적인 형식으로 포맷팅
 *
 * @param {number} bytes - 파일 크기 (바이트)
 * @returns {string} 포맷팅된 파일 크기 문자열 (예: "5.2 MB")
 *
 * @example
 * ```typescript
 * formatFileSize(5242880); // "5.00 MB"
 * formatFileSize(1024); // "1.00 KB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 파일 형식 검증
 *
 * @param {File} file - 파일 객체
 * @param {string[]} allowedTypes - 허용된 파일 형식 배열 (예: ['image/jpeg', 'image/png'])
 * @returns {boolean} 파일 형식이 허용된 형식인지 여부
 *
 * @example
 * ```typescript
 * const isValid = validateFileType(file, ['image/jpeg', 'image/png']);
 * ```
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * 파일 크기 검증
 *
 * @param {File} file - 파일 객체
 * @param {number} maxSizeBytes - 최대 파일 크기 (바이트)
 * @returns {boolean} 파일 크기가 허용된 크기 이하인지 여부
 *
 * @example
 * ```typescript
 * const isValid = validateFileSize(file, 5 * 1024 * 1024); // 5MB
 * ```
 */
export function validateFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * 이미지 파일인지 확인
 *
 * @param {File} file - 파일 객체
 * @returns {boolean} 이미지 파일인지 여부
 *
 * @example
 * ```typescript
 * if (isImageFile(file)) {
 *   // 이미지 파일 처리
 * }
 * ```
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 음악 파일인지 확인
 *
 * @param {File} file - 파일 객체
 * @returns {boolean} 음악 파일인지 여부
 *
 * @example
 * ```typescript
 * if (isAudioFile(file)) {
 *   // 음악 파일 처리
 * }
 * ```
 */
export function isAudioFile(file: File): boolean {
  return file.type.startsWith('audio/');
}

/**
 * 영상 파일인지 확인
 *
 * @param {File} file - 파일 객체
 * @returns {boolean} 영상 파일인지 여부
 *
 * @example
 * ```typescript
 * if (isVideoFile(file)) {
 *   // 영상 파일 처리
 * }
 * ```
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * 이미지 압축 (Canvas API 사용)
 * - 500KB 이하면 압축 생략
 * - 최대 1920px 리사이즈 + JPEG 80% 품질
 */
export async function compressImage(file: File): Promise<File> {
  const SKIP_THRESHOLD = 500 * 1024; // 500KB 이하는 스킵
  const MAX_DIMENSION = 1920;
  const QUALITY = 0.8;

  if (file.size <= SKIP_THRESHOLD) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // 실패 시 원본 그대로
    };

    img.src = url;
  });
}
