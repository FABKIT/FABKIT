import { FolderInput } from "lucide-react";
import type { ChangeEvent } from "react";

interface FileUploadButton {
	onChange?: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
	label: string;
}

export function FileUploadButton({ onChange, label }: FileUploadButton) {
	return (
		<>
			<input
				type="file"
				id="import_file"
				name="import_file"
				className="hidden"
				multiple
				accept=".fabkit"
				onChange={onChange}
			/>
			<label htmlFor="import_file">
				<div className="inline-flex items-center justify-center gap-x-1.5 bg-primary text-sm font-semibold text-white rounded-md px-3.5 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
					<FolderInput className="h-4 w-4"></FolderInput>
					{label}
				</div>
			</label>
		</>
	);
}
