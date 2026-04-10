let VSHADER_SOURCE = `
attribute vec2 a_Position;
uniform vec2 u_Translation;
uniform float u_Rotation;
uniform float u_Scale;

void main() {
  float cosR = cos(u_Rotation);
  float sinR = sin(u_Rotation);
  vec2 rotated = vec2(
      a_Position.x * cosR - a_Position.y * sinR,
      a_Position.x * sinR + a_Position.y * cosR
  );

  vec2 scaled = rotated * u_Scale;
  vec2 final = scaled + u_Translation;

  gl_Position = vec4(final, 0.0, 1.0);
}
`;

// Fragment shader program
let FSHADER_SOURCE =`
precision mediump float;
uniform vec4 u_Color;
void main() {
  gl_FragColor = u_Color;
}
`;

export function main() {
  // Get canvas'
  let canvas = document.getElementById("canvas");

  // Get contexts
  let gl = setupWebGL(canvas);

  // Check for invalid context
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders.");
    return;
  }

  // Enable blending for transparency
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  let vars = connectVariablesToGLSL(gl);

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  let state = {
    currentShapeType: "triangle",
    shapes: [],
    previewShape: null,
    previewOn: false
  };

  // Canvas buttons/listener
  document.getElementById("clearButton").addEventListener('click', () => {
    changeCanvasColor(gl);
    state.shapes.length = 0;
  });
  document.getElementById("resetSlidersButton").addEventListener('click', () => {
    const sliders = document.querySelectorAll('input[type="range"]');

    sliders.forEach(slider => {
      slider.value = slider.defaultValue;
    });
  })
  document.getElementById("togglePreview").addEventListener('change', (e) => {state.previewOn = e.target.checked;})

  // Shape buttons/listener
  document.getElementById("triangleButton").addEventListener('click', () => {
    state.currentShapeType = "triangle";
    showShapeMenu('triangleMenu')
  });
  document.getElementById("rectangleButton").addEventListener('click', () => {
    state.currentShapeType = "rectangle";
    showShapeMenu('rectangleMenu')
  });
  document.getElementById("circleButton").addEventListener('click', () => {
    state.currentShapeType = "circle";
    showShapeMenu('circleMenu')
  });

  // Triangle vertex buttons/listener
  document.getElementById("vertex1Button").addEventListener('click', () => showVertex("vertex1"));
  document.getElementById("vertex2Button").addEventListener('click', () => showVertex("vertex2"));
  document.getElementById("vertex3Button").addEventListener('click', () => showVertex("vertex3"));

  let isDrawing = false;

  // Canvas click listener
  canvas.addEventListener("mousemove", (ev) => {
    // Drag to draw
    if (!state.previewOn && isDrawing) {
      updatePreview(ev, canvas, state);
      click(state);
    }
    // Preview
    else if (state.previewOn) {
      updatePreview(ev, canvas, state);
    }
  });

  canvas.addEventListener("mousedown", (ev) => {
    isDrawing = true;
    updatePreview(ev, canvas, state);
    click(state);
  });

  canvas.addEventListener("mouseup", () => {isDrawing = false;});

  canvas.addEventListener("mouseleave", () => {
    isDrawing = false;
    state.previewShape = null;
  });

  // Render all shapes in state.shapes every frame
  function renderLoop() {
    renderAllShapes(gl, vars, state.shapes, state.previewShape);
    requestAnimationFrame(renderLoop);
  }

  requestAnimationFrame(renderLoop);
}

function updatePreview(ev, canvas, state) {
  const rect = canvas.getBoundingClientRect();

  const mouseX = ((ev.clientX - rect.left) / canvas.width) * 2 - 1;
  const mouseY = 1 - ((ev.clientY - rect.top) / canvas.height) * 2;

  let triVertices = null;
  let rectParams = null;
  let circleSegments = null;

  if (state.currentShapeType === "triangle") {
    triVertices = [
      parseFloat(document.getElementById("triVertX1").value),
      parseFloat(document.getElementById("triVertY1").value),
      parseFloat(document.getElementById("triVertX2").value),
      parseFloat(document.getElementById("triVertY2").value),
      parseFloat(document.getElementById("triVertX3").value),
      parseFloat(document.getElementById("triVertY3").value)
    ];
  } else if (state.currentShapeType === "rectangle") {
    rectParams = {
      rectWidth: parseFloat(document.getElementById("rectWidth").value),
      rectHeight: parseFloat(document.getElementById("rectHeight").value),
    };
  } else if (state.currentShapeType === "circle") {
    circleSegments = parseFloat(document.getElementById("circleSegments").value);
  }

  state.previewShape = {
    type: state.currentShapeType,
    x: mouseX,
    y: mouseY,
    size: parseFloat(document.getElementById("shapeSize").value),
    rotation: parseFloat(document.getElementById("shapeRotation").value),
    color: [
      Number(document.getElementById("shapeRed").value) / 255,
      Number(document.getElementById("shapeGreen").value) / 255,
      Number(document.getElementById("shapeBlue").value) / 255,
      0.5 // preview alpha
    ],
    triVertices,
    rectParams,
    circleSegments
  };
}

