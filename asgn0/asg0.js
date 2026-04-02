import { Vector3 } from './lib/cuon-matrix-cse160.js';

export function main() {
  // Retrieve <canvas> element
  let canvas = document.getElementById('VectorCanvas');
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  }

  // Get the rendering context for 2DCG
  let ctx = canvas.getContext('2d');

  // Draw a black square
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Get center of canvas
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  // Get button
  const drwBtn = document.getElementById('drwBtn');
  const opBtn = document.getElementById('opBtn');

  drwBtn.addEventListener('click', () => handleDrawEvent(ctx, canvas, centerX, centerY));
  opBtn.addEventListener('click', () => handleDrawOperationEvent(ctx, canvas, centerX, centerY));
}

function handleDrawEvent(ctx, canvas, centerX, centerY) {
  // Clear and redraw canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black'; // Set color to black
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill a rectangle with the color

  // Get x and y
  const v1x = parseFloat(document.getElementById('v1xCoordInput').value);
  const v1y = parseFloat(document.getElementById('v1yCoordInput').value);
  const v2x = parseFloat(document.getElementById('v2xCoordInput').value);
  const v2y = parseFloat(document.getElementById('v2yCoordInput').value);

  // Create vector to be drawn
  let v1 = new Vector3([v1x, v1y, 0]);
  let v2 = new Vector3([v2x, v2y, 0]);

  drawVector(ctx, v1, "red", centerX, centerY);
  drawVector(ctx, v2, "blue", centerX, centerY);
}

function handleDrawOperationEvent(ctx, canvas, centerX, centerY) {
  // Clear and redraw canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'black'; // Set color to black
  ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill a rectangle with the color

  // Retrieve input box values
  const v1x = parseFloat(document.getElementById('v1xCoordInput').value);
  const v1y = parseFloat(document.getElementById('v1yCoordInput').value);
  const v2x = parseFloat(document.getElementById('v2xCoordInput').value);
  const v2y = parseFloat(document.getElementById('v2yCoordInput').value);
  const scalarVal = parseFloat(document.getElementById('scalarInput').value);

  // Create vector to be drawn
  let v1 = new Vector3([v1x, v1y, 0]);
  let v2 = new Vector3([v2x, v2y, 0]);

  // Draw v1 and v2
  drawVector(ctx, v1, "red", centerX, centerY);
  drawVector(ctx, v2, "blue", centerX, centerY);

  // Get operation
  const op = document.getElementById('opBox').value;

  let v3, v4;
  if (op === "add") {
    v3 = new Vector3(v1.elements).add(v2);
    drawVector(ctx, v3, "green", centerX, centerY);
  }
  else if (op === "sub") {
    v3 = new Vector3(v1.elements).sub(v2);
    drawVector(ctx, v3, "green", centerX, centerY);
  }
  else if (op === "mul") {
    v3 = new Vector3(v1.elements).mul(scalarVal);
    v4 = new Vector3(v2.elements).mul(scalarVal);
    drawVector(ctx, v3, "green", centerX, centerY);
    drawVector(ctx, v4, "green", centerX, centerY);
  }
  else if (op === "div") {
    v3 = new Vector3(v1.elements).div(scalarVal);
    v4 = new Vector3(v2.elements).div(scalarVal);
    drawVector(ctx, v3, "green", centerX, centerY);
    drawVector(ctx, v4, "green", centerX, centerY);
  }
  else if (op === "angle") {
    let v1v2Dot = Vector3.dot(v1, v2);
    let v1Mag = v1.magnitude();
    let v2Mag = v2.magnitude();
    console.log("Angle: " + Math.acos(v1v2Dot / (v1Mag * v2Mag)) * (180 / Math.PI));
  }
  else if (op === "area") {
    let v1v2Cross = Vector3.cross(v1, v2);
    let v1v2CrossMag = v1v2Cross.magnitude();
    console.log("Area: " + v1v2CrossMag / 2);
  }
  else if (op === "mag") {
    let v1Mag = v1.magnitude();
    let v2Mag = v2.magnitude();
    console.log("Magnitude v1: " + v1Mag);
    console.log("Magnitude v2: " + v2Mag);
  }
  else if (op === "norm") {
    v3 = new Vector3(v1.elements).normalize();
    v4 = new Vector3(v2.elements).normalize();
    drawVector(ctx, v3, "green", centerX, centerY);
    drawVector(ctx, v4, "green", centerX, centerY);
  }
}

function drawVector(ctx, v, color, originX, originY) {
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(
      originX + (v.elements[0] * (originX / 10)),
      originY - v.elements[1] * (originX / 10));
  ctx.strokeStyle = color;
  ctx.stroke();
}

document.addEventListener("DOMContentLoaded", main);