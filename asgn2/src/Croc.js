let VSHADER_SOURCE = `
attribute vec3 a_Position;
attribute vec3 a_Normal;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform mat4 u_GlobalRotation;

uniform vec3 u_LightDir;

varying float v_Light;

void main() {
    // full transform
    mat4 fullModel = u_GlobalRotation * u_ModelMatrix;

    vec4 worldPos = fullModel * vec4(a_Position, 1.0);

    // transform normal (basic version)
    vec3 normal = normalize(mat3(fullModel) * a_Normal);

    // lighting
    v_Light = max(dot(normal, normalize(u_LightDir)), 0.0);

    gl_Position =
        u_ProjectionMatrix *
        u_ViewMatrix *
        worldPos;
}
`;

let FSHADER_SOURCE = `
precision mediump float;

uniform vec4 u_Color;

varying float v_Light;

void main () {
    float ambient = 0.2;
    float light = ambient + v_Light;

    vec3 color = u_Color.rgb * light;

    gl_FragColor = vec4(color, u_Color.a);
}
`;

let g_AnimalGlobalRotation = 0;
let g_time = 0;
let g_sliders_enabled = true;
let g_animate_default = false;
let g_animate_alt = false;
let g_alt_anim_time = 0;
let g_render = true;
let g_identity = new Matrix4();

let g_frameCount = 0;
let g_lastTime = performance.now();

function main() {
    const {canvas, gl} = initWebGL("canvas");

    gl.clearColor(0.5, 0.5, 0.7, 1);
    gl.enable(gl.DEPTH_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    cubeMesh = drawCube(gl);

    setupAttribute(gl, gl.program, cubeMesh.buffer, "a_Position", 3);

    setupAttribute(gl, gl.program, cubeMesh.normalBuffer, "a_Normal", 3);

    const uniforms = {
        u_ModelMatrix : gl.getUniformLocation(gl.program, "u_ModelMatrix"),
        u_Color : gl.getUniformLocation(gl.program, "u_Color"),
        u_ProjectionMatrix : gl.getUniformLocation(gl.program, "u_ProjectionMatrix"),
        u_ViewMatrix : gl.getUniformLocation(gl.program, "u_ViewMatrix"),
        u_GlobalRotation: gl.getUniformLocation(gl.program, "u_GlobalRotation"),
        u_LightDir: gl.getUniformLocation(gl.program, "u_LightDir")
    };

    const camera = new Camera(
        gl,
        canvas,
        uniforms.u_ViewMatrix,
        uniforms.u_ProjectionMatrix
    );

    gl.uniform3f(uniforms.u_LightDir, 1, 1, 1);

    // Create body parts
    const bodyParts = createBodyParts(cubeMesh);
    createHierarchy(bodyParts);

    let rotDict = setupRotDict();
    let bodyTransDict = {
        bodyX: 0,
        bodyY: 0,
        bodyZ: 0
    };

    setupControls(camera);
    canvas.addEventListener('click', (e) => {
        if (e.shiftKey) {
            g_animate_alt = true;
            g_alt_anim_time = 0;
        }
    });

    // Render
    tick(gl, uniforms, bodyParts, rotDict, bodyTransDict);
}

function tick(gl, uniforms, bodyParts, rotDict, bodyTransDict) {
    if (g_animate_default || g_animate_alt) {
        if (g_sliders_enabled) {
            resetSliders();
            getSliders(rotDict);
            disableSliders();
        }
        g_sliders_enabled = false;
        updateAnimationAngles(rotDict, bodyTransDict);
    }
    else {
        g_sliders_enabled = true;
        enableSliders();
        getSliders(rotDict);
    }

    renderScene(gl, uniforms, bodyParts, rotDict, bodyTransDict);

    updateFPS();

    requestAnimationFrame(() => tick(gl, uniforms, bodyParts, rotDict, bodyTransDict));
}

function renderScene(gl, uniforms, bodyParts, rotDict, bodyTransDict) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    g_AnimalGlobalRotation = document.getElementById("globalRot").value;

    document.getElementById('resetBtn').addEventListener('click', () => {
        resetSliders();
    });

    const global = new Matrix4();
    global.rotate(g_AnimalGlobalRotation, 0, 1, 0);

    gl.uniformMatrix4fv(uniforms.u_GlobalRotation, false, global.elements);

    transformBodyParts(bodyParts, rotDict, bodyTransDict);

    bodyParts.ground.updateTransforms(g_identity);
    bodyParts.ground.draw(gl, uniforms.u_ModelMatrix, uniforms.u_Color);

    if (!g_render) return;
    bodyParts.bodyMain.updateTransforms(g_identity);
    bodyParts.bodyMain.draw(gl, uniforms.u_ModelMatrix, uniforms.u_Color);
}

