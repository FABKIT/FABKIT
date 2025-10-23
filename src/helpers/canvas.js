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

    fitArtToCanvas(image){
        const bgW = this.backgroundLayer.width();
        const bgH = this.backgroundLayer.height();

        let newWidth;
        let newHeight;

        if (image.width >= image.height) {
            // Horizontal image: fit width to bgW, scale height maintaining aspect ratio
            newWidth = bgW;
            newHeight = bgW * (image.height / image.width);
        } else {
            // Vertical image: fit height to bgH, scale width maintaining aspect ratio
            newHeight = bgH;
            newWidth = bgH * (image.width / image.height);
        }

        return {
            width: newWidth,
            height: newHeight
        }
    }

    drawUploadedArtwork(src, config) {
        const self = this;

        self.artworkLayer.removeChildren();

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

                img.setAttrs(self.fitArtToCanvas(img.image()));

                // Reset scale and position to initial state
                // in case someone uploaded > zoomed > removed > uploaded another,
                // new image would keep zoom as it was which is bad
                self.artworkLayer.scale({ x: 1, y: 1 });
                self.artworkLayer.position({ x: 0, y: 0 });

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
