"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/shadcn/select";
import { Tabs, TabsContent } from "@/components/ui/shadcn/tabs";
import { algorithms, categoryLabels } from "@/utils/machine-learning/algorithms";
import { getMockResult } from "@/utils/machine-learning/mock-results";
import { useState } from "react";
import { AlgorithmCard } from "./components/algorithm-card";
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

	const categories = Object.keys(categoryLabels);
	const filteredAlgorithms =
		selectedCategory === "all"
			? algorithms
			: algorithms.filter((alg) => alg.category === selectedCategory);

	const runAlgorithm = async (algorithmId: string) => {
		if (!file || availableColumns.length === 0) {
			return;
		}

		setIsRunning(true);
		setResults(null);

		// Simulate processing time
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Get mock result
		const mockResult = getMockResult(algorithmId, availableColumns);
		setResults(mockResult);
		setIsRunning(false);
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
			<div className="w-1/2 flex flex-col space-y-4">
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

				<Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="overflow-auto p-2 pr-6 flex flex-col">
					<div>
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
										onRun={() => runAlgorithm(algorithm.id)}
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
												onRun={() => runAlgorithm(algorithm.id)}
											/>
										))}
								</div>
							</TabsContent>
						))}
					</div>
				</Tabs>
			</div>

			{/* Right side - Results */}
			<div className="w-1/2 flex flex-col">
				<h3 className="text-lg font-medium mb-4">分析结果</h3>
				<div className="flex-1 overflow-auto">
					{selectedAlgorithm ? (
						<ResultsRenderer
							results={results}
							selectedAlgorithm={selectedAlgorithm}
							algorithms={algorithms}
						/>
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