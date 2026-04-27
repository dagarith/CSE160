class Node {
    constructor(mesh = null, color = [1, 1, 1, 1]) {
        // Geometry
        this.mesh = mesh;
        this.color = color;

        // Transforms
        this.localMatrix = new Matrix4();
        this.globalMatrix = new Matrix4();
        this.scaleVec = [1, 1, 1];

        // Hierarchy
        this.children = [];
    }

    addChild(child) {
        this.children.push(child);
    }

    updateTransforms(parentMatrix) {
        // Build transform without scale for children
        const transformForChildren = new Matrix4();
        transformForChildren.set(parentMatrix);
        transformForChildren.multiply(this.localMatrix);

        // Store the full transform with scale for drawing this node
        this.globalMatrix.set(transformForChildren);
        this.globalMatrix.scale(this.scaleVec[0], this.scaleVec[1], this.scaleVec[2]);

        // IMPORTANT: Pass transform WITHOUT scale to children
        for (let child of this.children) {
            child.updateTransforms(transformForChildren);
        }
    }

    draw(gl, u_ModelMatrix, u_Color) {
        if (this.mesh) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.buffer);
            gl.uniformMatrix4fv(u_ModelMatrix, false, this.globalMatrix.elements);
            gl.uniform4fv(u_Color, this.color);
            gl.drawArrays(gl.TRIANGLES, 0, this.mesh.vertexCount);
        }

        for (let child of this.children) {
            child.draw(gl, u_ModelMatrix, u_Color);
        }
    }

    // Transformation functions
    setIdentity() {
        this.localMatrix.setIdentity();
        this.scaleVec = [1, 1, 1];
    }

    translate(x, y, z) {
        this.localMatrix.translate(x, y, z);
    }

    rotate(angle, x, y, z) {
        this.localMatrix.rotate(angle, x, y, z);
    }

    scale(x, y, z) {
        this.scaleVec = [x, y, z];
    }

    setColor(colorArr) {
        this.color = colorArr;
    }
}