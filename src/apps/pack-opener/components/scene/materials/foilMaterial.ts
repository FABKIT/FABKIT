import { shaderMaterial } from "@react-three/drei";
import type { Texture } from "three";

const vertexShader = /* glsl */ `
	varying vec2 vUv;
	varying vec3 vNormal;
	varying vec3 vViewDir;
	void main() {
		vUv = uv;
		vNormal = normalize(normalMatrix * normal);
		vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
		vViewDir = normalize(-mvPosition.xyz);
		gl_Position = projectionMatrix * mvPosition;
	}
`;

const fragmentShader = /* glsl */ `
	uniform float uTime;
	uniform sampler2D uBaseTexture;
	uniform float uIntensity;
	varying vec2 vUv;
	varying vec3 vNormal;
	varying vec3 vViewDir;

	vec3 hsv2rgb(vec3 c) {
		vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
		vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
		return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
	}

	void main() {
		vec4 base = texture2D(uBaseTexture, vUv);
		float fresnel = pow(
			1.0 - clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0),
			2.0
		);
		float hue = fract(vUv.x + vUv.y + uTime * 0.15);
		vec3 rainbow = hsv2rgb(vec3(hue, 0.6, 1.0));
		vec3 color = mix(base.rgb, rainbow, uIntensity * (0.3 + fresnel * 0.7));
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
	{ uTime: 0, uBaseTexture: null as Texture | null, uIntensity: 0.5 },
	vertexShader,
	fragmentShader,
);
