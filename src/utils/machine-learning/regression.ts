import {
	SimpleLinearRegression,
	PolynomialRegression,
	MultivariateLinearRegression,
	PowerRegression,
	ExponentialRegression,
	TheilSenRegression,
	RobustPolynomialRegression,
} from "ml-regression";
import { DecisionTreeRegression } from "ml-cart";
import { RandomForestRegression as RFR } from "ml-random-forest";
import type { RegressionResult } from "./types";
import { calculateRSquared, calculateAdjustedRSquared } from "./helpers";

/**
 * 简单线性回归
 */
export function runSimpleLinearRegression(x: number[], y: number[]): RegressionResult {
	const regression = new SimpleLinearRegression(x, y);

	const predictions = x.map((xi) => regression.predict(xi));
	const r_squared = calculateRSquared(y, predictions);
	const n = x.length;
	const p = 1; // 一个自变量
	const adjusted_r_squared = calculateAdjustedRSquared(r_squared, n, p);

	return {
		type: "regression",
		coefficients: [regression.slope],
		intercept: regression.intercept,
		r_squared,
		adjusted_r_squared,
		predictions,
		residuals: y.map((yi, i) => yi - predictions[i]),
		equation: `y = ${regression.slope.toFixed(4)}x + ${regression.intercept.toFixed(4)}`,
		model_type: "Simple Linear Regression",
	};
}

/**
 * 多项式回归
 */
export function runPolynomialRegression(
	x: number[],
	y: number[],
	degree = 2,
): RegressionResult {
	const regression = new PolynomialRegression(x, y, degree);

	const predictions = x.map((xi) => regression.predict(xi));
	const r_squared = calculateRSquared(y, predictions);
	const n = x.length;
	const adjusted_r_squared = calculateAdjustedRSquared(r_squared, n, degree);

	return {
		type: "regression",
		coefficients: regression.coefficients,
		r_squared,
		adjusted_r_squared,
		predictions,
		residuals: y.map((yi, i) => yi - predictions[i]),
		degree,
		equation: regression.toString(4),
		model_type: `Polynomial Regression (degree ${degree})`,
	};
}

/**
 * 多元线性回归
 */
export function runMultivariateLinearRegression(
	x: number[][],
	y: number[],
): RegressionResult {
	const regression = new MultivariateLinearRegression(x, y);

	const predictions = x.map((xi) => regression.predict(xi));
	const r_squared = calculateRSquared(y, predictions);
	const n = x.length;
	const p = x[0].length;
	const adjusted_r_squared = calculateAdjustedRSquared(r_squared, n, p);

	return {
		type: "regression",
		coefficients: regression.weights,
		r_squared,
		adjusted_r_squared,
		predictions,
		residuals: y.map((yi, i) => yi - predictions[i]),
		model_type: "Multivariate Linear Regression",
	};
}

/**
 * 幂回归
 */
export function runPowerRegression(x: number[], y: number[]): RegressionResult {
	const regression = new PowerRegression(x, y);

	const predictions = x.map((xi) => regression.predict(xi));
	const r_squared = calculateRSquared(y, predictions);
	const n = x.length;
	const p = 1;
	const adjusted_r_squared = calculateAdjustedRSquared(r_squared, n, p);

	return {
		type: "regression",
		coefficients: [regression.A, regression.B],
		r_squared,
		adjusted_r_squared,
		predictions,
		residuals: y.map((yi, i) => yi - predictions[i]),
		equation: `y = ${regression.A.toFixed(4)} * x^${regression.B.toFixed(4)}`,
		model_type: "Power Regression",
	};
}

/**
 * 指数回归
 */
export function runExponentialRegression(x: number[], y: number[]): RegressionResult {
	const regression = new ExponentialRegression(x, y);

	const predictions = x.map((xi) => regression.predict(xi));
	const r_squared = calculateRSquared(y, predictions);
	const n = x.length;
	const p = 1;
	const adjusted_r_squared = calculateAdjustedRSquared(r_squared, n, p);

	return {
		type: "regression",
		coefficients: [regression.A, regression.B],
		r_squared,
		adjusted_r_squared,
		predictions,
		residuals: y.map((yi, i) => yi - predictions[i]),
		equation: `y = ${regression.A.toFixed(4)} * e^(${regression.B.toFixed(4)}x)`,
		model_type: "Exponential Regression",
	};
}

