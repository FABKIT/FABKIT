import { shaderMaterial } from "@react-three/drei";
import type { Texture } from "three";

const vertexShader = /* glsl */ `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

/**
 * uTreatment codes — see TREATMENT_CODE in Card3D.tsx, which maps
 * FoilTreatment (shared/data/fab-printings.ts) to these:
 *   0 standard   (no effect — CardFaceMaterial doesn't even attach this
 *                 material for "standard", so the shader never actually
 *                 needs to handle this case, but the branch stays cheap
 *                 insurance)
 *   1 rainbow    broad spectral sweep across the whole card
 *   2 cold       tight silver-white specular band
 *   3 gold-cold  the same band, tinted FABKIT gold
 *
 * uLightDir is the card's current tilt offset (-1..1 each axis, see
 * Card3D's pointer-driven tilt) fed in every frame — moving the card
 * moves this "virtual light" across it, per the execution plan section
 * 3.3. A flat plane has one constant normal/view-direction pair, so
 * unlike a lit 3D object there's no NdotH term to key off; instead the
 * band's *position* is a UV coordinate offset by uLightDir, which is
 * what actually makes it sweep as the card tilts.
 */
const fragmentShader = /* glsl */ `
	uniform sampler2D uBaseTexture;
	uniform float uIntensity;
	uniform int uTreatment;
	uniform vec2 uLightDir;
	varying vec2 vUv;

	vec3 hsv2rgb(vec3 c) {
		vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
		vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
		return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
	}

	// Cheap per-pixel hash noise — not a real normal perturbation (this
	// material is fully unlit, see Card3D.tsx's own comment on why), but
	// the same visual job: a flat gradient band reads as plastic, a
	// grainy one reads as foil. See the execution plan, section 3.5.
	float hash(vec2 p) {
		return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
	}

	void main() {
		vec4 base = texture2D(uBaseTexture, vUv);

		// Card art has transparent rounded corners baked into its own alpha
		// channel (see Card3D.tsx's plain meshBasicMaterial path, which relies
		// on the same cutout via alphaTest). A ShaderMaterial doesn't get
		// three.js's built-in alphaTest handling for free — that only applies
		// to three's own built-in materials — so it has to be an explicit
		// discard here instead.
		if (base.a < 0.5) discard;

		if (uTreatment == 0) {
			gl_FragColor = base;
			return;
		}

		// Sample the base art's own luminance so the effect sits over the
		// artwork rather than washing out the (usually lighter) text box —
		// section 3.5's masking requirement.
		//
		// This used to run the other way round (smoothstep(0.05, 0.4, ...)),
		// which gave the FULL effect to the brightest pixels and none to the
		// darkest: the exact opposite of what the line above it describes,
		// and it hit the white text box hardest. Foil is light added on top
		// of the print, so the thing that needs protecting is whatever is
		// already close to white. Full effect across the art, easing off as
		// the base approaches white.
		float luminance = dot(base.rgb, vec3(0.299, 0.587, 0.114));
		float mask = 1.0 - smoothstep(0.55, 0.95, luminance);

		float grain = hash(vUv * 320.0) * 0.18;

		vec3 effectColor = base.rgb;
		float strength = 0.0;

		if (uTreatment == 1) {
			// Rainbow Foil: the hue still sweeps across the card's own UVs
			// (that's what makes it a "sweep" rather than a flat tint), but
			// its phase is offset by the light direction instead of a
			// clock, so tilting the card visibly moves the band.
			float hue = fract(vUv.x + vUv.y + (uLightDir.x + uLightDir.y) * 0.3);
			effectColor = hsv2rgb(vec3(hue, 0.55, 1.0));
			// Base sheen plus a tilt response. The ramp is deliberately
			// shallower than the base is large: under the additive combine a
			// steep ramp turned the whole card into a saturated wash at full
			// tilt, which is a different kind of wrong from the dullness it
			// replaced. Verified across the tilt range, not just head-on.
			strength = 0.20 + 0.30 * clamp(abs(uLightDir.x) + abs(uLightDir.y), 0.0, 1.0);
		} else {
			// Cold / Gold Cold Foil: a tight horizontal specular band. Its
			// vertical position tracks uLightDir.y (tilting the card up or
			// down sweeps the band up or down the art), and it fades
			// slightly at the horizontal edges opposite the light so it
			// reads as directional rather than a static painted stripe.
			// Coefficients tuned so the band stays on-card across the whole
			// practical tilt range instead of sweeping off the edge at
			// anything but a near-flat tilt (verified visually, not just
			// algebraically — an earlier, steeper coefficient here pushed
			// the band almost entirely off-card at a natural tilt angle).
			float bandCenter = 0.5 - uLightDir.y * 0.28;
			float verticalDist = abs(vUv.y - bandCenter);
			float band = pow(clamp(1.0 - verticalDist * 4.0, 0.0, 1.0), 2.5);
			float sideFade = 1.0 - clamp(abs(vUv.x - 0.5 - uLightDir.x * 0.15) * 0.4, 0.0, 1.0);
			band *= sideFade;

			// A pure sheen colour, not pre-blended with the base art — band
			// is applied once, below, as the final mix factor. Blending it
			// in here too would square the effective strength (0.5 band
			// becomes a 0.25 contribution) and make the effect nearly
			// invisible at anything but a dead-on band hit.
			effectColor = uTreatment == 3
				? vec3(0.651, 0.525, 0.290)  // FABKIT gold, #a6864a
				: vec3(1.0, 1.0, 1.0);       // near-white, metallic rather than colourful
			strength = band;
		}

		strength = clamp(strength + grain * strength, 0.0, 1.0);

		// Added, not mixed.
		//
		// mix() REPLACES the artwork with effectColor in proportion to
		// strength, dragging every pixel toward one fixed value. The rainbow
		// tint's darkest channel is around 0.45, so mixing toward it visibly
		// DARKENED light areas; the cold white flattened contrast. Both read
		// as the card going dull and desaturated, which is not what foil
		// does. Adding can only ever brighten, which is physically what a
		// foil layer is, and it leaves the art's own colour and contrast
		// intact underneath. It also makes the varying brightness between
		// one card scan and the next less noticeable, not more, since
		// nothing is being pulled toward a common colour any more.
		//
		// Deliberately added HERE, in the fragment shader, and NOT by giving
		// the material AdditiveBlending: this material stays in the opaque
		// queue (it cuts its corners with discard, above). A blended
		// material moves to the transparent queue, which three.js draws
		// after everything opaque whatever render order it is given — the
		// exact mechanism that once let the celebration glow paint over the
		// card.
		vec3 color = base.rgb + effectColor * (uIntensity * strength * mask);
		gl_FragColor = vec4(color, base.a);
	}
`;

/**
 * A drei shaderMaterial constructor — instantiate with `new FoilMaterialImpl()`
 * and attach via `<primitive object={material} attach="material" />` rather
 * than registering it as a JSX intrinsic through R3F's extend(). This app's
 * Vite dev setup pre-bundles @react-three/fiber into two separate chunks
 * (one for this app's direct imports, one discovered through
 * @react-three/drei's internals) — extend() populates one chunk's catalogue
 * while <Canvas>'s reconciler reads from the other, so a custom intrinsic
 * throws "not part of the THREE namespace" at first render. `<primitive>`
 * sidesteps the catalogue entirely.
 */
export const FoilMaterialImpl = shaderMaterial(
	{
		uBaseTexture: null as Texture | null,
		uIntensity: 0.5,
		uTreatment: 0,
		uLightDir: [0, 0],
	},
	vertexShader,
	fragmentShader,
);
