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

    initTouchMove() {
      // by default Konva prevent some events when node is dragging
      // it improve the performance and work well for 95% of cases
      // we need to enable all events on Konva, even when we are dragging a node
      // so it triggers touchmove correctly
      Konva.hitOnDragEnabled = true;
      const touchMoveLayer = this.stageLayer;
      if (!touchMoveLayer) return;
      const artworkLayer = this.artworkLayer;
      if (!artworkLayer) return;

      let lastCenter = null;
      let lastDist = 0;
      let dragStopped = false;

      function getDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      }

      function getCenter(p1, p2) {
        return {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
        };
      }

      touchMoveLayer.on('touchmove', function (e) {
        e.evt.preventDefault();
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        // we need to restore dragging, if it was cancelled by multi-touch
        if (touch1 && !touch2 && !touchMoveLayer.isDragging() && dragStopped) {
          touchMoveLayer.startDrag();
          dragStopped = false;
        }

        if (touch1 && touch2) {
          // if the stage was under Konva's drag&drop
          // we need to stop it, and implement our own pan logic with two pointers
          if (touchMoveLayer.isDragging()) {
            dragStopped = true;
            touchMoveLayer.stopDrag();
          }

          const rect = touchMoveLayer.container().getBoundingClientRect();

          const p1 = {
            x: touch1.clientX - rect.left,
            y: touch1.clientY - rect.top,
          };
          const p2 = {
            x: touch2.clientX - rect.left,
            y: touch2.clientY - rect.top,
          };

          if (!lastCenter) {
            lastCenter = getCenter(p1, p2);
            return;
          }
          const newCenter = getCenter(p1, p2);

          const dist = getDistance(p1, p2);

          if (!lastDist) {
            lastDist = dist;
          }

          // local coordinates of center point
          const pointTo = {
            x: (newCenter.x - touchMoveLayer.x()) / touchMoveLayer.scaleX(),
            y: (newCenter.y - touchMoveLayer.y()) / touchMoveLayer.scaleX(),
          };

          const scale = artworkLayer.scaleX() * (dist / lastDist);

          artworkLayer.scaleX(scale);
          artworkLayer.scaleY(scale);

          // calculate new position of the stage
          const dx = newCenter.x - lastCenter.x;
          const dy = newCenter.y - lastCenter.y;

          const newPos = {
            x: newCenter.x - pointTo.x * scale + dx,
            y: newCenter.y - pointTo.y * scale + dy,
          };

          artworkLayer.position(newPos);

          lastDist = dist;
          lastCenter = newCenter;
        }
      });

      touchMoveLayer.on('touchend', function () {
        lastDist = 0;
        lastCenter = null;
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
                self.initTouchMove();
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
