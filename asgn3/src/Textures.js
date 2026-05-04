const TextureManager = {
    textures: {},

    load(gl, name, src) {
        const texture = gl.createTexture();
        const image = new Image();

        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                image
            );

            // Nearest cause they're pixel art textures
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

            this.textures[name] = texture;
        };

        image.src = src;
    },

    texturesReady() {
        for (let i = 0; i < this.textures.length; i++) {
            if (this.textures[i] === null) return false;
        }
        return true;
    },

    get(name) {
        return this.textures[name] || null;
    }
};