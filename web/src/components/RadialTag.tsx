import * as d3 from 'd3';
import React, { useEffect, useRef } from "react";
import { useTagStore } from "@/store/module";

interface Props {
}

interface node {
    name: string;
    children?: node[];
    weight?: number;
    full_name?: string;
}

function buildTree(dictionary): node {
    const root: node = { name: '', children: [] };

    for (const key in dictionary) {
        const parts = key.split('/');
        let currentNode = root;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            let childNode = currentNode.children?.find(child => child.name === part);
            if (!childNode) {
                childNode = { name: part, children: []};
                currentNode.children = currentNode.children || [];
                currentNode.children.push(childNode);
            }
            childNode.full_name = parts.slice(0, i + 1).join('/');
            if (i === parts.length - 1) {
                childNode.weight = dictionary[key];
            }
            currentNode = childNode;
        }
    }

    return root;
}


const RadialTag: React.FC<Props> = (props: Props) => {
    const tagStore = useTagStore();
    const tagCounts = tagStore.state.tagCounts;
    const tagsText = tagStore.state.tags;
    const svgRef = useRef<SVGSVGElement | null>(null);

    const newTagCounts = Object.keys(tagCounts).reduce((acc, key) => {
        if (tagsText.includes(key)) {
            acc[key] = tagCounts[key];
        }
        return acc;
    }, {});

    const data = buildTree(newTagCounts);

    useEffect(() => {
        if (!data) return;

        const width = 1080;
        const radius = width / 2;

        const tree = d3.tree<node>()
        .size([2 * Math.PI, radius-100])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

        const root = d3.hierarchy(data);
        tree(root);

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [-width / 2, -width / 2, width, width])
            .style("font", "10px sans-serif")
            .style("user-select", "none")

        if (window.innerWidth >= 1080) {
            svg.style('width', '1080px');
        }

        svg.selectAll("*").remove();

        svg.append("g")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1)
            .selectAll("path")
            .data(root.links())
            .join("path")
            .attr("d", d3.linkRadial<any, d3.HierarchyLink<node>>()
                .angle(d => (d as any).x)
                .radius(d => (d as any).y))

        const node = svg.append("g")
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `
            rotate(${d.x * 180 / Math.PI - 90})
            translate(${(d).y},0)
        `);

        const tooltip = d3.select("body").append("div")
        .attr("class", "d3_tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "white")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("z-index", "1000")

        const colorScale = d3.scaleLinear<string>()
            .domain([0, 100])
            .range(["green", "red"]);

        node.append("circle")
            .attr("fill", d => d.data.weight != null ? colorScale(d.data.weight) : "#FFF")
            .attr("stroke", "#000")
            .attr("r", 2.5);

        node.append('a')
        .attr('xlink:href', d => `?tag=${d.data.full_name}&tag_mode=full`)
        .attr('target', '_blank')
        .append("text")
        .attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .text(d => d.data.name)
        .on("mouseover", function(event, d) {
            tooltip.html(`${d.data.name}: ${d.data.weight ? d.data.weight : 0}`)
            .style("visibility", "visible");
          })
          .on("mousemove", function(event, d) {
              tooltip.style("top", (event.pageY) + "px")
                .style("left", (event.pageX) + "px");
          })
          .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
          })
        .clone(true).lower()
        .attr("stroke", "white")
    }, [data]);

  return <svg ref={svgRef}></svg>;
}

export default RadialTag;