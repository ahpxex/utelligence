import { PCA } from "ml-pca";
import * as kmeansModule from "ml-kmeans";
import type { ClusteringResult } from "./types";

/**
 * PCA 主成分分析
 */
export function runPCA(data: number[][], options: { nComponents?: number } = {}) {
	const pca = new PCA(data);

	const nComponents = options.nComponents || Math.min(data.length, data[0].length);
	const explainedVariance = pca.getExplainedVariance();
	const eigenvalues = pca.getEigenvalues();
	const loadings = pca.getLoadings();

	// 计算累积方差
	let cumulativeVariance = 0;
	const cumulativeVarianceArray: number[] = [];
	for (const variance of explainedVariance) {
		cumulativeVariance += variance;
		cumulativeVarianceArray.push(cumulativeVariance);
	}

	// 提取主成分
	const components = [];
	for (let i = 0; i < Math.min(nComponents, explainedVariance.length); i++) {
		components.push({
			component: `PC${i + 1}`,
			variance_explained: explainedVariance[i],
			eigenvalue: eigenvalues[i],
			loadings: loadings.getColumn(i),
		});
	}

	// Kaiser准则：特征值 > 1
	const kaiserComponents = eigenvalues.filter((ev) => ev > 1).length;

	const result: ClusteringResult = {
		type: "dimensionality_reduction",
		components,
		cumulative_variance: cumulativeVariance,
		explained_variance: explainedVariance,
		eigenvalues: eigenvalues,
		kaiser_criterion: `前${kaiserComponents}个主成分满足Kaiser准则 (特征值 > 1.0)`,
		scree_plot_elbow: `建议保留前${Math.min(kaiserComponents, 3)}个主成分`,
		// 转换后的数据
		transformed_data: pca.predict(data, { nComponents }).to2DArray(),
	};

	return result;
}

/**
 * K-Means 聚类
 */
export function runKMeans(
	data: number[][],
	options: { k?: number; maxIterations?: number; initialization?: string } = {},
) {
	const k = options.k || 3;
	const maxIterations = options.maxIterations || 100;

	const kmeans = (kmeansModule as any).default || kmeansModule;
	const result = kmeans(data, k, {
		maxIterations,
		initialization: options.initialization || "kmeans++",
	});

	// 计算轮廓系数（简化版）
	const silhouetteScore = calculateSilhouetteScore(data, result.clusters, result.centroids);

	// 计算每个聚类的大小
	const clusterSizes = Array.from({ length: k }, () => 0);
	for (const cluster of result.clusters) {
		clusterSizes[cluster]++;
	}

	// 计算类内平方和
	const withinClusterSS: number[] = Array.from({ length: k }, () => 0);
	for (let i = 0; i < data.length; i++) {
		const cluster = result.clusters[i];
		const centroid = result.centroids[cluster];
		const distance = euclideanDistance(data[i], centroid);
		withinClusterSS[cluster] += distance ** 2;
	}

	const clusteringResult: ClusteringResult = {
		type: "clustering",
		n_clusters: k,
		clusters: result.clusters,
		centroids: result.centroids,
		iterations: result.iterations,
		inertia: withinClusterSS.reduce((sum, val) => sum + val, 0),
		silhouette_score: silhouetteScore,
		cluster_sizes: clusterSizes,
		within_cluster_sum_of_squares: withinClusterSS,
		optimal_k_analysis: `当前使用K=${k}，建议通过肘部法则和轮廓系数进一步验证`,
	};

	return clusteringResult;
}

/**
 * 计算欧氏距离
 */
function euclideanDistance(a: number[], b: number[]): number {
	let sum = 0;
	for (let i = 0; i < a.length; i++) {
		sum += (a[i] - b[i]) ** 2;
	}
	return Math.sqrt(sum);
}

/**
 * 简化的轮廓系数计算
 */
function calculateSilhouetteScore(
	data: number[][],
	clusters: number[],
	centroids: number[][],
): number {
	const n = data.length;
	const k = centroids.length;

	let totalScore = 0;
	let validPoints = 0;

	for (let i = 0; i < n; i++) {
		const clusterI = clusters[i];

		// a(i): 与同一聚类内其他点的平均距离
		let aSum = 0;
		let aCount = 0;
		for (let j = 0; j < n; j++) {
			if (i !== j && clusters[j] === clusterI) {
				aSum += euclideanDistance(data[i], data[j]);
				aCount++;
			}
		}
		const a = aCount > 0 ? aSum / aCount : 0;

		// b(i): 与最近的其他聚类中点的平均距离的最小值
		let minB = Number.POSITIVE_INFINITY;
		for (let otherCluster = 0; otherCluster < k; otherCluster++) {
			if (otherCluster === clusterI) continue;

			let bSum = 0;
			let bCount = 0;
			for (let j = 0; j < n; j++) {
				if (clusters[j] === otherCluster) {
					bSum += euclideanDistance(data[i], data[j]);
					bCount++;
				}
			}
			if (bCount > 0) {
				const b = bSum / bCount;
				minB = Math.min(minB, b);
			}
		}

		const b = minB === Number.POSITIVE_INFINITY ? 0 : minB;

		// s(i) = (b - a) / max(a, b)
		if (a > 0 || b > 0) {
			const s = (b - a) / Math.max(a, b);
			totalScore += s;
			validPoints++;
		}
	}

	return validPoints > 0 ? totalScore / validPoints : 0;
}
