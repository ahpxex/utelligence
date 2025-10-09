export interface Algorithm {
	id: string;
	name: string;
	description: string;
	category: string;
	parameters?: string[];
}

export const algorithms: Algorithm[] = [
	// Unsupervised learning
	{
		id: "pca",
		name: "Principal Component Analysis (PCA)",
		description: "降维技术，用于数据可视化和特征提取",
		category: "unsupervised",
		parameters: ["nComponents"],
	},
	{
		id: "kmeans",
		name: "K-Means Clustering",
		description: "将数据分为k个聚类的算法",
		category: "unsupervised",
		parameters: ["k", "maxIterations"],
	},

	// Supervised learning
	{
		id: "naive_bayes",
		name: "Naive Bayes",
		description: "基于贝叶斯定理的分类算法",
		category: "supervised",
		parameters: ["labelColumn", "testSize"],
	},
	{
		id: "knn",
		name: "K-Nearest Neighbor (KNN)",
		description: "基于邻近数据点的分类和回归算法",
		category: "supervised",
		parameters: ["k", "labelColumn", "testSize"],
	},
	{
		id: "confusion_matrix",
		name: "Confusion Matrix",
		description: "分类模型的混淆矩阵分析",
		category: "supervised",
		parameters: ["actualColumn", "predictedColumn"],
	},
	{
		id: "decision_tree",
		name: "Decision Tree Classifier",
		description: "决策树分类算法",
		category: "supervised",
		parameters: ["maxDepth", "minNumSamples", "labelColumn", "testSize"],
	},
	{
		id: "random_forest",
		name: "Random Forest Classifier",
		description: "随机森林分类算法",
		category: "supervised",
		parameters: ["nEstimators", "maxDepth", "labelColumn", "testSize"],
	},

	// Regression
	{
		id: "simple_linear",
		name: "Simple Linear Regression",
		description: "简单线性回归分析",
		category: "regression",
		parameters: [],
	},
	{
		id: "polynomial",
		name: "Polynomial Regression",
		description: "多项式回归分析",
		category: "regression",
		parameters: ["degree"],
	},
	{
		id: "multivariate",
		name: "Multivariate Linear Regression",
		description: "多元线性回归分析",
		category: "regression",
		parameters: [],
	},
	{
		id: "power",
		name: "Power Regression",
		description: "幂函数回归分析",
		category: "regression",
		parameters: [],
	},
	{
		id: "exponential",
		name: "Exponential Regression",
		description: "指数回归分析",
		category: "regression",
		parameters: [],
	},
	{
		id: "theil_sen",
		name: "Theil-Sen Regression",
		description: "Theil-Sen稳健回归算法",
		category: "regression",
		parameters: [],
	},
	{
		id: "robust_polynomial",
		name: "Robust Polynomial Regression",
		description: "稳健多项式回归",
		category: "regression",
		parameters: ["degree"],
	},
	{
		id: "decision_tree_reg",
		name: "Decision Tree Regression",
		description: "决策树回归算法",
		category: "regression",
		parameters: ["maxDepth", "minNumSamples"],
	},
	{
		id: "random_forest_reg",
		name: "Random Forest Regression",
		description: "随机森林回归算法",
		category: "regression",
		parameters: ["nEstimators", "maxDepth"],
	},

	// Math
	{
		id: "svd",
		name: "Singular Value Decomposition",
		description: "奇异值分解",
		category: "math",
		parameters: [],
	},
	{
		id: "evd",
		name: "Eigenvalue Decomposition",
		description: "特征值分解",
		category: "math",
		parameters: [],
	},
	{
		id: "cholesky",
		name: "Cholesky Decomposition",
		description: "Cholesky分解",
		category: "math",
		parameters: [],
	},
	{
		id: "lu",
		name: "LU Decomposition",
		description: "LU分解",
		category: "math",
		parameters: [],
	},
	{
		id: "qr",
		name: "QR Decomposition",
		description: "QR分解",
		category: "math",
		parameters: [],
	},
	{
		id: "distance_matrix",
		name: "Distance Matrix",
		description: "距离矩阵计算",
		category: "math",
		parameters: ["metric"],
	},
];

export const categoryLabels = {
	unsupervised: "无监督学习",
	supervised: "监督学习",
	regression: "回归分析",
	math: "数学运算",
};

export const categoryColors = {
	unsupervised: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
	supervised: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
	regression: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
	math: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};
