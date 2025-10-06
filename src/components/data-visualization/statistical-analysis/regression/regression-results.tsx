"use client";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/shadcn/card";
import { getChartColor } from "@/utils/constants/chart-colors";
import type { RegressionResult } from "@/utils/data/statistics/regression";
import BaseEChart from "../../charts/base-echart";
import type { EChartsCoreOption } from "echarts";
import { useMemo } from "react";

interface RegressionResultsProps {
	regressionResult: RegressionResult;
	regressionData: { x: number; y: number; predicted?: number }[];
	truncatedData: { x: number; y: number; predicted?: number }[];
	linePoints: { x: number; y: number }[];
	dependentVar: string;
	independentVar: string;
	regressionType: string;
	additionalVars: string[];
	dataPointLimit: number;
}

export function RegressionResults({
	regressionResult,
	regressionData,
	truncatedData,
	linePoints,
	dependentVar,
	independentVar,
	regressionType,
	additionalVars,
	dataPointLimit,
}: RegressionResultsProps) {
	const chartOption = useMemo<EChartsCoreOption | null>(() => {
		const scatterPoints = truncatedData.map((point) => [Number(point.x), Number(point.y)]);
		const sortedLinePoints = [...linePoints]
			.sort((a, b) => a.x - b.x)
			.map((point) => [Number(point.x), Number(point.y)]);

		if (scatterPoints.length === 0 && sortedLinePoints.length === 0) {
			return null;
		}

		const series: Array<{
			name: string;
			type: "scatter" | "line";
			symbolSize?: number;
			smooth?: boolean;
			showSymbol?: boolean;
			lineStyle?: { color: string; width: number };
			itemStyle: { color: string };
			data: number[][];
		}> = [
			{
				name: "观测值",
				type: "scatter",
				symbolSize: 8,
				itemStyle: { color: getChartColor(0) },
				data: scatterPoints,
			},
		];

		if (sortedLinePoints.length > 0) {
			series.push({
				name: "预测值",
				type: "line",
				smooth: true,
				showSymbol: false,
				lineStyle: { color: getChartColor(1), width: 2 },
				itemStyle: { color: getChartColor(1) },
				data: sortedLinePoints,
			});
		}

		return {
			tooltip: {
				trigger: "item",
				formatter: (params: { value: [number, number] }) => {
					const [x, y] = params.value;
					return `${independentVar}: ${x}<br/>${dependentVar}: ${y}`;
				},
			},
			legend: { data: series.map((s) => s.name), top: 0 },
			grid: { left: 56, right: 24, top: 48, bottom: 56 },
			xAxis: {
				name: independentVar,
				type: "value",
				nameLocation: "middle",
				nameGap: 30,
				splitLine: { lineStyle: { type: "dashed" } },
			},
			yAxis: {
				name: dependentVar,
				type: "value",
				nameLocation: "middle",
				nameGap: 40,
				splitLine: { lineStyle: { type: "dashed" } },
			},
			series,
		};
	}, [dependentVar, independentVar, linePoints, truncatedData]);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<Card>
				<CardHeader>
					<CardTitle>回归分析可视化</CardTitle>
					<CardDescription>
						{dependentVar} vs {independentVar}
						{regressionType === "multiple" && additionalVars.length > 0 && " + 其他变量"}
						{regressionData.length > dataPointLimit && (
							<span className="block text-xs text-muted-foreground mt-1">
								(显示 {truncatedData.length} 个数据点，总共 {regressionData.length} 个)
							</span>
						)}
					</CardDescription>
				</CardHeader>
				<CardContent className="h-[350px]">
					{chartOption ? (
						<BaseEChart option={chartOption} style={{ height: "100%" }} />
					) : (
						<div className="flex items-center justify-center h-full text-muted-foreground">
							暂无可视化数据
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>回归模型统计</CardTitle>
					<CardDescription>
						{(() => {
							switch (regressionType) {
								case "simple":
									return "简单线性回归";
								case "multiple":
									return "多元线性回归";
								case "logistic":
									return "逻辑回归";
								case "exponential":
									return "指数回归";
								case "power":
									return "幂函数回归";
								default:
									return "回归分析";
							}
						})()}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<table className="w-full text-sm">
						<tbody>
							<tr>
								<td className="py-2 font-medium">回归方程</td>
								<td className="py-2">{regressionResult.equation}</td>
							</tr>
							<tr>
								<td className="py-2 font-medium">
									{regressionType === "logistic" ? "伪R²值" : "R²值"}
								</td>
								<td className="py-2">{regressionResult.r2.toFixed(4)}</td>
							</tr>
							<tr>
								<td className="py-2 font-medium">调整后的R²</td>
								<td className="py-2">{regressionResult.adjustedR2.toFixed(4)}</td>
							</tr>
							<tr>
								<td className="py-2 font-medium">标准误差</td>
								<td className="py-2">{regressionResult.standardError.toFixed(4)}</td>
							</tr>
							<tr>
								<td className="py-2 font-medium">观测值</td>
								<td className="py-2">{regressionResult.observations}</td>
							</tr>
							{regressionType === "simple" && (
								<>
									<tr>
										<td className="py-2 font-medium">斜率</td>
										<td className="py-2">{regressionResult.slope?.toFixed(4)}</td>
									</tr>
									<tr>
										<td className="py-2 font-medium">截距</td>
										<td className="py-2">{regressionResult.intercept?.toFixed(4)}</td>
									</tr>
								</>
							)}
							{regressionType === "multiple" && regressionResult.coefficients && (
								<tr>
									<td className="py-2 font-medium align-top">系数</td>
									<td className="py-2">
										<ul className="list-none space-y-1">
											<li>截距: {regressionResult.coefficients[0]?.toFixed(4)}</li>
											{regressionResult.coefficients.slice(1).map((coef, index) => (
												<li key={index}>
													{`X${index + 1}`}: {coef?.toFixed(4)}
												</li>
											))}
										</ul>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</CardContent>
			</Card>
		</div>
	);
}
