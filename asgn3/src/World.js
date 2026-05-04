let VSHADER_SOURCE = `
attribute vec3 a_Position;
attribute vec2 a_TexCoord;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;

varying vec2 v_TexCoord;

void main() {
    vec4 worldPos = u_ModelMatrix * vec4(a_Position, 1.0);
    
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
    [4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,4,4,4,4,0,0,4,0,0,4,0,0,4],
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

    const vaoExt = gl.getExtension("OES_vertex_array_object");
    if (!vaoExt) throw new Error("VAOs not supported");

    gl.clearColor(0.5, 0.5, 0.7, 1);
    gl.enable(gl.DEPTH_TEST);

    // Get attribs/unis
    const attribs = getAttributes(gl);
    const unis = getUniforms(gl);

    // Create one cube mesh with its own buffer
    const cubeMesh = createCubeMesh(gl, attribs, vaoExt);

    // Do not blend textures/base colors
    gl.uniform1f(unis.u_T, 1.0);

    // Init camera object
    const camera = new Camera(gl, canvas, unis.u_ViewMatrix, unis.u_ProjectionMatrix);

    const entities = [];

    const textureNames = [
        "stone",
        "grass",
        "cobble",
        "signWelcome",
        "signWrongTurn1",
        "signWrongTurn2",
        "signBye"
    ];

    for (const name of textureNames) {
        TextureManager.load(gl, name, `../resources/${name}.png`);
    }

    const specialBlocks = new Map([
        ["16,31,2", "signWelcome"],
        ["30,31,2", "signWrongTurn1"],
        ["12,0,2", "signWrongTurn2"],
        ["0,7,2", "signBye"]
    ]);

    createWorldObjects(entities, cubeMesh, specialBlocks);

    const ctx = {
        gl,
        attribs,
        unis,
        camera,
        entities,
        vaoExt
    };

    startRenderLoop(ctx);
}

function startRenderLoop(ctx) {
    function render() {
        const {gl, unis, camera, entities, vaoExt} = ctx;

        if (!TextureManager.texturesReady()) {
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
                unis.u_UseTexture,
                vaoExt
            );
        }

        updateFPS();

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

function createWorldObjects(entities, cubeMesh, specialBlocks) {
    for (let x = 0; x < g_worldMatrix.length; x++) {
        for (let z = 0; z < g_worldMatrix[x].length; z++) {

            const height = g_worldMatrix[x][z];

            for (let y = 0; y <= height; y++) {
                let texKey = getKey(x, z, y);
                let tex = null;

                if (y === 0) {
                    tex = "grass";
                }
                else if (specialBlocks.has(texKey)) {
                    tex = specialBlocks.get(texKey);
                }
                else {
                    tex = (Math.random() < 0.5) ? "stone" : "cobble";
                }

                const e = new Entity (
                  cubeMesh,
                    [0.5, 0.5, 0.5, 1],
                    tex,
                    !!tex
                );
                e.setIdentity();
                e.setPosition(x, y, z);
                entities.push(e);
            }
        }
    }

    let sky = new Entity(cubeMesh, [0.4, 0.4, 1, 1], null, false);
    sky.setIdentity();
    sky.setPosition(0, 0, 0);
    sky.setScale(100, 100, 100);

    entities.push(sky);
}

function getKey(x, z, y) {
    return `${x},${z},${y}`;
}

function isSolid(x, z) {
    // Get block that camera is above
    const centerX = Math.floor(x + 0.5);
    const centerZ = Math.floor(z + 0.5);

    // Check if camera is out of bounds (since otherwise it would crash checking out of bounds in world matrix)
    if (
        centerX < 0 || centerX >= g_worldMatrix.length ||
        centerZ < 0 || centerZ >= g_worldMatrix[0].length
    ) return false;

    // Return bool of world matrix height
    return g_worldMatrix[centerX][centerZ] !== 0;
}

function updateFPS() {
    // Inc frame count every frame
    g_frameCount++;
    // Log now
    const now = performance.now();
    // Check fps every second
    if (now >= g_lastTime + 1000) {
        // Calc fps
        const fps = Math.round((g_frameCount * 1000) / (now - g_lastTime));
        document.getElementById('fps').textContent = fps;
        // Reset counters
        g_frameCount = 0;
        g_lastTime = now;
    }
}

function getAttributes(gl) {
    return {
        // vShader attrib
        a_Position : gl.getAttribLocation(gl.program, "a_Position"),

        // fShader attrib
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