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
 * uTreatment: 1 rainbow (spectral sweep), 2 cold (achromatic silver mirror
 * under the ink), 3 gold-cold (same, gold tint); see TREATMENT_CODE in
 * CardFaceMaterial.tsx. uLightDir is the card tilt (-1..1 per axis).
 *
 * Cold foil is a mirror under translucent ink: ink density decides how much
 * shows, and one soft reflection sweeps with tilt and drift. No textures or
 * normals.
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

	/** Smooth value noise, for the slow wave in a cold foil's reflection —
	 * hash() on its own is per-pixel static, which would read as dirt. */
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
		// Texture is sRGB; re-encode so the shader math stays in display space.
		vec4 base = linearToOutputTexel(texture2D(uBaseTexture, vUv));

		// Explicit discard for the card's alpha corners.
		if (base.a < 0.5) discard;

		float lum = luma(base.rgb);

		if (uTreatment == 1) {
			// Rainbow foil: full effect across the art, easing off near white.
			float rainbowMask = 1.0 - smoothstep(0.55, 0.95, lum);
			float grain = hash(vUv * 320.0) * 0.18;

			// Hue sweeps across the UVs, phase offset by tilt.
			float hue = fract(vUv.x + vUv.y + (uLightDir.x + uLightDir.y) * 0.3);
			vec3 spectral = hsv2rgb(vec3(hue, 0.55, 1.0));
			// Base sheen plus a shallow tilt response.
			float strength = 0.20 + 0.30 * clamp(abs(uLightDir.x) + abs(uLightDir.y), 0.0, 1.0);
			strength = clamp(strength + grain * strength, 0.0, 1.0);

			// Added, not mixed, so the art is only ever brightened. Combined here
			// rather than via AdditiveBlending to stay in the opaque queue.
			gl_FragColor = vec4(base.rgb + spectral * (uIntensity * strength * rainbowMask), base.a);
			return;
		}

		// Cold foil / gold cold foil.
		// Ink density gates the foil; a floor keeps dark areas faintly alive.
		float transmission = 0.06 + 0.94 * smoothstep(0.04, 0.80, lum);

		// Broad soft band that drifts on its own so touch devices see it too;
		// the faint low-frequency wave only bends its shape.
		float wave = valueNoise(vUv * vec2(4.0, 5.0)) - 0.5;
		vec2 drift = vec2(sin(uTime * 0.62), cos(uTime * 0.41) * 0.8) * 0.48;
		vec2 offset = (vUv - 0.5) - (-uLightDir * 0.55 + drift + wave * 0.09);
		float bandDist = length(vec2(offset.x * 0.42, offset.y));
		// Ambient floor keeps a foil visible at rest.
		float mirror = 0.16 + exp(-pow(bandDist * 3.00, 2.0)) * 2.45;

		// Achromatic; gold tint only for gold-cold.
		vec3 tint = uTreatment == 3 ? vec3(1.0, 0.86, 0.55) : vec3(1.0);
		vec3 shine = clamp(tint * (mirror * transmission * uIntensity * 1.38), 0.0, 1.0);

		// Screened (bounded at white) in the fragment shader to stay in the opaque queue.
		gl_FragColor = vec4(1.0 - (1.0 - base.rgb) * (1.0 - shine), base.a);
	}
`;

/**
 * Attach via <primitive>, not extend(): extend() throws "not part of the
 * THREE namespace" under Vite's split pre-bundling.
 */
export const FoilMaterialImpl = shaderMaterial(
	{
		uBaseTexture: null as Texture | null,
		uIntensity: 0.5,
		uTreatment: 0,
		uLightDir: [0, 0],
		/** Seconds, for the reflection's drift. */
		uTime: 0,
	},
	vertexShader,
	fragmentShader,
);
