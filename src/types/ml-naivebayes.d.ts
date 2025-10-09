declare module "ml-naivebayes" {
	export default class GaussianNB {
		constructor();
		train(features: number[][], labels: number[]): void;
		predict(features: number[][]): number[];
	}
}
