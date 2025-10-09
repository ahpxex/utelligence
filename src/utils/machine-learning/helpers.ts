import { Matrix } from "ml-matrix";
import type { MLData } from "./types";

/**
 * 将表格数据转换为 ML 数据格式
 */
export function prepareMLData(
	data: Record<string, any>[],
	featureColumns: string[],
	labelColumn?: string,
): MLData {
	console.log("[prepareMLData] Feature columns:", featureColumns);
	console.log("[prepareMLData] Label column:", labelColumn);
	console.log("[prepareMLData] Data sample:", data[0]);
	
	const features: number[][] = [];
	const labels: (number | string)[] = [];

	for (const row of data) {
		const featureRow: number[] = [];
		for (const col of featureColumns) {
			const value = Number.parseFloat(row[col]);
			featureRow.push(Number.isNaN(value) ? 0 : value);
		}
		features.push(featureRow);

		if (labelColumn) {
			// Check if column exists in row
			if (!(labelColumn in row)) {
				console.warn(`[prepareMLData] Label column "${labelColumn}" not found in row:`, Object.keys(row));
			} else if (row[labelColumn] === undefined || row[labelColumn] === null || row[labelColumn] === "") {
				console.warn(`[prepareMLData] Label value is empty for column "${labelColumn}":`, row[labelColumn]);
			} else {
				const label = row[labelColumn];
				labels.push(typeof label === "number" ? label : String(label));
			}
		}
	}

	console.log("[prepareMLData] Features count:", features.length);
	console.log("[prepareMLData] Labels count:", labels.length);
	console.log("[prepareMLData] Labels sample:", labels.slice(0, 3));

	return {
		features,
		labels: labels.length > 0 ? (labels as number[] | string[]) : undefined,
		featureNames: featureColumns,
	};
}

/**
 * 计算 R² (决定系数)
 */
export function calculateRSquared(actual: number[], predicted: number[]): number {
	if (actual.length !== predicted.length || actual.length === 0) {
		return 0;
	}

	const mean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
	let ssTotal = 0;
	let ssResidual = 0;

	for (let i = 0; i < actual.length; i++) {
		ssTotal += (actual[i] - mean) ** 2;
		ssResidual += (actual[i] - predicted[i]) ** 2;
	}

	return ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;
}

/**
 * 计算调整后的 R²
 */
export function calculateAdjustedRSquared(
	rSquared: number,
	n: number,
	p: number,
): number {
	if (n <= p + 1) return rSquared;
	return 1 - ((1 - rSquared) * (n - 1)) / (n - p - 1);
}

/**
 * 计算混淆矩阵
 */
export function calculateConfusionMatrix(
	actual: (number | string)[],
	predicted: (number | string)[],
	classes: (number | string)[],
): number[][] {
	const n = classes.length;
	const matrix: number[][] = Array.from({ length: n }, () =>
		Array.from({ length: n }, () => 0),
	);

	for (let i = 0; i < actual.length; i++) {
		const actualIndex = classes.indexOf(actual[i]);
		const predictedIndex = classes.indexOf(predicted[i]);
		if (actualIndex >= 0 && predictedIndex >= 0) {
			matrix[actualIndex][predictedIndex]++;
		}
	}

	return matrix;
}

/**
 * 从混淆矩阵计算分类指标
 */
export function calculateClassificationMetrics(confusionMatrix: number[][]): {
	accuracy: number;
	precision: number[];
	recall: number[];
	f1_score: number[];
} {
	const n = confusionMatrix.length;
	const precision: number[] = [];
	const recall: number[] = [];
	const f1_score: number[] = [];

	let correctPredictions = 0;
	let totalPredictions = 0;

	for (let i = 0; i < n; i++) {
		let tp = confusionMatrix[i][i];
		let fp = 0;
		let fn = 0;

		for (let j = 0; j < n; j++) {
			if (j !== i) {
				fp += confusionMatrix[j][i]; // 列和（预测为i但实际不是）
				fn += confusionMatrix[i][j]; // 行和（实际为i但预测不是）
			}
			totalPredictions += confusionMatrix[i][j];
		}

		correctPredictions += tp;

		const p = tp + fp === 0 ? 0 : tp / (tp + fp);
		const r = tp + fn === 0 ? 0 : tp / (tp + fn);
		const f1 = p + r === 0 ? 0 : (2 * p * r) / (p + r);

		precision.push(p);
		recall.push(r);
		f1_score.push(f1);
	}

	const accuracy = totalPredictions === 0 ? 0 : correctPredictions / totalPredictions;

	return { accuracy, precision, recall, f1_score };
}

/**
 * K-Fold 交叉验证数据分割
 */
export function kFoldSplit(
	data: number[][],
	labels: (number | string)[],
	k = 5,
): Array<{
	train: { data: number[][]; labels: (number | string)[] };
	test: { data: number[][]; labels: (number | string)[] };
}> {
	const n = data.length;
	const foldSize = Math.floor(n / k);
	const folds: Array<{
		train: { data: number[][]; labels: (number | string)[] };
		test: { data: number[][]; labels: (number | string)[] };
	}> = [];

	for (let i = 0; i < k; i++) {
		const testStart = i * foldSize;
		const testEnd = i === k - 1 ? n : (i + 1) * foldSize;

		const trainData: number[][] = [];
		const trainLabels: (number | string)[] = [];
		const testData: number[][] = [];
		const testLabels: (number | string)[] = [];

		for (let j = 0; j < n; j++) {
			if (j >= testStart && j < testEnd) {
				testData.push(data[j]);
				testLabels.push(labels[j]);
			} else {
				trainData.push(data[j]);
				trainLabels.push(labels[j]);
			}
		}

		folds.push({
			train: { data: trainData, labels: trainLabels },
			test: { data: testData, labels: testLabels },
		});
	}

	return folds;
}

/**
 * 标准化数据
 */
export function standardizeData(data: number[][]): {
	standardized: number[][];
	means: number[];
	stds: number[];
} {
	const matrix = new Matrix(data);
	const means: number[] = [];
	const stds: number[] = [];
	const standardized: number[][] = [];

	for (let col = 0; col < matrix.columns; col++) {
		const column = matrix.getColumn(col);
		const mean = column.reduce((sum, val) => sum + val, 0) / column.length;
		const variance =
			column.reduce((sum, val) => sum + (val - mean) ** 2, 0) / column.length;
		const std = Math.sqrt(variance);

		means.push(mean);
		stds.push(std === 0 ? 1 : std);
	}

	for (let row = 0; row < matrix.rows; row++) {
		const standardizedRow: number[] = [];
		for (let col = 0; col < matrix.columns; col++) {
			const value = matrix.get(row, col);
			standardizedRow.push((value - means[col]) / stds[col]);
		}
		standardized.push(standardizedRow);
	}

	return { standardized, means, stds };
}

/**
 * 将字符串标签转换为数值
 */
export function encodeLabels(labels: (number | string)[]): {
	encoded: number[];
	classes: (number | string)[];
	encoder: Map<number | string, number>;
} {
	const uniqueLabels = Array.from(new Set(labels));
	const encoder = new Map<number | string, number>();
	uniqueLabels.forEach((label, index) => encoder.set(label, index));

	const encoded = labels.map((label) => encoder.get(label) as number);

	return { encoded, classes: uniqueLabels, encoder };
}

/**
 * 解码标签
 */
export function decodeLabels(
	encoded: number[],
	classes: (number | string)[],
): (number | string)[] {
	return encoded.map((e) => classes[e]);
}