/**
 * Theil-Sen 稳健回归
 */
export function runTheilSenRegression(x: number[], y: number[]): RegressionResult {
	const regression = new TheilSenRegression(x, y);

	const predictions = x.map((xi) => regression.predict(xi));
	const r_squared = calculateRSquared(y, predictions);
	const n = x.length;
	const p = 1;
	const adjusted_r_squared = calculateAdjustedRSquared(r_squared, n, p);

	return {
		type: "regression",
		coefficients: [regression.slope],
		intercept: regression.intercept,
		r_squared,
		adjusted_r_squared,
		predictions,
		residuals: y.map((yi, i) => yi - predictions[i]),
		equation: `y = ${regression.slope.toFixed(4)}x + ${regression.intercept.toFixed(4)}`,
		model_type: "Theil-Sen Robust Regression",
	};
}

/**
 * 稳健多项式回归
 */
export function runRobustPolynomialRegression(
	x: number[],
	y: number[],
	degree = 2,
): RegressionResult {
	const regression = new RobustPolynomialRegression(x, y, degree);

	const predictions = x.map((xi) => regression.predict(xi));
	const r_squared = calculateRSquared(y, predictions);
	const n = x.length;
	const adjusted_r_squared = calculateAdjustedRSquared(r_squared, n, degree);

	return {
		type: "regression",
		coefficients: regression.coefficients,
		r_squared,
		adjusted_r_squared,
		predictions,
		residuals: y.map((yi, i) => yi - predictions[i]),
		degree,
		equation: regression.toString(4),
		model_type: `Robust Polynomial Regression (degree ${degree})`,
	};
}

/**
 * 决策树回归
 */
export function runDecisionTreeRegression(
	x: number[][],
	y: number[],
	options: { maxDepth?: number; minNumSamples?: number } = {},
): RegressionResult {
	const maxDepth = options.maxDepth || 10;
	const minNumSamples = options.minNumSamples || 3;

	const regression = new DecisionTreeRegression({
		maxDepth,
		minNumSamples,
	});
	regression.train(x, y);

	const predictions = regression.predict(x);
	const r_squared = calculateRSquared(y, predictions);
	const n = x.length;
	const p = x[0].length;
	const adjusted_r_squared = calculateAdjustedRSquared(r_squared, n, p);

	return {
		type: "regression",
		coefficients: [], // 决策树没有系数
		r_squared,
		adjusted_r_squared,
		predictions,
		residuals: y.map((yi, i) => yi - predictions[i]),
		max_depth: maxDepth,
		min_samples_split: minNumSamples,
		model_type: "Decision Tree Regression",
	};
}

/**
 * 随机森林回归
 */
export function runRandomForestRegression(
	x: number[][],
	y: number[],
	options: { nEstimators?: number; maxDepth?: number } = {},
): RegressionResult {
	const nEstimators = options.nEstimators || 100;
	const maxDepth = options.maxDepth || 10;

	const regression = new RFR({
		nEstimators,
		maxFeatures: Math.floor(Math.sqrt(x[0].length)),
		treeOptions: { maxDepth },
	});
	regression.train(x, y);

	const predictions = regression.predict(x);
	const r_squared = calculateRSquared(y, predictions);
	const n = x.length;
	const p = x[0].length;
	const adjusted_r_squared = calculateAdjustedRSquared(r_squared, n, p);

	// 计算 MSE 和 MAE
	const mse =
		predictions.reduce((sum, pred, i) => sum + (y[i] - pred) ** 2, 0) / predictions.length;
	const mae =
		predictions.reduce((sum, pred, i) => sum + Math.abs(y[i] - pred), 0) /
		predictions.length;

	return {
		type: "regression",
		coefficients: [], // 随机森林没有系数
		r_squared,
		adjusted_r_squared,
		predictions,
		residuals: y.map((yi, i) => yi - predictions[i]),
		n_estimators: nEstimators,
		max_depth: maxDepth,
		mean_squared_error: mse,
		mean_absolute_error: mae,
		model_type: "Random Forest Regression",
	};
}
