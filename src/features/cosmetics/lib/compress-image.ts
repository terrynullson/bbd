const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.68;
const MAX_BYTES = 120_000;

type CompressImageOptions = {
  maxDimension?: number;
  quality?: number;
  maxBytes?: number;
};

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
      'image/jpeg',
      quality,
    );
  });
}

export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {},
): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Выберите файл изображения');
  }

  const maxDimension = options.maxDimension ?? MAX_DIMENSION;
  const maxBytes = options.maxBytes ?? MAX_BYTES;
  let quality = options.quality ?? JPEG_QUALITY;

  const image = await loadImage(file);
  const canvas = drawToCanvas(image, maxDimension);

  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > maxBytes && quality > 0.4) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > maxBytes) {
    throw new Error('Фото слишком большое даже после сжатия');
  }

  return blob;
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  const blob = await compressImageFile(file);
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
