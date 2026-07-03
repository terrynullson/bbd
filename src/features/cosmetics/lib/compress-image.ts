const MAX_DIMENSION = 800;
const DEFAULT_QUALITY = 0.8;
const MAX_BYTES = 150_000;
const MIN_QUALITY = 0.45;

type ImageMime = 'image/webp' | 'image/jpeg';

type CompressImageOptions = {
  maxDimension?: number;
  quality?: number;
  maxBytes?: number;
};

let webpSupported: boolean | undefined;

function isWebpSupported(): boolean {
  if (webpSupported !== undefined) return webpSupported;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  webpSupported = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  return webpSupported;
}

function pickOutputMime(): ImageMime {
  return isWebpSupported() ? 'image/webp' : 'image/jpeg';
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Не удалось прочитать изображение'));
    };

    image.src = url;
  });
}

function drawToCanvas(
  image: HTMLImageElement,
  maxDimension: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Не удалось обработать изображение');
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: ImageMime,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Не удалось сжать изображение'));
          return;
        }
        resolve(blob);
      },
      mime,
      quality,
    );
  });
}

export type CompressedImage = {
  blob: Blob;
  mime: ImageMime;
  extension: 'webp' | 'jpg';
};

export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Выберите файл изображения');
  }

  const maxDimension = options.maxDimension ?? MAX_DIMENSION;
  const maxBytes = options.maxBytes ?? MAX_BYTES;
  let quality = options.quality ?? DEFAULT_QUALITY;
  const mime = pickOutputMime();
  const extension = mime === 'image/webp' ? 'webp' : 'jpg';

  const image = await loadImage(file);
  const canvas = drawToCanvas(image, maxDimension);

  let blob = await canvasToBlob(canvas, mime, quality);

  while (blob.size > maxBytes && quality > MIN_QUALITY) {
    quality -= 0.07;
    blob = await canvasToBlob(canvas, mime, quality);
  }

  if (blob.size > maxBytes) {
    throw new Error('Фото слишком большое даже после сжатия');
  }

  return { blob, mime, extension };
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  const { blob } = await compressImageFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Не удалось подготовить фото'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('Не удалось подготовить фото'));
    reader.readAsDataURL(blob);
  });
}
