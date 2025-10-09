import { GaussianNB } from "ml-naivebayes";
import KNN from "ml-knn";
import { DecisionTreeClassifier, DecisionTreeRegression } from "ml-cart";
import {
	RandomForestClassifier as RFC,
	RandomForestRegression as RFR,
} from "ml-random-forest";
import type { ClassificationResult } from "./types";
import {
	calculateClassificationMetrics,
	calculateConfusionMatrix,
	encodeLabels,
	kFoldSplit,
} from "./helpers";

/**
 * Naive Bayes 分类
 */
export function runNaiveBayes(
	trainData: number[][],
	trainLabels: (number | string)[],
	testData: number[][],
	testLabels: (number | string)[],
) {
	// 编码标签
	const { encoded: trainEncoded, classes } = encodeLabels(trainLabels);
	const { encoded: testEncoded } = encodeLabels(testLabels);

	// 训练模型
	const model = new GaussianNB();
	model.train(trainData, trainEncoded);

	// 预测
	const predictions = model.predict(testData);

	// 计算混淆矩阵和指标
	const confusionMatrix = calculateConfusionMatrix(testEncoded, predictions, [
		...Array.from({ length: classes.length }, (_, i) => i),
	]);
	const metrics = calculateClassificationMetrics(confusionMatrix);

	// 交叉验证
	const cvScore = performCrossValidation(
		[...trainData, ...testData],
		[...trainLabels, ...testLabels],
		"naive_bayes",
		5,
	);

	const result: ClassificationResult = {
		type: "classification",
		accuracy: metrics.accuracy,
		precision: metrics.precision,
		recall: metrics.recall,
		f1_score: metrics.f1_score,
		confusion_matrix: confusionMatrix,
		classes: classes.map(String),
		predictions: predictions,
		cross_validation_score: cvScore,
		model_type: "Gaussian Naive Bayes",
	};

	return result;
}

/**
 * K-Nearest Neighbors 分类
 */
export function runKNN(
	trainData: number[][],
	trainLabels: (number | string)[],
	testData: number[][],
	testLabels: (number | string)[],
	options: { k?: number } = {},
) {
	const k = options.k || 5;

	// 编码标签
	const { encoded: trainEncoded, classes } = encodeLabels(trainLabels);
	const { encoded: testEncoded } = encodeLabels(testLabels);

	// 训练模型
	const model = new KNN(trainData, trainEncoded, { k });

	// 预测
	const predictions = model.predict(testData);

	// 计算混淆矩阵和指标
	const confusionMatrix = calculateConfusionMatrix(testEncoded, predictions, [
		...Array.from({ length: classes.length }, (_, i) => i),
	]);
	const metrics = calculateClassificationMetrics(confusionMatrix);

	const result: ClassificationResult = {
		type: "knn_classification",
		k_neighbors: k,
		accuracy: metrics.accuracy,
		precision: metrics.precision,
		recall: metrics.recall,
		f1_score: metrics.f1_score,
		confusion_matrix: confusionMatrix,
		classes: classes.map(String),
		predictions: predictions,
		distance_metric: "Euclidean",
		optimal_k_analysis: `当前使用k=${k}，建议通过交叉验证选择最优k值`,
	};

	return result;
}

/**
 * Decision Tree 分类
 */
export function runDecisionTree(
	trainData: number[][],
	trainLabels: (number | string)[],
	testData: number[][],
	testLabels: (number | string)[],
	options: { maxDepth?: number; minNumSamples?: number } = {},
) {
	const maxDepth = options.maxDepth || 10;
	const minNumSamples = options.minNumSamples || 3;

	// 编码标签
	const { encoded: trainEncoded, classes } = encodeLabels(trainLabels);
	const { encoded: testEncoded } = encodeLabels(testLabels);

	// 训练模型
	const model = new DecisionTreeClassifier({
		maxDepth,
		minNumSamples,
	});
	model.train(trainData, trainEncoded);

	// 预测
	const predictions = model.predict(testData);

	// 计算混淆矩阵和指标
	const confusionMatrix = calculateConfusionMatrix(testEncoded, predictions, [
		...Array.from({ length: classes.length }, (_, i) => i),
	]);
	const metrics = calculateClassificationMetrics(confusionMatrix);

	const result: ClassificationResult = {
		type: "tree_classification",
		accuracy: metrics.accuracy,
		precision: metrics.precision,
		recall: metrics.recall,
		f1_score: metrics.f1_score,
		confusion_matrix: confusionMatrix,
		classes: classes.map(String),
		predictions: predictions,
		max_depth: maxDepth,
		min_samples_split: minNumSamples,
	};

	return result;
}

