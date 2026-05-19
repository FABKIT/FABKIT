export function FabbleHeader() {
	return (
		<div className="relative w-full overflow-hidden h-72">
			<img
				src="/img/Mischievous-Meeps.png"
				alt=""
				aria-hidden="true"
				className="absolute inset-0 w-full h-full object-cover object-top select-none"
			/>
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface" />
			<div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-4">
				<img
					src="/FabbleLogo.svg"
					alt="Fabble"
					className="select-none w-[300px] h-auto drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
				/>
			</div>
		</div>
	);
}
