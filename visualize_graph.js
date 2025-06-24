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

    const customNodes = {
        0: { color: 'red', size: 8 },
        1: { color: '#008f1f', size: 8 },
        2: { color: '#2800c7', size: 8 }
    };

    // Default style
    const defaultColor = '#1f77b4';
    const defaultSize = 5;

    // Build arrays for color and size
    const nodeColors = nodes.map((_, i) =>
        customNodes[i] ? customNodes[i].color : defaultColor
    );

    const nodeSizes = nodes.map((_, i) =>
        customNodes[i] ? customNodes[i].size : defaultSize
    );

    const nodeTrace = {
        x: nodes.map(n => n.x),
        y: nodes.map(n => n.y),
        mode: 'markers',
        type: 'scatter',
        marker: {
            size: nodeSizes,
            color: nodeColors
        },
        text: nodes.map((_, i) => `Node ${i}`),
        textposition: 'top center',
        hoverinfo: 'text'
    };

    return [edgeTrace, nodeTrace];
}

async function render2DGraph(edgeFile, layoutFile, plotId) {
    const { edges, nodes } = await load2DGraphData(edgeFile, layoutFile);
    const traces = create2DTraces(edges, nodes);

    const layout = {
        margin: { l: 0, r: 0, t: 0, b: 0, pad: 0 },
        dragmode: 'pan',
        xaxis: { visible: false, showgrid: false, range: [0, 1], scaleanchor: 'y' },
        yaxis: { visible: false, showgrid: false, range: [0, 1] },
        showlegend: false
    };

    Plotly.newPlot(plotId, traces, layout);
}

async function load3DGraphData(edgeFile, layoutFile) {
    const [edgeData, nodeData] = await Promise.all([
        d3.dsv(";", edgeFile),
        d3.dsv(";", layoutFile)
    ]);

    const edges = edgeData.map(d => [parseInt(d.from), parseInt(d.to)]);
    const nodes = nodeData.map(d => ({
        x: parseFloat(d.x),
        y: parseFloat(d.y),
        z: parseFloat(d.z)
    }));

    return { edges, nodes };
}

function create3DTraces(edges, nodes) {
    const edgeX = [], edgeY = [], edgeZ = [];
    for (const [src, tgt] of edges) {
        const { x: x0, y: y0, z: z0 } = nodes[src];
        const { x: x1, y: y1, z: z1 } = nodes[tgt];
        edgeX.push(x0, x1, null);
        edgeY.push(y0, y1, null);
        edgeZ.push(z0, z1, null);
    }

    const edgeTrace = {
        x: edgeX,
        y: edgeY,
        z: edgeZ,
        mode: 'lines',
        type: 'scatter3d',
        line: { width: 1, color: '#888' },
        hoverinfo: 'none'
    };

    const nodeTrace = {
        x: nodes.map(n => n.x),
        y: nodes.map(n => n.y),
        z: nodes.map(n => n.z),
        mode: 'markers',
        type: 'scatter3d',
        marker: { size: 3, color: '#1f77b4' },
        text: nodes.map((_, i) => String(i)),
        hoverinfo: 'text'
    };

    return [edgeTrace, nodeTrace];
}

async function render3DGraph(edgeFile, layoutFile, plotId) {
    const { edges, nodes } = await load3DGraphData(edgeFile, layoutFile);
    const traces = create3DTraces(edges, nodes);

    const layout = {
         margin: { l: 0, r: 0, t: 0, b: 0, pad: 0 },
        dragmode: 'orbit',
        scene: {
            xaxis: { visible: false, showgrid: false, range: [0, 1] },
            yaxis: { visible: false, showgrid: false, range: [0, 1] },
            zaxis: { visible: false, showgrid: false, range: [0, 1] }
        },
        showlegend: false
    };

    Plotly.newPlot(plotId, traces, layout);
}