import { Buffer, Geometry, Program, Texture } from '@pixi/core';
import { Mesh, MeshMaterial } from '@pixi/mesh';
import { rgb2hex, hex2rgb } from '@pixi/utils';
import { TYPES } from '@pixi/constants';
const gradVert = `
attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform vec2 rangeY;

varying float vOrdinate;

void main(void)
{
vec2 pos = (translationMatrix * vec3(aVertexPosition, 1.0)).xy;
if (pos.y > rangeY.y) {
    pos.y = rangeY.y;
}
gl_Position = vec4((projectionMatrix * vec3(pos, 1.0)).xy, 0.0, 1.0);
vOrdinate = pos.y;
}`;
const gradFrag = `
varying float vOrdinate;

uniform vec4 colorTop;
uniform vec4 colorBottom;
uniform vec4 uColor;
uniform vec2 rangeY2;

void main(void)
{
vec4 color = colorTop;
if (vOrdinate > rangeY2.x) {
    if (vOrdinate >= rangeY2.y) {
        color = colorBottom;
    } else {
        color = colorTop + (colorBottom - colorTop) * (vOrdinate - rangeY2.x) / (rangeY2.y - rangeY2.x);
    }
}

color.rgb *= color.a;
gl_FragColor = color * uColor;
}
`;
export class PlotGradientShader extends MeshMaterial {
    constructor() {
        const rangeY = new Float32Array(2);
        super(Texture.WHITE, {
            uniforms: {
                resolution: 1,
                colorTop: new Float32Array([1, 1, 1, 1]),
                colorBottom: new Float32Array([1, 1, 1, 1]),
                rangeY: rangeY,
                rangeY2: rangeY,
            },
            program: PlotGradientShader.getProgram()
        });
    }
    static getProgram() {
        if (!PlotGradientShader._prog) {
            PlotGradientShader._prog = new Program(gradVert, gradFrag);
        }
        return PlotGradientShader._prog;
    }
}
PlotGradientShader._prog = null;
export class PlotGradientGeometry extends Geometry {
    constructor(_static = false) {
        super();
        this.lastLen = 0;
        this.lastPointNum = 0;
        this.lastPointData = 0;
        this.points = [];
        this._floatView = null;
        this._buffer = null;
        this.stridePoints = 2;
        this.strideFloats = 2 * 6;
        this.strideBytes = 8 * 6;
        this.initGeom(_static);
        this.reset();
    }
    initGeom(_static) {
        this._buffer = new Buffer(new Float32Array(0), _static, false);
        this.addAttribute('aVertexPosition', this._buffer, 2, false, TYPES.FLOAT);
    }
    moveTo(x, y) {
        const { points } = this;
        points.push(x);
        points.push(y);
    }
    lineTo(x, y) {
        const { points } = this;
        points.push(x);
        points.push(y);
    }
    invalidate(pointNum = 0) {
        this.lastPointNum = Math.min(pointNum, this.lastPointNum);
    }
    reset() {
        if (this.lastLen > 0) {
            this.clearBufferData();
        }
        this.lastLen = 0;
        this.lastPointData = 0;
        this.points.length = 0;
    }
    clearBufferData() {
        const { points, strideFloats, stridePoints } = this;
        this.lastPointNum = 0;
        this.lastPointData = 0;
        const arrayLen = Math.max(0, points.length / stridePoints - 1);
        this._floatView = new Float32Array(strideFloats * arrayLen);
        this._buffer.update(this._floatView);
        this.lastLen = points.length;
    }
    updateBuffer() {
        const { points, stridePoints, strideFloats } = this;
        if (this.lastLen > points.length) {
            this.lastLen = -1;
        }
        if (this.lastLen < points.length
            || this.lastPointNum < this.lastLen) {
            this.clearBufferData();
        }
        if (this.lastPointNum == this.lastLen) {
            return;
        }
        const { _floatView } = this;
        this.lastPointData = Math.min(this.lastPointData, this.lastPointNum);
        let j = Math.round(this.lastPointNum * strideFloats / stridePoints);
        for (let i = this.lastPointNum; i < points.length - stridePoints; i += stridePoints) {
            const next = i + stridePoints;
            const x = points[i], y = points[i + 1], x2 = points[next], y2 = points[next + 1];
            const bottomLine = 10000.0;
            _floatView[j++] = x;
            _floatView[j++] = y;
            _floatView[j++] = x2;
            _floatView[j++] = y2;
            _floatView[j++] = x2;
            _floatView[j++] = bottomLine;
            _floatView[j++] = x;
            _floatView[j++] = y;
            _floatView[j++] = x2;
            _floatView[j++] = bottomLine;
            _floatView[j++] = x;
            _floatView[j++] = bottomLine;
        }
        this._buffer.update();
        this.lastPointNum = this.lastLen;
        this.lastPointData = this.lastLen;
    }
}
export class PlotGradient extends Mesh {
    constructor() {
        super(new PlotGradientGeometry(), new PlotGradientShader());
        this.masterPlot = null;
        this.plotUpdateId = -1;
    }
    get coordTop() {
        return this.shader.uniforms.rangeY[0];
    }
    set coordTop(value) {
        this.shader.uniforms.rangeY[0] = value;
    }
    get coordBottom() {
        return this.shader.uniforms.rangeY[1];
    }
    set coordBottom(value) {
        this.shader.uniforms.rangeY[1] = value;
    }
    get alphaTop() {
        return this.shader.uniforms.colorTop[3];
    }
    set alphaTop(value) {
        this.shader.uniforms.colorTop[3] = value;
    }
    get alphaBottom() {
        return this.shader.uniforms.colorBottom[3];
    }
    set alphaBottom(value) {
        this.shader.uniforms.colorBottom[3] = value;
    }
    get colorBottom() {
        return rgb2hex(this.shader.uniforms.colorBottom);
    }
    set colorBottom(value) {
        hex2rgb(value, this.shader.uniforms.colorBottom);
    }
    get colorTop() {
        return rgb2hex(this.shader.uniforms.colorTop);
    }
    set colorTop(value) {
        hex2rgb(value, this.shader.uniforms.colorTop);
    }
    clear() {
        if (!this.masterPlot) {
            this.geometry.reset();
        }
    }
    moveTo(x, y) {
        this.lineTo(x, y);
    }
    lineTo(x, y) {
        if (!this.masterPlot) {
            this.geometry.lineTo(x, y);
        }
    }
    _render(renderer) {
        const geom = this.geometry;
        if (this.masterPlot) {
            const plotGeom = this.masterPlot.geometry;
            if (this.plotUpdateId !== plotGeom.updateId) {
                this.plotUpdateId = plotGeom.updateId;
                geom.points = plotGeom.points;
                geom.invalidate();
            }
        }
        geom.updateBuffer();
        this._renderDefault(renderer);
    }
    _renderCanvas(renderer) {
        const geom = this.geometry;
    }
}
//# sourceMappingURL=PlotGradient.js.map