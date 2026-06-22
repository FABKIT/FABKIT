export function FabbleHeader() {
	return (
		<div className="relative w-full overflow-hidden h-85">
			{/* Meeps art — positioned to keep the Meep faces in frame */}
			<img
				src="/img/Mischievous-Meeps.webp"
				alt=""
				aria-hidden="true"
				className="absolute inset-0 w-full h-full object-cover object-[45%_32%] select-none"
			/>

			{/* Full-height fade — starts imperceptibly at the top and builds toward
			    the bottom so there is no visible seam where the gradient begins */}
			<div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-surface via-surface/20 to-transparent" />

			{/* Logo */}
			<div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-8">
				<img
					src="/FabbleLogo.svg"
					alt="Fabble"
					className="select-none w-72 h-auto fabble-logo-shadow"
				/>
			</div>
		</div>
	);
}
