import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RotateCw, ZoomIn, Check, X } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
  circularCrop?: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const ImageCropper = ({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  circularCrop = false,
}: ImageCropperProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    },
    [aspectRatio]
  );

  const getCroppedImg = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Get the natural size of the image
    const naturalWidth = image.naturalWidth;
    const naturalHeight = image.naturalHeight;

    // Calculate the scale between displayed and natural size
    const displayedWidth = image.width;
    const displayedHeight = image.height;
    const scaleX = naturalWidth / displayedWidth;
    const scaleY = naturalHeight / displayedHeight;

    // Calculate crop dimensions in natural image coordinates
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Set canvas size to the final crop size
    const outputWidth = cropWidth;
    const outputHeight = cropHeight;
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    ctx.imageSmoothingQuality = "high";

    // For rotation and scale, we need to transform the entire image first
    // Create an offscreen canvas with the transformed image
    const offscreenCanvas = document.createElement("canvas");
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!offscreenCtx) return;

    const rotateRads = (rotate * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rotateRads));
    const sin = Math.abs(Math.sin(rotateRads));

    // Calculate the size of the rotated image
    const rotatedWidth = naturalWidth * cos + naturalHeight * sin;
    const rotatedHeight = naturalWidth * sin + naturalHeight * cos;

    offscreenCanvas.width = rotatedWidth * scale;
    offscreenCanvas.height = rotatedHeight * scale;

    offscreenCtx.imageSmoothingQuality = "high";

    // Move to center, rotate, scale, and draw
    offscreenCtx.translate(offscreenCanvas.width / 2, offscreenCanvas.height / 2);
    offscreenCtx.rotate(rotateRads);
    offscreenCtx.scale(scale, scale);
    offscreenCtx.translate(-naturalWidth / 2, -naturalHeight / 2);
    offscreenCtx.drawImage(image, 0, 0, naturalWidth, naturalHeight);

    // Calculate the offset for the crop area on the transformed image
    // The crop coordinates need to be adjusted for the transformation
    const transformedCropX = cropX * scale + (offscreenCanvas.width - naturalWidth * scale) / 2;
    const transformedCropY = cropY * scale + (offscreenCanvas.height - naturalHeight * scale) / 2;

    // Apply circular crop mask if needed
    if (circularCrop) {
      ctx.beginPath();
      ctx.arc(outputWidth / 2, outputHeight / 2, Math.min(outputWidth, outputHeight) / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    // Draw the cropped portion from the offscreen canvas
    ctx.drawImage(
      offscreenCanvas,
      transformedCropX,
      transformedCropY,
      cropWidth * scale,
      cropHeight * scale,
      0,
      0,
      outputWidth,
      outputHeight
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
          onClose();
        }
      },
      "image/jpeg",
      0.95
    );
  }, [completedCrop, rotate, scale, circularCrop, onCropComplete, onClose]);

  const handleRotate = () => {
    setRotate((prev) => (prev + 90) % 360);
  };

  const resetCrop = () => {
    setScale(1);
    setRotate(0);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crop & Adjust Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center bg-muted rounded-lg p-4 overflow-hidden">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              circularCrop={circularCrop}
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imageSrc}
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxHeight: "400px",
                  maxWidth: "100%",
                  transformOrigin: "center",
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4" />
                Zoom: {Math.round(scale * 100)}%
              </Label>
              <Slider
                value={[scale]}
                onValueChange={([value]) => setScale(value)}
                min={0.5}
                max={3}
                step={0.1}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="w-4 h-4 mr-2" />
                Rotate 90°
              </Button>
              <span className="text-sm text-muted-foreground">Current: {rotate}°</span>
              <Button variant="ghost" size="sm" onClick={resetCrop} className="ml-auto">
                Reset
              </Button>
            </div>
          </div>

          <canvas ref={previewCanvasRef} className="hidden" />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={getCroppedImg}>
            <Check className="w-4 h-4 mr-2" />
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
