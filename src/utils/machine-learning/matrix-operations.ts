import { Matrix } from "ml-matrix";
import type { MatrixDecompositionResult } from "./types";

/**
 * SVD 奇异值分解
 */
export function runSVD(data: number[][]): MatrixDecompositionResult {
	const matrix = new Matrix(data);
	const svd = (matrix as any).svd();

	const singularValues = svd.diagonal as number[];
	const rank = singularValues.filter((v: number) => Math.abs(v) > 1e-10).length;

	// 条件数 = 最大奇异值 / 最小非零奇异值
	const maxSV = Math.max(...singularValues);
	const minNonZeroSV = Math.min(...singularValues.filter((v: number) => Math.abs(v) > 1e-10));
	const conditionNumber = minNonZeroSV > 0 ? maxSV / minNonZeroSV : Number.POSITIVE_INFINITY;

	// Frobenius范数
	let frobeniusNorm = 0;
	for (let i = 0; i < matrix.rows; i++) {
		for (let j = 0; j < matrix.columns; j++) {
			frobeniusNorm += matrix.get(i, j) ** 2;
		}
	}
	frobeniusNorm = Math.sqrt(frobeniusNorm);

	// 核范数（奇异值之和）
	const nuclearNorm = singularValues.reduce((sum: number, val: number) => sum + Math.abs(val), 0);

	// 方差解释率
	const totalVariance = singularValues.reduce((sum: number, val: number) => sum + val ** 2, 0);
	const varianceExplained = singularValues.map((val: number) => (val ** 2) / totalVariance);

	return {
		type: "matrix_decomposition",
		singular_values: singularValues,
		rank,
		condition_number: conditionNumber,
		frobenius_norm: frobeniusNorm,
		nuclear_norm: nuclearNorm,
		variance_explained: varianceExplained,
		effective_rank: rank,
		matrix_properties: {
			full_rank: rank === Math.min(matrix.rows, matrix.columns),
			well_conditioned: conditionNumber < 100,
			numerical_stability: conditionNumber < 100 ? "良好" : "需要注意",
		},
		applications: "可用于降维、去噪、数据压缩等任务",
	};
}

/**
 * EVD 特征值分解
 */
export function runEVD(data: number[][]): MatrixDecompositionResult {
	const matrix = new Matrix(data);

	// 确保矩阵是方阵
	if (matrix.rows !== matrix.columns) {
		throw new Error("特征值分解要求方阵");
	}

	const evd = (matrix as any).eig();
	const eigenvalues = evd.realEigenvalues as number[];
	const imaginaryEigenvalues = evd.imaginaryEigenvalues as number[];

	// 计算复数特征值数量
	const complexEigenvalues = imaginaryEigenvalues.filter(
		(v: number) => Math.abs(v) > 1e-10,
	).length;

	// 谱半径（最大特征值的绝对值）
	const spectralRadius = Math.max(...eigenvalues.map(Math.abs));

	// 迹（对角元素之和 = 特征值之和）
	const trace = eigenvalues.reduce((sum: number, val: number) => sum + val, 0);

	// 行列式（特征值之积）
	const determinant = eigenvalues.reduce((prod: number, val: number) => prod * val, 1);

	// 条件数
	const maxEV = Math.max(...eigenvalues.map(Math.abs));
	const minEV = Math.min(
		...eigenvalues.filter((v: number) => Math.abs(v) > 1e-10).map(Math.abs),
	);
	const conditionNumber = minEV > 0 ? maxEV / minEV : Number.POSITIVE_INFINITY;

	return {
		type: "eigendecomposition",
		eigenvalues: eigenvalues,
		real_eigenvalues: eigenvalues.length,
		complex_eigenvalues: complexEigenvalues,
		spectral_radius: spectralRadius,
		trace,
		determinant,
		condition_number: conditionNumber,
		eigenvalue_distribution:
			eigenvalues.filter((v: number) => v > 0).length === eigenvalues.length
				? "正特征值占主导，矩阵正定性良好"
				: "存在负特征值",
		stability_analysis:
			conditionNumber < 100 ? "特征值分离良好，数值计算稳定" : "可能存在数值稳定性问题",
	};
}

/**
 * Cholesky 分解
 */
