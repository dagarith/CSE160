let cubeMesh = null;

function drawCube(gl) {
    const vertices = new Float32Array([
        // FRONT face
        -0.5, -0.5,  0.5,
        0.5, -0.5,  0.5,
        0.5,  0.5,  0.5,

        -0.5, -0.5,  0.5,
        0.5,  0.5,  0.5,
        -0.5,  0.5,  0.5,

        // BACK face
        0.5, -0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5,  0.5, -0.5,

        0.5, -0.5, -0.5,
        -0.5,  0.5, -0.5,
        0.5,  0.5, -0.5,

        // LEFT face
        -0.5, -0.5, -0.5,
        -0.5, -0.5,  0.5,
        -0.5,  0.5,  0.5,

        -0.5, -0.5, -0.5,
        -0.5,  0.5,  0.5,
        -0.5,  0.5, -0.5,

        // RIGHT face
        0.5, -0.5,  0.5,
        0.5, -0.5, -0.5,
        0.5,  0.5, -0.5,

        0.5, -0.5,  0.5,
        0.5,  0.5, -0.5,
        0.5,  0.5,  0.5,

        // TOP face
        -0.5,  0.5,  0.5,
        0.5,  0.5,  0.5,
        0.5,  0.5, -0.5,

        -0.5,  0.5,  0.5,
        0.5,  0.5, -0.5,
        -0.5,  0.5, -0.5,

        // BOTTOM face
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5,  0.5,

        -0.5, -0.5, -0.5,
        0.5, -0.5,  0.5,
        -0.5, -0.5,  0.5
    ]);

    const normals = new Float32Array([
        // FRONT
        0,0,1, 0,0,1, 0,0,1,
        0,0,1, 0,0,1, 0,0,1,

        // BACK
        0,0,-1, 0,0,-1, 0,0,-1,
        0,0,-1, 0,0,-1, 0,0,-1,

        // LEFT
        -1,0,0, -1,0,0, -1,0,0,
        -1,0,0, -1,0,0, -1,0,0,

        // RIGHT
        1,0,0, 1,0,0, 1,0,0,
        1,0,0, 1,0,0, 1,0,0,

        // TOP
        0,1,0, 0,1,0, 0,1,0,
        0,1,0, 0,1,0, 0,1,0,

        // BOTTOM
        0,-1,0, 0,-1,0, 0,-1,0,
        0,-1,0, 0,-1,0, 0,-1,0,
    ]);

    const mesh = {
        vertices,
        normals,
        vertexCount: 36,
        buffer: gl.createBuffer(),
        normalBuffer: gl.createBuffer()
    };

    // positions
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // normals
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    return mesh;
}

