"use client";

import DataTabs from "@/components/data-visualization/data-tabs";
import FileUpload from "@/components/data-visualization/file-upload/file-upload";
import ProfileSwitcher from "@/components/data-visualization/file-upload/profile-switcher";
import { useUnifiedDataStore } from "@/store/unified-data-store";

export default function DataPanel() {
	const currentFile = useUnifiedDataStore((state) => state.currentFile);
	const uploadFile = useUnifiedDataStore((state) => state.uploadFile);

	const handleFileChange = async (file: File) => {
		await uploadFile(file);
	};

	return (
		<div className="flex flex-col w-full flex-1 h-full rounded-lg bg-white dark:bg-gray-800 overflow-y-auto">
			{!currentFile ? (
				<div className="flex items-center justify-center h-full">
					<FileUpload onFileChange={handleFileChange} />
				</div>
			) : (
				<div className="h-full flex flex-col overflow-hidden">
					<div className="p-4 bg-primary/10 dark:bg-primary/20 border-b border-primary/20 dark:border-primary/30 shrink-0">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<ProfileSwitcher />
								<div>
									<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
										当前文件: <span className="font-bold">{currentFile?.name}</span>
									</h3>
									<p className="text-xs text-gray-500">
										{currentFile?.size ? `${(currentFile.size / 1024).toFixed(2)} KB` : ""}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<label
									htmlFor="file-upload-header"
									className="px-3 py-1 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
								>
									上传新文件
								</label>
								<input
									id="file-upload-header"
									type="file"
									className="hidden"
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) handleFileChange(file);
									}}
									accept=".csv,.xls,.xlsx"
									multiple
								/>
							</div>
						</div>
					</div>
					<div className="flex-1 overflow-auto p-4">
						<DataTabs file={currentFile} />
					</div>
				</div>
			)}
		</div>
	);
}
