import { db, auth, signInAnonymously, addDoc, collection } from "./firebase.js";

export function randomFrame(){
    let attempt = 0;
    let frames = [];
    let value = null;

    while (attempt < 5) {
      if(value == null){
        frames = Array.from({ length: 3 }, () => Math.floor(Math.random() * 36));
      }
      else{
        frames[value] = Math.floor(Math.random() * 36);
      }
      
      frames.sort((a, b) => a - b);
      console.log(frames);
      console.log(value);

      const diff1 = frames[1] - frames[0];
      const diff2 = frames[2] - frames[1];

      if (diff1 >= 3 && diff2 >= 3) {
        return frames;
      }

      if (diff1 < 3) {
        // Replace either frames[0] or frames[1], randomly
        value = Math.random() < 0.5 ? 0 : 1;
      }

      if (diff2 < 3) {
        // Replace either frames[1] or frames[2], randomly
        value = Math.random() < 0.5 ? 1 : 2;
      }
      attempt++;
    }

    return frames;
}

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

export async function render2DGraph(edgeFile, layoutFile, plotId, randomView, start) {
    const { edges, nodes } = await load2DGraphData(edgeFile, layoutFile);

    // compute graph center as rotation pivot
    const cx = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
    const cy = nodes.reduce((s, n) => s + n.y, 0) / nodes.length;

    // base traces (theta = 0)
    let traces = create2DTraces(edges, nodes);

    // generate frames (e.g. 36 frames for full circle)
    const nFrames = 36;
    const thetas = Array.from({ length: nFrames }, (_, k) => (2 * Math.PI * k) / nFrames);

    let startIndex = 0

    // if randomview, take a random start index and change the initial trace accordingly
    if(randomView){
        startIndex = start; //Math.floor(Math.random() * nFrames);
        traces = createRotatedTraces(edges, nodes, thetas[startIndex], cx, cy);
    }
    
    const reorder = [
        ...thetas.slice(startIndex),
        ...thetas.slice(0, startIndex)
    ];

    const frames = reorder.map((theta, k) => {
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

    frames.push({
        name: `frame${nFrames + 1}`,
        data: frames[0].data,
        traces: [0, 1]
    });

    let minVal = Infinity;
    let maxVal = -Infinity;

    for (const f of frames) {
      const nodeTrace = f.data[1];
      for (const val of nodeTrace.x) {
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
      for (const val of nodeTrace.y) {
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
      }
    }
    const pad = 0.05 * (maxVal - minVal);

    const sliders = [{
        steps: frames.map(f => ({
            method: "animate",
            args: [[f.name], {
                mode: "immediate",
                frame: { duration: 0, redraw: false },
                transition: { duration: 0 }
            }],
            label: ''
        })),
        transition: { duration: 0 },
        x: 0.1,
        len: 0.8,
        tickcolor: 'rgba(0,0,0,0)'
    }];
    

    const layout = {
        margin: { l: 0, r: 0, t: 0, b: 0, pad: 0 },
        dragmode: 'pan',
        xaxis: { visible: false, showgrid: false, range: [minVal - pad, maxVal + pad], scaleanchor: 'y' },
        yaxis: { visible: false, showgrid: false, range: [minVal - pad, maxVal + pad] },
        showlegend: false,
        sliders
    };

    const config = {
    scrollZoom: true,
    displaylogo: false,
    responsive: true,
    modeBarButtonsToRemove: [
        "toImage",
        "zoom2d",
        "select2d",
        "lasso2d",
        "toggleSpikelines",
        "hoverClosestCartesian",
        "hoverCompareCartesian",
        "autoScale2d"
        ]
    };

    Plotly.newPlot(plotId, traces, layout, config).then(() => {
        Plotly.addFrames(plotId, frames);

        document.getElementById(plotId).on('plotly_animated', () => {
            Plotly.redraw(plotId);
        });
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

export async function render3DGraph(edgeFile, layoutFile, plotId, randomView, pos, graph) {
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
    }

    if(pos){
        camera = {
            eye: pos[0],
            up: pos[1]
        };
    }
    
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
    }

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

    const config = {
    scrollZoom: true,
    displaylogo: false,
    responsive: true,
    modeBarButtonsToRemove: [
        "toImage",
        "tableRotation",
        "resetCameraLastSave3d",
        "hoverClosest3d"
        ]
    };

    Plotly.newPlot(plotId, traces, layout, config);

    if(graph == null){
        console.log("no graph")
        return;
    }

    const myPlot = document.getElementById("plot");

    myPlot.on('plotly_relayout', logInteraction);

    // Logs when there hasn't been an interaction for 10 seconds
    let interactionTimer = null;
    console.log("Timer null");

    function logInteraction() {
    // If timer was running, reset it
    if (interactionTimer){
      console.log("Timer reset");
      clearTimeout(interactionTimer);
    }

    console.log("Timer running");

    // Start 10 second timer
    interactionTimer = setTimeout(async () => {
      const sceneCamera = myPlot._fullLayout.scene.camera;


      signInAnonymously(auth)
        .then(async () => {
          console.log("Signed in!");
        
          try {
            await addDoc(collection(db, graph), {
              camera: sceneCamera,
              timestamp: new Date()
            });
            console.log("Camera logged to firebase");
          } catch (e) {
            console.error("Failed to log camera: ", e);
          }
        })
        .catch((error) => {
          console.error("Auth error:", error);
        });

          interactionTimer = null;
        }, 10000);
    }
}