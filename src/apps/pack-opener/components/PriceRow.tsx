import { PriceValue } from "@fabkit/apps/pack-opener/components/PriceValue";

/** A labelled price, as listed in the dialogs. */
export function PriceRow({
	label,
	amount,
}: {
	label: string;
	amount: number | null;
}) {
	return (
		<div className="flex items-center justify-between text-sm">
			<span className="text-muted">{label}</span>
			<span className="font-card-stat text-body">
				<PriceValue amount={amount} />
			</span>
		</div>
	);
}