export function runCholesky(data: number[][]): MatrixDecompositionResult {
	const matrix = new Matrix(data);

	// 确保矩阵是方阵
	if (matrix.rows !== matrix.columns) {
		throw new Error("Cholesky分解要求方阵");
	}

	try {
		const cholesky = (matrix as any).cholesky();

		return {
			type: "matrix_decomposition",
			decomposition_type: "Cholesky",
			lower_triangular: cholesky.lowerTriangularMatrix.to2DArray(),
			success: true,
			positive_definite: true,
			message: "Cholesky分解成功，矩阵为正定矩阵",
		};
	} catch (error) {
		return {
			type: "matrix_decomposition",
			decomposition_type: "Cholesky",
			success: false,
			positive_definite: false,
			message: "Cholesky分解失败，矩阵不是正定矩阵",
			error: String(error),
		};
	}
}

/**
 * LU 分解
 */
export function runLU(data: number[][]): MatrixDecompositionResult {
	const matrix = new Matrix(data);

	// 确保矩阵是方阵
	if (matrix.rows !== matrix.columns) {
		throw new Error("LU分解要求方阵");
	}

	const lu = (matrix as any).lu();

	return {
		type: "matrix_decomposition",
		decomposition_type: "LU",
		lower_triangular: lu.lowerTriangularMatrix.to2DArray(),
		upper_triangular: lu.upperTriangularMatrix.to2DArray(),
		pivot_vector: lu.pivotVector,
		pivot_sign: lu.pivotSign,
		is_singular: lu.isSingular,
		determinant: lu.determinant,
		success: true,
	};
}

/**
 * QR 分解
 */
export function runQR(data: number[][]): MatrixDecompositionResult {
	const matrix = new Matrix(data);
	const qr = (matrix as any).qr();

	return {
		type: "matrix_decomposition",
		decomposition_type: "QR",
		orthogonal_matrix: qr.orthogonalMatrix.to2DArray(),
		upper_triangular_matrix: qr.upperTriangularMatrix.to2DArray(),
		rank: qr.rank,
		is_full_rank: qr.isFullRank,
		success: true,
	};
}

/**
 * 距离矩阵计算
 */
export function runDistanceMatrix(
	data: number[][],
	metric: "euclidean" | "manhattan" | "chebyshev" = "euclidean",
): MatrixDecompositionResult {
	const n = data.length;
	const distanceMatrix: number[][] = Array.from({ length: n }, () =>
		Array.from({ length: n }, () => 0),
	);

	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			let distance = 0;

			if (metric === "euclidean") {
				distance = euclideanDistance(data[i], data[j]);
			} else if (metric === "manhattan") {
				distance = manhattanDistance(data[i], data[j]);
			} else if (metric === "chebyshev") {
				distance = chebyshevDistance(data[i], data[j]);
			}

			distanceMatrix[i][j] = distance;
			distanceMatrix[j][i] = distance;
		}
	}

	// 计算统计信息
	const distances: number[] = [];
	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			distances.push(distanceMatrix[i][j]);
		}
	}

	const meanDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
	const maxDistance = Math.max(...distances);
	const minDistance = Math.min(...distances);

	return {
		type: "matrix_decomposition",
		decomposition_type: "Distance Matrix",
		distance_matrix: distanceMatrix,
		metric,
		mean_distance: meanDistance,
		max_distance: maxDistance,
		min_distance: minDistance,
		num_points: n,
	};
}

// 辅助函数：欧氏距离
function euclideanDistance(a: number[], b: number[]): number {
	let sum = 0;
	for (let i = 0; i < a.length; i++) {
		sum += (a[i] - b[i]) ** 2;
	}
	return Math.sqrt(sum);
}

// 辅助函数：曼哈顿距离
function manhattanDistance(a: number[], b: number[]): number {
	let sum = 0;
	for (let i = 0; i < a.length; i++) {
		sum += Math.abs(a[i] - b[i]);
	}
	return sum;
}

// 辅助函数：切比雪夫距离
function chebyshevDistance(a: number[], b: number[]): number {
	let maxDiff = 0;
	for (let i = 0; i < a.length; i++) {
		maxDiff = Math.max(maxDiff, Math.abs(a[i] - b[i]));
	}
	return maxDiff;
}