function updateAnimationAngles(rotDict, bodyTransDict) {
    g_time = performance.now() * 0.001;
    if (g_animate_default) {
        rotDict.bodyFrontYaw = Math.sin(g_time * 4.0) * 2;
        rotDict.bodyBackYaw = Math.sin(g_time * 4.0) * 4;
        rotDict.tail1Yaw = Math.sin(g_time * 4.0) * 4;
        rotDict.tail2Yaw = Math.sin(g_time * 4.0) * 4;
        rotDict.legBackLeftPitch = Math.sin(g_time * 4.0) * 12;
        rotDict.legBackRightPitch = Math.sin(g_time * 4.0) * -12;
        rotDict.legFrontRightPitch = Math.sin(g_time * 4.0) * 12;
        rotDict.legFrontLeftPitch = Math.sin(g_time * 4.0) * -12;
        rotDict.headPitch = Math.sin(g_time * 4.0) * 2;
    }
    else if (g_animate_alt) {
        g_alt_anim_time += 0.016;
        if (g_alt_anim_time < 0.8) {
            bodyTransDict.bodyX -= 0.008;
            rotDict.legBackLeftPitch = Math.sin(g_alt_anim_time * 4.0) * 15;
            rotDict.legBackRightPitch = Math.sin(g_alt_anim_time * 4.0) * 15;
            rotDict.legFrontRightPitch = Math.sin(g_alt_anim_time * 4.0) * 15;
            rotDict.legFrontLeftPitch = Math.sin(g_alt_anim_time * 4.0) * 15;
            rotDict.jawPitch = Math.sin(g_alt_anim_time * 4.0) * 13;
            rotDict.snoutPitch = Math.sin(g_alt_anim_time * 4.0) * -13;
            rotDict.neckRot = Math.sin(g_alt_anim_time * 4.0) * -10;
        }
        else if (g_alt_anim_time < 3.15) {
            rotDict.neckYaw = Math.sin(g_alt_anim_time * 4.0) * 15;
            rotDict.headYaw = Math.sin(g_alt_anim_time * 4.0) * 15;
            rotDict.tail1Yaw = Math.sin(g_alt_anim_time * 4.0) * 4;
            rotDict.tail2Yaw = Math.sin(g_alt_anim_time * 4.0) * 4;
            rotDict.bodyFrontYaw = Math.sin(g_alt_anim_time * 4.0) * 5;
            rotDict.bodyBackYaw = Math.sin(g_alt_anim_time * 4.0) * 4;
        }
        else if (g_alt_anim_time < 3.95) {
            bodyTransDict.bodyX += 0.008;
            rotDict.legBackLeftPitch = Math.sin(g_alt_anim_time * 4.0) * -15;
            rotDict.legBackRightPitch = Math.sin(g_alt_anim_time * 4.0) * -15;
            rotDict.legFrontRightPitch = Math.sin(g_alt_anim_time * 4.0) * -15;
            rotDict.legFrontLeftPitch = Math.sin(g_alt_anim_time * 4.0) * -15;
        }
        else if (g_alt_anim_time > 4) {
            g_animate_alt = false;
        }
    }
}

function updateFPS() {
    g_frameCount++;
    const now = performance.now();
    if (now >= g_lastTime + 1000) {
        const fps = Math.round((g_frameCount * 1000) / (now - g_lastTime));
        document.getElementById('fps').textContent = fps;
        g_frameCount = 0;
        g_lastTime = now;
    }
}

