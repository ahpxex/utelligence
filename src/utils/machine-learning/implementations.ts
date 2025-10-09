/**
 * 机器学习算法实现的统一入口
 * 整合所有算法实现，提供统一的调用接口
 */

// 导出所有实现
export * from "./types";
export * from "./helpers";
export * from "./unsupervised";
export * from "./supervised";
export * from "./regression";
export * from "./matrix-operations";

import { runPCA, runKMeans } from "./unsupervised";
import {
	runNaiveBayes,
	runKNN,
	runDecisionTree,
	runRandomForest,
	analyzeConfusionMatrix,
} from "./supervised";
import {
	runSimpleLinearRegression,
	runPolynomialRegression,
	runMultivariateLinearRegression,
	runPowerRegression,
	runExponentialRegression,
	runTheilSenRegression,
	runRobustPolynomialRegression,
	runDecisionTreeRegression,
	runRandomForestRegression,
} from "./regression";
import {
	runSVD,
	runEVD,
	runCholesky,
	runLU,
	runQR,
	runDistanceMatrix,
} from "./matrix-operations";
import { prepareMLData } from "./helpers";
import type { MLResult } from "./types";

/**
 * 根据算法 ID 运行相应的算法
 */
export async function runAlgorithm(
	algorithmId: string,
	data: Record<string, any>[],
	options: {
		featureColumns?: string[];
		labelColumn?: string;
		testSize?: number;
		[key: string]: any;
	} = {},
): Promise<MLResult> {
	// 提取数值列 - 检查是否是数字或可以转换为数字
	const numericColumns =
		options.featureColumns ||
		Object.keys(data[0]).filter((key) => {
			const value = data[0][key];
			return typeof value === "number" || !Number.isNaN(Number.parseFloat(value));
		});
	
	console.log("[ML Debug] Algorithm:", algorithmId);
	console.log("[ML Debug] Data rows:", data.length);
	console.log("[ML Debug] Numeric columns:", numericColumns);
	console.log("[ML Debug] Options:", options);

	// 根据算法类型执行不同的逻辑
	switch (algorithmId) {
		// 无监督学习
		case "pca": {
			const mlData = prepareMLData(data, numericColumns);
			return runPCA(mlData.features, {
				nComponents: options.nComponents || 3,
			});
		}

		case "kmeans": {
			const mlData = prepareMLData(data, numericColumns);
			return runKMeans(mlData.features, {
				k: options.k || 3,
				maxIterations: options.maxIterations || 100,
			});
		}

		// 监督学习 - 分类
		case "naive_bayes":
		case "knn":
		case "decision_tree":
		case "random_forest": {
			if (!options.labelColumn) {
				throw new Error("分类算法需要指定标签列");
			}

			const mlData = prepareMLData(data, numericColumns, options.labelColumn);
			if (!mlData.labels || mlData.labels.length === 0) {
				throw new Error("未找到标签数据");
			}

			// 简单的训练/测试集分割
			const testSize = options.testSize || 0.3;
			const splitIndex = Math.floor(data.length * (1 - testSize));

			const trainData = mlData.features.slice(0, splitIndex);
			const trainLabels = mlData.labels.slice(0, splitIndex);
			const testData = mlData.features.slice(splitIndex);
			const testLabels = mlData.labels.slice(splitIndex);

			if (algorithmId === "naive_bayes") {
				return runNaiveBayes(trainData, trainLabels, testData, testLabels);
			}
			if (algorithmId === "knn") {
				return runKNN(trainData, trainLabels, testData, testLabels, {
					k: options.k || 5,
				});
			}
			if (algorithmId === "decision_tree") {
				return runDecisionTree(trainData, trainLabels, testData, testLabels, {
					maxDepth: options.maxDepth || 10,
					minNumSamples: options.minNumSamples || 3,
				});
			}
			if (algorithmId === "random_forest") {
				return runRandomForest(trainData, trainLabels, testData, testLabels, {
					nEstimators: options.nEstimators || 100,
					maxDepth: options.maxDepth || 10,
				});
			}
			break;
		}

		case "confusion_matrix": {
			if (!options.actualColumn || !options.predictedColumn) {
				throw new Error("混淆矩阵需要指定实际值列和预测值列");
			}

			const actual = data.map((row) => row[options.actualColumn]);
			const predicted = data.map((row) => row[options.predictedColumn]);

			return analyzeConfusionMatrix(actual, predicted);
		}

		// 回归分析
		case "simple_linear": {
			if (numericColumns.length < 2) {
				throw new Error("简单线性回归需要至少2个数值列");
			}
			const x = data.map((row) => Number(row[numericColumns[0]]));
			const y = data.map((row) => Number(row[numericColumns[1]]));
			return runSimpleLinearRegression(x, y);
		}

		case "polynomial": {
			if (numericColumns.length < 2) {
				throw new Error("多项式回归需要至少2个数值列");
			}
			const x = data.map((row) => Number(row[numericColumns[0]]));
			const y = data.map((row) => Number(row[numericColumns[1]]));
			return runPolynomialRegression(x, y, options.degree || 2);
		}

		case "multivariate": {
			if (numericColumns.length < 2) {
				throw new Error("多元回归需要至少2个数值列");
			}
			const yColumn = numericColumns[numericColumns.length - 1];
			const xColumns = numericColumns.slice(0, -1);
			const mlData = prepareMLData(data, xColumns, yColumn);
			if (!mlData.labels) {
				throw new Error("未找到标签数据");
			}
			return runMultivariateLinearRegression(
				mlData.features,
				mlData.labels.map(Number),
			);
		}

		case "power": {
			if (numericColumns.length < 2) {
				throw new Error("幂回归需要至少2个数值列");
			}
			const x = data.map((row) => Number(row[numericColumns[0]]));
			const y = data.map((row) => Number(row[numericColumns[1]]));
			return runPowerRegression(x, y);
		}

		case "exponential": {
			if (numericColumns.length < 2) {
				throw new Error("指数回归需要至少2个数值列");
			}
			const x = data.map((row) => Number(row[numericColumns[0]]));
			const y = data.map((row) => Number(row[numericColumns[1]]));
			return runExponentialRegression(x, y);
		}

		case "theil_sen": {
			if (numericColumns.length < 2) {
				throw new Error("Theil-Sen回归需要至少2个数值列");
			}
			const x = data.map((row) => Number(row[numericColumns[0]]));
			const y = data.map((row) => Number(row[numericColumns[1]]));
			return runTheilSenRegression(x, y);
		}

		case "robust_polynomial": {
			if (numericColumns.length < 2) {
				throw new Error("稳健多项式回归需要至少2个数值列");
			}
			const x = data.map((row) => Number(row[numericColumns[0]]));
			const y = data.map((row) => Number(row[numericColumns[1]]));
			return runRobustPolynomialRegression(x, y, options.degree || 2);
		}

		case "decision_tree_reg": {
			if (numericColumns.length < 2) {
				throw new Error("决策树回归需要至少2个数值列");
			}
			const yColumn = numericColumns[numericColumns.length - 1];
			const xColumns = numericColumns.slice(0, -1);
			const mlData = prepareMLData(data, xColumns, yColumn);
			if (!mlData.labels) {
				throw new Error("未找到标签数据");
			}
			return runDecisionTreeRegression(mlData.features, mlData.labels.map(Number), {
				maxDepth: options.maxDepth || 10,
				minNumSamples: options.minNumSamples || 3,
			});
		}

		case "random_forest_reg": {
			if (numericColumns.length < 2) {
				throw new Error("随机森林回归需要至少2个数值列");
			}
			const yColumn = numericColumns[numericColumns.length - 1];
			const xColumns = numericColumns.slice(0, -1);
			const mlData = prepareMLData(data, xColumns, yColumn);
			if (!mlData.labels) {
				throw new Error("未找到标签数据");
			}
			return runRandomForestRegression(mlData.features, mlData.labels.map(Number), {
				nEstimators: options.nEstimators || 100,
				maxDepth: options.maxDepth || 10,
			});
		}

		// 矩阵运算
		case "svd": {
			const mlData = prepareMLData(data, numericColumns);
			return runSVD(mlData.features);
		}

		case "evd": {
			const mlData = prepareMLData(data, numericColumns);
			// 确保是方阵
			const size = Math.min(mlData.features.length, mlData.features[0].length);
			const squareMatrix = mlData.features
				.slice(0, size)
				.map((row) => row.slice(0, size));
			return runEVD(squareMatrix);
		}

		case "cholesky": {
			const mlData = prepareMLData(data, numericColumns);
			const size = Math.min(mlData.features.length, mlData.features[0].length);
			const squareMatrix = mlData.features
				.slice(0, size)
				.map((row) => row.slice(0, size));
			return runCholesky(squareMatrix);
		}

		case "lu": {
			const mlData = prepareMLData(data, numericColumns);
			const size = Math.min(mlData.features.length, mlData.features[0].length);
			const squareMatrix = mlData.features
				.slice(0, size)
				.map((row) => row.slice(0, size));
			return runLU(squareMatrix);
		}

		case "qr": {
			const mlData = prepareMLData(data, numericColumns);
			return runQR(mlData.features);
		}

		case "distance_matrix": {
			const mlData = prepareMLData(data, numericColumns);
			return runDistanceMatrix(
				mlData.features,
				(options.metric as "euclidean" | "manhattan" | "chebyshev") || "euclidean",
			);
		}

		default:
			throw new Error(`不支持的算法: ${algorithmId}`);
	}

	throw new Error(`算法 ${algorithmId} 实现未完成`);
}
