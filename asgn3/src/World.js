let VSHADER_SOURCE = `
attribute vec3 a_Position;
attribute vec3 a_Normal;
attribute vec2 a_TexCoord;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

varying vec2 v_TexCoord;

void main() {
    vec4 worldPos = u_ModelMatrix * vec4(a_Position, 1.0);
    
    vec3 normal = normalize(mat3(u_ModelMatrix) * a_Normal);
    
    v_TexCoord = a_TexCoord;

    gl_Position =
        u_ProjectionMatrix *
        u_ViewMatrix *
        worldPos;
}
`;

let FSHADER_SOURCE = `
precision mediump float;

uniform vec4 u_Color; // Base color
uniform sampler2D u_Sampler; // Texture
uniform float u_T; // Blend
uniform int u_UseTexture; // Use texture bool

varying vec2 v_TexCoord;

void main () {
    if (u_UseTexture == 1) {
        vec4 texColor = texture2D(u_Sampler, v_TexCoord);
        vec3 blended = mix(u_Color.rgb, texColor.rgb, u_T);
        gl_FragColor = vec4(blended, texColor.a * u_Color.a);
    } else {
        gl_FragColor = vec4(u_Color.rgb, u_Color.a);
    }
}
`;

let g_frameCount = 0;
let g_lastTime = performance.now();