/**
 * Random Forest 分类
 */
export function runRandomForest(
	trainData: number[][],
	trainLabels: (number | string)[],
	testData: number[][],
	testLabels: (number | string)[],
	options: { nEstimators?: number; maxDepth?: number } = {},
) {
	const nEstimators = options.nEstimators || 100;
	const maxDepth = options.maxDepth || 10;

	// 编码标签
	const { encoded: trainEncoded, classes } = encodeLabels(trainLabels);
	const { encoded: testEncoded } = encodeLabels(testLabels);

	// 训练模型
	const model = new RFC({
		nEstimators,
		maxFeatures: Math.floor(Math.sqrt(trainData[0].length)),
		treeOptions: { maxDepth },
	});
	model.train(trainData, trainEncoded);

	// 预测
	const predictions = model.predict(testData);

	// 计算混淆矩阵和指标
	const confusionMatrix = calculateConfusionMatrix(testEncoded, predictions, [
		...Array.from({ length: classes.length }, (_, i) => i),
	]);
	const metrics = calculateClassificationMetrics(confusionMatrix);

	const result: ClassificationResult = {
		type: "ensemble_classification",
		n_estimators: nEstimators,
		accuracy: metrics.accuracy,
		precision: metrics.precision,
		recall: metrics.recall,
		f1_score: metrics.f1_score,
		confusion_matrix: confusionMatrix,
		classes: classes.map(String),
		predictions: predictions,
		max_depth: maxDepth,
	};

	return result;
}

/**
 * 执行交叉验证
 */
function performCrossValidation(
	data: number[][],
	labels: (number | string)[],
	algorithm: "naive_bayes" | "knn" | "decision_tree" | "random_forest",
	k = 5,
): number {
	const folds = kFoldSplit(data, labels, k);
	const scores: number[] = [];

	for (const fold of folds) {
		try {
			const { encoded: trainEncoded } = encodeLabels(fold.train.labels);
			const { encoded: testEncoded } = encodeLabels(fold.test.labels);

			let predictions: number[] = [];

			if (algorithm === "naive_bayes") {
				const model = new GaussianNB();
				model.train(fold.train.data, trainEncoded);
				predictions = model.predict(fold.test.data);
			} else if (algorithm === "knn") {
				const model = new KNN(fold.train.data, trainEncoded, { k: 5 });
				predictions = model.predict(fold.test.data);
			} else if (algorithm === "decision_tree") {
				const model = new DecisionTreeClassifier({ maxDepth: 10 });
				model.train(fold.train.data, trainEncoded);
				predictions = model.predict(fold.test.data);
			} else if (algorithm === "random_forest") {
				const model = new RFC({ nEstimators: 50 });
				model.train(fold.train.data, trainEncoded);
				predictions = model.predict(fold.test.data);
			}

			// 计算准确率
			let correct = 0;
			for (let i = 0; i < testEncoded.length; i++) {
				if (predictions[i] === testEncoded[i]) {
					correct++;
				}
			}
			scores.push(correct / testEncoded.length);
		} catch (error) {
			console.warn("交叉验证折叠失败:", error);
		}
	}

	return scores.length > 0
		? scores.reduce((sum, score) => sum + score, 0) / scores.length
		: 0;
}

/**
 * 计算混淆矩阵的统计信息（用于单独调用）
 */
export function analyzeConfusionMatrix(
	actual: (number | string)[],
	predicted: (number | string)[],
) {
	const { classes } = encodeLabels([...actual, ...predicted]);
	const confusionMatrix = calculateConfusionMatrix(actual, predicted, classes);
	const metrics = calculateClassificationMetrics(confusionMatrix);

	return {
		type: "classification" as const,
		confusion_matrix: confusionMatrix,
		classes: classes.map(String),
		accuracy: metrics.accuracy,
		precision: metrics.precision,
		recall: metrics.recall,
		f1_score: metrics.f1_score,
		normalize: false,
		labels: classes.map(String),
	};
}
