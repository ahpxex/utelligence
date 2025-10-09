declare module "ml-regression" {
	export class SimpleLinearRegression {
		constructor(x: number[], y: number[]);
		slope: number;
		intercept: number;
		predict(x: number): number;
		toString(precision?: number): string;
	}

	export class PolynomialRegression {
		constructor(x: number[], y: number[], degree: number);
		coefficients: number[];
		predict(x: number): number;
		toString(precision?: number): string;
	}

	export class MultivariateLinearRegression {
		constructor(x: number[][], y: number[], options?: any);
		weights: number[];
		predict(x: number[]): number;
	}

	export class PowerRegression {
		constructor(x: number[], y: number[]);
		A: number;
		B: number;
		predict(x: number): number;
		toString(precision?: number): string;
	}

	export class ExponentialRegression {
		constructor(x: number[], y: number[]);
		A: number;
		B: number;
		predict(x: number): number;
		toString(precision?: number): string;
	}

	export class TheilSenRegression {
		constructor(x: number[], y: number[]);
		slope: number;
		intercept: number;
		predict(x: number): number;
		toString(precision?: number): string;
	}

	export class RobustPolynomialRegression {
		constructor(x: number[], y: number[], degree: number);
		coefficients: number[];
		predict(x: number): number;
		toString(precision?: number): string;
	}
}
