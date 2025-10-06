"use client";

import DataAnalysis from "@/components/data-visualization/data-analysis";
import DataCleaning from "@/components/data-visualization/data-cleaning/data-cleaning";
import DataDisplay from "@/components/data-visualization/data-display";
import FilePreview from "@/components/data-visualization/file-upload/file-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/shadcn/tabs";
import { useUnifiedDataStore } from "@/store/unified-data-store";
import { useEffect, useState } from "react";

interface DataTabsProps {
	file: File | null;
}

export default function DataTabs({ file }: DataTabsProps) {
	const [activeTab, setActiveTab] = useState("preview");
	const { uploadFile } = useUnifiedDataStore();
	const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);

	// Initialize file in the store when it changes
	useEffect(() => {
		if (file && file !== lastUploadedFile) {
			uploadFile(file);
			setLastUploadedFile(file);
		}
	}, [file, uploadFile, lastUploadedFile]);

	// 当文件变更时，重置到预览标签
	useEffect(() => {
		if (file && file !== lastUploadedFile) {
			setActiveTab("preview");
		}
	}, [file, lastUploadedFile]);

	return (
		<div className="w-full h-full">
			<Tabs value={activeTab} className="w-full h-full flex flex-col" onValueChange={setActiveTab}>
				<TabsList className="w-full grid grid-cols-4 mb-4">
					<TabsTrigger value="preview">文件预览</TabsTrigger>
					<TabsTrigger value="display">数据展示</TabsTrigger>
					<TabsTrigger value="cleaning">数据清洗</TabsTrigger>
					<TabsTrigger value="analysis">数据分析</TabsTrigger>
				</TabsList>

				<div className="flex-1 overflow-auto">
					<TabsContent value="preview" className="h-full">
						<FilePreview />
					</TabsContent>

					<TabsContent value="display" className="h-full">
						<DataDisplay />
					</TabsContent>

					<TabsContent value="cleaning" className="h-full">
						<DataCleaning file={file} />
					</TabsContent>

					<TabsContent value="analysis" className="h-full">
						<DataAnalysis file={file} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
