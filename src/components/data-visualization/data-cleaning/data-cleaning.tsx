"use client";

import { Alert, AlertDescription } from "@/components/ui/shadcn/alert";
import { Button } from "@/components/ui/shadcn/button";
import { Progress } from "@/components/ui/shadcn/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/shadcn/tabs";
import { useUnifiedDataStore } from "@/store/unified-data-store";
import { useToast } from "@/utils/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import DuplicatesTab from "./duplicates-tab";
import MissingValuesTab from "./missing-value-tab";
import OutliersTab from "./outliers-tab";
import { TransformTab } from "./transform-tab";

interface DataCleaningProps {
	file: File | null;
}

export default function DataCleaning({ file }: DataCleaningProps) {
	const [activeTab, setActiveTab] = useState("missing");
	const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [cleaningComplete, setCleaningComplete] = useState(false);
	const [cleaningInProgress, setCleaningInProgress] = useState(false);
	const [progress, setProgress] = useState(0);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { toast } = useToast();

	// Get data from unified store
	const { rawData: parsedData, processAndAnalyze, cleanedData, activeProfileId } = useUnifiedDataStore();

	// Get all available columns
	const availableColumns = parsedData?.headers || [];

	// Missing values state
	const [missingValues, setMissingValues] = useState<{
		[key: string]: { strategy: string; value?: string | number };
	}>({});

	// Outliers state
	const [outlierSettings, setOutlierSettings] = useState<{
		[key: string]: {
			method: string;
			action: string;
			lowerThreshold?: number;
			upperThreshold?: number;
			multiplier?: number;
			replacementMethod?: string;
			replacementValue?: number;
		};
	}>({});

	// Duplicates state
	const [duplicateSettings, setDuplicateSettings] = useState<{
		columnsToCheck: string[];
		strategy: string;
	}>({
		columnsToCheck: [],
		strategy: "remove_first",
	});

	const tabOptions = [
		{ id: "missing", name: "缺失值处理" },
		{ id: "outliers", name: "异常值处理" },
		{ id: "duplicates", name: "重复值处理" },
		{ id: "transform", name: "数据转换" },
	];

	// Load data from file when it changes
	useEffect(() => {
		if (file && (!parsedData || parsedData.headers.length === 0)) {
			setIsLoading(true);
			setErrorMessage(null);
			setCleaningComplete(false);

			// Get all columns from parsed data or use an empty array
			const columnsToAnalyze = parsedData?.headers || [];

			processAndAnalyze(columnsToAnalyze)
				.then(() => {
					setIsLoading(false);
				})
				.catch((error) => {
					console.error("Error processing file:", error);
					setErrorMessage(`处理文件出错: ${error}`);
					setIsLoading(false);
				});
		}
	}, [file, parsedData, processAndAnalyze]);

	// Update selected columns when available columns change
	useEffect(() => {
		if (parsedData && parsedData.headers.length > 0) {
			setSelectedColumns(parsedData.headers);
		}
	}, [parsedData]);

	// Reset cleaning status when tab changes
	useEffect(() => {
		setCleaningComplete(false);
		setErrorMessage(null);
	}, [activeTab]);

	// Reset cleaning status when settings change
	useEffect(() => {
		if (activeTab === "missing" && Object.keys(missingValues).length > 0) {
			setCleaningComplete(false);
		}
	}, [missingValues, activeTab]);

	useEffect(() => {
		if (activeTab === "outliers" && Object.keys(outlierSettings).length > 0) {
			setCleaningComplete(false);
		}
	}, [outlierSettings, activeTab]);

	useEffect(() => {
		if (activeTab === "duplicates" && duplicateSettings.columnsToCheck.length > 0) {
			setCleaningComplete(false);
		}
	}, [duplicateSettings, activeTab]);


	// Common props for all tab components
	const tabProps = {
		file,
		availableColumns,
		rawData: parsedData,
		onComplete: () => setCleaningComplete(true),
		onProgress: (value: number) => setProgress(value),
		onProcessingStart: () => {
			setCleaningInProgress(true);
			setErrorMessage(null);
			setProgress(0);
		},
		onProcessingEnd: () => {
			setCleaningInProgress(false);
		},
		onError: (error: string) => {
			setErrorMessage(error);
			setCleaningInProgress(false);
		},
	};

	if (!activeProfileId) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-gray-500 dark:text-gray-400">请先上传文件</p>
			</div>
		);
	}

	return (
		<div className="w-full space-y-4">
			<Tabs
				defaultValue="missing"
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<TabsList>
					{tabOptions.map((tab) => (
						<TabsTrigger key={tab.id} value={tab.id}>
							{tab.name}
						</TabsTrigger>
					))}
				</TabsList>

				{errorMessage && (
					<Alert className="my-4" variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				)}

				{cleaningInProgress && (
					<div className="my-4 space-y-2">
						<p>正在处理数据，请稍候...</p>
						<Progress value={progress} className="w-full" />
					</div>
				)}

				{isLoading ? (
					<div className="flex items-center justify-center h-40">
						<p>正在加载数据，请稍候...</p>
					</div>
				) : (
					<>
						<TabsContent value="missing" className="mt-4">
							<MissingValuesTab
								{...tabProps}
								columns={selectedColumns}
								onSettingsChange={setMissingValues}
							/>
						</TabsContent>

						<TabsContent value="outliers" className="mt-4">
							<OutliersTab
								{...tabProps}
								columns={selectedColumns}
								onSettingsChange={setOutlierSettings}
							/>
						</TabsContent>

						<TabsContent value="duplicates" className="mt-4">
							<DuplicatesTab
								{...tabProps}
								columns={selectedColumns}
								onSettingsChange={setDuplicateSettings}
							/>
						</TabsContent>

						<TabsContent value="transform" className="mt-4">
							<TransformTab
								{...tabProps}
								selectedColumn=""
								selectedColumns={selectedColumns}
								setMessage={(message) => setErrorMessage(message)}
								setProcessedFileUrl={() => {}}
								setCleaned={(cleaned) => setCleaningComplete(cleaned)}
								rawFileData={parsedData}
							/>
						</TabsContent>

					</>
				)}
			</Tabs>
		</div>
	);
}
