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
        marker: { size: 6, color: '#1f77b4' },
        text: nodes.map((_, i) => String(i)),
        textposition: 'top center',
        hoverinfo: 'text'
    };

    return [edgeTrace, nodeTrace];
}

function rotateNodes(nodes, angle) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    return nodes.map(n => ({
        x: n.x * cosA - n.y * sinA,
        y: n.x * sinA + n.y * cosA
    }));
}

async function render2DGraph(edgeFile, layoutFile, plotId) {
    const { edges, nodes } = await load2DGraphData(edgeFile, layoutFile);

    // randomView = true;

    // if (randomView) {
    //     const angle = Math.random() * 2 * Math.PI;
    //     nodes = rotateNodes(nodes, angle);
    //     console.log("random rotation taken");
    // }

    const traces = create2DTraces(edges, nodes);

    const allVals = [
    ...nodes.map(n => n.x),
    ...nodes.map(n => n.y)
    ];

    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    const pad = 0.05 * (maxVal - minVal);

    const layout = {
        margin: { l: 0, r: 0, t: 0, b: 0, pad: 0 },
        dragmode: 'pan',
        xaxis: { visible: false, showgrid: false, range: [minVal - pad, maxVal + pad], scaleanchor: 'y' },
        yaxis: { visible: false, showgrid: false, range: [minVal - pad, maxVal + pad] },
        showlegend: false
    };

    Plotly.newPlot(plotId, traces, layout, {scrollZoom: true});
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

async function render3DGraph(edgeFile, layoutFile, plotId, randomView) {
    const { edges, nodes } = await load3DGraphData(edgeFile, layoutFile);
    const traces = create3DTraces(edges, nodes);

    const xVals = nodes.map(n => n.x);
    const yVals = nodes.map(n => n.y);
    const zVals = nodes.map(n => n.z);

    const xMin = Math.min(...xVals);
    const xMax = Math.max(...xVals);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);
    const zMin = Math.min(...zVals);
    const zMax = Math.max(...zVals);

    let camera = {
        eye: { x: 1.25, y: 1.25, z: 1.25 }
    };

    if (randomView) {
        const r = 2.0; // distance of camera from origin
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.random() * Math.PI;
        camera = {
            eye: {
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta),
                z: r * Math.cos(phi)
            }
        };
        console.log("random view taken");
    }

    console.log(camera);

    const layout = {
         margin: { l: 0, r: 0, t: 0, b: 0, pad: 0 },
        dragmode: 'orbit',
        scene: {
            xaxis: { visible: false, showgrid: false, range: [xMin, xMax] },
            yaxis: { visible: false, showgrid: false, range: [yMin, yMax] },
            zaxis: { visible: false, showgrid: false, range: [zMin, zMax] },
            camera: camera
        },
        showlegend: false
    };

    Plotly.newPlot(plotId, traces, layout);
}