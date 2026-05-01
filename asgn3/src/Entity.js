class Entity {
    constructor(mesh = null, color = [1, 1, 1, 1], texName = null, useTex = false) {
        this.mesh = mesh;
        this.color = color;

        this.texName = texName;
        this.useTex = useTex;

        this.modelMatrix = new Matrix4();
    }

    setIdentity() {
        this.modelMatrix.setIdentity();
    }

    setPosition(x, y, z) {
        this.modelMatrix.translate(x, y, z);
    }

    setScale(x, y, z) {
        this.modelMatrix.scale(x, y, z);
    }

    draw(gl, u_ModelMatrix, u_Color, u_Sampler, u_UseTexture) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.buffer);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.modelMatrix.elements);
        gl.uniform4fv(u_Color, this.color);

        gl.uniform1i(u_UseTexture, this.useTex ? 1 : 0);

        if (this.useTex && this.texName) {
            const tex = TextureManager.get(this.texName);

            if (tex) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.uniform1i(u_Sampler, 0);
            }
        }

        gl.drawArrays(gl.TRIANGLES, 0, this.mesh.vertexCount);
    }
}