import { Image as ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";

interface ImageUploadProps {
	onImageSelect?: (file: File | null) => void;
	onError?: (error: string) => void;
	maxSize?: number; // in bytes
	acceptedFormats?: string[];
	className?: string;
}

export default function ImageUpload({
	onImageSelect,
	onError,
	maxSize = 10 * 1024 * 1024, // 10MB default
	acceptedFormats = ["image/png", "image/jpeg", "image/gif"],
	className = "",
}: ImageUploadProps) {
	const { t } = useTranslation();
	const id = useRef(uuid());
	const [isDragging, setIsDragging] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const maxSizeInMb = maxSize / 1024 / 1024;

	const validateAndProcessFile = useCallback(
		(file: File) => {
			setError(null);

			// Validate file type
			if (!acceptedFormats.includes(file.type)) {
				const errorMsg = t("components.image_upload.error_invalid_format");
				setError(errorMsg);
				onError?.(errorMsg);
				return;
			}

			// Validate file size
			if (file.size > maxSize) {
				const errorMsg = t("components.image_upload.error_too_large", {
					maxSizeInMb,
				});
				setError(errorMsg);
				onError?.(errorMsg);
				return;
			}

			setFileName(file.name);
			onImageSelect?.(file);
		},
		[acceptedFormats, maxSize, onError, onImageSelect, t, maxSizeInMb],
	);

	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const files = e.dataTransfer.files;
			if (files.length > 0) {
				validateAndProcessFile(files[0]);
			}
		},
		[validateAndProcessFile],
	);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) {
				validateAndProcessFile(files[0]);
			}
		},
		[validateAndProcessFile],
	);

	const handleClear = useCallback(() => {
		setFileName(null);
		setError(null);
		onImageSelect?.(null);
	}, [onImageSelect]);

	return (
		<div className={`relative ${className}`}>
			<input
				type="file"
				id={id.current}
				accept={acceptedFormats.join(",")}
				onChange={handleFileInput}
				className="sr-only"
			/>

			{!fileName ? (
				<label
					htmlFor={id.current}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					className={`
						flex items-center gap-2 px-3 py-2 min-h-[42px] cursor-pointer
						border border-border rounded-lg
						transition-colors
						${
							isDragging
								? "bg-surface-active border-heading"
								: error
									? "border-red-400 bg-red-50"
									: "bg-surface hover:bg-surface-muted"
						}
					`}
				>
					<Upload className="w-4 h-4 text-muted shrink-0" />
					<span className={`text-sm ${error ? "text-red-600" : "text-muted"}`}>
						{error || t("components.image_upload.drag_or_click")}
					</span>
				</label>
			) : (
				<div className="flex items-center gap-2 px-3 py-2 min-h-[42px] border border-border rounded-lg bg-surface">
					<ImageIcon className="w-4 h-4 text-heading shrink-0" />
					<span className="text-sm flex-1 truncate">{fileName}</span>
					<button
						type="button"
						onClick={handleClear}
						className="p-1 rounded hover:bg-surface-muted transition-colors shrink-0"
						aria-label={t("components.image_upload.remove")}
					>
						<X className="w-4 h-4 text-muted hover:text-heading" />
					</button>
				</div>
			)}
		</div>
	);
}
