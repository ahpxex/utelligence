"use client";

import { Alert, AlertDescription } from "@/components/ui/shadcn/alert";
import { Skeleton } from "@/components/ui/shadcn/skeleton";
import { processFileData } from "@/utils/data/data-processing";
import {
	type RegressionResult,
	exponentialRegression,
	logisticRegression,
	multipleLinearRegression,
	powerRegression,
	simpleLinearRegression,
} from "@/utils/data/statistics/regression";
import { convertToNumericArray } from "@/utils/data/statistics/utils";
import { useEffect, useMemo, useState } from "react";
import { RegressionControls } from "./regression/regression-controls";
import { RegressionResults } from "./regression/regression-results";
import { RegressionTypeInformation } from "./regression/regression-type-information";

interface RegressionTabProps {
	file: File | null;
	availableColumns: string[];
}

export function RegressionTab({ file, availableColumns }: RegressionTabProps) {
	const [regressionType, setRegressionType] = useState<string>("simple");
	const [independentVar, setIndependentVar] = useState<string>("");
	const [dependentVar, setDependentVar] = useState<string>("");
	const [additionalVars, setAdditionalVars] = useState<string[]>([]);
	const [regressionResult, setRegressionResult] = useState<RegressionResult | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [regressionData, setRegressionData] = useState<
		{ x: number; y: number; predicted?: number }[]
	>([]);
	const [numericColumns, setNumericColumns] = useState<string[]>([]);
	const [hasFile, setHasFile] = useState<boolean>(false);
	const [dataPointLimit] = useState<number>(400); // Keep limit logic here or move to Results

	// Identify which columns contain numeric data
	const identifyNumericColumns = async () => {
		if (!file) return;

		setIsLoading(true);
		setErrorMessage(null);
		setNumericColumns([]); // Reset numeric columns

		try {
			const data = await new Promise<{ headers: string[]; rows: any[][] }>((resolve, reject) => {
				processFileData(file, resolve, reject);
			});

			const headers = data.headers;
			const rows = data.rows;
			const numericCols: string[] = [];

			for (const col of availableColumns) {
				const colIndex = headers.indexOf(col);
				if (colIndex !== -1) {
					const colData = rows.map((row) => row[colIndex]);
					const numericData = convertToNumericArray(colData);
					// Consider numeric if at least 30% are valid numbers
					if (numericData.length >= colData.length * 0.3) {
						numericCols.push(col);
					}
				}
			}
			setNumericColumns(numericCols);
		} catch (error: any) {
			console.error("Error identifying numeric columns:", error);
			setErrorMessage(
				`处理文件以识别数值列时出错: ${typeof error === "string" ? error : error?.message || "未知错误"}`
			);
		} finally {
			setIsLoading(false);
		}
	};

	// Perform the regression analysis
	const performRegression = async () => {
		if (!file || !dependentVar || !independentVar) return;

		setIsLoading(true);
		setErrorMessage(null);
		setRegressionResult(null);
		setRegressionData([]);

		try {
			const data = await new Promise<{ headers: string[]; rows: any[][] }>((resolve, reject) => {
				processFileData(file, resolve, reject);
			});

			const headers = data.headers;
			const rows = data.rows;
			const dependentIndex = headers.indexOf(dependentVar);
			const independentIndex = headers.indexOf(independentVar);

			if (dependentIndex === -1 || independentIndex === -1) {
				throw new Error("无法找到选定的因变量或自变量列");
			}

			const yData = rows.map((row) => row[dependentIndex]);
			const xData = rows.map((row) => row[independentIndex]);

			let result: RegressionResult | null = null;
			switch (regressionType) {
				case "simple":
					result = simpleLinearRegression(xData, yData);
					break;
				case "multiple":
					const additionalData = additionalVars
						.map((col) => {
							const colIndex = headers.indexOf(col);
							return colIndex !== -1 ? rows.map((row) => row[colIndex]) : [];
						})
						.filter((arr) => arr.length > 0);

					if (additionalData.length > 0) {
						result = multipleLinearRegression(yData, [xData, ...additionalData]);
					} else {
						result = simpleLinearRegression(xData, yData); // Fallback to simple if no valid additional vars
					}
					break;
				case "logistic":
					result = logisticRegression(xData, yData);
					break;
				case "exponential":
					result = exponentialRegression(xData, yData);
					break;
				case "power":
					result = powerRegression(xData, yData);
					break;
			}

			if (result) {
				setRegressionResult(result);

				// Prepare data for visualization (using valid pairs)
				const visualData: { x: number; y: number; predicted?: number }[] = [];
				const [validX, validY] = prepareRegressionData(xData, yData); // Reuse data prep logic

				for (let i = 0; i < validX.length; i++) {
					const dataPoint: { x: number; y: number; predicted?: number } = {
						x: validX[i],
						y: validY[i],
					};

					// Match predictions - need to ensure this aligns correctly with valid pairs
					// Simple approach: Use the index assuming result.predictedValues corresponds to valid pairs
					if (result.predictedValues && i < result.predictedValues.length) {
						dataPoint.predicted = result.predictedValues[i];
					}
					visualData.push(dataPoint);
				}

				visualData.sort((a, b) => a.x - b.x);
				setRegressionData(visualData);
			} else {
				throw new Error(
					"无法执行回归分析。请确保数据适合所选的回归类型（例如，逻辑回归需要二元 Y 值）。"
				);
			}
		} catch (error: any) {
			console.error("Error performing regression:", error);
			setErrorMessage(
				`执行回归分析时出错: ${typeof error === "string" ? error : error?.message || "未知错误"}`
			);
			setRegressionResult(null);
			setRegressionData([]);
		} finally {
			setIsLoading(false);
		}
	};

	// Initialize state when file or selected columns change
	useEffect(() => {
		if (file) {
			setHasFile(true);
			identifyNumericColumns();
		} else {
			setHasFile(false);
			setNumericColumns([]);
			setDependentVar("");
			setIndependentVar("");
			setAdditionalVars([]);
			setRegressionResult(null);
			setRegressionData([]);
			setErrorMessage(null);
		}
	}, [file, availableColumns]); // Rerun when file or selected columns change

	// Reset dependent/independent variables when numeric columns change
	useEffect(() => {
		if (numericColumns.length > 0) {
			// Set defaults only if current selections are invalid or not present
			const firstCol = numericColumns[0];
			const secondCol = numericColumns.length > 1 ? numericColumns[1] : "";

			if (!numericColumns.includes(dependentVar)) {
				setDependentVar(firstCol);
			}
			if (!numericColumns.includes(independentVar) || independentVar === dependentVar) {
				setIndependentVar(secondCol);
			}
			// Remove any additional vars that are no longer numeric or are the main vars
			setAdditionalVars((prev) =>
				prev.filter((v) => numericColumns.includes(v) && v !== dependentVar && v !== independentVar)
			);
		} else {
			// Clear selections if no numeric columns available
			setDependentVar("");
			setIndependentVar("");
			setAdditionalVars([]);
		}
	}, [numericColumns]); // Rerun only when numeric columns list changes

	// Perform regression when variables or regression type changes
	useEffect(() => {
		// Only run if we have valid selections and file
		if (
			dependentVar &&
			independentVar &&
			hasFile &&
			numericColumns.includes(dependentVar) &&
			numericColumns.includes(independentVar)
		) {
			performRegression();
		} else {
			// Clear results if selections become invalid
			setRegressionResult(null);
			setRegressionData([]);
		}
	}, [dependentVar, independentVar, additionalVars, regressionType, hasFile]); // Dependencies

	// Add a variable to the multiple regression
	const handleAddVariable = (variable: string) => {
		if (
			!additionalVars.includes(variable) &&
			variable !== dependentVar &&
			variable !== independentVar
		) {
			setAdditionalVars([...additionalVars, variable]);
		}
	};

	// Remove a variable from the multiple regression
	const handleRemoveVariable = (variable: string) => {
		setAdditionalVars(additionalVars.filter((v) => v !== variable));
	};

	// Truncate data points for chart rendering
	const truncatedData = useMemo(() => {
		if (regressionData.length <= dataPointLimit) {
			return regressionData;
		}
		const sampledData: typeof regressionData = [];
		const sortedByX = [...regressionData].sort((a, b) => a.x - b.x);
		if (sortedByX.length > 0) {
			sampledData.push(sortedByX[0]);
			sampledData.push(sortedByX[sortedByX.length - 1]);
		}
		const remainingPoints = regressionData.filter(
			(_, i) => i !== 0 && i !== regressionData.length - 1
		);
		const sampleSize = Math.min(dataPointLimit - 2, remainingPoints.length);
		for (let i = 0; i < sampleSize; i++) {
			sampledData.push(remainingPoints[i]);
		}
		for (let i = sampleSize; i < remainingPoints.length; i++) {
			const j = Math.floor(Math.random() * (i + 1));
			if (j < sampleSize) {
				sampledData[j + 2] = remainingPoints[i];
			}
		}
		return sampledData;
	}, [regressionData, dataPointLimit]);

	// Generate points for the regression line visualization
	const linePoints = useMemo(() => {
		if (!regressionResult || regressionData.length === 0) return [];

		const sortedData = [...regressionData].sort((a, b) => a.x - b.x);
		const lineData: Array<{ x: number; y: number }> = [];
		const xMin = sortedData[0].x;
		const xMax = sortedData[sortedData.length - 1].x;
		const range = xMax - xMin;

		// Avoid division by zero or infinite loops if range is zero
		if (range <= 0) {
			// Handle single point case or very small range
			if (regressionResult.predictedValues && regressionResult.predictedValues.length > 0) {
				return sortedData
					.filter((d) => d.predicted !== undefined)
					.map((d) => ({ x: d.x, y: d.predicted as number }));
			} else {
				// Cannot generate line for non-predicted cases with zero range
				return [];
			}
		}

		const step = range / 100; // Generate 101 points for the line

		// Function to calculate y based on regression type and coefficients
		const calculateY = (x: number): number | null => {
			switch (regressionType) {
				case "simple":
				case "multiple": // Use predicted values if available, otherwise estimate if simple
					if (regressionResult.predictedValues) {
						// Find the closest original data point to get prediction (less accurate)
						// A better approach might involve interpolation if needed
						const closestPoint = sortedData.reduce((prev, curr) =>
							Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
						);
						return closestPoint.predicted ?? null;
					} else if (
						regressionType === "simple" &&
						regressionResult.slope !== undefined &&
						regressionResult.intercept !== undefined
					) {
						return regressionResult.slope * x + regressionResult.intercept;
					}
					return null;
				case "exponential":
					if (regressionResult.coefficients.length >= 2) {
						return (
							regressionResult.coefficients[0] * Math.exp(regressionResult.coefficients[1] * x)
						);
					}
					return null;
				case "power":
					if (x > 0 && regressionResult.coefficients.length >= 2) {
						return regressionResult.coefficients[0] * Math.pow(x, regressionResult.coefficients[1]);
					}
					return null;
				case "logistic":
					if (regressionResult.slope !== undefined && regressionResult.intercept !== undefined) {
						const z = regressionResult.intercept + regressionResult.slope * x;
						return 1 / (1 + Math.exp(-z));
					}
					return null;
				default:
					return null;
			}
		};

		for (let i = 0; i <= 100; i++) {
			const x = xMin + i * step;
			const y = calculateY(x);
			if (y !== null && isFinite(y)) {
				// Ensure y is a valid number
				lineData.push({ x, y });
			}
		}

		// Ensure the last point is included exactly if missed by step
		if (lineData.length === 0 || lineData[lineData.length - 1].x < xMax) {
			const lastY = calculateY(xMax);
			if (lastY !== null && isFinite(lastY)) {
				lineData.push({ x: xMax, y: lastY });
			}
		}

		return lineData;
	}, [regressionResult, regressionData, regressionType]);

	// ---- Render Logic ----

	if (!hasFile) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-gray-500">请先上传文件</p>
			</div>
		);
	}

	if (isLoading && numericColumns.length === 0) {
		// Show skeleton when initially identifying numeric columns
		return (
			<div className="space-y-4">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-8 w-1/3" />
				<Skeleton className="h-60 w-full" />
			</div>
		);
	}

	if (numericColumns.length < 1) {
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-gray-500">选定列中未找到足够的数值数据进行分析</p>
			</div>
		);
	}

	if (numericColumns.length < 2 && regressionType !== "logistic") {
		// Most regressions need at least 2 numeric columns (X and Y)
		// Logistic might work with 1 X if Y is binary (handled in function)
		return (
			<div className="flex items-center justify-center h-full">
				<p className="text-gray-500">需要至少两列数值数据进行此回归分析</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Controls Section */}
			<RegressionControls
				regressionType={regressionType}
				setRegressionType={setRegressionType}
				numericColumns={numericColumns}
				dependentVar={dependentVar}
				setDependentVar={setDependentVar}
				independentVar={independentVar}
				setIndependentVar={setIndependentVar}
				additionalVars={additionalVars}
				handleAddVariable={handleAddVariable}
				handleRemoveVariable={handleRemoveVariable}
			/>

			{/* Error Message */}
			{errorMessage && (
				<Alert variant="destructive">
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			)}

			{/* Loading Indicator for Regression Calculation */}
			{isLoading && regressionResult === null && (
				<div className="space-y-4 mt-6">
					<Skeleton className="h-[350px] w-full" />
					<Skeleton className="h-[200px] w-full" />
				</div>
			)}

			{/* Results Section */}
			{!isLoading && regressionResult && (
				<RegressionResults
					regressionResult={regressionResult}
					regressionData={regressionData}
					truncatedData={truncatedData}
					linePoints={linePoints}
					dependentVar={dependentVar}
					independentVar={independentVar}
					regressionType={regressionType}
					additionalVars={additionalVars}
					dataPointLimit={dataPointLimit}
				/>
			)}

			{/* Information Section */}
			<RegressionTypeInformation regressionType={regressionType} />
		</div>
	);
}

// Helper function (already exists in regression.ts, but needed here for type check)
function prepareRegressionData(xData: any[], yData: any[]): [number[], number[]] {
	const pairs: [number, number][] = [];

	for (let i = 0; i < Math.min(xData.length, yData.length); i++) {
		const xValue = xData[i];
		const yValue = yData[i];
		const xNum = typeof xValue === "number" ? xValue : Number(String(xValue).trim());
		const yNum = typeof yValue === "number" ? yValue : Number(String(yValue).trim());

		if (
			!isNaN(xNum) &&
			!isNaN(yNum) &&
			xValue !== null &&
			xValue !== undefined &&
			String(xValue).trim() !== "" &&
			yValue !== null &&
			yValue !== undefined &&
			String(yValue).trim() !== ""
		) {
			pairs.push([xNum, yNum]);
		}
	}
	return [pairs.map((p) => p[0]), pairs.map((p) => p[1])];
}
