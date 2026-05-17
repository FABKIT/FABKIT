export function FabbleHeader() {
	return (
		<div className="relative w-full overflow-hidden" style={{ height: 280 }}>
			{/* Artwork */}
			<img
				src="/img/Mischievous-Meeps.png"
				alt=""
				aria-hidden="true"
				className="absolute inset-0 w-full h-full object-cover"
				style={{ objectPosition: "center 30%" }}
			/>

			{/* Smooth fade — reaches solid surface color at 75% of the div height
			    so the overflow:hidden cut-off has no visible edge */}
			<div
				className="absolute inset-x-0 bottom-0 pointer-events-none"
				style={{
					height: "74%",
					background:
						"linear-gradient(to bottom, transparent 0%, var(--color-surface) 75%)",
				}}
			/>

			{/* Logo — strong drop shadows keep it legible without a dark backdrop */}
			<div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-4">
				<img
					src="/FabbleLogo.svg"
					alt="Fabble"
					className="select-none"
					style={{
						width: 300,
						height: "auto",
						filter:
							"drop-shadow(0 1px 3px rgba(0,0,0,0.95)) drop-shadow(0 2px 6px rgba(0,0,0,0.7))",
					}}
				/>
			</div>
		</div>
	);
}