function createBodyParts(cubeMesh) {
    return {
        ground: new Node(cubeMesh, [0.5, 0.5, 0.5, 1]),
        bodyMain: new Node(cubeMesh, [0.2, 0.3, 0.2, 1]),
        bodyFront: new Node(cubeMesh, [0.2, 0.4, 0.2, 1]),
        bodyBack: new Node(cubeMesh, [0.2, 0.4, 0.2, 1]),
        neck: new Node(cubeMesh, [0.2, 0.3, 0.2, 1]),
        head: new Node(cubeMesh, [0.2, 0.4, 0.2, 1]),
        eyeLeft: new Node(cubeMesh, [1, 1, 1, 1]),
        eyeRight: new Node(cubeMesh, [1, 1, 1, 1]),
        eyeLeftPupil: new Node(cubeMesh, [0, 0, 0, 1]),
        eyeRightPupil: new Node(cubeMesh, [0, 0, 0, 1]),
        snout: new Node(cubeMesh, [0.2, 0.3, 0.2, 1]),
        jaw: new Node(cubeMesh, [0.2, 0.4, 0.2, 1]),
        nose: new Node(cubeMesh, [0.2, 0.28, 0.2, 1]),
        tail1: new Node(cubeMesh, [0.2, 0.3, 0.2, 1]),
        tail2: new Node(cubeMesh, [0.2, 0.4, 0.2, 1]),
        legBackLeft: new Node(cubeMesh, [0.2, 0.3, 0.2, 1]),
        legBackRight: new Node(cubeMesh, [0.2, 0.3, 0.2, 1]),
        legFrontRight: new Node(cubeMesh, [0.2, 0.3, 0.2, 1]),
        legFrontLeft: new Node(cubeMesh, [0.2, 0.3, 0.2, 1])
    };
}

function createHierarchy(bodyParts) {
    bodyParts.bodyMain.addChild(bodyParts.bodyFront);
    bodyParts.bodyMain.addChild(bodyParts.bodyBack);

    bodyParts.bodyFront.addChild(bodyParts.neck);
    bodyParts.bodyFront.addChild(bodyParts.legFrontLeft);
    bodyParts.bodyFront.addChild(bodyParts.legFrontRight);

    bodyParts.neck.addChild(bodyParts.head);

    bodyParts.head.addChild(bodyParts.eyeLeft);
    bodyParts.head.addChild(bodyParts.eyeRight);
    bodyParts.head.addChild(bodyParts.snout);
    bodyParts.head.addChild(bodyParts.jaw);

    bodyParts.eyeLeft.addChild(bodyParts.eyeLeftPupil);
    bodyParts.eyeRight.addChild(bodyParts.eyeRightPupil);

    bodyParts.snout.addChild(bodyParts.nose);

    bodyParts.bodyBack.addChild(bodyParts.legBackLeft);
    bodyParts.bodyBack.addChild(bodyParts.legBackRight);
    bodyParts.bodyBack.addChild(bodyParts.tail1);

    bodyParts.tail1.addChild(bodyParts.tail2);
}

