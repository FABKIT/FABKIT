import { Sparkles } from "@react-three/drei";

interface TearBurstProps {
	position?: [number, number, number];
}

/** Particle flourish shown only while the pack is tearing — mounted/unmounted
 * by PackMesh based on phase, not self-gating. */
export function TearBurst({ position = [0, 0, 0.1] }: TearBurstProps) {
	return (
		<Sparkles
			count={60}
			scale={[1.4, 0.4, 1]}
			size={4}
			speed={0.8}
			color="#f3e6c8"
			position={position}
		/>
	);
}
