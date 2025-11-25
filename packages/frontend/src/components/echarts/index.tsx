import { FC, useEffect, useRef } from "react";
import { echarts } from "@/components/echarts/lib";
import { EChartsOption } from "echarts";

interface EchartsProps {
  options: EChartsOption;
}

/**
 * react 组件中渲染 echarts 图表组件
 */
export const Echarts: FC<EchartsProps> = (props) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!props.options) return;
    if (!chartRef.current) {
      chartRef.current = echarts.init(chartContainerRef.current);
    }
    try {
      chartRef.current.setOption(props.options, {
        notMerge: false,
        lazyUpdate: false, // 立即更新
      });
    } catch (e) {
      console.debug("echarts 渲染异常", e, props.options);
    }
  }, [JSON.stringify(props.options)]);

  // 图表自适应尺寸
  useEffect(() => {
    const resize = () => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    };

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <div ref={chartContainerRef} className="h-full w-full" />;
};
