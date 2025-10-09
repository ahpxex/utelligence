"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/shadcn/select";
import { Tabs, TabsContent } from "@/components/ui/shadcn/tabs";
import { Alert, AlertDescription } from "@/components/ui/shadcn/alert";
import { algorithms, categoryLabels } from "@/utils/machine-learning/algorithms";
import { runAlgorithm } from "@/utils/machine-learning/implementations";
import { useUnifiedDataStore } from "@/store/unified-data-store";
import { useState, useEffect } from "react";
import { AlgorithmCard } from "./components/algorithm-card";
import { AlgorithmParameters } from "./components/algorithm-parameters";
import { ResultsRenderer } from "./components/results-renderer";

interface MachineLearningTabProps {
	availableColumns: string[];
	file: File | null;
}

export function MachineLearningTab({ availableColumns, file }: MachineLearningTabProps) {
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("");
	const [isRunning, setIsRunning] = useState<boolean>(false);
	const [results, setResults] = useState<any>(null);
	const [parameters, setParameters] = useState<Record<string, any>>({});
	const [error, setError] = useState<string | null>(null);

	// Get actual data from store
	const { processedData, cleanedData } = useUnifiedDataStore();

	// Reset parameters when algorithm changes
	useEffect(() => {
		setParameters({});
		setError(null);
	}, [selectedAlgorithm]);

	const categories = Object.keys(categoryLabels);
	const filteredAlgorithms =
		selectedCategory === "all"
			? algorithms
			: algorithms.filter((alg) => alg.category === selectedCategory);

	const selectedAlgorithmObj = algorithms.find(alg => alg.id === selectedAlgorithm);

	const handleRunAlgorithm = async (algorithmId: string) => {
		console.log("[ML Tab] handleRunAlgorithm called with:", algorithmId);
		console.log("[ML Tab] availableColumns:", availableColumns);
		console.log("[ML Tab] processedData:", processedData);
		console.log("[ML Tab] cleanedData:", cleanedData);
		
		// Check if we have columns
		if (availableColumns.length === 0) {
			console.log("[ML Tab] Early return: no columns");
			setError("没有可用的列信息");
			return;
		}

		// Get actual data from store
		const rawData = cleanedData?.rows || processedData?.rows || [];
		const headers = cleanedData?.headers || processedData?.headers || availableColumns;
		
		console.log("[ML Tab] Data rows:", rawData.length);
		console.log("[ML Tab] Headers:", headers);
		console.log("[ML Tab] Raw data sample:", rawData[0]);
		
		if (rawData.length === 0) {
			console.log("[ML Tab] No data available");
			setError("没有可用的数据，请先上传文件");
			return;
		}
		
		// Convert array data to object format
		// Data from store is in array format: [["Alice", 20, 85, ...], ...]
		// We need to convert it to object format: [{Name: "Alice", Age: 20, ...}, ...]
		const data = rawData.map((row: any) => {
			const obj: Record<string, any> = {};
			headers.forEach((header: string, index: number) => {
				obj[header] = row[index];
			});
			return obj;
		});
		
		console.log("[ML Tab] Converted data sample:", data[0]);

		console.log("[ML Tab] Starting algorithm execution...");
		setIsRunning(true);
		setResults(null);
		setError(null);

		try {
			// Prepare options with parameters
			const options = {
				featureColumns: availableColumns,
				...parameters,
			};
			console.log("[ML Tab] Options:", options);

			// Run the algorithm
			console.log("[ML Tab] Calling runAlgorithm...");
			const result = await runAlgorithm(algorithmId, data, options);
			console.log("[ML Tab] Result:", result);
			setResults(result);
		} catch (err) {
			console.error("[ML Tab] 算法执行错误:", err);
			setError(err instanceof Error ? err.message : "算法执行失败");
		} finally {
			console.log("[ML Tab] Algorithm execution finished");
			setIsRunning(false);
		}
	};

	if (availableColumns.length === 0) {
		return (
			<div className="flex items-center justify-center h-64">
				<p className="text-gray-500 dark:text-gray-400">请先上传数据文件</p>
			</div>
		);
	}

	return (
		<div className="flex gap-6 h-[calc(100vh-300px)]">
			{/* Left side - Algorithm cards */}
			<div className="w-1/2 flex flex-col space-y-4 overflow-hidden">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-medium">机器学习算法</h3>
					<Select value={selectedCategory} onValueChange={setSelectedCategory}>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="选择类别" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">全部算法</SelectItem>
							{categories.map((category) => (
								<SelectItem key={category} value={category}>
									{categoryLabels[category as keyof typeof categoryLabels]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 overflow-hidden flex flex-col">
					<div className="flex-1 overflow-auto p-2 pr-6">
						<TabsContent value="all" className="mt-0 h-full">
							<div className="grid grid-cols-1 gap-3 h-fit">
								{algorithms.map((algorithm) => (
									<AlgorithmCard
										key={algorithm.id}
										algorithm={algorithm}
										isSelected={selectedAlgorithm === algorithm.id}
										isRunning={isRunning}
										showCategory={true}
										onSelect={() => setSelectedAlgorithm(algorithm.id)}
										onRun={() => handleRunAlgorithm(algorithm.id)}
									/>
								))}
							</div>
						</TabsContent>

						{categories.map((category) => (
							<TabsContent key={category} value={category} className="mt-0 h-full">
								<div className="grid grid-cols-1 gap-3 h-fit">
									{algorithms
										.filter((alg) => alg.category === category)
										.map((algorithm) => (
											<AlgorithmCard
												key={algorithm.id}
												algorithm={algorithm}
												isSelected={selectedAlgorithm === algorithm.id}
												isRunning={isRunning}
												showCategory={false}
												onSelect={() => setSelectedAlgorithm(algorithm.id)}
												onRun={() => handleRunAlgorithm(algorithm.id)}
											/>
										))}
								</div>
							</TabsContent>
						))}
					</div>
				</Tabs>
			</div>

			{/* Right side - Results and Parameters */}
			<div className="w-1/2 flex flex-col">
				<h3 className="text-lg font-medium mb-4">分析结果</h3>
				
				{error && (
					<Alert variant="destructive" className="mb-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				
				<div className="flex-1 overflow-auto">
					{isRunning ? (
						<div className="h-full flex items-center justify-center">
							<div className="text-center space-y-4">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
								<p className="text-muted-foreground">正在执行算法...</p>
							</div>
						</div>
					) : selectedAlgorithm ? (
						<div className="space-y-4">
							{/* Parameter configuration inside results area */}
							{selectedAlgorithmObj && (
								<AlgorithmParameters
									algorithm={selectedAlgorithmObj}
									availableColumns={availableColumns}
									parameters={parameters}
									onParametersChange={setParameters}
								/>
							)}
							
							<ResultsRenderer
								results={results}
								selectedAlgorithm={selectedAlgorithm}
								algorithms={algorithms}
							/>
						</div>
					) : (
						<div className="h-full">
							<div className="h-full flex items-center justify-center">
								<p className="text-muted-foreground">请选择一个算法开始分析</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}