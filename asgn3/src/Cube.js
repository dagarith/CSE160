function createCubeMesh(gl, attribs, vaoExt) {
    // Coords/uv
    const values = new Float32Array([
        // Front face
        -0.5,-0.5,0.5,  0,0,
        0.5,-0.5,0.5,   1,0,
        0.5,0.5,0.5,    1,1,

        -0.5,-0.5,0.5,  0,0,
        0.5,0.5,0.5,    1,1,
        -0.5,0.5,0.5,   0,1,

        // Back face
        0.5,-0.5,-0.5,  1,0,
        -0.5,-0.5,-0.5, 0,0,
        -0.5,0.5,-0.5,  0,1,

        0.5,-0.5,-0.5,  1,0,
        -0.5,0.5,-0.5,  0,1,
        0.5,0.5,-0.5,   1,1,

        // Left face
        -0.5,-0.5,-0.5, 0,0,
        -0.5,-0.5,0.5,  1,0,
        -0.5,0.5,0.5,   1,1,

        -0.5,-0.5,-0.5, 0,0,
        -0.5,0.5,0.5,   1,1,
        -0.5,0.5,-0.5,  0,1,

        // Right face
        0.5,-0.5,0.5,   0,0,
        0.5,-0.5,-0.5,  1,0,
        0.5,0.5,-0.5,   1,1,

        0.5,-0.5,0.5,   0,0,
        0.5,0.5,-0.5,   1,1,
        0.5,0.5,0.5,    0,1,

        // Top face
        -0.5,0.5,0.5,   0,0,
        0.5,0.5,0.5,    1,0,
        0.5,0.5,-0.5,   1,1,

        -0.5,0.5,0.5,   0,0,
        0.5,0.5,-0.5,   1,1,
        -0.5,0.5,-0.5,  0,1,

        // Bottom face
        -0.5,-0.5,-0.5, 0,0,
        0.5,-0.5,-0.5,  1,0,
        0.5,-0.5,0.5,   1,1,

        -0.5,-0.5,-0.5, 0,0,
        0.5,-0.5,0.5,   1,1,
        -0.5,-0.5,0.5,  0,1
    ]);

    const mesh = {
        values,
        vertexCount: 36,
        buffer: gl.createBuffer(),
        vao: vaoExt.createVertexArrayOES()
    };

    // Bind vao (wish I knew about these earlier)
    vaoExt.bindVertexArrayOES(mesh.vao);

    // Bind buffer, set buffer data
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);

    // Set vertex attribs
    const FSIZE = 4;
    const stride = 5 * FSIZE;

    gl.enableVertexAttribArray(attribs.a_Position);
    gl.vertexAttribPointer(attribs.a_Position, 3, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(attribs.a_TexCoord);
    gl.vertexAttribPointer(attribs.a_TexCoord, 2, gl.FLOAT, false, stride, 3 * FSIZE);

    // Unbind vao
    vaoExt.bindVertexArrayOES(null);

    return mesh;
}