const g_worldMatrix = [
    [4,4,4,4,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4],
    [4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,0,0,0,0,0,4,0,0,0,0,0,4],
    [4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,4],
    [4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,4,0,0,4,0,0,4],
    [4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,4,0,0,4,0,0,4],
    [4,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,4,0,0,4],
    [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,4,0,0,4],
    [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,4],
    [4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
    [4,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
    [4,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,4,0,0,4,4,4,4,4,4,4,4,4,4,0,0,4],
    [4,0,0,4,4,4,4,4,0,0,4,0,0,4,0,0,4,0,0,4,0,0,0,0,0,4,0,0,0,0,0,4],
    [4,0,0,4,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,4],
    [4,0,0,4,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,4,4,4,4,0,0,4,0,0,0,0,0,4],
    [4,4,4,4,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,4,0,0,4,4,4,4,4,4,4],
    [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,4,0,0,4,0,0,0,0,0,4],
    [4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,4,0,0,0,0,0,4],
    [4,0,0,4,4,4,4,4,4,4,4,0,0,4,0,0,0,0,0,0,0,0,4,0,0,4,0,0,0,0,0,4],
    [4,0,0,4,0,0,0,0,0,0,0,0,0,4,0,0,4,4,4,4,4,4,4,0,0,4,4,4,4,0,0,4],
    [4,0,0,4,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
    [4,0,0,4,0,0,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
    [4,0,0,4,0,0,0,0,0,4,4,4,4,4,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,4],
    [4,0,0,4,0,0,0,0,0,4,4,4,4,4,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,0,0,4],
    [4,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
    [4,0,0,4,0,0,4,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,4],
    [4,0,0,4,0,0,4,4,4,4,4,4,0,0,4,4,4,4,0,0,4,4,4,4,4,0,0,4,4,4,4,4],
    [4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,4],
    [4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,4],
    [4,0,0,4,4,4,4,4,4,4,4,4,0,0,4,4,4,4,0,0,4,0,0,4,4,4,4,4,4,4,4,4],
    [4,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,4],
    [4,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,4],
    [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]
];

function main() {
    const {canvas, gl} = initWebGL("canvas");

    gl.clearColor(0.5, 0.5, 0.7, 1);
    gl.enable(gl.DEPTH_TEST);

    const cubeMesh = createCubeMesh(gl);

    const attribs = getAttributes(gl);
    const unis = getUniforms(gl);

    setupAttributes(gl, cubeMesh.buffer, attribs);

    gl.uniform1f(unis.u_T, 1.0);

    const camera = new Camera(gl, canvas, unis.u_ViewMatrix, unis.u_ProjectionMatrix);

    const entities = [];

    TextureManager.load(gl, "stone", "../resources/stone.png");
    TextureManager.load(gl, "grass", "../resources/grass.png");
    TextureManager.load(gl, "cobble", "../resources/cobble.png");
    TextureManager.load(gl, "signWelcome", "../resources/signWelcome.png");
    TextureManager.load(gl, "signWrongTurn1", "../resources/signWrongTurn1.png");
    TextureManager.load(gl, "signWrongTurn2", "../resources/signWrongTurn2.png");
    TextureManager.load(gl, "signBye", "../resources/signBye.png");

    createWorldObjects(entities, cubeMesh);

    const ctx = {
        gl,
        attribs,
        unis,
        camera,
        entities
    };

    startRenderLoop(ctx);
}

function startRenderLoop(ctx) {
    function render() {
        const {gl, attribs, unis, camera, entities} = ctx;

        if (!texturesReady()) {
            requestAnimationFrame(render);
            return;
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        camera.update();

        for (const e of entities) {
            e.draw(
                gl,
                unis.u_ModelMatrix,
                unis.u_Color,
                unis.u_Sampler,
                unis.u_UseTexture
            );
        }

        updateFPS();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

function texturesReady() {
    return TextureManager.get("stone") &&
        TextureManager.get("grass") &&
        TextureManager.get("cobble") &&
        TextureManager.get("signWelcome") &&
        TextureManager.get("signWrongTurn1") &&
        TextureManager.get("signWrongTurn2") &&
        TextureManager.get("signBye");
}

function createWorldObjects(entities, cubeMesh) {
    for (let x = 0; x < g_worldMatrix.length; x++) {
        for (let z = 0; z < g_worldMatrix[x].length; z++) {

            const height = g_worldMatrix[x][z];

            for (let y = 0; y <= height; y++) {
                let e;
                if (y === 0) {
                    e = new Entity(cubeMesh, [0.5, 0.5, 0.5, 1], "grass", true);
                }
                else if (x === 16 && z === 31 && y === 2) {
                    e = new Entity(cubeMesh, [0.5, 0.5, 0.5, 1], "signWelcome", true);
                }
                else if (x === 30 && z === 31 && y === 2) {
                    e = new Entity(cubeMesh, [0.5, 0.5, 0.5, 1], "signWrongTurn1", true);
                }
                else if (x === 12 && z === 0 && y === 2) {
                    e = new Entity(cubeMesh, [0.5, 0.5, 0.5, 1], "signWrongTurn2", true);
                }
                else if (x === 0 && z === 7 && y === 2) {
                    e = new Entity(cubeMesh, [0.5, 0.5, 0.5, 1], "signBye", true);
                }
                else if (Math.random() < 0.5) {
                    e = new Entity(cubeMesh, [0.5, 0.5, 0.5, 1], "stone", true);
                }
                else {
                    e = new Entity(cubeMesh, [0.5, 0.5, 0.5, 1], "cobble", true);
                }
                e.setIdentity();
                e.setPosition(x - 16, y, z - 16);
                entities.push(e);
            }
        }
    }

    let sky = new Entity(cubeMesh, [0.2, 0.2, 0.8, 1], null, false);
    sky.setIdentity();
    sky.setScale(40, 40, 40);
    sky.setPosition(-0.0125, 0, -0.0125);
    entities.push(sky);
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

function setupAttributes(gl, buffer, attribs) {
    const FSIZE = 4;
    const stride = 8 * FSIZE;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enableVertexAttribArray(attribs.a_Position);
    gl.vertexAttribPointer(attribs.a_Position, 3, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(attribs.a_Normal);
    gl.vertexAttribPointer(attribs.a_Normal, 3, gl.FLOAT, false, stride, 3 * FSIZE);

    gl.enableVertexAttribArray(attribs.a_TexCoord);
    gl.vertexAttribPointer(attribs.a_TexCoord, 2, gl.FLOAT, false, stride, 6 * FSIZE);
}

function getAttributes(gl) {
    return {
        // vShader attribs
        a_Position : gl.getAttribLocation(gl.program, "a_Position"),
        a_Normal : gl.getAttribLocation(gl.program, "a_Normal"),

        // fShader attribs
        a_TexCoord : gl.getAttribLocation(gl.program, "a_TexCoord")
    };
}

function getUniforms(gl) {
    return {
        // vShader unis
        u_ModelMatrix : gl.getUniformLocation(gl.program, "u_ModelMatrix"),
        u_ViewMatrix : gl.getUniformLocation(gl.program, "u_ViewMatrix"),
        u_ProjectionMatrix : gl.getUniformLocation(gl.program, "u_ProjectionMatrix"),

        // fShader unis
        u_Color : gl.getUniformLocation(gl.program, "u_Color"),
        u_T : gl.getUniformLocation(gl.program, "u_T"),
        u_Sampler : gl.getUniformLocation(gl.program, "u_Sampler"),
        u_UseTexture : gl.getUniformLocation(gl.program, "u_UseTexture"),
    };
}

function initWebGL(canvasId) {
    // Set up canvas and WebGL context
    const canvas = document.getElementById(canvasId);
    const gl = canvas.getContext("webgl");
    if (!gl) throw new Error("WebGL failed");

    // Set up shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) throw new Error("Failed to initialize shaders");

    return {canvas, gl};
}

main();