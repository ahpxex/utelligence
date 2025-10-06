"use client";

import { getChartColor } from "@/utils/constants/chart-colors";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/shadcn/card";
import type { ChartConfig } from "@/types/chart-types";
import { AlertTriangle } from "lucide-react";
import { useMemo, type FC } from "react";
import BaseEChart from "./base-echart";
import type { EChartsCoreOption } from "echarts";

interface BarChartComponentProps {
	chartConfig: ChartConfig;
}

const BarChartComponent: FC<BarChartComponentProps> = ({ chartConfig }) => {
	const {
		title = "Bar Chart",
		processedData = [],
		xAxisColumn,
		yAxisColumn,
		layout = "simple",
		yCategories = [],
		yKey = "count",
		isTruncated = false,
	} = chartConfig;

	const categoryDataKey = "name";

	const description = `X: ${xAxisColumn || "N/A"}, Y: ${yAxisColumn || "N/A"} (${layout === "stacked" ? "Stacked" : "Simple"} Count)`;

	const option = useMemo<EChartsCoreOption>(() => {
		const xCategories = processedData.map((item: Record<string, unknown>) => String(item[categoryDataKey] ?? ""));

		const series =
			layout === "stacked"
				? yCategories.map((category: string, index: number) => ({
					name: category,
					type: "bar" as const,
					stack: "total",
					emphasis: { focus: "series" as const },
					itemStyle: { color: getChartColor(index) },
					data: processedData.map((row: Record<string, unknown>) => Number(row[category] ?? 0)),
				}))
				: [
					{
						name: yAxisColumn || yKey,
						type: "bar" as const,
						itemStyle: { color: getChartColor(0) },
						data: processedData.map((row: Record<string, unknown>) => Number(row[yKey] ?? 0)),
						emphasis: { focus: "series" as const },
					},
				];

		return {
			tooltip: { trigger: "axis" },
			legend: { top: 0 },
			grid: { left: 56, right: 24, top: 40, bottom: 80 },
			xAxis: {
				type: "category",
				data: xCategories,
				axisLabel: { rotate: 45, align: "right" },
			},
			yAxis: {
				type: "value",
				axisLine: { show: false },
				splitLine: { lineStyle: { type: "dashed" } },
			},
			series,
		};
	}, [layout, processedData, yCategories, yAxisColumn, yKey]);

	if (!processedData || processedData.length === 0) {
		return (
			<Card className="h-[400px]">
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">{title}</CardTitle>
					<CardDescription className="text-xs">{description} - 正在等待数据...</CardDescription>
				</CardHeader>
				<CardContent className="flex items-center justify-center h-[340px]">
					<p className="text-muted-foreground">没有可用于柱状图的数据。</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="h-[400px]">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm">{title}</CardTitle>
				<CardDescription className="text-xs flex items-center">
					{description}
					{isTruncated && (
						<span
							className="ml-2 flex items-center text-amber-600 dark:text-amber-400"
							title="数据点过多，已截断显示"
						>
							<AlertTriangle size={12} className="mr-1" />
							(已截断)
						</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent className="h-[340px]">
				<BaseEChart option={option} style={{ height: "100%" }} />
			</CardContent>
		</Card>
	);
};

BarChartComponent.displayName = "BarChartComponent";

export default BarChartComponent;
