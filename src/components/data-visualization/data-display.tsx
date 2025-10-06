"use client";

import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent } from "@/components/ui/shadcn/card";
import { useUnifiedDataStore } from "@/store/unified-data-store";
import { visualizationChartStore } from "@/store/visualization-chart-store";
import type { ChartConfig } from "@/types/chart-types";
import { PlusCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import AddChartModal from "../ui/data/add-chart-modal";
import { Badge } from "../ui/shadcn/badge";
import ChartRenderer from "./charts/chart-renderer";
/**
 * 数据可视化显示组件
 * 负责处理数据文件(CSV/Excel)并显示可视化图表
 */
export default function DataDisplay() {
	// Get data from unified store
	const {
		currentFile: file,
		rawData,
		processedData: parsedData,
		currentFileIdentifier,
		activeProfileId,
		isLoading: isFileLoading,
		error: fileError,
		processAndAnalyze,
	} = useUnifiedDataStore();

	// Get visualization chart state - using individual selectors to avoid infinite loop
	const userCharts = visualizationChartStore((state) => state.userCharts);
	const removeChart = visualizationChartStore((state) => state.removeChart);
	const setChartType = visualizationChartStore((state) => state.setChartType);
	const setChartTitle = visualizationChartStore((state) => state.setChartTitle);
	const setXAxisColumn = visualizationChartStore((state) => state.setXAxisColumn);
	const setYAxisColumn = visualizationChartStore((state) => state.setYAxisColumn);
	const resetBuilder = visualizationChartStore((state) => state.resetBuilder);
	const availableColumns = visualizationChartStore((state) => state.availableColumns);

	// Local state only for modal open/close
	const [addChartModalOpen, setAddChartModalOpen] = useState<boolean>(false);

	// Simplified useEffect to trigger file processing via store action
	useEffect(() => {
		// Don't clear if we have a profile (even if file is null after refresh)
		if (!activeProfileId) {
			return;
		}

		// Check if we have rawData and haven't processed it yet
		// processAndAnalyze will skip if data is already processed
		if (rawData && rawData.headers && !parsedData) {
			processAndAnalyze(rawData.headers).catch((error) => {
				console.error("Error processing data:", error);
			});
		}
	}, [
		activeProfileId,
		rawData,
		parsedData,
		currentFileIdentifier,
		processAndAnalyze,
	]);

	// Get columnsVisualizableStatus for validation
	const columnsVisualizableStatus = visualizationChartStore((state) => state.columnsVisualizableStatus);

	// 打开添加图表对话框
	const openAddChartModal = () => {
		// Check for fileError from the store instead of rawFileData presence
		if (fileError) {
			console.error("Cannot open add chart modal due to file error:", fileError);
			return;
		}
		if (isFileLoading) {
			console.warn("Data is still loading, please wait.");
			return;
		}

		// Check if processed data exists
		if (!parsedData || !parsedData.headers || parsedData.headers.length === 0) {
			console.warn("No processed data available yet, please wait.");
			return;
		}

		// Check if available columns are set in visualization chart store
		if (availableColumns.length === 0) {
			console.warn("Available columns not ready yet, please wait.");
			return;
		}

		// Check if columns have been analyzed for visualization
		if (columnsVisualizableStatus.length === 0) {
			console.warn("Column visualization analysis not completed yet, please wait.");
			return;
		}

		setAddChartModalOpen(true);
		// Reset builder state each time the modal opens
		resetBuilder();
		setChartType("bar");
		setChartTitle("");
		setXAxisColumn(null);
		setYAxisColumn(null);
	};

	// Determine available columns for display
	const columnsForDisplay =
		availableColumns.length > 0 ? availableColumns : parsedData?.headers || [];

	// Render loading and error states based on store state
	if (!activeProfileId) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-gray-500 dark:text-gray-400">请先上传文件</p>
			</div>
		);
	}

	if (isFileLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-gray-500 dark:text-gray-400">正在处理文件...</p>
			</div>
		);
	}

	if (fileError) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-4">
				<p className="text-red-500 dark:text-red-400 mb-4">文件处理失败:</p>
				<p className="text-red-400 dark:text-red-300 text-sm bg-red-900/20 p-2 rounded">
					{fileError}
				</p>
			</div>
		);
	}

	return (
		<div className="w-full">
			<Card className="mb-6">
				<CardContent className="p-4">
					<div className="flex justify-between items-center">
						<div>
							<h3 className="text-sm font-medium mb-2">数据可视化总览</h3>
							<p className="text-xs text-muted-foreground mb-2">可用列数: {columnsForDisplay.length}</p>
							<div className="flex flex-wrap gap-2">
								{columnsForDisplay.map((col) => (
									<Badge key={col} variant="outline" className="text-xs">
										{col}
									</Badge>
								))}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{userCharts.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center h-64 p-6">
						<p className="text-muted-foreground mb-6 text-center">
							您尚未创建任何数据可视化图表。
							<br />
							点击下方按钮，选择需要可视化的列和图表类型。
						</p>
						<Button
							onClick={openAddChartModal}
							className="flex items-center gap-2"
							disabled={isFileLoading || !!fileError}
						>
							<PlusCircle size={16} />
							<span>添加可视化图表</span>
						</Button>
					</CardContent>
				</Card>
			) : (
				<>
					<div className="flex justify-end mb-4">
						<Button
							onClick={openAddChartModal}
							variant="default"
							className="flex items-center gap-2"
							size="sm"
							disabled={isFileLoading || !!fileError}
						>
							<PlusCircle size={16} />
							<span>添加图表</span>
						</Button>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{userCharts.map((chart: ChartConfig) => (
							<div key={chart.id} className="relative">
								<ChartRenderer chartConfig={chart} onRemoveChart={removeChart} />
								<Button
									variant="ghost"
									size="icon"
									className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
									onClick={() => removeChart(chart.id)}
									aria-label="删除图表"
								>
									<X size={12} />
								</Button>
							</div>
						))}
					</div>
				</>
			)}

			{/* 添加图表对话框 */}
			<AddChartModal open={addChartModalOpen} onOpenChange={setAddChartModalOpen} />
		</div>
	);
}
