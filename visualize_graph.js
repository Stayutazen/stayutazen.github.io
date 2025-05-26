async function load2DGraphData(edgeFile, layoutFile) {
    const [edgeData, nodeData] = await Promise.all([
        d3.dsv(";", edgeFile),
        d3.dsv(";", layoutFile)
    ]);

    const edges = edgeData.map(d => [parseInt(d.from), parseInt(d.to)]);
    const nodes = nodeData.map(d => ({
        x: parseFloat(d.x),
        y: parseFloat(d.y)
    }));

    return { edges, nodes };
}

function create2DTraces(edges, nodes) {
    const edgeX = [], edgeY = [];
    for (const [src, tgt] of edges) {
        const { x: x0, y: y0 } = nodes[src];
        const { x: x1, y: y1 } = nodes[tgt];
        edgeX.push(x0, x1, null);
        edgeY.push(y0, y1, null);
    }

    const edgeTrace = {
        x: edgeX,
        y: edgeY,
        mode: 'lines',
        type: 'scatter',
        line: { width: 1, color: '#888' },
        hoverinfo: 'none'
    };

    const nodeTrace = {
        x: nodes.map(n => n.x),
        y: nodes.map(n => n.y),
        mode: 'markers',
        type: 'scatter',
        marker: { size: 3, color: '#1f77b4' },
        text: nodes.map((_, i) => String(i)),
        textposition: 'top center',
        hoverinfo: 'text'
    };

    return [edgeTrace, nodeTrace];
}

async function render2DGraph(edgeFile, layoutFile, plotId) {
    const { edges, nodes } = await load2DGraphData(edgeFile, layoutFile);
    const traces = create2DTraces(edges, nodes);

    const layout = {
        margin: { t: 20 },
        dragmode: 'pan',
        xaxis: { visible: false, showgrid: false, range: [0, 1], scaleanchor: 'y' },
        yaxis: { visible: false, showgrid: false, range: [0, 1] },
        showlegend: false
    };

    Plotly.newPlot(plotId, traces, layout);
}