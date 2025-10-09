// 机器学习算法的输入输出类型定义

export interface MLData {
	features: number[][]; // 特征矩阵
	labels?: number[] | string[]; // 标签（用于监督学习）
	featureNames?: string[]; // 特征名称
}

export interface RegressionResult {
	type: "regression";
	coefficients: number[];
	intercept?: number;
	r_squared: number;
	adjusted_r_squared?: number;
	predictions?: number[];
	residuals?: number[];
	std_errors?: number[];
	p_values?: number[];
	[key: string]: any;
}

export interface ClassificationResult {
	type: "classification" | "knn_classification" | "tree_classification" | "ensemble_classification";
	accuracy: number;
	predictions?: (number | string)[];
	confusion_matrix?: number[][];
	classes?: string[];
	precision?: number[];
	recall?: number[];
	f1_score?: number[];
	[key: string]: any;
}

export interface ClusteringResult {
	type: "clustering" | "dimensionality_reduction";
	clusters?: number[];
	centroids?: number[][];
	components?: any[];
	explained_variance?: number[];
	[key: string]: any;
}

export interface MatrixDecompositionResult {
	type: "matrix_decomposition" | "eigendecomposition";
	singular_values?: number[];
	eigenvalues?: number[];
	rank?: number;
	condition_number?: number;
	[key: string]: any;
}

export type MLResult =
	| RegressionResult
	| ClassificationResult
	| ClusteringResult
	| MatrixDecompositionResult;

export interface CrossValidationOptions {
	k?: number; // number of folds
	shuffle?: boolean;
	randomState?: number;
}
