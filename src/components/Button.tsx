import type {ReactNode} from "react";

interface ImportButtonProps {
	onClick?: () => void;
	disabled?: boolean;
	children: ReactNode;
}

export function Button({ onClick, children, disabled }: ImportButtonProps) {
	return (
		<div
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="inline-flex items-center justify-center gap-x-1.5 bg-primary text-sm font-semibold text-white rounded-md px-3.5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{children}
		</div>
	);
}