function transformBodyParts(bodyParts, rotDict, bodyTransDict) {
    bodyParts.ground.setIdentity();
    bodyParts.bodyMain.setIdentity();
    bodyParts.bodyFront.setIdentity();
    bodyParts.bodyBack.setIdentity();
    bodyParts.neck.setIdentity();
    bodyParts.head.setIdentity();
    bodyParts.eyeLeft.setIdentity();
    bodyParts.eyeRight.setIdentity();
    bodyParts.eyeLeftPupil.setIdentity();
    bodyParts.eyeRightPupil.setIdentity();
    bodyParts.snout.setIdentity();
    bodyParts.nose.setIdentity();
    bodyParts.jaw.setIdentity();
    bodyParts.legFrontLeft.setIdentity();
    bodyParts.legFrontRight.setIdentity();
    bodyParts.legBackLeft.setIdentity();
    bodyParts.legBackRight.setIdentity();
    bodyParts.tail1.setIdentity();
    bodyParts.tail2.setIdentity();

    bodyParts.ground.scale(200, 1,200);
    bodyParts.bodyMain.scale(0.65, 0.5 ,0.85);
    bodyParts.bodyFront.scale(0.85, 0.5, 1);
    bodyParts.bodyBack.scale(0.7, 0.5, 1);
    bodyParts.neck.scale(0.32, 0.4, 0.65);
    bodyParts.head.scale(0.45, 0.35, 0.5);
    bodyParts.eyeLeft.scale(0.1, 0.1, 0.1);
    bodyParts.eyeRight.scale(0.1, 0.1, 0.1);
    bodyParts.eyeLeftPupil.scale(0.05, 0.05, 0.05);
    bodyParts.eyeRightPupil.scale(0.05, 0.05, 0.05);
    bodyParts.snout.scale(0.35, 0.12, 0.4);
    bodyParts.nose.scale(0.1, 0.15, 0.45);
    bodyParts.jaw.scale(0.37, 0.12, 0.42);
    bodyParts.legFrontLeft.scale(0.3, 0.35, 0.2);
    bodyParts.legFrontRight.scale(0.3, 0.35, 0.2);
    bodyParts.legBackLeft.scale(0.38, 0.35, 0.2);
    bodyParts.legBackRight.scale(0.38, 0.35, 0.2);
    bodyParts.tail1.scale(0.8, 0.4, 0.8);
    bodyParts.tail2.scale(0.95, 0.3, 0.45);

    bodyParts.bodyFront.rotate(rotDict.bodyFrontYaw, 0, 1, 0);
    bodyParts.bodyBack.rotate(rotDict.bodyBackYaw, 0, 1, 0);
    bodyParts.head.rotate(rotDict.headPitch, 0, 0, 1);
    bodyParts.head.rotate(rotDict.headYaw, 0, 1, 0);
    bodyParts.neck.rotate(rotDict.neckPitch, 0, 0, 1);
    bodyParts.neck.rotate(rotDict.neckYaw, 0, 1, 0);
    bodyParts.neck.rotate(rotDict.neckRot, 1, 0, 0);
    bodyParts.snout.rotate(rotDict.snoutPitch, 0, 0, 1);
    bodyParts.jaw.rotate(rotDict.jawPitch, 0, 0, 1);
    bodyParts.tail1.rotate(rotDict.tail1Yaw, 0, 1, 0);
    bodyParts.tail2.rotate(rotDict.tail2Yaw, 0, 1, 0);
    bodyParts.legBackLeft.rotate(rotDict.legBackLeftPitch, 0, 0, 1);
    bodyParts.legBackRight.rotate(rotDict.legBackRightPitch, 0, 0, 1);
    bodyParts.legFrontLeft.rotate(rotDict.legFrontLeftPitch, 0, 0, 1);
    bodyParts.legFrontRight.rotate(rotDict.legFrontRightPitch, 0, 0, 1);

    bodyParts.ground.translate(0, -0.755, 0);
    bodyParts.bodyMain.translate(bodyTransDict.bodyX, bodyTransDict.bodyY, bodyTransDict.bodyZ);
    bodyParts.bodyFront.translate(-0.55, 0.05, 0);
    bodyParts.bodyBack.translate(0.55, 0.05, 0);
    bodyParts.neck.translate(-0.55, -0.045, 0);
    bodyParts.head.translate(-0.35, -0.02, 0);
    bodyParts.eyeLeft.translate(0, 0.1, 0.22);
    bodyParts.eyeRight.translate(0, 0.1, -0.22);
    bodyParts.eyeLeftPupil.translate(0, 0, 0.035);
    bodyParts.eyeRightPupil.translate(0, 0, -0.035);
    bodyParts.snout.translate(-0.38, 0.03, 0);
    bodyParts.nose.translate(-0.15, 0, 0);
    bodyParts.jaw.translate(-0.38, -0.08, 0);
    bodyParts.legFrontLeft.translate(-0.2, -0.13, 0.6);
    bodyParts.legFrontRight.translate(-0.2, -0.13, -0.6);
    bodyParts.legBackLeft.translate(0, -0.13, 0.6);
    bodyParts.legBackRight.translate(0, -0.13, -0.6);
    bodyParts.tail1.translate(0.7, -0.06, 0);
    bodyParts.tail2.translate(0.85, -0.04, 0);
}

function getSliders(rotDict) {
    rotDict.bodyFrontYaw = Number(document.getElementById("bodyFrontYaw").value);
    rotDict.bodyBackYaw = Number(document.getElementById("bodyBackYaw").value);
    rotDict.headPitch = Number(document.getElementById("headPitch").value);
    rotDict.headYaw = Number(document.getElementById("headYaw").value);
    rotDict.neckPitch = Number(document.getElementById("neckPitch").value);
    rotDict.neckYaw = Number(document.getElementById("neckYaw").value);
    rotDict.neckRot = Number(document.getElementById("neckRot").value);
    rotDict.snoutPitch = Number(document.getElementById("snoutPitch").value);
    rotDict.jawPitch = Number(document.getElementById("jawPitch").value);
    rotDict.tail1Yaw = Number(document.getElementById("tail1Yaw").value);
    rotDict.tail2Yaw = Number(document.getElementById("tail2Yaw").value);
    rotDict.legBackLeftPitch = Number(document.getElementById("legBackLeftPitch").value);
    rotDict.legBackRightPitch = Number(document.getElementById("legBackRightPitch").value);
    rotDict.legFrontLeftPitch = Number(document.getElementById("legFrontLeftPitch").value);
    rotDict.legFrontRightPitch = Number(document.getElementById("legFrontRightPitch").value);
}

