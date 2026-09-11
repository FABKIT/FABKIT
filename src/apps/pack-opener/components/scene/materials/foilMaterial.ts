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
 *   2 cold       silver mirror under the ink, achromatic
 *   3 gold-cold  the same, tinted gold
 *
 * uLightDir is the card's current tilt offset (-1..1 each axis, see
 * Card3D's pointer-driven tilt) fed in every frame — moving the card
 * moves this "virtual light" across it, per the execution plan section
 * 3.3.
 *
 * THE COLD FOIL IS A MIRROR UNDER THE INK, which is how the printing
 * process actually works: a metallic layer (vapour-deposited aluminium on a
 * carrier film) is laid onto the card first, and the artwork is printed on
 * top of it in translucent inks. Light reaches the foil THROUGH the print
 * and comes back out through it, so the ink decides where the foil shows.
 *
 * Two earlier attempts got this wrong in opposite directions and both are
 * worth remembering, because both look plausible in a still frame:
 *
 *   - a single bright band swept across the card by the tilt. It read as a
 *     torch shone on an ordinary card, because it was light landing ON the
 *     print rather than coming back THROUGH it.
 *   - a masked, brushed, satin metal with a normal derived from the art's
 *     luminance. It read as a metallic TEXTURE, which cold foil does not
 *     have: the foil is smooth and specular, and the card is flat, so there
 *     is nothing for a surface normal to describe. Feedback was exact: "a
 *     reflective metal shine, without a metallic texture".
 *
 * So there is no mask, no normal, no grain and no texture of any kind here.
 * There is ink density, which decides how much foil gets back out, and one
 * broad soft reflection that sweeps as the card tilts. The places that light
 * up on a real cold foil — the frame's filigree, the title plate, the pitch
 * gem, the text box, the pale parts of the art — are simply the places the
 * ink is thinnest, so they fall out of the model rather than being listed.
 *
 * ACHROMATIC, at every angle. That is the property that distinguishes cold
 * foil from Rainbow Foil, which is the one that shifts hue, and it is why
 * the reflection is not tinted by the artwork underneath it either. (A cold
 * foil process in general CAN be overprinted to make metallic reds and
 * blues; Flesh and Blood does not print them that way.) Gold Cold Foil
 * carries a fixed gold tint, equally unchanging with angle.
 *
 * WHY NOT A REAL METAL MATERIAL. three.js's metalness is reflection, and a
 * metal with nothing to reflect renders black. Getting real metalness here
 * would mean scene lights and an environment map — the HDRI that was
 * deliberately removed from this scene (see the app's CLAUDE.md: it washed
 * the art out and cost a measured ~300ms of blank canvas on first load).
 * What replaces it is about six lines of arithmetic: no download, no
 * lights, and not one extra texture sample.
 */
