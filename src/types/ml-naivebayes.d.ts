declare module "ml-naivebayes" {
	export class GaussianNB {
		constructor();
		train(features: number[][], labels: number[]): void;
		predict(features: number[][]): number[];
	}
	export class MultinomialNB {
		constructor();
		train(features: number[][], labels: number[]): void;
		predict(features: number[][]): number[];
	}
}
