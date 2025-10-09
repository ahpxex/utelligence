declare module "ml-knn" {
	export default class KNN {
		constructor(
			trainFeatures: number[][],
			trainLabels: number[],
			options?: { k?: number },
		);
		predict(testFeatures: number[][]): number[];
	}
}
