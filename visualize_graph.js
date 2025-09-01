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
        hoverinfo: 'text'
    };

    return [edgeTrace, nodeTrace];
}


function rotate2D(x, y, theta, cx = 0, cy = 0) {
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const dx = x - cx;
    const dy = y - cy;
    return [
        cx + cosT * dx - sinT * dy,
        cy + sinT * dx + cosT * dy
    ];
}

function createRotatedTraces(edges, nodes, theta, cx = 0, cy = 0) {
    const rotatedNodes = nodes.map(n => {
        const [xr, yr] = rotate2D(n.x, n.y, theta, cx, cy);
        return { x: xr, y: yr };
    });

    return create2DTraces(edges, rotatedNodes);
}

async function render2DGraph(edgeFile, layoutFile, plotId, randomView) {
    const { edges, nodes } = await load2DGraphData(edgeFile, layoutFile);

    // compute graph center as rotation pivot
    const cx = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
    const cy = nodes.reduce((s, n) => s + n.y, 0) / nodes.length;

    // base traces (theta = 0)
    const traces = create2DTraces(edges, nodes);

    // generate frames (e.g. 36 frames for full circle)
    const nFrames = 36;
    const thetas = Array.from({ length: nFrames }, (_, k) => (2 * Math.PI * k) / nFrames);

    const frames = thetas.map((theta, k) => {
        const rotatedTraces = createRotatedTraces(edges, nodes, theta, cx, cy);

        return {
            name: `frame${k + 1}`,
            data: [
                rotatedTraces[0], // edge trace
                rotatedTraces[1]  // node trace
            ],
            traces: [0, 1] 
        };
    });

    let startIndex = 0

    if(randomView){
        startIndex = Math.floor(Math.random() * nFrames);
    }

    // const reorderedFrames = [
    //     ...frames.slice(startIndex),
    //     ...frames.slice(0, startIndex)
    // ];

    // reorderedFrames.push({
    //     name: `frame${nFrames + 1}`,
    //     data: reorderedFrames[0].data,
    //     traces: [0, 1]
    // });

    frames.push({
        name: `frame${nFrames + 1}`,
        data: frames[0].data,
        traces: [0, 1]
    });

    const allVals = frames.flatMap(f => {
        const nodeTrace = f.data[1];
        return [...nodeTrace.x, ...nodeTrace.y];
    });

    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    const pad = 0.05 * (maxVal - minVal);

    const sliders = [{
        steps: frames.map((f, k) => ({
            method: "animate",
            args: [[f.name], {
                mode: "immediate",
                frame: { duration: 0, redraw: true },
                transition: { duration: 0 }
            }],
            label: f.name
        })),
        transition: { duration: 0 },
        x: 0.1,
        len: 0.8,
        tickcolor: 'rgba(0,0,0,0)'
    }];

    // console.log(reorderedFrames)
    console.log(frames)

    const layout = {
        margin: { l: 0, r: 0, t: 0, b: 0, pad: 0 },
        dragmode: 'pan',
        xaxis: { visible: false, showgrid: false, range: [minVal - pad, maxVal + pad], scaleanchor: 'y' },
        yaxis: { visible: false, showgrid: false, range: [minVal - pad, maxVal + pad] },
        showlegend: false,
        sliders
    };

    // const initialTrace = reorderedFrames[0].data // initial trace is different after reordering as well

    Plotly.newPlot(plotId, traces, layout, { scrollZoom: true }).then(() => {
        Plotly.addFrames(plotId, frames);
    });
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