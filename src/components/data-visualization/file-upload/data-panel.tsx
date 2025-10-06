"use client";

import DataTabs from "@/components/data-visualization/data-tabs";
import FileUpload from "@/components/data-visualization/file-upload/file-upload";
import ProfileSwitcher from "@/components/data-visualization/file-upload/profile-switcher";
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent } from "@/components/ui/shadcn/card";
import { Separator } from "@/components/ui/shadcn/separator";
import { useUnifiedDataStore } from "@/store/unified-data-store";
import { UploadIcon } from "@radix-ui/react-icons";

export default function DataPanel() {
	const currentFile = useUnifiedDataStore((state) => state.currentFile);
	const uploadFile = useUnifiedDataStore((state) => state.uploadFile);

	const handleFileChange = async (file: File) => {
		await uploadFile(file);
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
	};

	return (
		<div className="flex flex-col w-full flex-1 h-full rounded-lg bg-white dark:bg-gray-800 overflow-y-auto">
			{!currentFile ? (
				<div className="flex items-center justify-center h-full">
					<FileUpload onFileChange={handleFileChange} />
				</div>
			) : (
				<div className="h-full flex flex-col overflow-hidden">
					<Card className="rounded-none border-0 border-b shadow-none ">
						<CardContent >
							<div className="flex items-center justify-between gap-4">
								<div className="flex items-center gap-3 flex-1 min-w-0">
									<ProfileSwitcher />
								</div>
								<div className="flex items-center gap-2">
									<label htmlFor="file-upload-header">
										<Button variant="default" size="sm" className="cursor-pointer" asChild>
											<span>
												<UploadIcon className="w-4 h-4 mr-2" />
												上传新文件
											</span>
										</Button>
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
						</CardContent>
					</Card>
					<div className="flex-1 overflow-auto p-4">
						<DataTabs file={currentFile} />
					</div>
				</div>
			)}
		</div>
	);
}