const fragmentShader = /* glsl */ `
	uniform sampler2D uBaseTexture;
	uniform float uIntensity;
	uniform int uTreatment;
	uniform vec2 uLightDir;
	uniform float uTime;
	varying vec2 vUv;

	vec3 hsv2rgb(vec3 c) {
		vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
		vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
		return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
	}

	float hash(vec2 p) {
		return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
	}

	float luma(vec3 c) {
		return dot(c, vec3(0.299, 0.587, 0.114));
	}

	/** Smooth value noise — hash() on its own is per-pixel static, which
	 * reads as dirt on a flat surface rather than as a brushed finish. */
	float valueNoise(vec2 p) {
		vec2 i = floor(p);
		vec2 f = fract(p);
		f = f * f * (3.0 - 2.0 * f);
		float a = hash(i);
		float b = hash(i + vec2(1.0, 0.0));
		float c = hash(i + vec2(0.0, 1.0));
		float d = hash(i + vec2(1.0, 1.0));
		return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
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

		float lum = luma(base.rgb);

		if (uTreatment == 1) {
			// RAINBOW FOIL — unchanged. Sample the base art's own luminance so
			// the effect sits over the artwork rather than washing out the
			// (usually lighter) text box. Foil is light added on top of the
			// print, so the thing that needs protecting is whatever is already
			// close to white: full effect across the art, easing off as the
			// base approaches white.
			float rainbowMask = 1.0 - smoothstep(0.55, 0.95, lum);
			float grain = hash(vUv * 320.0) * 0.18;

			// The hue sweeps across the card's own UVs (that's what makes it a
			// "sweep" rather than a flat tint), but its phase is offset by the
			// light direction instead of a clock, so tilting the card visibly
			// moves the band.
			float hue = fract(vUv.x + vUv.y + (uLightDir.x + uLightDir.y) * 0.3);
			vec3 spectral = hsv2rgb(vec3(hue, 0.55, 1.0));
			// Base sheen plus a tilt response. The ramp is deliberately
			// shallower than the base is large: under the additive combine a
			// steep ramp turned the whole card into a saturated wash at full
			// tilt, which is a different kind of wrong from the dullness it
			// replaced. Verified across the tilt range, not just head-on.
			float strength = 0.20 + 0.30 * clamp(abs(uLightDir.x) + abs(uLightDir.y), 0.0, 1.0);
			strength = clamp(strength + grain * strength, 0.0, 1.0);

			// Added, not mixed. mix() REPLACES the artwork with the tint in
			// proportion to strength, dragging every pixel toward one fixed
			// value: the rainbow tint's darkest channel is around 0.45, so
			// mixing toward it visibly DARKENED light areas. Adding can only
			// ever brighten, which is physically what a foil layer is, and it
			// leaves the art's own colour and contrast intact underneath.
			//
			// Deliberately added HERE, in the fragment shader, and NOT by
			// giving the material AdditiveBlending: this material stays in the
			// opaque queue (it cuts its corners with discard, above). A blended
			// material moves to the transparent queue, which three.js draws
			// after everything opaque whatever render order it is given — the
			// exact mechanism that once let the celebration glow paint over the
			// card.
			gl_FragColor = vec4(base.rgb + spectral * (uIntensity * strength * rainbowMask), base.a);
			return;
		}

		// COLD FOIL / GOLD COLD FOIL: a mirror underneath the ink.
		// See this file's header for the printing process this models.

		// 1. HOW MUCH OF THE MIRROR GETS BACK OUT.
		//
		// Light goes down through the ink, off the foil, and back out through
		// the ink again, so how bright the foil reads at a pixel is decided by
		// how dense the ink over it is. Dense blacks smother it; pale ink and
		// unprinted card let it blaze. This is why no hand-drawn mask is
		// needed and why the effect lands where it does on a real card: the
		// frame's filigree, the title plate, the pitch gem, the text box and
		// the bright parts of the illustration are exactly the places the ink
		// is thinnest. The floor keeps a little life in the darkest areas,
		// because ink is translucent rather than opaque and a black region of
		// a real cold foil still glints when it catches the light.
		float transmission = 0.06 + 0.94 * smoothstep(0.04, 0.80, lum);

		// 2. WHAT THE MIRROR IS REFLECTING, AND WHY IT HAS TO MOVE.
		//
		// A flat mirror on a flat card reflects one broad soft source — a
		// window, a strip light — as a band of brightness, not as a pattern.
		// It is stretched across the card (the 0.42 below) because that is
		// the shape a reflected light source takes, and because a band
		// sweeping over the card is what a foil does when you turn it.
		//
		// THE DRIFT IS NOT DECORATION, it is the effect. uLightDir alone
		// comes from the pointer, so it is perfectly still whenever the
		// player is not moving the mouse, and never moves at all on a
		// touchscreen, where there is no pointer to read. A cold foil that
		// never moves is a cold foil you cannot see: the first version of
		// this got away with a frozen highlight only because it was a narrow
		// hard band, which is obvious even standing still and also wrong.
		// So the reflection drifts on its own, slowly, as though the card
		// were being turned under a light, and the pointer tilt adds to that
		// rather than being the only source of motion.
		//
		// The faint wave is the one concession to imperfection: a real card
		// is never perfectly flat, so the edge of the reflection is never a
		// perfectly straight line. Deliberately very low frequency — four
		// cells across the whole card — so it bends the SHAPE of the
		// reflection rather than adding any texture to it.
		float wave = valueNoise(vUv * vec2(4.0, 5.0)) - 0.5;
		vec2 drift = vec2(sin(uTime * 0.62), cos(uTime * 0.41) * 0.8) * 0.48;
		vec2 offset = (vUv - 0.5) - (-uLightDir * 0.55 + drift + wave * 0.09);
		float bandDist = length(vec2(offset.x * 0.42, offset.y));
		// The ambient term is the card at rest, and it is deliberately NOT
		// near zero: pulling a Cold Foil should be obvious at a glance while
		// someone is busy opening packs, not something they only notice if
		// the band happens to be crossing at that moment. It is still a
		// floor rather than a wash — measured over real card art, the
		// quietest moment of the drift keeps 45% of the art's own
		// saturation, where pushing this further took it under a third and
		// the illustration started to look bleached.
		float mirror = 0.16 + exp(-pow(bandDist * 3.00, 2.0)) * 2.45;

		// 3. WHAT COLOUR IT IS: none.
		//
		// Cold foil in this game is achromatic. It is a reflective metal shine
		// and it stays the same neutral silver at every angle — that is the
		// single property that tells it apart from Rainbow Foil, which is the
		// one that shifts hue. So the reflection is not tinted by the art
		// underneath it either: a generic cold foil process CAN be overprinted
		// to make metallic reds and blues, but these cards are not printed
		// that way. Gold Cold Foil is the exception, and its tint is likewise
		// fixed rather than angle-dependent.
		vec3 tint = uTreatment == 3 ? vec3(1.0, 0.86, 0.55) : vec3(1.0);
		vec3 shine = clamp(tint * (mirror * transmission * uIntensity * 1.38), 0.0, 1.0);

		// Screened, not added. Reflected light can only ever brighten, which
		// rules out mix(), and screen is bounded at white, which rules out the
		// flat blown-out patches a straight add produced across the pale half
		// of a card (measured: 40%+ of pixels clipping, against 0% here).
		//
		// Deliberately combined HERE, in the fragment shader, and NOT by
		// giving the material a blend mode: this material stays in the opaque
		// queue (it cuts its corners with discard, above). A blended material
		// moves to the transparent queue, which three.js draws after
		// everything opaque whatever render order it is given — the exact
		// mechanism that once let the celebration glow paint over the card.
		gl_FragColor = vec4(1.0 - (1.0 - base.rgb) * (1.0 - shine), base.a);
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
		/** Seconds, for the reflection's own slow drift — see the fragment
		 * shader's section 2 for why a cold foil that only moves with the
		 * pointer is a cold foil nobody ever sees. */
		uTime: 0,
	},
	vertexShader,
	fragmentShader,
);
