"use client";

import { UploadIcon } from "@radix-ui/react-icons";
import type React from "react";
import { useState } from "react";

interface FileUploadProps {
	onFileChange?: (file: File) => void;
}

const supportedFileTypes = [
	{ extension: "csv", description: "CSV文件" },
	{ extension: "xls", description: "Excel文件" },
	{ extension: "xlsx", description: "Excel文件" },
];

export default function FileUpload({ onFileChange }: FileUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState<string>("");

	const validateFile = (file: File): boolean => {
		const extension = file.name.split(".").pop()?.toLowerCase() || "";
		const isValid = supportedFileTypes.some((type) => type.extension === extension);

		if (!isValid) {
			setError(
				`不支持的文件类型: .${extension}。请选择以下类型: ${supportedFileTypes
					.map((t) => `.${t.extension}`)
					.join(", ")}`
			);
		} else {
			setError("");
		}

		return isValid;
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);

		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const files = Array.from(e.dataTransfer.files);

			for (const uploadedFile of files) {
				if (validateFile(uploadedFile)) {
					setFile(uploadedFile);
					if (onFileChange) {
						onFileChange(uploadedFile);
					}
				}
			}
		}
	};

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const files = Array.from(e.target.files);

			for (const uploadedFile of files) {
				if (validateFile(uploadedFile)) {
					setFile(uploadedFile);
					if (onFileChange) {
						onFileChange(uploadedFile);
					}
				}
			}
		}
	};

	return (
		<div className="w-full max-w-md p-8 flex flex-col items-center">
			<div
				className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 transition-colors
          ${
						isDragging
							? "border-primary bg-primary/10 dark:bg-primary/20"
							: error
								? "border-red-400 bg-red-50 dark:bg-red-900/10"
								: "border-gray-300 dark:border-gray-700"
					}
        `}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				<UploadIcon className={`w-10 h-10 mb-4 ${error ? "text-red-400" : "text-gray-400"}`} />
				<p className="mb-2 text-sm text-center text-gray-500 dark:text-gray-400">
					<span className="font-semibold">点击上传</span> 或拖拽文件
				</p>
				<p className="text-xs text-center text-gray-500 dark:text-gray-400">
					支持 CSV、Excel(XLS/XLSX) 格式
				</p>

				{error && <p className="mt-2 text-xs text-center text-red-500">{error}</p>}

				<input
					id="file-upload"
					type="file"
					className="hidden"
					onChange={handleFileInputChange}
					accept={supportedFileTypes.map((type) => `.${type.extension}`).join(",")}
					multiple
				/>

				<label
					htmlFor="file-upload"
					className={`mt-4 px-4 py-2 text-white text-sm font-medium rounded-md cursor-pointer ${
						error
							? "bg-red-500 hover:bg-red-600 focus:ring-red-500"
							: "bg-primary hover:bg-primary/90 focus:ring-primary"
					} focus:outline-hidden focus:ring-2 focus:ring-offset-2`}
				>
					选择文件
				</label>
			</div>

			{file && (
				<div className="mt-4 w-full">
					<p className="text-sm font-medium text-gray-700 dark:text-gray-300">已选择文件:</p>
					<div className="flex items-center justify-between mt-1">
						<p className="text-sm text-gray-500 truncate max-w-[80%]">{file.name}</p>
						<span className="text-xs bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary px-2 py-0.5 rounded-full">
							{file.name.split(".").pop()?.toUpperCase()}
						</span>
					</div>
					<p className="text-xs text-gray-500 mt-1">
						{file.size < 1024
							? `${file.size} B`
							: file.size < 1024 * 1024
								? `${(file.size / 1024).toFixed(2)} KB`
								: `${(file.size / (1024 * 1024)).toFixed(2)} MB`}
					</p>
				</div>
			)}
		</div>
	);
}