function disableSliders() {
    document.getElementById("bodyFrontYaw").disabled = true;
    document.getElementById("bodyBackYaw").disabled = true;
    document.getElementById("headPitch").disabled = true;
    document.getElementById("headYaw").disabled = true;
    document.getElementById("neckPitch").disabled = true;
    document.getElementById("neckYaw").disabled = true;
    document.getElementById("neckRot").disabled = true;
    document.getElementById("snoutPitch").disabled = true;
    document.getElementById("jawPitch").disabled = true;
    document.getElementById("tail1Yaw").disabled = true;
    document.getElementById("tail2Yaw").disabled = true;
    document.getElementById("legBackLeftPitch").disabled = true;
    document.getElementById("legBackRightPitch").disabled = true;
    document.getElementById("legFrontLeftPitch").disabled = true;
    document.getElementById("legFrontRightPitch").disabled = true;
}

function enableSliders() {
    document.getElementById("bodyFrontYaw").disabled = false;
    document.getElementById("bodyBackYaw").disabled = false;
    document.getElementById("headPitch").disabled = false;
    document.getElementById("headYaw").disabled = false;
    document.getElementById("neckPitch").disabled = false;
    document.getElementById("neckYaw").disabled = false;
    document.getElementById("neckRot").disabled = false;
    document.getElementById("snoutPitch").disabled = false;
    document.getElementById("jawPitch").disabled = false;
    document.getElementById("tail1Yaw").disabled = false;
    document.getElementById("tail2Yaw").disabled = false;
    document.getElementById("legBackLeftPitch").disabled = false;
    document.getElementById("legBackRightPitch").disabled = false;
    document.getElementById("legFrontLeftPitch").disabled = false;
    document.getElementById("legFrontRightPitch").disabled = false;
}

function resetSliders() {
    document.getElementById("bodyFrontYaw").value = 0;
    document.getElementById("bodyBackYaw").value = 0;
    document.getElementById("headPitch").value = 0;
    document.getElementById("headYaw").value = 0;
    document.getElementById("neckPitch").value = 0;
    document.getElementById("neckYaw").value = 0;
    document.getElementById("neckRot").value = 0;
    document.getElementById("snoutPitch").value = 0;
    document.getElementById("jawPitch").value = 0;
    document.getElementById("tail1Yaw").value = 0;
    document.getElementById("tail2Yaw").value = 0;
    document.getElementById("legBackLeftPitch").value = 0;
    document.getElementById("legBackRightPitch").value = 0;
    document.getElementById("legFrontLeftPitch").value = 0;
    document.getElementById("legFrontRightPitch").value = 0;
}

function setupRotDict() {
    return {
        bodyFrontYaw: 0,
        bodyBackYaw: 0,
        headPitch: 0,
        headYaw: 0,
        neckPitch: 0,
        neckYaw: 0,
        neckRot: 0,
        snoutPitch: 0,
        jawPitch: 0,
        tail1Yaw: 0,
        tail2Yaw: 0,
        legBackLeftPitch: 0,
        legBackRightPitch: 0,
        legFrontLeftPitch: 0,
        legFrontRightPitch: 0
    }
}

function initWebGL(canvasId) {
    // Set up canvas and WebGL context
    const canvas = document.getElementById(canvasId);
    if (!canvas) throw new Error("Can't get canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) throw new Error("Can't get webgl");

    // Set up shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) throw new Error("Failed to initialize shaders");

    return {canvas, gl};
}

function setupAttribute(gl, program, buffer, name, size) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    const location = gl.getAttribLocation(program, name);
    if (location < 0) {
        console.error(`Attribute not found: ${name}`);
        return;
    }

    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
}

function setupControls(camera) {
    document.getElementById("hud").innerText =
        "1: Render\n" +
        "2: Stop render\n" +
        "3: Animate\n" +
        "4: Stop animate\n" +
        "5: Reset Camera\n";

    window.addEventListener("keydown", (e) => {
        switch (e.key) {
            case "1":
                g_render = true;
                break;
            case "2":
                g_render = false;
                break;
            case "3":
                g_animate_default = true;
                break;
            case "4":
                g_animate_default = false;
                break;
            case "5":
                camera.reset();
        }
    });

    document.getElementById("tooltips").innerText =
        "Left click: Rotate\n" +
        "Right click: Pan\n" +
        "Scroll: Zoom\n" +
        "Shift + Left Click: Alt anim";
}

main();