function click(state) {
  if (!state.previewShape) return;

  // Clone from JSON string values but 1 alpha
  const finalShape = JSON.parse(JSON.stringify(state.previewShape));
  finalShape.color[3] = 1.0;

  state.shapes.push(finalShape);
}

function renderAllShapes(gl, vars, shapes, previewShape) {
  // Clear screen
  gl.clear(gl.COLOR_BUFFER_BIT);
  // Render all shapes
  for (let shape of shapes) {
    renderCurrentShape(gl, vars, shape);
  }

  if (previewShape) {
    renderCurrentShape(gl, vars, previewShape);
  }
}

function renderCurrentShape(gl, vars, shape) {
  // Set shader values to shape slider input
  gl.uniform2f(vars.u_Translation, shape.x, shape.y);
  gl.uniform1f(vars.u_Scale, shape.size);
  gl.uniform1f(vars.u_Rotation, shape.rotation);
  gl.uniform4f(vars.u_Color, ...shape.color);

  // Create vars
  let vertices;
  let drawMode;
  let vertexCount;

  // Set scale (canvas is 400x400)
  const scale = 1 / 400;

  if (shape.type === "triangle") {
    // Get vertices from shape.vertices
    const x1 = shape.triVertices[0] * scale;
    const y1 = shape.triVertices[1] * scale;
    const x2 = shape.triVertices[2] * scale;
    const y2 = shape.triVertices[3] * scale;
    const x3 = shape.triVertices[4] * scale;
    const y3 = shape.triVertices[5] * scale;

    // Load vertices into array for shader
    vertices = new Float32Array([
      x1, y1,
      x2, y2,
      x3, y3
    ]);

    // Set draw mode/vertex count for triangle
    drawMode = gl.TRIANGLES;
    vertexCount = 3;
  }
  else if (shape.type === "rectangle") {
    // Get width/height
    const rectWidth = shape.rectParams.rectWidth;
    const rectHeight = shape.rectParams.rectHeight;

    // Calculate x/y of each edge
    const left = -rectWidth * scale;
    const right = rectWidth * scale;
    const top = rectHeight * scale;
    const bottom = -rectHeight * scale;

    // Use edge coords to get vertices
    const topLeft = { x: left, y: top };
    const topRight = { x: right, y: top };
    const bottomRight = { x: right, y: bottom };
    const bottomLeft = { x: left, y: bottom };

    // Load vertices into array for shader
    vertices = new Float32Array([
      topLeft.x, topLeft.y,
      bottomLeft.x, bottomLeft.y,
      topRight.x, topRight.y,
      bottomRight.x, bottomRight.y
    ]);

    // Set draw mode/vertex count for rectangle
    drawMode = gl.TRIANGLE_STRIP;
    vertexCount = 4;
  }
  else if (shape.type === "circle") {
    // Get segment count and radius
    const segments = shape.circleSegments;
    const radius = 40 * scale;

    let circleVertices = [];
    circleVertices.push(0, 0);

    for (let i = 0; i <= segments; i++) {
      let angle = i * 2 * Math.PI / segments;
      circleVertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }

    vertices = new Float32Array(circleVertices);

    // Set draw mode/vertex count for circle
    drawMode = gl.TRIANGLE_FAN;
    vertexCount = segments + 2;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.vertexAttribPointer(vars.a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vars.a_Position);

  // Draw the shape
  gl.drawArrays(drawMode, 0, vertexCount);

  // Clean up
  gl.deleteBuffer(buffer);
}

function changeCanvasColor(gl) {
  // Get r, g, b from html slider
  let r = parseFloat(document.getElementById("canvasRed").value) / 255;
  let g = parseFloat(document.getElementById("canvasGreen").value) / 255;
  let b = parseFloat(document.getElementById("canvasBlue").value) / 255 ;
  let a = 1.0;

  // Set COLOR_BUFFER_BIT to slider colors
  gl.clearColor(r, g, b, a);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function showShapeMenu(menuId) {
  // Hide all shape menu elements
  document.getElementById("triangleMenu").style.display = "none";
  document.getElementById("rectangleMenu").style.display = "none";
  document.getElementById("circleMenu").style.display = "none";

  // Unhide desired
  document.getElementById(menuId).style.display = "block";
}

function showVertex(vertexId) {
  // Hide all triangle menu elements
  document.getElementById('vertex1').style.display = 'none';
  document.getElementById('vertex2').style.display = 'none';
  document.getElementById('vertex3').style.display = 'none';

  // Unhide desired
  document.getElementById(vertexId).style.display = 'block';
}

function setupWebGL(canvas) {
  // Get and return context
  return getWebGLContext(canvas);
}

function connectVariablesToGLSL(gl) {
  // Create dict of var locations
  return {
    a_Position: gl.getAttribLocation(gl.program, 'a_Position'),
    u_Translation: gl.getUniformLocation(gl.program, 'u_Translation'),
    u_Rotation: gl.getUniformLocation(gl.program, 'u_Rotation'),
    u_Scale: gl.getUniformLocation(gl.program, 'u_Scale'),
    u_Color: gl.getUniformLocation(gl.program, 'u_Color')
  };
}

document.addEventListener("DOMContentLoaded", main);