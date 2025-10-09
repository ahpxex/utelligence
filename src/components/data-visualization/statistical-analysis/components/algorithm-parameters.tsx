"use client";

import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/shadcn/select";
import type { Algorithm } from "@/utils/machine-learning/algorithms";

interface AlgorithmParametersProps {
	algorithm: Algorithm;
	availableColumns: string[];
	parameters: Record<string, any>;
	onParametersChange: (parameters: Record<string, any>) => void;
}

export function AlgorithmParameters({
	algorithm,
	availableColumns,
	parameters,
	onParametersChange,
}: AlgorithmParametersProps) {
	const updateParameter = (key: string, value: any) => {
		onParametersChange({
			...parameters,
			[key]: value,
		});
	};

	const numericColumns = availableColumns; // In real scenario, filter only numeric columns

	if (!algorithm.parameters || algorithm.parameters.length === 0) {
		return null;
	}

	return (
		<div className="space-y-4 mt-4 p-4 border rounded-lg bg-muted/30">
			<h4 className="text-sm font-medium">参数配置</h4>

			{algorithm.parameters?.map((param) => {
				// Common parameters
				if (param === "labelColumn") {
					return (
						<div key={param} className="space-y-2">
							<Label htmlFor={param}>标签列</Label>
							<Select
								value={parameters[param] || ""}
								onValueChange={(value) => updateParameter(param, value)}
							>
								<SelectTrigger id={param}>
									<SelectValue placeholder="选择标签列" />
								</SelectTrigger>
								<SelectContent>
									{availableColumns.map((col) => (
										<SelectItem key={col} value={col}>
											{col}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					);
				}

				if (param === "actualColumn" || param === "predictedColumn") {
					return (
						<div key={param} className="space-y-2">
							<Label htmlFor={param}>
								{param === "actualColumn" ? "实际值列" : "预测值列"}
							</Label>
							<Select
								value={parameters[param] || ""}
								onValueChange={(value) => updateParameter(param, value)}
							>
								<SelectTrigger id={param}>
									<SelectValue placeholder="选择列" />
								</SelectTrigger>
								<SelectContent>
									{availableColumns.map((col) => (
										<SelectItem key={col} value={col}>
											{col}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					);
				}

				if (param === "testSize") {
					return (
						<div key={param} className="space-y-2">
							<Label htmlFor={param}>测试集比例</Label>
							<Input
								id={param}
								type="number"
								min="0.1"
								max="0.9"
								step="0.1"
								value={parameters[param] || 0.3}
								onChange={(e) =>
									updateParameter(param, Number.parseFloat(e.target.value))
								}
							/>
						</div>
					);
				}

				// Algorithm-specific parameters
				if (param === "k") {
					return (
						<div key={param} className="space-y-2">
							<Label htmlFor={param}>
								{algorithm.category === "unsupervised" ? "聚类数 (k)" : "邻居数 (k)"}
							</Label>
							<Input
								id={param}
								type="number"
								min="1"
								max="20"
								value={parameters[param] || (algorithm.category === "unsupervised" ? 3 : 5)}
								onChange={(e) =>
									updateParameter(param, Number.parseInt(e.target.value))
								}
							/>
						</div>
					);
				}

				if (param === "nComponents") {
					return (
						<div key={param} className="space-y-2">
							<Label htmlFor={param}>主成分数</Label>
							<Input
								id={param}
								type="number"
								min="1"
								max="10"
								value={parameters[param] || 3}
								onChange={(e) =>
									updateParameter(param, Number.parseInt(e.target.value))
								}
							/>
						</div>
					);
				}

				if (param === "maxIterations") {
					return (
						<div key={param} className="space-y-2">
							<Label htmlFor={param}>最大迭代次数</Label>
							<Input
								id={param}
								type="number"
								min="10"
								max="1000"
								value={parameters[param] || 100}
								onChange={(e) =>
									updateParameter(param, Number.parseInt(e.target.value))
								}
							/>
						</div>
					);
				}

				if (param === "maxDepth") {
					return (
						<div key={param} className="space-y-2">
							<Label htmlFor={param}>最大深度</Label>
							<Input
								id={param}
								type="number"
								min="1"
								max="50"
								value={parameters[param] || 10}
								onChange={(e) =>
									updateParameter(param, Number.parseInt(e.target.value))
								}
							/>
						</div>
					);
				}

				if (param === "minNumSamples") {
					return (
						<div key={param} className="space-y-2">
							<Label htmlFor={param}>最小样本数</Label>
							<Input
								id={param}
								type="number"
								min="1"
								max="20"
								value={parameters[param] || 3}
								onChange={(e) =>
									updateParameter(param, Number.parseInt(e.target.value))
								}
							/>
						</div>
					);
				}

				if (param === "nEstimators") {
					return (
						<div key={param} className="space-y-2">
							<Label htmlFor={param}>树的数量</Label>
							<Input
								id={param}
								type="number"
								min="10"
								max="500"
								value={parameters[param] || 100}
								onChange={(e) =>
									updateParameter(param, Number.parseInt(e.target.value))
								}
							/>
						</div>
					);
				}

				if (param === "degree") {
					return (
						<div key={param} className="space-y-2">
							<Label htmlFor={param}>多项式次数</Label>
							<Input
								id={param}
								type="number"
								min="1"
								max="10"
								value={parameters[param] || 2}
								onChange={(e) =>
									updateParameter(param, Number.parseInt(e.target.value))
								}
							/>
						</div>
					);
				}

				if (param === "metric") {
					return (
						<div key={param} className="space-y-2">
							<Label htmlFor={param}>距离度量</Label>
							<Select
								value={parameters[param] || "euclidean"}
								onValueChange={(value) => updateParameter(param, value)}
							>
								<SelectTrigger id={param}>
									<SelectValue placeholder="选择距离度量" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="euclidean">欧氏距离</SelectItem>
									<SelectItem value="manhattan">曼哈顿距离</SelectItem>
									<SelectItem value="chebyshev">切比雪夫距离</SelectItem>
								</SelectContent>
							</Select>
						</div>
					);
				}

				return null;
			})}
		</div>
	);
}
