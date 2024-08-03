import * as d3 from 'd3';
import React, { useEffect, useRef } from "react";
import { getMemoStats } from "@/helpers/api";
import { extractUsernameFromName } from "@/store/v1";
import useCurrentUser from "@/hooks/useCurrentUser";

interface Props {
}

const PostHeatmap: React.FC<Props> = (props: Props) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const user = useCurrentUser();

    useEffect(() => {
        getMemoStats(extractUsernameFromName(user.name)).then(({ data }) => {
            const user_post_ts = data
            const parseDate = d3.timeParse("%Y-%m-%d");
            const formatDate = d3.timeFormat("%Y-%m-%d");

            const dateCounts: { [key: string]: number } = {};
            user_post_ts.forEach(ts => {
                const dateStr = formatDate(new Date((ts) * 1000));
                if (!dateCounts[dateStr]) {
                    dateCounts[dateStr] = 0;
                }
                dateCounts[dateStr]++;
            });

            const _data = Object.keys(dateCounts).map(date => ({
                date: parseDate(date)!,
                count: dateCounts[date]
            }));

            const today = new Date();
            let startDate = d3.min(_data, d => d.date)!;
            const endDate = new Date(new Date().getTime());
            const eightWeeksAgo = new Date(today.getTime() - 52 * 7 * 24 * 60 * 60 * 1000);
            if (startDate > eightWeeksAgo) {
                startDate = eightWeeksAgo;
            }
            const daysRange = d3.timeDays(startDate, endDate);

            const fullData = daysRange.map(date => ({
                date,
                count: dateCounts[formatDate(date)] || 0
            }));

            const margin = { top: 50, right: 20, bottom: 20, left: 50 };
            const width = window.innerWidth - 6 * 16 - margin.left - margin.right;
            const height = 500 - margin.top - margin.bottom;

            const numWeeks = d3.timeWeek.count(startDate, endDate) + 1;
            const cellSize = Math.floor(width / numWeeks);

            const svg = d3.select(svgRef.current)
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const colorScale = d3.scaleThreshold<number, string>()
                .domain([1, 2, 4, 7, 11, 16])
                .range(["#ebedf0", "#c6e48b", "#7bc96f", "#239a3b", "#196127", "#003700"]);

            const tooltip = d3.select("body").append("div")
            .attr("class", "d3_tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "white")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("z-index", "1000")

            svg.selectAll("rect")
                .data(fullData)
                .enter()
                .append("rect")
                .attr("x", d => d3.timeMonday.count(startDate, d.date) * cellSize)
                .attr("y", d => (d.date.getDay() === 0 ? 6 : d.date.getDay() - 1) * cellSize)
                .attr("width", cellSize - 1)
                .attr("height", cellSize - 1)
                .attr("fill", d => colorScale(d.count))
                .on("mouseover", function(event, d) {
                    if (d.count > 0) {
                    tooltip.html(`${formatDate(d.date)}：${d.count}`)
                        .style("visibility", "visible");
                    }
                })
                .on("mousemove", function(event, d) {
                    if (d.count > 0) {
                    tooltip.style("top", (event.pageY) + "px")
                        .style("left", (event.pageX) + "px");
                    }
                })
                .on("mouseout", function() {
                    tooltip.style("visibility", "hidden");
                });

            const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周天'];
            svg.selectAll(".dayLabel")
                .data(days)
                .enter().append("text")
                .text(d => d)
                .attr("x", -5)
                .attr("y", (d, i) => i * cellSize + cellSize / 2)
                .attr("transform", "translate(-6," + cellSize / 10 + ")")

            const months = d3.timeMonths(startDate, endDate);
            const monthFormat = d3.timeFormat("%m月");
            svg.selectAll(".monthLabel")
                .data(months)
                .enter().append("text")
                .text(d => monthFormat(d))
                .attr("x", d => d3.timeWeek.count(startDate, d) * cellSize)
                .attr("y", -5)
                .style("text-anchor", "middle")
        });
    }, []);

    return <svg ref={svgRef}></svg>;
}

export default PostHeatmap;