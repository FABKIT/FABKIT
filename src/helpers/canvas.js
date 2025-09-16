import Konva from "konva";

const CanvasHelpers = class CanvasHelper {
    background = '';
    artworkLayer;
    backgroundLayer;
    stageLayer;

    constructor() {
    }

    initWheelResize() {
        if (!this.stageLayer) return;

        this.stageLayer.off('wheel');
        this.stageLayer.on('wheel', (e) => {
            e.evt.preventDefault();

            const oldScale = this.artworkLayer.scaleX();
            const pointer = this.stageLayer.getPointerPosition();

            // Calculate pointer position relative to layer
            const mousePointTo = {
                x: (pointer.x - this.artworkLayer.x()) / oldScale,
                y: (pointer.y - this.artworkLayer.y()) / oldScale,
            };

            // Determine zoom direction
            let direction = e.evt.deltaY > 0 ? 1 : -1;

            // Reverse direction for trackpad pinch gestures
            if (e.evt.ctrlKey) {
                direction = -direction;
            }

            const scaleBy = 1.1; // Adjust zoom sensitivity
            const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

            // Apply scale to layer
            this.artworkLayer.scale({ x: newScale, y: newScale });

            // Adjust position to zoom relative to pointer
            const newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            };
            this.artworkLayer.position(newPos);
        });
    }

    // function to calculate crop values from source image, its visible size and a crop strategy
    getCrop(image, size, clipPosition = 'center-middle') {
        const width = size.width;
        const height = size.height;
        const aspectRatio = width / height;

        let newWidth;
        let newHeight;

        const imageRatio = image.width / image.height;

        if (aspectRatio >= imageRatio) {
            newWidth = image.width;
            newHeight = image.width / aspectRatio;
        } else {
            newWidth = image.height * aspectRatio;
            newHeight = image.height;
        }

        let x = 0;
        let y = 0;
        if (clipPosition === 'left-top') {
            x = 0;
            y = 0;
        } else if (clipPosition === 'left-middle') {
            x = 0;
            y = (image.height - newHeight) / 2;
        } else if (clipPosition === 'left-bottom') {
            x = 0;
            y = image.height - newHeight;
        } else if (clipPosition === 'center-top') {
            x = (image.width - newWidth) / 2;
            y = 0;
        } else if (clipPosition === 'center-middle') {
            x = (image.width - newWidth) / 2;
            y = (image.height - newHeight) / 2;
        } else if (clipPosition === 'center-bottom') {
            x = (image.width - newWidth) / 2;
            y = image.height - newHeight;
        } else if (clipPosition === 'right-top') {
            x = image.width - newWidth;
            y = 0;
        } else if (clipPosition === 'right-middle') {
            x = image.width - newWidth;
            y = (image.height - newHeight) / 2;
        } else if (clipPosition === 'right-bottom') {
            x = image.width - newWidth;
            y = image.height - newHeight;
        } else if (clipPosition === 'scale') {
            x = 0;
            y = 0;
            newWidth = width;
            newHeight = height;
        } else {
            console.error(
                new Error('Unknown clip position property - ' + clipPosition)
            );
        }

        return {
            cropX: x,
            cropY: y,
            cropWidth: newWidth,
            cropHeight: newHeight,
        };
    }

    drawUploadedArtwork(src, config) {
        const self = this;

        const existing = self.artworkLayer.findOne('.artwork');
        if (existing && existing.attrs.image.src === src) {
            if (config.height && existing.attrs.height === config.height) {
                return;
            }
            existing.setAttrs(config);
            // apply default left-top crop
            applyCrop('center-middle');
            return;
        }

        self.artworkLayer.removeChildren();

        // function to apply crop
        function applyCrop(pos) {
            const img = self.artworkLayer.findOne('.artwork');
            img.setAttr('lastCropUsed', pos);
            const crop = self.getCrop(
                img.image(),
                {width: img.width(), height: img.height()},
                pos
            );
            img.setAttrs(crop);
        }

        Konva.Image.fromURL(
            src,
            (img) => {
                img.setAttrs(
                    {
                        ...config,
                        ...{
                            name: 'artwork',
                            id: 'img-artwork',
                            draggable: true,
                        }
                    });
                self.artworkLayer.add(img);
                // apply default left-top crop
                applyCrop('center-middle');
                self.artworkLayer.draggable(true);
                self.initWheelResize();
            }
        );
    }

    async drawBackground(src) {
        const self = this;

        const existing = self.backgroundLayer.findOne('.background');
        if (existing && existing.attrs.image.src.endsWith(src)) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            Konva.Image.fromURL(
                src,
                (img) => {
                    img.setAttrs({
                        x: 0,
                        y: 0,
                        name: 'background',
                        id: 'img-background',
                        draggable: false,
                        listening: false,
                    });
                    if (existing) {
                        // disable clear before draw
                        self.backgroundLayer.clearBeforeDraw(false);
                        self.backgroundLayer.removeChildren();
                    }
                    // Enable clear before draw
                    self.backgroundLayer.clearBeforeDraw(true);
                    self.backgroundLayer.add(img);
                    self.backgroundLayer.listening(false);

                    resolve();
                }
            );
        });
    }

}

export function useCanvasHelper() {
    return CanvasHelpers;
}
