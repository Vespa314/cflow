import * as d3 from 'd3';
import React, { useEffect, useRef } from "react";
import { getMemoStats } from "@/helpers/api";
import { extractUsernameFromName } from "@/store/v1";
import useCurrentUser from "@/hooks/useCurrentUser";

interface Props {
}

type DataEntry = {
    day: string;
    hour: number;
    value: number;
  };

function transformTimestamps(ts_list: number[]): DataEntry[] {
    const daysOfWeek = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const counts: { [key: string]: number } = {};

    ts_list.forEach(ts => {
        const date = new Date(ts * 1000);
        date.setHours(date.getHours()); // 转换为北京时间
        const day = daysOfWeek[date.getUTCDay()];
        const hour = date.getHours();
        const key = `${day}-${hour}`;

        if (!counts[key]) {
        counts[key] = 0;
        }
        counts[key]++;
    });

    const data: DataEntry[] = [];

    for (const key in counts) {
        if (counts[key] > 0) {
        const [day, hour] = key.split("-");
        data.push({
            day: day,
            hour: parseInt(hour, 10),
            value: counts[key],
        });
        }
    }

    return data;
}


const BubbleHeatmap: React.FC<Props> = (props: Props) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const user = useCurrentUser();

    useEffect(() => {
        getMemoStats(extractUsernameFromName(user.name)).then(({ data }) => {
          const _data = transformTimestamps(data)
          const svg = d3.select(svgRef.current);
          const margin = { top: 20, right: 20, bottom: 30, left: 50 }
          const width = 1080;
          const height = 420;

          svg
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom);

          const g = svg.append('g')
          .attr('transform', `translate(${margin.left},${margin.top})`);

          const dayOrder = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

          const x = d3.scaleLinear()
          .domain([0, 23])
          .range([0, width]);

          const y = d3.scaleBand()
          .domain(dayOrder)
          .range([height, 0])
          .padding(0.1);

          const r = d3.scaleSqrt()
          .domain([0, d3.max(_data, d => d.value) as number])
          .range([0, 15]);

          const xAxis = d3.axisBottom(x).ticks(24);
          const yAxis = d3.axisLeft(y).tickSizeOuter(0);

          g.append('g')
          .attr('class', 'x-axis')
          .attr('transform', `translate(0,${height})`)
          .call(xAxis);

          g.append('g')
          .attr('class', 'y-axis')
          .call(yAxis);

          const tooltip = d3.select("body").append("div")
              .attr("class", "d3_tooltip")
              .style("position", "absolute")
              .style("visibility", "hidden")
              .style("background-color", "white")
              .style("border", "1px solid #ccc")
              .style("padding", "5px")
              .style("border-radius", "5px")
              .style("font-size", "12px")
              .style("z-index", "1000")

          g.append('g')
          .selectAll('circle')
          .data(_data)
          .enter().append('circle')
          .attr('cx', d => x(d.hour))
          .attr('cy', d => y(d.day)! + y.bandwidth() / 2)
          .attr('r', d => r(d.value))
          .attr('fill', 'green')
          .attr('opacity', 0.7)
          .on("mouseover", function(event, d) {
              if (d.value > 0) {
                tooltip.html(`${d.value}`)
                  .style("visibility", "visible");
              }
            })
            .on("mousemove", function(event, d) {
              if (d.value > 0) {
                tooltip.style("top", (event.pageY + 10) + "px")
                  .style("left", (event.pageX + 10) + "px");
              }
            })
            .on("mouseout", function() {
              tooltip.style("visibility", "hidden");
            });

          const xTicks = x.ticks(24).filter(tick => tick !== 0);
          g.append('g')
          .attr('class', 'grid')
          .selectAll('line')
          .data(xTicks)
          .enter().append('line')
          .attr('x1', d => x(d))
          .attr('x2', d => x(d))
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', '#ccc')
          .attr('stroke-dasharray', '2,2');
        });
    }, []);
    return <svg ref={svgRef}></svg>;
}

export default BubbleHeatmap;
