"use client";

import dynamic from "next/dynamic";
import type { CSSProperties, FC } from "react";
import type { EChartsCoreOption } from "echarts";
import type { EChartsReactProps } from "echarts-for-react";

const ReactECharts = dynamic(async () => {
	const mod = await import("echarts-for-react");
	return mod;
}, {
	ssr: false,
}) as unknown as FC<EChartsReactProps>;

export interface BaseEChartProps {
	option: EChartsCoreOption;
	className?: string;
	style?: CSSProperties;
	theme?: "light" | "dark";
	showLoading?: boolean;
	onChartReady?: EChartsReactProps["onChartReady"];
	opts?: EChartsReactProps["opts"];
}

const DEFAULT_STYLE: CSSProperties = { width: "100%", height: "320px" };

const BaseEChart: FC<BaseEChartProps> = ({
	option,
	className,
	style,
	theme,
	showLoading = false,
	onChartReady,
	opts,
}) => (
	<ReactECharts
		option={option}
		notMerge
		lazyUpdate
		showLoading={showLoading}
		className={className}
		style={{ ...DEFAULT_STYLE, ...style }}
		theme={theme}
		onChartReady={onChartReady}
		opts={opts}
	/>
);

BaseEChart.displayName = "BaseEChart";

export default BaseEChart;
